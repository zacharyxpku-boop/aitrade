import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Public-domain classic trading literature harvester (Internet Archive edition).
// Discovery: archive.org advancedsearch API. Eligibility: mediatype:texts with a
// publication year of 1928 or earlier (95-year US public-domain rule). Anything
// without a clear pre-1929 year is skipped and recorded. OCR text feeds the
// internal research layer; book text is not learner-facing course copy by itself.

const corpusDir = "data/corpus";
const rawDir = path.join(corpusDir, "raw");
fs.mkdirSync(rawDir, { recursive: true });

const DELAY_MS = Number(process.env.CLASSICS_DELAY_MS || 2500);
const MAX_BOOKS = Number(process.env.CLASSICS_MAX_BOOKS || 25);
const FETCH_TIMEOUT_MS = 60000;
const PUBLIC_DOMAIN_MAX_YEAR = 1928;
const USER_AGENT = "TradeGym education corpus harvester (pre-1929 public-domain classics via archive.org)";

const SEARCHES = [
  'title:("tape reading")',
  'title:("stock market barometer")',
  'title:("reminiscences of a stock operator")',
  'title:("abc of stock speculation")',
  'title:("psychology of the stock market")',
  'title:("truth of the stock tape")',
  'title:("speculation as a fine art")',
  'title:("the stock exchange from within")',
  'title:("how to invest") AND subject:(speculation)',
  'subject:(speculation) AND subject:(stocks)',
  'title:(speculation) AND subject:("stock-exchange")',
  // Second-sweep: more pre-1929 public-domain trading/finance classics.
  'title:("pitfalls of speculation")',
  'title:("cycles of speculation")',
  'title:("the psychology of speculation")',
  'title:("the work of wall street")',
  'title:("the art of investment")',
  'title:("studies in stock speculation")',
  'title:("the ticker")',
  'title:("manias panics")',
  'title:("confusion de confusiones")',
  'title:("the game in wall street")',
  'title:("ten years in wall street")',
  'title:("the pit") AND subject:(speculation)',
  'title:("how to trade in stocks")',
  'title:("the principles of stock exchange")',
  'title:("speculation on the stock") AND date:[1850 TO 1928]',
  'subject:("speculation") AND subject:("finance")',
  'subject:("stock exchange") AND subject:("commerce")',
  'title:("financial markets") AND date:[1850 TO 1928]',
  'title:("investment") AND subject:("speculation")',
  'title:("the stock markets")',
  // Third-sweep: foundational economics + crowd-psychology classics (theory layer).
  'title:("extraordinary popular delusions")',
  'title:("the madness of crowds")',
  'title:("lombard street") AND creator:(bagehot)',
  'title:("the crowd") AND creator:(le bon)',
  'title:("psychology of revolution")',
  'title:("principles of economics") AND creator:(marshall)',
  'title:("the theory of political economy")',
  'title:("the wealth of nations")',
  'title:("principles of political economy")',
  'title:("the theory of interest")',
  'title:("the purchasing power of money")',
  'title:("the nature of capital and income")',
  'title:("interest and prices")',
  'title:("the stock exchange and the money market")',
  'title:("money and the mechanism of exchange")',
  'title:("a treatise on money")',
  'title:("the psychology of the crowd")',
  'subject:("crowds") AND subject:("psychology")',
  'subject:("financial crises")',
  'subject:("money") AND subject:("banking") AND date:[1850 TO 1928]',
];

const SEARCH_LIST = process.env.CLASSICS_SEARCHES ? JSON.parse(process.env.CLASSICS_SEARCHES) : SEARCHES;

const TITLE_FILTER = /(stock|speculat|market|exchange|wall street|tape|invest|trading|trader|ticker|finance|panic|mania|pit|bourse|crowd|delusion|econom|capital|money|interest|bank|wealth|political economy)/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { redirect: "follow", headers: { "user-agent": USER_AGENT }, ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function yearOf(doc) {
  const value = Array.isArray(doc.year) ? doc.year[0] : doc.year;
  const year = Number(String(value || "").slice(0, 4));
  return Number.isFinite(year) && year > 1500 ? year : null;
}

const existingFiles = fs.readdirSync(corpusDir).filter((file) => /^corpus_\d+\.json$/.test(file));
const existingSourceIds = new Set();
let docCounter = 0;
for (const file of existingFiles) {
  docCounter = Math.max(docCounter, Number((file.match(/^corpus_(\d+)\.json$/) || [])[1] || 0));
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(corpusDir, file), "utf8"));
    if (doc.sourceId) existingSourceIds.add(doc.sourceId);
  } catch { /* keep numbering past unreadable files */ }
}

const stored = [];
const skipped = [];
const candidates = new Map();

for (const query of SEARCH_LIST) {
  await sleep(DELAY_MS);
  try {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(`${query} AND mediatype:texts`)}&fl=identifier,title,year,creator&rows=15&output=json`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      skipped.push({ query, reason: `search HTTP ${response.status}` });
      continue;
    }
    const data = await response.json();
    for (const doc of data?.response?.docs || []) {
      const year = yearOf(doc);
      if (!year || year > PUBLIC_DOMAIN_MAX_YEAR) continue;
      if (!TITLE_FILTER.test(String(doc.title || ""))) continue;
      if (!candidates.has(doc.identifier)) {
        candidates.set(doc.identifier, { ...doc, year, discoveredVia: query });
      }
    }
  } catch (error) {
    skipped.push({ query, reason: error.name === "AbortError" ? "timeout" : error.message });
  }
}

const targets = [...candidates.values()]
  .filter((doc) => !existingSourceIds.has(`archive:${doc.identifier}`))
  .slice(0, MAX_BOOKS);

for (const doc of targets) {
  await sleep(DELAY_MS);
  try {
    const textUrl = `https://archive.org/download/${doc.identifier}/${doc.identifier}_djvu.txt`;
    const response = await fetchWithTimeout(textUrl);
    if (!response.ok) {
      skipped.push({ book: doc.title, identifier: doc.identifier, reason: `fulltext HTTP ${response.status}` });
      continue;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const text = buffer.toString("utf8").trim();
    if (text.length < 20000) {
      skipped.push({ book: doc.title, identifier: doc.identifier, reason: `text too short (${text.length})` });
      continue;
    }
    docCounter += 1;
    const id = `corpus_${String(docCounter).padStart(4, "0")}`;
    const rawPath = path.join(rawDir, `archive_${doc.identifier.replace(/[^a-z0-9_-]+/gi, "_")}.txt`);
    fs.writeFileSync(rawPath, buffer);
    const record = {
      id,
      educationOnly: true,
      productionReady: false,
      sourceId: `archive:${doc.identifier}`,
      name: `${doc.title}${doc.creator ? ` — ${Array.isArray(doc.creator) ? doc.creator[0] : doc.creator}` : ""} (${doc.year})`,
      url: `https://archive.org/details/${doc.identifier}`,
      tier: "public_domain",
      contentType: "text/plain",
      rawFile: rawPath,
      sha256: sha256(buffer),
      charCount: text.length,
      textExtraction: "ocr",
      publicationYear: doc.year,
      discoveredVia: doc.discoveredVia,
      licenseEvidence: `Published ${doc.year} (<= ${PUBLIC_DOMAIN_MAX_YEAR}); US public domain by the 95-year rule. Verify edition-specific additions before non-US commercial distribution.`,
      text,
      fetchedAt: new Date().toISOString(),
      boundary: "Public-domain classic text stored for the internal research layer. Historical trading opinions are study material, not advice; learner-facing lessons still use original wording and modern risk boundaries.",
    };
    fs.writeFileSync(path.join(corpusDir, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
    stored.push({ id, title: doc.title, identifier: doc.identifier, year: doc.year, charCount: text.length });
  } catch (error) {
    skipped.push({ book: doc.title, identifier: doc.identifier, reason: error.name === "AbortError" ? "timeout" : error.message });
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  candidatesFound: candidates.size,
  booksStored: stored.length,
  skipped: skipped.length,
  stored,
  skippedList: skipped,
  boundary: "Classic-literature harvest is research-layer material. Historical strategies and claims must be framed critically in any education use, never as trading guidance.",
};
fs.writeFileSync("docs/CLASSICS_HARVEST_REPORT.json", `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ok: true, candidatesFound: candidates.size, booksStored: stored.length, skipped: skipped.length }, null, 2));
