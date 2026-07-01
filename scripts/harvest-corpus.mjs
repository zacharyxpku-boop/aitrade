import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return (result.text || "").trim();
  } finally {
    await parser.destroy();
  }
}

// Corpus harvester for the internal knowledge layer.
// It fetches full content ONLY from public_domain and open_access tier sources,
// stores provenance + hash + license tier per document, and never touches
// restricted_default or video platforms. Fetching here is research-layer work;
// it does not make any text learner-facing and does not grant publication rights.

const tiersPath = "docs/SOURCE_LICENSE_TIERS.json";
if (!fs.existsSync(tiersPath)) {
  throw new Error("Missing docs/SOURCE_LICENSE_TIERS.json. Run node scripts/classify-source-license.mjs first.");
}

const corpusDir = "data/corpus";
const rawDir = path.join(corpusDir, "raw");
fs.mkdirSync(rawDir, { recursive: true });

const PUBLIC_DELAY_MS = Number(process.env.CORPUS_PUBLIC_DELAY_MS || 1000);
const ARXIV_DELAY_MS = Number(process.env.CORPUS_ARXIV_DELAY_MS || 3500);
const MAX_PUBLIC_DOCS = Number(process.env.CORPUS_MAX_PUBLIC_DOCS || 260);
const MAX_ARXIV_PDFS = Number(process.env.CORPUS_MAX_ARXIV_PDFS || 55);
const FETCH_TIMEOUT_MS = Number(process.env.CORPUS_FETCH_TIMEOUT_MS || 20000);
const USER_AGENT = "TradeGym education corpus harvester (research layer; license-tier gated; contact: local prototype)";

const tiers = JSON.parse(fs.readFileSync(tiersPath, "utf8"));
const publicDomainSources = tiers.sources.filter((item) => item.tier === "public_domain").slice(0, MAX_PUBLIC_DOCS);
const arxivAbsSources = tiers.sources.filter((item) => item.tier === "open_access" && /arxiv\.org\/abs\//i.test(item.url));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const robotsCache = new Map();
async function robotsAllows(url) {
  let host;
  let pathname;
  try {
    const parsed = new URL(url);
    host = parsed.origin;
    pathname = parsed.pathname;
  } catch {
    return false;
  }
  if (!robotsCache.has(host)) {
    try {
      const response = await fetchWithTimeout(`${host}/robots.txt`, { headers: { "user-agent": USER_AGENT } });
      const body = response.ok ? await response.text() : "";
      const disallows = [];
      let applies = false;
      for (const line of body.split(/\r?\n/)) {
        const cleaned = line.replace(/#.*$/, "").trim();
        const agentMatch = cleaned.match(/^user-agent:\s*(.+)$/i);
        if (agentMatch) {
          applies = agentMatch[1].trim() === "*";
          continue;
        }
        if (!applies) continue;
        const disallowMatch = cleaned.match(/^disallow:\s*(.*)$/i);
        if (disallowMatch) {
          const rule = disallowMatch[1].trim();
          if (rule) disallows.push(rule);
        }
      }
      robotsCache.set(host, disallows);
    } catch {
      robotsCache.set(host, []);
    }
  }
  const rules = robotsCache.get(host);
  return !rules.some((rule) => pathname.startsWith(rule));
}

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { redirect: "follow", ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function htmlToText(html) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(nav|header|footer|aside)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const entities = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " ", "&mdash;": "—", "&ndash;": "–", "&rsquo;": "'", "&lsquo;": "'", "&ldquo;": '"', "&rdquo;": '"' };
  text = text.replace(/&[a-z#0-9]+;/gi, (match) => entities[match.toLowerCase()] ?? " ");
  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").replace(/^[ ]+|[ ]+$/gm, "").trim();
  return { title: title.trim(), text };
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function corpusBoundary(tier) {
  return tier === "public_domain"
    ? "US federal public-domain text stored for the internal research layer. Spot-check embedded third-party material before any commercial quoting. Not trading advice."
    : "Open-access text stored for the internal research layer only. Learner-facing output must cite and use original wording. Not trading advice.";
}

// Incremental re-run support: never overwrite or re-fetch existing documents.
const existingFiles = fs.readdirSync(corpusDir).filter((file) => /^corpus_\d+\.json$/.test(file));
const existingSourceIds = new Set();
let maxExistingIndex = 0;
for (const file of existingFiles) {
  maxExistingIndex = Math.max(maxExistingIndex, Number((file.match(/^corpus_(\d+)\.json$/) || [])[1] || 0));
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(corpusDir, file), "utf8"));
    if (doc.sourceId) existingSourceIds.add(doc.sourceId);
  } catch {
    // unreadable file: leave it alone and keep numbering past it
  }
}

const documents = [];
const failures = [];
let docCounter = maxExistingIndex;

function saveDocument(record) {
  docCounter += 1;
  const id = `corpus_${String(docCounter).padStart(4, "0")}`;
  const full = {
    id,
    educationOnly: true,
    productionReady: false,
    ...record,
    boundary: corpusBoundary(record.tier),
  };
  fs.writeFileSync(path.join(corpusDir, `${id}.json`), `${JSON.stringify(full, null, 2)}\n`, "utf8");
  documents.push({
    id,
    sourceId: record.sourceId,
    name: record.name,
    url: record.url,
    tier: record.tier,
    contentType: record.contentType,
    sha256: record.sha256,
    charCount: record.charCount,
    textExtraction: record.textExtraction,
  });
}

async function harvestPublicDomain() {
  if (process.env.CORPUS_SKIP_PUBLIC === "1") return;
  for (const source of publicDomainSources) {
    if (existingSourceIds.has(source.sourceId)) continue;
    await sleep(PUBLIC_DELAY_MS);
    try {
      if (!(await robotsAllows(source.url))) {
        failures.push({ url: source.url, tier: source.tier, reason: "robots.txt disallow" });
        continue;
      }
      const response = await fetchWithTimeout(source.url, {
        headers: { "user-agent": USER_AGENT, accept: "text/html,application/pdf,application/json,text/plain,*/*" },
      });
      if (!response.ok) {
        failures.push({ url: source.url, tier: source.tier, reason: `HTTP ${response.status}` });
        continue;
      }
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      const buffer = Buffer.from(await response.arrayBuffer());
      if (contentType.includes("pdf") || /\.pdf($|\?)/i.test(source.url)) {
        const rawPath = path.join(rawDir, `${source.sourceId.replace(/[^a-z0-9_-]+/gi, "_")}.pdf`);
        fs.writeFileSync(rawPath, buffer);
        let text = "";
        let extraction = "failed";
        try {
          text = await extractPdfText(buffer);
          extraction = text.length > 200 ? "full" : "partial";
        } catch (error) {
          extraction = `failed: ${error.message}`;
        }
        saveDocument({
          sourceId: source.sourceId,
          name: source.name,
          url: source.url,
          tier: source.tier,
          contentType: "application/pdf",
          rawFile: rawPath,
          sha256: sha256(buffer),
          charCount: text.length,
          textExtraction: extraction,
          text,
          fetchedAt: new Date().toISOString(),
        });
      } else {
        const { title, text } = htmlToText(buffer.toString("utf8"));
        if (text.length < 300) {
          failures.push({ url: source.url, tier: source.tier, reason: `extracted text too short (${text.length} chars)` });
          continue;
        }
        saveDocument({
          sourceId: source.sourceId,
          name: source.name,
          url: source.url,
          tier: source.tier,
          contentType: contentType || "text/html",
          pageTitle: title,
          sha256: sha256(buffer),
          charCount: text.length,
          textExtraction: "full",
          text,
          fetchedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      failures.push({ url: source.url, tier: source.tier, reason: error.name === "AbortError" ? "timeout" : error.message });
    }
  }
}

const ARXIV_QUERIES = process.env.CORPUS_ARXIV_QUERIES
  ? JSON.parse(process.env.CORPUS_ARXIV_QUERIES)
  : [
  'all:"backtest overfitting"',
  'all:"survivorship bias" AND cat:q-fin.*',
  'all:"walk-forward" AND cat:q-fin.*',
  'all:"market microstructure"',
  'all:"limit order book" AND cat:q-fin.TR',
  'all:"news sentiment" AND cat:q-fin.*',
  'all:"risk management" AND cat:q-fin.RM',
  'all:"technical analysis" AND cat:q-fin.ST',
];

function parseArxivEntries(xml) {
  const entries = [];
  const blocks = xml.split("<entry>").slice(1);
  for (const block of blocks) {
    const pick = (tag) => {
      const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return match ? match[1].replace(/\s+/g, " ").trim() : "";
    };
    const idUrl = pick("id");
    const arxivId = (idUrl.match(/abs\/([^<\s]+)/) || [])[1] || "";
    if (!arxivId) continue;
    entries.push({
      arxivId,
      title: pick("title"),
      summary: pick("summary"),
      published: pick("published"),
      absUrl: `https://arxiv.org/abs/${arxivId}`,
      pdfUrl: `https://arxiv.org/pdf/${arxivId}`,
    });
  }
  return entries;
}

async function harvestArxiv() {
  const seen = new Set();
  const papers = [];
  for (const query of ARXIV_QUERIES) {
    await sleep(ARXIV_DELAY_MS);
    try {
      const apiUrl = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&start=0&max_results=10&sortBy=relevance`;
      const response = await fetchWithTimeout(apiUrl, { headers: { "user-agent": USER_AGENT } });
      if (!response.ok) {
        failures.push({ url: apiUrl, tier: "open_access", reason: `arXiv API HTTP ${response.status}` });
        continue;
      }
      const xml = await response.text();
      for (const entry of parseArxivEntries(xml)) {
        if (!seen.has(entry.arxivId)) {
          seen.add(entry.arxivId);
          papers.push({ ...entry, query });
        }
      }
    } catch (error) {
      failures.push({ url: `arxiv-api:${query}`, tier: "open_access", reason: error.name === "AbortError" ? "timeout" : error.message });
    }
  }

  // Known pool abs URLs first, then API-discovered papers, up to the cap.
  const poolIds = arxivAbsSources
    .map((source) => ((source.url.match(/abs\/([^?\s]+)/) || [])[1] || ""))
    .filter(Boolean);
  for (const poolId of poolIds) {
    if (!seen.has(poolId)) {
      seen.add(poolId);
      papers.unshift({ arxivId: poolId, title: `arXiv ${poolId}`, summary: "", published: "", absUrl: `https://arxiv.org/abs/${poolId}`, pdfUrl: `https://arxiv.org/pdf/${poolId}`, query: "source-pool" });
    }
  }

  const targets = papers.filter((paper) => !existingSourceIds.has(`arxiv:${paper.arxivId}`)).slice(0, MAX_ARXIV_PDFS);
  for (const paper of targets) {
    await sleep(ARXIV_DELAY_MS);
    try {
      const response = await fetchWithTimeout(paper.pdfUrl, { headers: { "user-agent": USER_AGENT, accept: "application/pdf" } });
      if (!response.ok) {
        failures.push({ url: paper.pdfUrl, tier: "open_access", reason: `HTTP ${response.status}` });
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const rawPath = path.join(rawDir, `arxiv_${paper.arxivId.replace(/[^a-z0-9.]+/gi, "_")}.pdf`);
      fs.writeFileSync(rawPath, buffer);
      let text = "";
      let extraction = "failed";
      try {
        text = await extractPdfText(buffer);
        extraction = text.length > 500 ? "full" : "partial";
      } catch (error) {
        text = paper.summary;
        extraction = `pdf failed (${error.message}); stored abstract only`;
      }
      saveDocument({
        sourceId: `arxiv:${paper.arxivId}`,
        name: paper.title || `arXiv ${paper.arxivId}`,
        url: paper.absUrl,
        tier: "open_access",
        contentType: "application/pdf",
        rawFile: rawPath,
        sha256: sha256(buffer),
        charCount: text.length,
        textExtraction: extraction,
        abstract: paper.summary,
        discoveredVia: paper.query,
        text,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      failures.push({ url: paper.pdfUrl, tier: "open_access", reason: error.name === "AbortError" ? "timeout" : error.message });
    }
  }
}

await harvestPublicDomain();
await harvestArxiv();

const summary = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  publicDomainAttempted: publicDomainSources.length,
  publicDomainStored: documents.filter((item) => item.tier === "public_domain").length,
  openAccessStored: documents.filter((item) => item.tier === "open_access").length,
  totalStored: documents.length,
  totalOnDisk: maxExistingIndex - existingFiles.filter((f) => false).length + documents.length,
  previouslyStored: existingSourceIds.size,
  failures: failures.length,
  restrictedFetched: 0,
  boundary: "Corpus documents are internal research material gated by license tier. Nothing here is learner-facing, trading advice, or a publication right.",
  documents,
  failureList: failures,
};

fs.writeFileSync("docs/CORPUS_HARVEST_REPORT.json", `${JSON.stringify(summary, null, 2)}\n`, "utf8");

const md = [
  "# Corpus Harvest Report",
  "",
  "Full-content harvest of license-cleared sources for the internal research layer.",
  "",
  "## Summary",
  "",
  `- Public-domain sources attempted: ${summary.publicDomainAttempted}`,
  `- Public-domain documents stored: ${summary.publicDomainStored}`,
  `- Open-access (arXiv) documents stored: ${summary.openAccessStored}`,
  `- Total corpus documents: ${summary.totalStored}`,
  `- Failures recorded: ${summary.failures}`,
  `- Restricted-tier fetches: 0 (forbidden by design)`,
  "",
  "## Boundary",
  "",
  summary.boundary,
  "",
  "## Failures",
  "",
  ...failures.slice(0, 40).map((item) => `- ${item.tier} ${item.url}: ${item.reason}`),
  "",
].join("\n");

fs.writeFileSync("docs/CORPUS_HARVEST_REPORT.md", md, "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  publicDomainStored: summary.publicDomainStored,
  openAccessStored: summary.openAccessStored,
  totalStored: summary.totalStored,
  failures: summary.failures,
  outputJson: "docs/CORPUS_HARVEST_REPORT.json",
  outputMd: "docs/CORPUS_HARVEST_REPORT.md",
}, null, 2));
