import fs from "node:fs/promises";

const snapshotPath = "docs/REAL_SOURCE_HARVEST.json";
const outputJson = "docs/SOURCE_AUTHORITY_TIERS.json";
const outputMd = "docs/SOURCE_AUTHORITY_TIERS.md";

const snapshot = JSON.parse(await fs.readFile(snapshotPath, "utf8"));
const sources = Array.isArray(snapshot.sources) ? snapshot.sources : [];

function tierFor(source) {
  const type = source.sourceType || "";
  const reliability = source.reliabilityGrade || "C";
  const status = source.status || "research_only";
  if (status === "research_only") return "R";
  if (["official-docs", "exchange-docs"].includes(type) && ["S", "A"].includes(reliability)) return "S";
  if (type === "public-domain-classic" && ["S", "A", "B"].includes(reliability)) return "A";
  if (["data-provider-docs", "education-reference"].includes(type) && ["S", "A", "B"].includes(reliability)) return "A";
  if (type === "github-repository" && status === "taxonomy_candidate" && source.license && source.license !== "unknown") return "B";
  if (type === "npm-package" && status === "taxonomy_candidate" && source.license && source.license !== "unknown") return "B";
  if (/^npm-linked-/i.test(type)) return "C";
  if (type === "terms-review") return "R";
  return "R";
}

const tiered = sources.map((source) => ({
  id: source.id,
  name: source.name,
  url: source.url,
  sourceType: source.sourceType,
  license: source.license,
  termsUrl: source.termsUrl,
  reliabilityGrade: source.reliabilityGrade,
  status: source.status,
  authorityTier: tierFor(source),
  learnerUseBoundary: source.status === "research_only"
    ? "research_only; do not show to learners"
    : "metadata/taxonomy only until source-specific review approves original learner-facing use",
}));

const counts = tiered.reduce((acc, source) => {
  acc[source.authorityTier] = (acc[source.authorityTier] || 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  totalSources: tiered.length,
  counts,
  tierMeanings: {
    S: "Reviewed official regulator, government, central bank, or exchange documentation that is not research_only. Still metadata/taxonomy only until original lesson rewrite.",
    A: "Reviewed public education, public-domain classic, data-provider, or API documentation useful for taxonomy and boundary review.",
    B: "Open-source repository or package metadata with a declared license. Do not copy code or README text.",
    C: "Linked project/homepage/issue-tracker metadata. Useful for discovery only.",
    R: "Research-only, terms-review, unknown license, or insufficient authority.",
  },
  boundary: "Authority tiers classify source metadata. They do not grant content reuse, market-data rights, trading permission, or production readiness.",
  sources: tiered,
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, [
  "# Source Authority Tiers",
  "",
  "This report separates source metadata by authority tier. It does not copy third-party content and does not grant reuse rights.",
  "",
  `- Total sources: ${report.totalSources}`,
  `- Tier S: ${counts.S || 0}`,
  `- Tier A: ${counts.A || 0}`,
  `- Tier B: ${counts.B || 0}`,
  `- Tier C: ${counts.C || 0}`,
  `- Research/Review only: ${counts.R || 0}`,
  "",
  "## Tier Meanings",
  "",
  ...Object.entries(report.tierMeanings).map(([tier, meaning]) => `- ${tier}: ${meaning}`),
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n"), "utf8");

if ((counts.S || 0) < 50) throw new Error(`Tier S official/exchange source count too low: ${counts.S || 0}`);
if (((counts.S || 0) + (counts.A || 0)) < 150) throw new Error(`Tier S+A source count too low: ${(counts.S || 0) + (counts.A || 0)}`);
if (tiered.some((source) => /search\?/i.test(source.url || ""))) throw new Error("Search URL leaked into authority tier sources");

console.log(JSON.stringify({
  ok: true,
  productionReady: false,
  educationOnly: true,
  totalSources: report.totalSources,
  tierS: counts.S || 0,
  tierA: counts.A || 0,
  tierB: counts.B || 0,
  tierC: counts.C || 0,
  researchOrReviewOnly: counts.R || 0,
  outputJson,
  outputMd,
}, null, 2));
