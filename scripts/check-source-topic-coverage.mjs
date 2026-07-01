import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { sourceTopicCoverageReport } = require("../education-source-topic-coverage.js");

function fail(message) {
  throw new Error(message);
}

const forbidden = [
  "推荐买入",
  "推荐卖出",
  "保证收益",
  "胜率承诺",
  "实盘信号",
  "自动下单",
  "接入券商",
  "真实资金建议",
];

const text = JSON.stringify(sourceTopicCoverageReport);
const found = forbidden.filter((word) => text.includes(word));
if (found.length) fail(`source topic coverage contains forbidden terms: ${found.join(", ")}`);

if (sourceTopicCoverageReport.educationOnly !== true) fail("topic coverage must keep educationOnly true");
if (sourceTopicCoverageReport.productionReady !== false) fail("topic coverage must keep productionReady false");
if (sourceTopicCoverageReport.totalSources < 10000) fail(`expected >=10000 sources, got ${sourceTopicCoverageReport.totalSources}`);
if (sourceTopicCoverageReport.reviewedSources < 10000) fail(`expected source review coverage, got ${sourceTopicCoverageReport.reviewedSources}`);
if (sourceTopicCoverageReport.domains < 10) fail("expected at least 10 source topic domains");
if (sourceTopicCoverageReport.duplicateLearnerFacingGroups > 0) {
  fail(`normalized URL duplicate groups have multiple learner-facing variants: ${sourceTopicCoverageReport.duplicateLearnerFacingGroups}`);
}
if (sourceTopicCoverageReport.unclassifiedSources > 900) fail(`too many unclassified sources: ${sourceTopicCoverageReport.unclassifiedSources}`);

const weakDomains = sourceTopicCoverageReport.topicCoverage.filter((domain) => domain.sourceGap > 0 || domain.learnerFacingGap > 0);
if (weakDomains.length) {
  fail(`topic coverage gaps remain: ${weakDomains.map((domain) => `${domain.id}(sourceGap=${domain.sourceGap}, learnerFacingGap=${domain.learnerFacingGap})`).join("; ")}`);
}

await fs.promises.mkdir("docs", { recursive: true });
await fs.promises.writeFile(
  "docs/SOURCE_TOPIC_COVERAGE.json",
  `${JSON.stringify(sourceTopicCoverageReport, null, 2)}\n`,
  "utf8",
);

const md = [
  "# Source Topic Coverage",
  "",
  "This report maps source metadata into education knowledge domains. It is not content reuse approval and not market-data authorization.",
  "",
  "## Summary",
  "",
  `- Total sources: ${sourceTopicCoverageReport.totalSources}`,
  `- Reviewed sources: ${sourceTopicCoverageReport.reviewedSources}`,
  `- Topic domains: ${sourceTopicCoverageReport.domains}`,
  `- Domains meeting source minimum: ${sourceTopicCoverageReport.domainsMeetingSourceMinimum}`,
  `- Domains meeting learner-facing minimum: ${sourceTopicCoverageReport.domainsMeetingLearnerFacingMinimum}`,
  `- Unclassified review-needed sources: ${sourceTopicCoverageReport.unclassifiedSources}`,
  `- Duplicate normalized URLs: ${sourceTopicCoverageReport.duplicateNormalizedUrls}`,
  `- Duplicate learner-facing URLs: ${sourceTopicCoverageReport.duplicateLearnerFacingUrls}`,
  `- Duplicate learner-facing collision groups: ${sourceTopicCoverageReport.duplicateLearnerFacingGroups}`,
  "",
  "## Domain Coverage",
  "",
  "| Domain | Sources | Learner-facing allowed | Taxonomy allowed | Tier S/A | Research-only | Unique hosts |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  ...sourceTopicCoverageReport.topicCoverage.map((domain) => (
    `| ${domain.label} | ${domain.totalSources} | ${domain.learnerFacingAllowedSources} | ${domain.taxonomyAllowedSources} | ${domain.tierSOrASources} | ${domain.researchOnlySources} | ${domain.uniqueHosts} |`
  )),
  "",
  "## Boundary",
  "",
  sourceTopicCoverageReport.boundary,
  "",
].join("\n");

await fs.promises.writeFile("docs/SOURCE_TOPIC_COVERAGE.md", md, "utf8");

console.log(JSON.stringify({
  ok: true,
  productionReady: false,
  educationOnly: true,
  totalSources: sourceTopicCoverageReport.totalSources,
  domains: sourceTopicCoverageReport.domains,
  domainsMeetingSourceMinimum: sourceTopicCoverageReport.domainsMeetingSourceMinimum,
  domainsMeetingLearnerFacingMinimum: sourceTopicCoverageReport.domainsMeetingLearnerFacingMinimum,
  unclassifiedSources: sourceTopicCoverageReport.unclassifiedSources,
  duplicateNormalizedUrls: sourceTopicCoverageReport.duplicateNormalizedUrls,
  duplicateLearnerFacingUrls: sourceTopicCoverageReport.duplicateLearnerFacingUrls,
  duplicateLearnerFacingGroups: sourceTopicCoverageReport.duplicateLearnerFacingGroups,
}, null, 2));
