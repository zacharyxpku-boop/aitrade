import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { curriculumPaths, curriculumPathReport } = require("../education-curriculum-paths.js");
const { knowledgeLessons } = require("../education-knowledge-lessons.js");
const {
  REVIEW_TYPES,
  curriculumReviewQueue,
  curriculumReviewQueueReport,
} = require("../education-curriculum-review-queue.js");

const forbidden = [
  "we recommend buying",
  "we recommend selling",
  "you should buy",
  "you should sell",
  "buy signal",
  "sell signal",
  "provide live signal",
  "guaranteed return",
  "win-rate promise",
  "profit promise",
  "connect broker",
  "enable auto-trading",
  "guide real money",
  "荐股",
  "买入建议",
  "卖出建议",
  "实盘信号",
  "保证收益",
  "胜率承诺",
  "券商接入",
  "自动下单",
  "真实资金指导",
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
  if (missing.length) fail(`${label} ${item.id || "item"} missing fields: ${missing.join(", ")}`);
}

function itemKey(targetType, targetId, reviewType) {
  return `${targetType}:${targetId}:${reviewType}`;
}

const text = JSON.stringify({ curriculumReviewQueue, curriculumReviewQueueReport }).toLowerCase();
const found = forbidden.filter((word) => text.includes(word.toLowerCase()));
if (found.length) fail(`curriculum review queue contains forbidden terms: ${found.join(", ")}`);

if (curriculumReviewQueueReport.educationOnly !== true) fail("review queue report must keep educationOnly true");
if (curriculumReviewQueueReport.productionReady !== false) fail("review queue report must keep productionReady false");
if (curriculumReviewQueueReport.pathsCovered !== curriculumPaths.length) fail("review queue must cover every curriculum path");
if (curriculumReviewQueueReport.unitsCovered !== curriculumPathReport.totalUnits) fail("review queue must cover every curriculum unit");
if (curriculumReviewQueueReport.lessonsCovered !== knowledgeLessons.length) fail("review queue must cover every lesson");
if (curriculumReviewQueueReport.reviewItems < knowledgeLessons.length * 5) fail("review queue is too thin for lesson-level review");
if (!curriculumReviewQueueReport.handAuthoredSummary) fail("review queue must expose hand-authored coverage");
if (curriculumReviewQueueReport.handAuthoredSummary.lessonsNeedingHandAuthoring < 1) {
  fail("review queue should keep non-hand-authored lesson drafts visible until full human rewrite is complete");
}

const requiredFields = [
  "id",
  "reviewType",
  "targetType",
  "targetId",
  "module",
  "priority",
  "requiredReviewer",
  "status",
  "checklist",
  "riskIfSkipped",
  "allowedOutcome",
  "disallowedOutcome",
  "boundary",
];

const allowedStatuses = new Set(["needs_review"]);
const allowedPriorities = new Set(["P0", "P1", "P2"]);
const seenIds = new Set();
const reviewKeys = new Set();

for (const item of curriculumReviewQueue) {
  requireFields("ReviewItem", item, requiredFields);
  if (seenIds.has(item.id)) fail(`duplicate review item id: ${item.id}`);
  seenIds.add(item.id);
  reviewKeys.add(itemKey(item.targetType, item.targetId, item.reviewType));
  if (item.educationOnly !== true) fail(`review item ${item.id} must keep educationOnly true`);
  if (item.productionReady !== false) fail(`review item ${item.id} must keep productionReady false`);
  if (!allowedStatuses.has(item.status)) fail(`review item ${item.id} cannot be pre-approved`);
  if (!allowedPriorities.has(item.priority)) fail(`review item ${item.id} invalid priority`);
  if (item.checklist.length < 4) fail(`review item ${item.id} checklist too thin`);
  if (!/draft|revise/i.test(item.allowedOutcome)) fail(`review item ${item.id} allowedOutcome must remain draft/revision oriented`);
  if (!/trading|guidance|approved/i.test(item.disallowedOutcome)) fail(`review item ${item.id} disallowedOutcome must block approval/trading drift`);
  if (!/education/i.test(item.boundary)) fail(`review item ${item.id} boundary must mention education`);
}

for (const path of curriculumPaths) {
  for (const reviewType of [REVIEW_TYPES.PATH_PACING, REVIEW_TYPES.PATH_SOURCE_STRATEGY]) {
    if (!reviewKeys.has(itemKey("curriculum_path", path.id, reviewType))) {
      fail(`path ${path.id} missing review type ${reviewType}`);
    }
  }
  for (const unit of path.units) {
    for (const reviewType of [REVIEW_TYPES.UNIT_SEQUENCE, REVIEW_TYPES.UNIT_CHECKPOINT]) {
      if (!reviewKeys.has(itemKey("curriculum_unit", unit.id, reviewType))) {
        fail(`unit ${unit.id} missing review type ${reviewType}`);
      }
    }
  }
}

for (const lesson of knowledgeLessons) {
  for (const reviewType of [
    REVIEW_TYPES.LESSON_WORDING,
    REVIEW_TYPES.LESSON_SOURCE_EVIDENCE,
    REVIEW_TYPES.LESSON_BOUNDARY,
    REVIEW_TYPES.LESSON_TEACHING_QUALITY,
    REVIEW_TYPES.LESSON_HAND_AUTHORING,
  ]) {
    if (!reviewKeys.has(itemKey("knowledge_lesson", lesson.id, reviewType))) {
      fail(`lesson ${lesson.id} missing review type ${reviewType}`);
    }
  }
}

if ((curriculumReviewQueueReport.priorityCounts.P0 || 0) < knowledgeLessons.length) {
  fail("every lesson should have at least one P0 safety-boundary review");
}

console.log(JSON.stringify({
  ok: true,
  productionReady: false,
  educationOnly: true,
  reviewItems: curriculumReviewQueueReport.reviewItems,
  pathsCovered: curriculumReviewQueueReport.pathsCovered,
  unitsCovered: curriculumReviewQueueReport.unitsCovered,
  lessonsCovered: curriculumReviewQueueReport.lessonsCovered,
  reviewTypeCounts: curriculumReviewQueueReport.reviewTypeCounts,
  priorityCounts: curriculumReviewQueueReport.priorityCounts,
  handAuthoredSummary: curriculumReviewQueueReport.handAuthoredSummary,
}, null, 2));
