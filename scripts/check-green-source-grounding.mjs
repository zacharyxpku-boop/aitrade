import { createRequire } from "node:module";
import fs from "node:fs/promises";

const require = createRequire(import.meta.url);
const { knowledgeBrowserIndex } = require("../education-knowledge-browser-index.js");
const { conceptClusters } = require("../education-concept-clusters.js");
const { sourceInventory } = require("../education-source-inventory.js");

const outputJson = "docs/GREEN_SOURCE_GROUNDING.json";
const outputMd = "docs/GREEN_SOURCE_GROUNDING.md";
const GREEN_SOURCE_TIERS = new Set(["green_official_public_domain", "green_public_domain_classic"]);

function fail(message) {
  throw new Error(message);
}

function hostFor(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function familyFor(source) {
  const host = hostFor(source.url);
  if (/investor\.gov$/.test(host)) return "Investor.gov";
  if (/(^|\.)sec\.gov$/.test(host) || host === "data.sec.gov") return "SEC";
  if (/cftc\.gov$/.test(host)) return "CFTC";
  if (/bls\.gov$/.test(host)) return "BLS";
  if (/bea\.gov$/.test(host)) return "BEA";
  if (/gutenberg\.org$/.test(host)) return "Project Gutenberg";
  if (/archive\.org$/.test(host)) return "Internet Archive";
  if (/treasury\.gov$/.test(host)) return "Treasury";
  if (/federalreserve\.gov$/.test(host)) return "Federal Reserve";
  if (/eia\.gov$/.test(host)) return "EIA";
  if (/census\.gov$/.test(host)) return "Census";
  return host;
}

function sourceUseClass(source) {
  if (!source) return "missing";
  if (GREEN_SOURCE_TIERS.has(source.sourceUseTier)) return "green";
  if (/^yellow/i.test(source.sourceUseTier || "")) return "yellow";
  if (/^red/i.test(source.sourceUseTier || "")) return "red";
  if (source.status === "research_only") return "research_only";
  return "other";
}

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function uniqueRefs(refs) {
  const seen = new Set();
  return refs.filter((ref) => {
    if (!ref?.sourceId || seen.has(ref.sourceId)) return false;
    seen.add(ref.sourceId);
    return true;
  });
}

const sourceById = new Map(sourceInventory.map((source) => [source.id, source]));

const learnerNodes = knowledgeBrowserIndex.learnerFacingNodes || [];
const reviewedRefs = learnerNodes.flatMap((node) => (node.reviewedSourceRefs || []).map((ref) => ({ ...ref, nodeId: node.id, module: node.module })));
const authorityRefs = learnerNodes.flatMap((node) => (node.authorityContextRefs || []).map((ref) => ({ ...ref, nodeId: node.id, module: node.module })));
const clusterRefs = conceptClusters.flatMap((cluster) => (cluster.authorityGroundingRefs || []).map((ref) => ({ ...ref, clusterId: cluster.id, module: cluster.module })));
const learnerFacingRefs = [...reviewedRefs, ...authorityRefs];
const allGroundingRefs = [...learnerFacingRefs, ...clusterRefs];

const badRefs = allGroundingRefs
  .map((ref) => ({ ...ref, source: sourceById.get(ref.sourceId) }))
  .filter((row) => sourceUseClass(row.source) !== "green");

const moduleRows = knowledgeBrowserIndex.modules.map((module) => {
  const nodes = learnerNodes.filter((node) => node.module === module.title);
  const moduleReviewed = reviewedRefs.filter((ref) => ref.module === module.title);
  const moduleAuthority = authorityRefs.filter((ref) => ref.module === module.title);
  const moduleClusters = clusterRefs.filter((ref) => ref.module === module.title);
  const uniqueSourceIds = new Set([...moduleReviewed, ...moduleAuthority, ...moduleClusters].map((ref) => ref.sourceId));
  const familyCounts = countBy([...moduleReviewed, ...moduleAuthority, ...moduleClusters], (ref) => familyFor(sourceById.get(ref.sourceId) || ref));
  return {
    module: module.title,
    learnerFacingNodes: nodes.length,
    reviewedRefs: moduleReviewed.length,
    authorityRefs: moduleAuthority.length,
    clusterRefs: moduleClusters.length,
    uniqueGreenSources: uniqueSourceIds.size,
    families: familyCounts,
  };
});

const uniqueReviewedSources = uniqueRefs(reviewedRefs).map((ref) => sourceById.get(ref.sourceId)).filter(Boolean);
const uniqueAuthoritySources = uniqueRefs(authorityRefs).map((ref) => sourceById.get(ref.sourceId)).filter(Boolean);
const uniqueClusterSources = uniqueRefs(clusterRefs).map((ref) => sourceById.get(ref.sourceId)).filter(Boolean);
const uniqueAllGreenSources = uniqueRefs(allGroundingRefs).map((ref) => sourceById.get(ref.sourceId)).filter(Boolean);

const familyCounts = countBy(uniqueAllGreenSources, familyFor);
const sourceTypeCounts = countBy(uniqueAllGreenSources, (source) => source.sourceType);
const tierCounts = countBy(uniqueAllGreenSources, (source) => source.sourceUseTier);
const weakModules = moduleRows.filter((row) => row.uniqueGreenSources < 6 || row.reviewedRefs < row.learnerFacingNodes || row.authorityRefs < row.learnerFacingNodes);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingNodes: learnerNodes.length,
  conceptClusters: conceptClusters.length,
  reviewedRefs: reviewedRefs.length,
  authorityRefs: authorityRefs.length,
  clusterRefs: clusterRefs.length,
  uniqueReviewedSources: uniqueReviewedSources.length,
  uniqueAuthoritySources: uniqueAuthoritySources.length,
  uniqueClusterSources: uniqueClusterSources.length,
  uniqueAllGreenSources: uniqueAllGreenSources.length,
  badGroundingRefs: badRefs.length,
  familyCounts,
  sourceTypeCounts,
  tierCounts,
  moduleRows,
  sampleSources: uniqueAllGreenSources.slice(0, 24).map((source) => ({
    id: source.id,
    name: source.name,
    family: familyFor(source),
    url: source.url,
    sourceType: source.sourceType,
    sourceUseTier: source.sourceUseTier,
    allowedUse: source.allowedUse,
    disallowedUse: source.disallowedUse,
  })),
  boundary: "This report audits source grounding metadata only. Green sources can support source refs, taxonomy, source-boundary notes, and original lesson-rewrite evidence. It does not approve copied text, trading advice, signals, broker workflows, auto-trading, performance claims, or real-money guidance.",
};

if (report.educationOnly !== true) fail("green grounding report must keep educationOnly true");
if (report.productionReady !== false) fail("green grounding report must keep productionReady false");
if (report.learnerFacingNodes < 360) fail(`expected at least 360 learner-facing nodes, got ${report.learnerFacingNodes}`);
if (report.conceptClusters < 3000) fail(`expected at least 3000 concept clusters, got ${report.conceptClusters}`);
if (report.badGroundingRefs > 0) fail(`yellow/red/research-only sources leaked into green grounding refs: ${report.badGroundingRefs}`);
if (report.uniqueReviewedSources < 120) fail(`reviewedSourceRefs use too few unique green sources: ${report.uniqueReviewedSources}`);
if (report.uniqueAuthoritySources < 20) fail(`authorityContextRefs use too few unique green sources: ${report.uniqueAuthoritySources}`);
if (report.uniqueClusterSources < 120) fail(`concept cluster grounding uses too few unique green sources: ${report.uniqueClusterSources}`);
if (weakModules.length) fail(`weak green grounding modules: ${weakModules.map((row) => `${row.module}(${row.uniqueGreenSources})`).join(", ")}`);
for (const family of ["SEC", "Investor.gov", "CFTC", "BLS", "BEA", "Project Gutenberg", "Internet Archive"]) {
  if (!report.familyCounts[family]) fail(`missing required green source family in grounding report: ${family}`);
}

await fs.mkdir("docs", { recursive: true });
await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, [
  "# Green Source Grounding",
  "",
  "This report audits the green-source evidence chain for concept clusters and learner-facing knowledge-browser nodes.",
  "It is not content reuse approval and not trading guidance.",
  "",
  "## Summary",
  "",
  `- Learner-facing nodes: ${report.learnerFacingNodes}`,
  `- Concept clusters: ${report.conceptClusters}`,
  `- Reviewed source refs: ${report.reviewedRefs}`,
  `- Authority context refs: ${report.authorityRefs}`,
  `- Cluster grounding refs: ${report.clusterRefs}`,
  `- Unique reviewed green sources: ${report.uniqueReviewedSources}`,
  `- Unique authority green sources: ${report.uniqueAuthoritySources}`,
  `- Unique cluster green sources: ${report.uniqueClusterSources}`,
  `- Unique green sources across all grounding: ${report.uniqueAllGreenSources}`,
  `- Yellow/red/research-only leaks: ${report.badGroundingRefs}`,
  "",
  "## Source Families",
  "",
  "| Family | Unique green sources |",
  "| --- | ---: |",
  ...Object.entries(report.familyCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([family, count]) => `| ${family} | ${count} |`),
  "",
  "## Module Grounding",
  "",
  "| Module | Nodes | Reviewed refs | Authority refs | Cluster refs | Unique green sources |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...moduleRows.map((row) => `| ${row.module} | ${row.learnerFacingNodes} | ${row.reviewedRefs} | ${row.authorityRefs} | ${row.clusterRefs} | ${row.uniqueGreenSources} |`),
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingNodes: report.learnerFacingNodes,
  conceptClusters: report.conceptClusters,
  uniqueReviewedSources: report.uniqueReviewedSources,
  uniqueAuthoritySources: report.uniqueAuthoritySources,
  uniqueClusterSources: report.uniqueClusterSources,
  uniqueAllGreenSources: report.uniqueAllGreenSources,
  badGroundingRefs: report.badGroundingRefs,
  outputJson,
  outputMd,
}, null, 2));
