import fs from "node:fs";

const path = "docs/REAL_SOURCE_HARVEST.json";
if (!fs.existsSync(path)) {
  throw new Error("Missing docs/REAL_SOURCE_HARVEST.json. Run npm.cmd run harvest:real-sources first.");
}

const snapshot = JSON.parse(fs.readFileSync(path, "utf8"));
const sources = Array.isArray(snapshot.sources) ? snapshot.sources : [];
const urls = new Set(sources.map((item) => item.url).filter(Boolean));
const githubRepos = sources.filter((item) => item.sourceType === "github-repository");
const npmPackages = sources.filter((item) => item.sourceType === "npm-package");
const npmLinked = sources.filter((item) => /^npm-linked-/i.test(item.sourceType || ""));
const officialDocs = sources.filter((item) => !["github-repository", "npm-package"].includes(item.sourceType) && !/^npm-linked-/i.test(item.sourceType || ""));
const searchUrls = sources.filter((item) => /search\?/i.test(item.url || ""));
const taxonomyCandidates = sources.filter((item) => item.status === "taxonomy_candidate");
const researchOnly = sources.filter((item) => item.status === "research_only");
const failedQueries = (snapshot.queryResults || []).filter((item) => item.status !== 200);
const failedNpmQueries = (snapshot.npmQueryResults || []).filter((item) => item.status !== 200);

const report = {
  ok: urls.size >= 50,
  productionReady: false,
  educationOnly: true,
  generatedAt: snapshot.generatedAt,
  realUrls: urls.size,
  githubRepositories: githubRepos.length,
  npmPackages: npmPackages.length,
  npmLinkedUrls: npmLinked.length,
  officialOrDocumentUrls: officialDocs.length,
  searchUrls: searchUrls.length,
  taxonomyCandidates: taxonomyCandidates.length,
  researchOnly: researchOnly.length,
  failedQueries: failedQueries.length,
  failedNpmQueries: failedNpmQueries.length,
  gapToTarget3000RealUrls: Math.max(0, 3000 - urls.size),
  gapToTarget10000Inventory: Math.max(0, 10000 - urls.size),
  note: "This coverage check proves real-source harvesting progress. It does not claim the long-run target is complete.",
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  throw new Error(`Real source harvest too small: ${urls.size} URLs`);
}
