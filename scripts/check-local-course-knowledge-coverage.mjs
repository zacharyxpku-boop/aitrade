import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { localCourseCoverageIndex } = require("../education-local-course-coverage");

function fail(message) {
  throw new Error(message);
}

if (localCourseCoverageIndex.educationOnly !== true) fail("local course coverage must keep educationOnly true");
if (localCourseCoverageIndex.productionReady !== false) fail("local course coverage must keep productionReady false");
if (localCourseCoverageIndex.tier !== "local_private_course") fail("coverage must remain local_private_course");
if (localCourseCoverageIndex.documents < 298) fail(`expected at least 298 local course documents, got ${localCourseCoverageIndex.documents}`);
if (localCourseCoverageIndex.chunks < 3000) fail(`expected at least 3000 local course chunks, got ${localCourseCoverageIndex.chunks}`);
if (localCourseCoverageIndex.matchedNodes < 360) fail(`expected all 360 learner-facing nodes to have local course matches, got ${localCourseCoverageIndex.matchedNodes}`);
if (localCourseCoverageIndex.readyForRewriteReviewNodes < 360) fail(`expected all 360 nodes ready for rewrite review, got ${localCourseCoverageIndex.readyForRewriteReviewNodes}`);
if (!Array.isArray(localCourseCoverageIndex.moduleCoverage) || localCourseCoverageIndex.moduleCoverage.length < 12) fail("missing module coverage");
if (!Array.isArray(localCourseCoverageIndex.rewriteIntake) || localCourseCoverageIndex.rewriteIntake.length < 100) fail("rewrite intake too small");
if (!/private reviewer intake/i.test(localCourseCoverageIndex.boundary)) fail("missing private reviewer intake boundary");

for (const module of localCourseCoverageIndex.moduleCoverage) {
  if (module.learnerFacingNodes < 1) fail(`module ${module.module} has no learner-facing nodes`);
  if (module.nodesWithLocalCourseMatches !== module.learnerFacingNodes) fail(`module ${module.module} has incomplete local-course node coverage`);
  if (module.coverageRate !== 1) fail(`module ${module.module} expected coverageRate 1, got ${module.coverageRate}`);
}

for (const item of localCourseCoverageIndex.rewriteIntake) {
  if (item.productionReady === true) fail(`rewrite intake ${item.nodeId} must not be production-ready`);
  if (!Array.isArray(item.localCourseEvidence) || item.localCourseEvidence.length < 2) fail(`rewrite intake ${item.nodeId} missing local evidence`);
  const text = JSON.stringify(item);
  if (!/Do not copy local PDF wording/i.test(text)) fail(`rewrite intake ${item.nodeId} missing no-copy boundary`);
  if (!/structural_draft/i.test(text)) fail(`rewrite intake ${item.nodeId} missing structural_draft boundary`);
}

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/LOCAL_COURSE_KNOWLEDGE_COVERAGE.json", `${JSON.stringify(localCourseCoverageIndex, null, 2)}\n`, "utf8");

const reportMd = [
  "# Local Course Knowledge Coverage",
  "",
  "Maps the imported local PDF course folder into the internal knowledge browser and rewrite workflow.",
  "",
  "## Summary",
  "",
  `- Local private course documents: ${localCourseCoverageIndex.documents}`,
  `- Local private chunks: ${localCourseCoverageIndex.chunks}`,
  `- Learner-facing nodes matched: ${localCourseCoverageIndex.matchedNodes}`,
  `- Nodes ready for rewrite review: ${localCourseCoverageIndex.readyForRewriteReviewNodes}`,
  `- Rewrite intake candidates exported: ${localCourseCoverageIndex.rewriteIntake.length}`,
  `- Production ready: ${localCourseCoverageIndex.productionReady}`,
  "",
  "## Module Coverage",
  "",
  "| Module | Local docs | Nodes | Ready | Coverage |",
  "|---|---:|---:|---:|---:|",
  ...localCourseCoverageIndex.moduleCoverage.map((module) => `| ${module.module} | ${module.localCourseDocuments} | ${module.learnerFacingNodes} | ${module.readyForRewriteReview} | ${(module.coverageRate * 100).toFixed(0)}% |`),
  "",
  "## Rewrite Intake Samples",
  "",
  ...localCourseCoverageIndex.rewriteIntake.slice(0, 20).map((item) => `- ${item.nodeId}: ${item.module} / ${item.topic} -> ${item.localCourseEvidence.map((evidence) => evidence.sourceRelativePath).join("; ")}`),
  "",
  "## Boundary",
  "",
  localCourseCoverageIndex.boundary,
  "",
].join("\n");

fs.writeFileSync("docs/LOCAL_COURSE_KNOWLEDGE_COVERAGE.md", reportMd, "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  documents: localCourseCoverageIndex.documents,
  chunks: localCourseCoverageIndex.chunks,
  matchedNodes: localCourseCoverageIndex.matchedNodes,
  readyForRewriteReviewNodes: localCourseCoverageIndex.readyForRewriteReviewNodes,
  moduleCoverage: localCourseCoverageIndex.moduleCoverage.length,
  rewriteIntake: localCourseCoverageIndex.rewriteIntake.length,
  outputJson: "docs/LOCAL_COURSE_KNOWLEDGE_COVERAGE.json",
  outputMd: "docs/LOCAL_COURSE_KNOWLEDGE_COVERAGE.md",
}, null, 2));
