import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const JSON_PATH = "docs/KNOWLEDGE_INTERNAL_TEACHING_PACKAGES.json";
const MD_PATH = "docs/KNOWLEDGE_INTERNAL_TEACHING_PACKAGES.md";
const JS_PATH = "education-internal-teaching-packages.js";

function fail(message) {
  console.error(`knowledge internal teaching packages check failed: ${message}`);
  process.exit(1);
}

function readJson(path) {
  if (!fs.existsSync(path)) fail(`missing ${path}`);
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

for (const path of [JSON_PATH, MD_PATH, JS_PATH]) {
  if (!fs.existsSync(path)) fail(`missing ${path}`);
}

const artifact = readJson(JSON_PATH);
const { internalTeachingPackages } = require(`../${JS_PATH}`);
const { knowledgeBrowserIndex } = require("../education-knowledge-browser-index");

if (artifact.educationOnly !== true) fail("educationOnly drift");
if (artifact.productionReady !== false) fail("productionReady drift");
if (artifact.learnerFacingRelease !== false) fail("learnerFacingRelease drift");
if (artifact.approvalStatus !== "not_approved") fail("approvalStatus drift");
if (artifact.writeAllowedNow !== false) fail("writeAllowedNow drift");
if (artifact.packageStatus !== "internal_teaching_packages_ready_for_course_design_release_blocked") fail("packageStatus drift");

const totals = artifact.totals || {};
if (totals.moduleTeachingPackages !== 12) fail(`expected 12 module packages, got ${totals.moduleTeachingPackages}`);
if (totals.lessonOutlines < 36) fail(`expected at least 36 lesson outlines, got ${totals.lessonOutlines}`);
if (totals.quizAndPracticeItems < 108) fail(`expected at least 108 quiz/practice items, got ${totals.quizAndPracticeItems}`);
if (totals.moduleLearningPathSuggestions !== 12) fail(`expected 12 learning path suggestions, got ${totals.moduleLearningPathSuggestions}`);
if (totals.globalCourseGraphNodes !== 12) fail(`expected 12 graph nodes, got ${totals.globalCourseGraphNodes}`);
if (totals.globalCourseGraphEdges < 11) fail(`expected at least 11 graph edges, got ${totals.globalCourseGraphEdges}`);

if (!Array.isArray(artifact.moduleTeachingPackages) || artifact.moduleTeachingPackages.length !== totals.moduleTeachingPackages) fail("module package array mismatch");
if (!Array.isArray(artifact.lessonOutlines) || artifact.lessonOutlines.length !== totals.lessonOutlines) fail("lesson outline array mismatch");
if (!Array.isArray(artifact.quizAndPracticeItems) || artifact.quizAndPracticeItems.length !== totals.quizAndPracticeItems) fail("quiz/practice array mismatch");
if (!Array.isArray(artifact.moduleLearningPathSuggestions) || artifact.moduleLearningPathSuggestions.length !== 12) fail("learning path suggestion array mismatch");

const modules = new Set();
for (const pkg of artifact.moduleTeachingPackages) {
  modules.add(pkg.module);
  if (pkg.educationOnly !== true || pkg.productionReady !== false || pkg.learnerFacingRelease !== false || pkg.approvalStatus !== "not_approved" || pkg.writeAllowedNow !== false) fail(`package boundary drift ${pkg.packageId}`);
  if (pkg.internalTeachingStatus !== "internal_teaching_package_ready_for_course_design") fail(`package status drift ${pkg.packageId}`);
  if (!pkg.moduleOverview?.coreConcepts?.length) fail(`missing core concepts ${pkg.module}`);
  if (!pkg.moduleOverview?.teachableSequence?.length) fail(`missing teachable sequence ${pkg.module}`);
  if (!pkg.moduleOverview?.sourceFitPrecheckCounts || !Object.keys(pkg.moduleOverview.sourceFitPrecheckCounts).length) fail(`missing source-fit counts ${pkg.module}`);
  if (!Array.isArray(pkg.lessonOutlines) || pkg.lessonOutlines.length < 3 || pkg.lessonOutlines.length > 5) fail(`bad lesson count ${pkg.module}`);
  if ((pkg.practiceItemCount || 0) < pkg.lessonOutlines.length * 2) fail(`too few practice items ${pkg.module}`);
  if ((pkg.quizItemCount || 0) < pkg.lessonOutlines.length * 3) fail(`too few quiz items ${pkg.module}`);
  if (!pkg.sourceAndRiskNotes?.requiredBeforeRelease?.length) fail(`missing requiredBeforeRelease ${pkg.module}`);
  if (!String(pkg.boundary || "").includes("not publication approval")) fail(`weak boundary ${pkg.module}`);
}
if (modules.size !== 12) fail(`expected 12 unique modules, got ${modules.size}`);

for (const lesson of artifact.lessonOutlines) {
  if (lesson.educationOnly !== true || lesson.productionReady !== false || lesson.learnerFacingRelease !== false || lesson.approvalStatus !== "not_approved" || lesson.writeAllowedNow !== false) fail(`lesson boundary drift ${lesson.lessonId}`);
  if (!modules.has(lesson.module)) fail(`unknown lesson module ${lesson.lessonId}`);
  if (!Array.isArray(lesson.learningObjectives) || lesson.learningObjectives.length < 3) fail(`missing objectives ${lesson.lessonId}`);
  if (!lesson.conceptExplanation || lesson.conceptExplanation.length < 20) fail(`thin explanation ${lesson.lessonId}`);
  if (!Array.isArray(lesson.misconceptionWarnings) || lesson.misconceptionWarnings.length < 2) fail(`missing misconception warnings ${lesson.lessonId}`);
  if (!Array.isArray(lesson.practicePrompts) || lesson.practicePrompts.length < 2) fail(`missing practice prompts ${lesson.lessonId}`);
  if (!Array.isArray(lesson.quizQuestions) || lesson.quizQuestions.length < 3) fail(`missing quiz questions ${lesson.lessonId}`);
  if (!Array.isArray(lesson.releaseBlockers) || lesson.releaseBlockers.length < 3) fail(`missing release blockers ${lesson.lessonId}`);
}

for (const item of artifact.quizAndPracticeItems) {
  const text = JSON.stringify(item).toLowerCase();
  for (const forbidden of [
    "recommended buy",
    "recommended sell",
    "guaranteed return",
    "profit target",
    "approved for release",
    "learner-facing approved",
    "broker workflow ready",
    "auto-trading enabled",
  ]) {
    if (text.includes(forbidden)) fail(`forbidden phrase '${forbidden}' in ${item.itemId}`);
  }
}

const graph = artifact.globalCourseGraph || {};
if (graph.educationOnly !== true || graph.productionReady !== false || graph.learnerFacingRelease !== false || graph.approvalStatus !== "not_approved") fail("graph boundary drift");
if (!Array.isArray(graph.nodes) || graph.nodes.length !== 12) fail("graph nodes mismatch");
if (!Array.isArray(graph.edges) || graph.edges.length < 11) fail("graph edges mismatch");
if (graph.nodes.some((node) => !modules.has(node.module))) fail("graph references unknown module");

if (internalTeachingPackages.packageStatus !== artifact.packageStatus) fail("generated JS packageStatus mismatch");
if (internalTeachingPackages.totals?.moduleTeachingPackages !== 12) fail("generated JS totals mismatch");
if (internalTeachingPackages.learnerFacingRelease !== false || internalTeachingPackages.approvalStatus !== "not_approved") fail("generated JS release drift");

if (!knowledgeBrowserIndex.internalTeachingPackages) fail("Knowledge Browser index missing internalTeachingPackages");
if (knowledgeBrowserIndex.internalTeachingPackages.packageStatus !== artifact.packageStatus) fail("Knowledge Browser internal package status mismatch");
if (knowledgeBrowserIndex.internalTeachingPackages.totals?.lessonOutlines < 36) fail("Knowledge Browser lesson outline count too low");
if (knowledgeBrowserIndex.meta?.educationOnly !== true || knowledgeBrowserIndex.meta?.productionReady !== false) fail("Knowledge Browser meta boundary drift");

const md = fs.readFileSync(MD_PATH, "utf8");
if (!md.includes("Knowledge Internal Teaching Packages")) fail("markdown title missing");
if (!md.includes("Learner-facing release: false")) fail("markdown release boundary missing");

console.log(JSON.stringify({
  ok: true,
  packageStatus: artifact.packageStatus,
  moduleTeachingPackages: totals.moduleTeachingPackages,
  lessonOutlines: totals.lessonOutlines,
  quizAndPracticeItems: totals.quizAndPracticeItems,
  moduleLearningPathSuggestions: totals.moduleLearningPathSuggestions,
  knowledgeBrowserSurface: knowledgeBrowserIndex.internalTeachingPackages.knowledgeBrowserSurface,
}, null, 2));
