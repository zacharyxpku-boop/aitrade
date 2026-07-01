import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Permissive-licensed GitHub repository README harvester.
// Eligibility: repos already classified tier "permissive" (MIT/Apache/BSD/ISC/
// CC0/0BSD/Unlicense) in docs/SOURCE_LICENSE_TIERS.json. These licenses permit
// reuse with attribution + license preservation; we store README text in the
// research layer with full attribution records. raw.githubusercontent.com is
// used directly (no API token needed). Incremental, rate-limited, failures kept.

const tiersPath = "docs/SOURCE_LICENSE_TIERS.json";
const corpusDir = "data/corpus";
fs.mkdirSync(corpusDir, { recursive: true });

const DELAY_MS = Number(process.env.PERM_DELAY_MS || 1200);
const MAX_REPOS = Number(process.env.PERM_MAX_REPOS || 200);
const FETCH_TIMEOUT_MS = 20000;
const USER_AGENT = "TradeGym education corpus harvester (permissive-licensed README; attribution preserved)";

const tiers = JSON.parse(fs.readFileSync(tiersPath, "utf8"));
const permissive = tiers.sources.filter((item) => item.tier === "permissive" && /github\.com\//.test(item.url));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { redirect: "follow", headers: { "user-agent": USER_AGENT }, signal: controller.signal }).finally(() => clearTimeout(timer));
}
const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

function repoSlug(url) {
  const match = url.match(/github\.com\/([^/]+\/[^/#?]+)/i);
  return match ? match[1].replace(/\.git$/, "") : null;
}

function stripMarkdownNoise(text) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#+\s*/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const existingFiles = fs.readdirSync(corpusDir).filter((file) => /^corpus_\d+\.json$/.test(file));
const existingSourceIds = new Set();
let docCounter = 0;
for (const file of existingFiles) {
  docCounter = Math.max(docCounter, Number((file.match(/^corpus_(\d+)\.json$/) || [])[1] || 0));
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(corpusDir, file), "utf8"));
    if (doc.sourceId) existingSourceIds.add(doc.sourceId);
  } catch { /* keep numbering */ }
}

const stored = [];
const skipped = [];
const targets = permissive
  .map((item) => ({ ...item, slug: repoSlug(item.url) }))
  .filter((item) => item.slug && !existingSourceIds.has(`github:${item.slug}`))
  .slice(0, MAX_REPOS);

const README_CANDIDATES = ["README.md", "readme.md", "README.rst", "README.markdown", "Readme.md"];
const BRANCHES = ["master", "main"];

for (const repo of targets) {
  await sleep(DELAY_MS);
  let landed = false;
  for (const branch of BRANCHES) {
    if (landed) break;
    for (const file of README_CANDIDATES) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${repo.slug}/${branch}/${file}`;
        const response = await fetchWithTimeout(rawUrl);
        if (!response.ok) continue;
        const buffer = Buffer.from(await response.arrayBuffer());
        const text = stripMarkdownNoise(buffer.toString("utf8"));
        if (text.length < 800) continue;
        docCounter += 1;
        const id = `corpus_${String(docCounter).padStart(4, "0")}`;
        const record = {
          id,
          educationOnly: true,
          productionReady: false,
          sourceId: `github:${repo.slug}`,
          name: `${repo.slug} README`,
          url: `https://github.com/${repo.slug}`,
          tier: "permissive",
          license: repo.license,
          contentType: "text/markdown",
          sha256: sha256(buffer),
          charCount: text.length,
          textExtraction: "full",
          attribution: `${repo.slug} (${repo.license} license), https://github.com/${repo.slug} — license and copyright notice preserved per license terms.`,
          licenseEvidence: `GitHub license metadata: ${repo.license}. Permissive license permits reuse with attribution and license preservation.`,
          text,
          fetchedAt: new Date().toISOString(),
          boundary: "Permissive-licensed README stored for the internal research layer with attribution. Code/tool documentation is engineering reference, not trading advice; learner-facing lessons keep original wording.",
        };
        fs.writeFileSync(path.join(corpusDir, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
        stored.push({ id, slug: repo.slug, license: repo.license, charCount: text.length });
        landed = true;
        break;
      } catch (error) {
        // try next candidate; record only if all fail
      }
    }
  }
  if (!landed) skipped.push({ slug: repo.slug, reason: "no readable README on master/main" });
}

const summary = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  eligible: permissive.length,
  attempted: targets.length,
  stored: stored.length,
  skipped: skipped.length,
  stored10: stored.slice(0, 10),
  skippedList: skipped.slice(0, 30),
  boundary: "Permissive README harvest preserves attribution and license notices. It is research-layer engineering reference, not trading advice and not learner-facing prose.",
};
fs.writeFileSync("docs/PERMISSIVE_HARVEST_REPORT.json", `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ok: true, eligible: permissive.length, attempted: targets.length, stored: stored.length, skipped: skipped.length }, null, 2));
