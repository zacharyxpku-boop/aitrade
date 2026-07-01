import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Open-licensed course-text harvester for Wikibooks / Wikiversity.
// Both are CC BY-SA 4.0 (commercial use OK with attribution + share-alike) and
// expose the same MediaWiki API as Wikipedia. Unlike encyclopedia stubs, these
// are structured open courses/textbooks. Stored as tier "share_alike" with
// attribution. Learner-facing lessons still keep original wording.
//
// Configure via env: WIKI_HOST (en.wikibooks.org | en.wikiversity.org),
// WIKI_SEARCHES (JSON array of search queries).

const corpusDir = "data/corpus";
fs.mkdirSync(corpusDir, { recursive: true });

const HOST = process.env.WIKI_HOST || "en.wikibooks.org";
const SITE_LABEL = HOST.includes("wikiversity") ? "Wikiversity" : "Wikibooks";
const DELAY_MS = Number(process.env.WIKI_DELAY_MS || 1500);
const PER_QUERY = Number(process.env.WIKI_PER_QUERY || 12);
const FETCH_TIMEOUT_MS = 25000;
const USER_AGENT = "TradeGymEducationCorpus/0.1 (local education prototype; CC BY-SA course text; research layer)";

const DEFAULT_SEARCHES = [
  "technical analysis", "trading strategy", "candlestick", "chart pattern",
  "support resistance", "risk management trading", "position sizing",
  "portfolio theory", "financial markets", "stock market", "futures", "options trading",
  "market microstructure", "behavioral finance", "trading psychology",
  "backtesting", "moving average", "volatility", "foreign exchange", "investment analysis",
];
const SEARCHES = process.env.WIKI_SEARCHES ? JSON.parse(process.env.WIKI_SEARCHES) : DEFAULT_SEARCHES;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { redirect: "follow", headers: { "user-agent": USER_AGENT }, signal: controller.signal }).finally(() => clearTimeout(timer));
}
const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

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

for (const query of SEARCHES) {
  await sleep(DELAY_MS);
  try {
    const api = `https://${HOST}/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${PER_QUERY}&gsrnamespace=0&prop=extracts|info&explaintext=1&exsectionformat=plain&inprop=url&format=json&formatversion=2`;
    const response = await fetchWithTimeout(api);
    if (!response.ok) { skipped.push({ query, reason: `HTTP ${response.status}` }); continue; }
    const data = await response.json();
    const pages = data?.query?.pages || [];
    for (const page of pages) {
      const sourceId = `${SITE_LABEL.toLowerCase()}:${page.pageid}`;
      if (existingSourceIds.has(sourceId)) { skipped.push({ title: page.title, reason: "already stored" }); continue; }
      const TOPIC = /(financ|trad|stock|market|invest|econom|portfolio|option|future|forex|exchange|candlestick|technical analysis|risk|volatil|hedg|securit|capital|interest rate|monetary)/i;
      if (!TOPIC.test(page.title) && !TOPIC.test((page.extract || "").slice(0, 1500))) { skipped.push({ title: page.title, reason: "off-topic" }); continue; }
      const text = (page.extract || "").trim();
      if (text.length < 2000) { skipped.push({ title: page.title, reason: `too short (${text.length})` }); continue; }
      existingSourceIds.add(sourceId);
      docCounter += 1;
      const id = `corpus_${String(docCounter).padStart(4, "0")}`;
      const url = page.canonicalurl || `https://${HOST}/wiki/${encodeURIComponent(page.title)}`;
      const record = {
        id,
        educationOnly: true,
        productionReady: false,
        sourceId,
        name: `${SITE_LABEL}: ${page.title}`,
        url,
        tier: "share_alike",
        contentType: "text/plain",
        sha256: sha256(Buffer.from(text, "utf8")),
        charCount: text.length,
        textExtraction: "full",
        attribution: `"${page.title}", ${SITE_LABEL} contributors, CC BY-SA 4.0, ${url}`,
        licenseEvidence: `${SITE_LABEL} text is CC BY-SA 4.0; reuse requires attribution and share-alike on adaptations.`,
        discoveredVia: query,
        text,
        fetchedAt: new Date().toISOString(),
        boundary: "CC BY-SA open-course text for the research layer. Quoted reuse needs attribution and share-alike; learner-facing lessons keep original wording and modern risk boundaries. Not trading advice.",
      };
      fs.writeFileSync(path.join(corpusDir, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
      stored.push({ id, title: page.title, charCount: text.length, via: query });
    }
  } catch (error) {
    skipped.push({ query, reason: error.name === "AbortError" ? "timeout" : error.message });
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  host: HOST,
  searches: SEARCHES.length,
  stored: stored.length,
  skipped: skipped.length,
  storedList: stored.slice(0, 40),
  boundary: "Open-licensed course harvest (CC BY-SA). Research-layer reference; learner-facing original-wording rule unchanged. Not trading advice.",
};
fs.writeFileSync(`docs/MEDIAWIKI_COURSE_HARVEST_${SITE_LABEL.toUpperCase()}.json`, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ok: true, host: HOST, stored: stored.length, skipped: skipped.length }, null, 2));
