import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { curriculumPaths, curriculumPathReport } = require("../education-curriculum-paths.js");
const { knowledgeLessons } = require("../education-knowledge-lessons.js");

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
  if (missing.length) fail(`${label} ${item.id || item.module || "item"} missing fields: ${missing.join(", ")}`);
}

const text = JSON.stringify({ curriculumPaths, curriculumPathReport });
const found = forbidden.filter((word) => text.includes(word));
if (found.length) fail(`curriculum paths contain forbidden terms: ${found.join(", ")}`);

if (curriculumPathReport.educationOnly !== true) fail("curriculum report must keep educationOnly true");
if (curriculumPathReport.productionReady !== false) fail("curriculum report must keep productionReady false");
if (curriculumPaths.length < 12) fail(`expected at least 12 curriculum paths, got ${curriculumPaths.length}`);
if (curriculumPathReport.totalPathLessons !== knowledgeLessons.length) fail("curriculum path lesson count mismatch");
if (curriculumPathReport.pathsWithReviewLoops !== curriculumPaths.length) fail("every path must have review loops");
if (curriculumPathReport.prerequisitePathEdges < curriculumPaths.length - 1) fail("path prerequisite edges missing");
if (curriculumPathReport.prerequisiteUnitEdges < curriculumPathReport.totalUnits - curriculumPaths.length) fail("unit prerequisite edges missing");
if (curriculumPathReport.totalEstimatedMinutes < knowledgeLessons.length * 6) fail("curriculum estimated time too low");

const lessonIds = new Set(knowledgeLessons.map((lesson) => lesson.id));
const seenLessonIds = new Set();
const pathIds = new Set(curriculumPaths.map((path) => path.id));

for (const path of curriculumPaths) {
  requireFields("CurriculumPath", path, ["id", "module", "lessonCount", "unitCount", "estimatedMinutes", "entryLessonId", "finalLessonId", "units", "reviewLoop", "boundary"]);
  if (!Array.isArray(path.prerequisitePathIds)) fail(`path ${path.id} prerequisitePathIds must be an array`);
  if (path.educationOnly !== true) fail(`path ${path.id} must keep educationOnly true`);
  if (path.productionReady !== false) fail(`path ${path.id} must keep productionReady false`);
  if (path.lessonCount < 20) fail(`path ${path.id} has too few lessons`);
  if (path.unitCount < 2) fail(`path ${path.id} has too few units`);
  if (path.estimatedMinutes !== path.lessonCount * 8) fail(`path ${path.id} estimatedMinutes mismatch`);
  if (!lessonIds.has(path.entryLessonId) || !lessonIds.has(path.finalLessonId)) fail(`path ${path.id} invalid entry/final lesson`);
  for (const prereqPathId of path.prerequisitePathIds) {
    if (!pathIds.has(prereqPathId)) fail(`path ${path.id} invalid prerequisite path ${prereqPathId}`);
  }
  const unitIds = new Set(path.units.map((unit) => unit.id));
  for (const unit of path.units) {
    requireFields("CurriculumUnit", unit, ["id", "title", "lessonIds", "focus", "estimatedMinutes", "checkpoint"]);
    if (!Array.isArray(unit.prerequisiteUnitIds)) fail(`unit ${unit.id} prerequisiteUnitIds must be an array`);
    if (!["foundation", "application", "review"].includes(unit.focus)) fail(`unit ${unit.id} invalid focus`);
    if (unit.lessonIds.length > 10) fail(`unit ${unit.id} too large for one learning unit`);
    if (unit.estimatedMinutes !== unit.lessonIds.length * 8) fail(`unit ${unit.id} estimatedMinutes mismatch`);
    for (const prereqUnitId of unit.prerequisiteUnitIds) {
      if (!unitIds.has(prereqUnitId)) fail(`unit ${unit.id} invalid prerequisite unit ${prereqUnitId}`);
    }
    if (unit.nextUnitId && !unitIds.has(unit.nextUnitId)) fail(`unit ${unit.id} invalid nextUnitId ${unit.nextUnitId}`);
    for (const lessonId of unit.lessonIds) {
      if (!lessonIds.has(lessonId)) fail(`unit ${unit.id} invalid lessonId ${lessonId}`);
      seenLessonIds.add(lessonId);
    }
    if (unit.checkpoint.passCriteria.length < 4) fail(`unit ${unit.id} checkpoint too thin`);
  }
}

if (seenLessonIds.size !== knowledgeLessons.length) fail(`curriculum paths cover ${seenLessonIds.size} lessons, expected ${knowledgeLessons.length}`);

console.log(JSON.stringify({
  ok: true,
  productionReady: false,
  educationOnly: true,
  paths: curriculumPaths.length,
  totalLessons: curriculumPathReport.totalPathLessons,
  totalUnits: curriculumPathReport.totalUnits,
  totalEstimatedMinutes: curriculumPathReport.totalEstimatedMinutes,
  prerequisitePathEdges: curriculumPathReport.prerequisitePathEdges,
  prerequisiteUnitEdges: curriculumPathReport.prerequisiteUnitEdges,
  pathsWithReviewLoops: curriculumPathReport.pathsWithReviewLoops,
}, null, 2));
