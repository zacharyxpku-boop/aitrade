import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

// US federal public-domain PDF harvester.
// Curated direct PDF links to regulator investor-education booklets and reports.
// US federal works carry no copyright (17 U.S.C. 105) -> tier public_domain.
// Spot-check embedded third-party material before commercial quoting.

const corpusDir = "data/corpus";
const rawDir = path.join(corpusDir, "raw");
fs.mkdirSync(rawDir, { recursive: true });

const DELAY_MS = Number(process.env.GOVPDF_DELAY_MS || 1500);
const FETCH_TIMEOUT_MS = 45000;
const USER_AGENT = "TradeGym education corpus harvester (US federal public-domain PDFs)";

// [name, url, primaryDomainHint]
const GOV_PDFS = [
  ["SEC Saving and Investing Roadmap", "https://www.sec.gov/investor/pubs/sec-guide-to-savings-and-investing.pdf", "psychology_behavior"],
  ["SEC Financial Navigating in Volatile Times", "https://www.sec.gov/files/ocie-2020-risk-alert-covid-19.pdf", "risk_portfolio"],
  ["SEC Beginners Guide to Asset Allocation", "https://www.sec.gov/investor/pubs/assetallocation.pdf", "risk_portfolio"],
  ["SEC Mutual Funds and ETFs Guide", "https://www.sec.gov/investor/pubs/sec-guide-to-mutual-funds.pdf", "risk_portfolio"],
  ["SEC Margin Investing Basics", "https://www.sec.gov/investor/pubs/margin.pdf", "risk_portfolio"],
  ["SEC Trade Execution", "https://www.sec.gov/investor/pubs/tradexec.pdf", "exchange_microstructure"],
  ["SEC Market Structure Equity", "https://www.sec.gov/files/marketstructure/research/equity_market_structure_litreview.pdf", "exchange_microstructure"],
  ["SEC Day Trading Risks", "https://www.sec.gov/investor/pubs/daytips.pdf", "psychology_behavior"],
  ["SEC Affinity Fraud", "https://www.sec.gov/investor/pubs/affinity.pdf", "psychology_behavior"],
  ["SEC Microcap Stock Guide", "https://www.sec.gov/investor/pubs/microcapstock.pdf", "exchange_microstructure"],
  ["CFTC Futures and Options Basics", "https://www.cftc.gov/sites/default/files/idc/groups/public/@educationcenter/documents/file/educationbrochure.pdf", "exchange_microstructure"],
  ["CFTC Foreign Currency Fraud Advisory", "https://www.cftc.gov/sites/default/files/idc/groups/public/@customerprotection/documents/file/cpoforexadvisory.pdf", "psychology_behavior"],
  ["FINRA Smart Bond Investing", "https://www.finra.org/sites/default/files/InvestorDocument/p125847.pdf", "macro_economic_data"],
  ["Federal Reserve Beige Book Sample", "https://www.federalreserve.gov/monetarypolicy/files/BeigeBook_20240117.pdf", "macro_economic_data"],
  ["Federal Reserve Monetary Policy Report", "https://www.federalreserve.gov/monetarypolicy/files/20240301_mprfullreport.pdf", "macro_economic_data"],
  ["Federal Reserve FEDS Notes Volatility", "https://www.federalreserve.gov/econres/feds/files/2019053pap.pdf", "backtesting_research_hygiene"],
  ["NY Fed Staff Report Liquidity", "https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr800.pdf", "exchange_microstructure"],
  ["BLS CPI Handbook of Methods", "https://www.bls.gov/opub/hom/pdf/cpihom.pdf", "macro_economic_data"],
  ["BLS Employment Situation Technical Note", "https://www.bls.gov/news.release/pdf/empsit.pdf", "macro_economic_data"],
  ["Treasury Quarterly Refunding Statement", "https://home.treasury.gov/system/files/221/Most-Recent-Quarterly-Refunding-Documents.pdf", "macro_economic_data"],
  ["CBO Budget and Economic Outlook", "https://www.cbo.gov/system/files/2024-02/59710-Outlook-2024.pdf", "macro_economic_data"],
  ["GAO Financial Markets Regulation", "https://www.gao.gov/assets/gao-16-175.pdf", "market_data_api_boundary"],
  ["SEC Algorithmic Trading Staff Report", "https://www.sec.gov/files/algo_trading_report_2020.pdf", "exchange_microstructure"],
  ["CFTC Automated Trading Concept", "https://www.cftc.gov/sites/default/files/idc/groups/public/@newsroom/documents/file/federalregister112413.pdf", "exchange_microstructure"],
  ["SEC Regulation NMS", "https://www.sec.gov/rules/final/34-51808.pdf", "market_data_api_boundary"],
  ["NY Fed Primary Dealer Survey", "https://www.newyorkfed.org/medialibrary/media/markets/primarydealer_survey_questions.pdf", "market_data_api_boundary"],
  ["SEC Investor Bulletin Trading Halts", "https://www.sec.gov/files/trading-halts.pdf", "exchange_microstructure"],
  ["FDIC Trust Examination Markets", "https://www.fdic.gov/regulations/examinations/trustmanual/section_12/ch12.pdf", "risk_portfolio"],
  ["SEC Order Types Investor Bulletin", "https://www.sec.gov/files/ib_ordertypes.pdf", "exchange_microstructure"],
  ["CFTC Speculative Limits Backgrounder", "https://www.cftc.gov/sites/default/files/2020/10/positionlimitsfactsheet.pdf", "risk_portfolio"],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { redirect: "follow", headers: { "user-agent": USER_AGENT }, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function sha256(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return (result.text || "").trim();
  } finally {
    await parser.destroy();
  }
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

for (const [name, url, domainHint] of GOV_PDFS) {
  const sourceId = `govpdf:${crypto.createHash("md5").update(url).digest("hex").slice(0, 10)}`;
  if (existingSourceIds.has(sourceId)) { skipped.push({ name, reason: "already stored" }); continue; }
  await sleep(DELAY_MS);
  try {
    const host = new URL(url).hostname;
    if (!/\.(gov|mil)$/i.test(host)) { skipped.push({ name, reason: "not a federal host" }); continue; }
    const response = await fetchWithTimeout(url);
    if (!response.ok) { skipped.push({ name, url, reason: `HTTP ${response.status}` }); continue; }
    const buffer = Buffer.from(await response.arrayBuffer());
    let text = "";
    try { text = await extractPdfText(buffer); } catch (error) { skipped.push({ name, reason: `pdf parse: ${error.message}` }); continue; }
    if (text.length < 2000) { skipped.push({ name, reason: `text too short (${text.length})` }); continue; }
    docCounter += 1;
    const id = `corpus_${String(docCounter).padStart(4, "0")}`;
    const rawPath = path.join(rawDir, `${sourceId}.pdf`);
    fs.writeFileSync(rawPath, buffer);
    const record = {
      id, educationOnly: true, productionReady: false,
      sourceId, name, url, tier: "public_domain", contentType: "application/pdf",
      rawFile: rawPath, sha256: sha256(buffer), charCount: text.length, textExtraction: "full",
      domainHint,
      licenseEvidence: "US federal government work (17 U.S.C. 105), public domain. Verify embedded third-party material before commercial quoting.",
      text, fetchedAt: new Date().toISOString(),
      boundary: "US federal public-domain text for the internal research layer. Learner-facing lessons use original wording and modern risk boundaries. Not trading advice.",
    };
    fs.writeFileSync(path.join(corpusDir, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
    stored.push({ id, name, charCount: text.length });
  } catch (error) {
    skipped.push({ name, reason: error.name === "AbortError" ? "timeout" : error.message });
  }
}

const summary = {
  generatedAt: new Date().toISOString(), educationOnly: true, productionReady: false,
  attempted: GOV_PDFS.length, stored: stored.length, skipped: skipped.length,
  storedList: stored, skippedList: skipped,
  boundary: "Federal public-domain PDF harvest for the research layer. Not trading advice, not production readiness.",
};
fs.writeFileSync("docs/GOV_PDF_HARVEST_REPORT.json", `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ok: true, attempted: GOV_PDFS.length, stored: stored.length, skipped: skipped.length }, null, 2));
