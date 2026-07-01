import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { knowledgeBrowserIndex } = require("../education-knowledge-browser-index.js");

const corpusDir = "data/corpus";
const outputJsonPath = "docs/PUBLIC_SOURCE_GAP_AUDIT.json";
const outputMdPath = "docs/PUBLIC_SOURCE_GAP_AUDIT.md";
const publicTiers = new Set(["public_domain", "open_access", "share_alike", "permissive"]);

// Indexed to knowledgeBrowserIndex.modules order. Keep keys ASCII to avoid shell
// encoding drift when this script is run from Windows PowerShell.
const moduleQueryTerms = [
  ["technical analysis", "chart", "candlestick", "support", "resistance", "price action", "volume", "trend line", "market trend"],
  ["market structure", "support", "resistance", "order book", "market microstructure", "liquidity", "supply", "demand", "market depth", "bid ask spread", "limit order", "market maker"],
  ["candlestick", "candlestick pattern", "doji", "price action", "wick", "chart pattern"],
  ["market trend", "trend following", "moving average", "momentum", "dow theory", "technical analysis"],
  ["breakout", "support", "resistance", "volatility", "chart pattern", "technical analysis"],
  ["trading range", "support", "resistance", "mean reversion", "bollinger", "market trend"],
  ["reversal", "double top", "double bottom", "head and shoulders", "candlestick pattern", "chart pattern"],
  ["technical analysis", "time frame", "timeframe", "market trend", "moving average", "chart"],
  ["market sentiment", "sentiment analysis", "event study", "news analytics", "behavioral economics", "confirmation bias"],
  ["backtesting", "overfitting", "look-ahead bias", "survivorship bias", "data dredging", "cross-validation", "transaction cost"],
  ["risk management", "position sizing", "drawdown", "value at risk", "leverage", "margin", "diversification"],
  ["behavioral economics", "loss aversion", "prospect theory", "confirmation bias", "overconfidence", "herd behavior", "fear of missing out", "gambler"],
];

function fail(message) {
  throw new Error(message);
}

function readCorpusDocs() {
  return fs.readdirSync(corpusDir)
    .filter((file) => /^corpus_\d+\.json$/.test(file))
    .map((file) => JSON.parse(fs.readFileSync(path.join(corpusDir, file), "utf8")));
}

function hostFor(doc) {
  try {
    return new URL(doc.url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function isWikipediaDoc(doc) {
  return /wikipedia\.org/i.test(doc.url || "") ||
    /wikipedia/i.test(doc.sourceId || "") ||
    /^Wikipedia:/i.test(doc.name || "");
}

function sourceFamily(doc) {
  const host = hostFor(doc);
  if (isWikipediaDoc(doc)) return "Wikipedia";
  if (host.endsWith(".gov") || host === "sec.gov" || host === "investor.gov") return "Official/Public Domain";
  if (/arxiv\.org$/.test(host)) return "Open Research";
  if (/github\.com$/.test(host)) return "Permissive/Open Source";
  return host;
}

function scoreDoc(doc, haystack, terms) {
  const meta = [doc.name, doc.url, doc.sourceId].join(" ").toLowerCase();
  let score = 0;
  const matchedTerms = [];
  for (const term of terms) {
    if (meta.includes(term)) {
      score += 4;
      matchedTerms.push(term);
    } else if (haystack.includes(term)) {
      score += 1;
      matchedTerms.push(term);
    }
  }
  return { score, matchedTerms: [...new Set(matchedTerms)] };
}

const corpusDocs = readCorpusDocs();
const publicDocs = corpusDocs.filter((doc) => publicTiers.has(doc.tier));
const wikipediaDocs = publicDocs.filter(isWikipediaDoc);
const officialLikeDocs = publicDocs.filter((doc) => {
  const host = hostFor(doc);
  return host.endsWith(".gov") ||
    /sec\.gov|investor\.gov|federalreserve\.gov|cftc\.gov|finra\.org|nasdaqtrader\.com|treasury\.gov|bls\.gov|bea\.gov|census\.gov/i.test(`${host} ${doc.url || ""}`);
});

const searchableDocs = publicDocs.map((doc) => ({
  doc,
  haystack: [doc.name, doc.url, doc.sourceId, doc.text].join(" ").toLowerCase(),
}));

const moduleRows = knowledgeBrowserIndex.modules.map((module, index) => {
  const terms = moduleQueryTerms[index] || [];
  const scored = searchableDocs
    .map((entry) => {
      const scoredDoc = scoreDoc(entry.doc, entry.haystack, terms);
      return {
        doc: entry.doc,
        score: scoredDoc.score,
        matchedTerms: scoredDoc.matchedTerms,
      };
    })
    .filter((entry) => entry.score >= 2)
    .sort((left, right) => right.score - left.score || String(left.doc.name).localeCompare(String(right.doc.name)));
  const topEvidence = scored.slice(0, 40);
  const wikiEvidence = scored.filter((entry) => isWikipediaDoc(entry.doc));
  const officialEvidence = scored.filter((entry) => officialLikeDocs.some((doc) => doc.id === entry.doc.id));
  const hostSet = new Set(topEvidence.map((entry) => hostFor(entry.doc)));
  const familySet = new Set(topEvidence.map((entry) => sourceFamily(entry.doc)));
  const wikipediaGap = Math.max(0, 2 - wikiEvidence.length);
  const publicEvidenceGap = Math.max(0, 12 - topEvidence.length);
  const hostGap = Math.max(0, 2 - hostSet.size);
  return {
    moduleId: module.id,
    module: module.title,
    learnerFacingNodes: module.learnerFacingNodes,
    topics: module.topics || [],
    queryTerms: terms,
    matchedPublicDocs: scored.length,
    topPublicEvidenceDocs: topEvidence.length,
    wikipediaEvidenceDocs: wikiEvidence.length,
    officialLikeEvidenceDocs: officialEvidence.length,
    uniqueHosts: hostSet.size,
    sourceFamilies: [...familySet].sort(),
    wikipediaGap,
    publicEvidenceGap,
    hostGap,
    readinessStatus: publicEvidenceGap === 0 && wikiEvidence.length >= 1 && hostGap === 0
      ? "public_reference_ready_for_reviewer"
      : "public_reference_gap_review_required",
    recommendedNextHarvest: wikipediaGap > 0
      ? `Add or retune Wikipedia/public pages for ${module.title} terms: ${terms.slice(0, 5).join(", ")}.`
      : "",
    evidenceSamples: topEvidence.slice(0, 12).map((entry) => ({
      documentId: entry.doc.id,
      sourceId: entry.doc.sourceId,
      name: entry.doc.name,
      url: entry.doc.url,
      tier: entry.doc.tier,
      family: sourceFamily(entry.doc),
      score: entry.score,
      matchedTerms: entry.matchedTerms.slice(0, 8),
      excerptPolicy: entry.doc.tier === "share_alike"
        ? "attribution_and_share_alike_required"
        : entry.doc.tier === "open_access"
          ? "pointer_or_quote_only_after_license_review"
          : "cite_and_paraphrase_for_original_lesson",
    })),
    wikipediaEvidenceSamples: wikiEvidence.slice(0, 8).map((entry) => ({
      documentId: entry.doc.id,
      sourceId: entry.doc.sourceId,
      name: entry.doc.name,
      url: entry.doc.url,
      tier: entry.doc.tier,
      score: entry.score,
      matchedTerms: entry.matchedTerms.slice(0, 8),
      excerptPolicy: "attribution_and_share_alike_required",
    })),
  };
});

const weakModules = moduleRows.filter((row) => row.readinessStatus !== "public_reference_ready_for_reviewer");
const wikiThinModules = moduleRows.filter((row) => row.wikipediaGap > 0);
const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  corpusDocuments: corpusDocs.length,
  publicCorpusDocuments: publicDocs.length,
  wikipediaDocuments: wikipediaDocs.length,
  officialLikeDocuments: officialLikeDocs.length,
  modules: moduleRows.length,
  modulesWithPublicEvidence: moduleRows.filter((row) => row.topPublicEvidenceDocs >= 12).length,
  modulesWithWikipediaEvidence: moduleRows.filter((row) => row.wikipediaEvidenceDocs >= 1).length,
  modulesWithTwoWikipediaEvidence: moduleRows.filter((row) => row.wikipediaEvidenceDocs >= 2).length,
  modulesWithHostDiversity: moduleRows.filter((row) => row.uniqueHosts >= 2).length,
  publicReferenceReadyModules: moduleRows.filter((row) => row.readinessStatus === "public_reference_ready_for_reviewer").length,
  weakModules: weakModules.map((row) => ({
    module: row.module,
    publicEvidenceGap: row.publicEvidenceGap,
    wikipediaGap: row.wikipediaGap,
    hostGap: row.hostGap,
    recommendedNextHarvest: row.recommendedNextHarvest,
  })),
  wikipediaThinModules: wikiThinModules.map((row) => ({
    module: row.module,
    wikipediaEvidenceDocs: row.wikipediaEvidenceDocs,
    wikipediaGap: row.wikipediaGap,
    recommendedNextHarvest: row.recommendedNextHarvest,
  })),
  moduleRows,
  boundary: "Public source gap audit is reviewer-facing evidence planning only. Wikipedia and other public materials support taxonomy, source refs, and original education rewrites; this does not approve copied text, trading advice, signals, broker workflows, auto-trading, performance claims, or real-money guidance.",
};

if (audit.educationOnly !== true) fail("audit must keep educationOnly true");
if (audit.productionReady !== false) fail("audit must keep productionReady false");
if (audit.learnerFacingRelease !== false) fail("audit must keep learnerFacingRelease false");
if (audit.approvalStatus !== "not_approved") fail("audit must remain not_approved");

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Public Source Gap Audit",
  "",
  "Reviewer-facing audit of public and Wikipedia coverage by knowledge module.",
  "",
  `- Public corpus documents: ${audit.publicCorpusDocuments}`,
  `- Wikipedia documents: ${audit.wikipediaDocuments}`,
  `- Official-like documents: ${audit.officialLikeDocuments}`,
  `- Modules: ${audit.modules}`,
  `- Modules with public evidence: ${audit.modulesWithPublicEvidence}`,
  `- Modules with Wikipedia evidence: ${audit.modulesWithWikipediaEvidence}`,
  `- Modules with 2+ Wikipedia evidence docs: ${audit.modulesWithTwoWikipediaEvidence}`,
  `- Public-reference ready modules: ${audit.publicReferenceReadyModules}`,
  `- Approval status: ${audit.approvalStatus}`,
  "",
  "## Module Coverage",
  "",
  "| Module | Public evidence | Wikipedia | Official-like | Hosts | Status |",
  "| --- | ---: | ---: | ---: | ---: | --- |",
  ...moduleRows.map((row) => `| ${row.module} | ${row.topPublicEvidenceDocs} | ${row.wikipediaEvidenceDocs} | ${row.officialLikeEvidenceDocs} | ${row.uniqueHosts} | ${row.readinessStatus} |`),
  "",
  "## Wikipedia Thin Modules",
  "",
  ...(audit.wikipediaThinModules.length
    ? audit.wikipediaThinModules.map((row) => `- ${row.module}: ${row.wikipediaEvidenceDocs} Wikipedia docs; next ${row.recommendedNextHarvest}`)
    : ["- None"]),
  "",
  "## Boundary",
  "",
  audit.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: audit.educationOnly,
  productionReady: audit.productionReady,
  learnerFacingRelease: audit.learnerFacingRelease,
  approvalStatus: audit.approvalStatus,
  publicCorpusDocuments: audit.publicCorpusDocuments,
  wikipediaDocuments: audit.wikipediaDocuments,
  officialLikeDocuments: audit.officialLikeDocuments,
  modules: audit.modules,
  modulesWithPublicEvidence: audit.modulesWithPublicEvidence,
  modulesWithWikipediaEvidence: audit.modulesWithWikipediaEvidence,
  publicReferenceReadyModules: audit.publicReferenceReadyModules,
  wikipediaThinModules: audit.wikipediaThinModules.length,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
