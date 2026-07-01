import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { localCourse5Knowledge } = require("../education-local-course-5-knowledge-nodes.js");
const { knowledgeBrowserIndex } = require("../education-knowledge-browser-index.js");

function fail(message) {
  throw new Error(message);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

function requireFields(label, item, fields) {
  const missing = fields.filter((field) => !hasValue(item[field]));
  if (missing.length) fail(`${label} ${item.id || item.seedId || "item"} missing fields: ${missing.join(", ")}`);
}

const forbidden = [
  "buy signal",
  "sell signal",
  "recommended buy",
  "recommended sell",
  "guaranteed return",
  "win rate",
  "profit target",
  "real money",
  "auto trading",
  "approved for release",
  "learner-facing approved",
  "delete source",
];

if (!fs.existsSync("docs/LOCAL_COURSE_5_FOLLOWUP_AI_MODULE_LESSON_SEEDS.json")) fail("missing lesson seed source artifact");
if (!fs.existsSync("docs/LOCAL_COURSE_5_FOLLOWUP_KNOWLEDGE_NODES.json")) fail("missing knowledge nodes snapshot");
if (!fs.existsSync("docs/LOCAL_COURSE_5_FOLLOWUP_KNOWLEDGE_NODES.md")) fail("missing knowledge nodes markdown snapshot");

if (localCourse5Knowledge.status !== "course_5_followup_internal_knowledge_nodes_available_release_blocked") fail("status drift");
if (localCourse5Knowledge.educationOnly !== true || localCourse5Knowledge.productionReady !== false) fail("top-level boundary drift");
if (localCourse5Knowledge.learnerFacingRelease !== false || localCourse5Knowledge.writeAllowedNow !== false) fail("release boundary drift");
if (localCourse5Knowledge.sourceFolderMayBeDeleted !== false || localCourse5Knowledge.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (localCourse5Knowledge.internalAiAbsorptionComplete !== true || localCourse5Knowledge.aiOnlyAbsorptionAcceptedForKnowledgeBase !== true) fail("AI absorption flags missing");
if (localCourse5Knowledge.sourceRows !== 386 || localCourse5Knowledge.moduleRows !== 11 || localCourse5Knowledge.lessonSeedRows !== 36) fail("coverage counts drift");
if (localCourse5Knowledge.internalKnowledgeNodeRows !== 36) fail("expected 36 internal knowledge nodes");
if (!Array.isArray(localCourse5Knowledge.internalKnowledgeNodes) || localCourse5Knowledge.internalKnowledgeNodes.length !== 36) fail("knowledge node array mismatch");
if (!Array.isArray(localCourse5Knowledge.moduleSummary) || localCourse5Knowledge.moduleSummary.length !== 11) fail("module summary mismatch");

const moduleIds = new Set();
const seedIds = new Set();
for (const node of localCourse5Knowledge.internalKnowledgeNodes) {
  requireFields("Course5KnowledgeNode", node, [
    "id",
    "seedId",
    "courseId",
    "nodeType",
    "moduleId",
    "module",
    "title",
    "topic",
    "difficulty",
    "learningUse",
    "definition",
    "evidenceRefs",
    "candidateConcepts",
    "practicePrompt",
    "reviewChecklist",
    "reviewStatus",
    "safetyBoundary",
    "boundaryNote",
  ]);
  if (node.courseId !== "local_course_5_followup") fail(`node course drift: ${node.id}`);
  if (node.nodeType !== "internal_course_knowledge_node") fail(`node type drift: ${node.id}`);
  if (node.educationOnly !== true || node.productionReady !== false || node.learnerFacingAllowed !== false || node.learnerFacingRelease !== false || node.writeAllowedNow !== false) fail(`node release boundary drift: ${node.id}`);
  if (node.sourceFolderMayBeDeleted !== false) fail(`node deletion boundary drift: ${node.id}`);
  if (node.evidenceRefs.length < 1) fail(`node missing evidence refs: ${node.id}`);
  if (node.reviewChecklist.length < 4) fail(`node thin review checklist: ${node.id}`);
  moduleIds.add(node.moduleId);
  if (seedIds.has(node.seedId)) fail(`duplicate seed mapping: ${node.seedId}`);
  seedIds.add(node.seedId);
}
if (moduleIds.size !== 11) fail(`expected 11 modules, got ${moduleIds.size}`);

const snapshot = JSON.parse(fs.readFileSync("docs/LOCAL_COURSE_5_FOLLOWUP_KNOWLEDGE_NODES.json", "utf8"));
if (snapshot.internalKnowledgeNodeRows !== localCourse5Knowledge.internalKnowledgeNodeRows) fail("snapshot count drift");
if (knowledgeBrowserIndex.localCourse5Knowledge?.internalKnowledgeNodeRows !== 36) fail("knowledge browser index missing Course 5 nodes");
if (knowledgeBrowserIndex.qualitySummary.localCourse5InternalKnowledgeNodes !== 36) fail("knowledge browser quality summary missing Course 5 node count");

const text = JSON.stringify(localCourse5Knowledge).toLowerCase();
for (const phrase of forbidden) {
  if (text.includes(phrase)) fail(`forbidden phrase found: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  status: localCourse5Knowledge.status,
  sourceRows: localCourse5Knowledge.sourceRows,
  moduleRows: localCourse5Knowledge.moduleRows,
  lessonSeedRows: localCourse5Knowledge.lessonSeedRows,
  internalKnowledgeNodeRows: localCourse5Knowledge.internalKnowledgeNodeRows,
  learnerFacingRelease: localCourse5Knowledge.learnerFacingRelease,
  sourceFolderMayBeDeleted: localCourse5Knowledge.sourceFolderMayBeDeleted,
}, null, 2));
