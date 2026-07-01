const { curriculumPaths, curriculumPathReport } = require("./education-curriculum-paths");
const { knowledgeLessons, knowledgeLessonReport } = require("./education-knowledge-lessons");
const { knowledgeBrowserIndex } = require("./education-knowledge-browser-index");

const REVIEW_TYPES = {
  PATH_PACING: "path_pacing_review",
  PATH_SOURCE_STRATEGY: "path_source_strategy_review",
  UNIT_SEQUENCE: "unit_sequence_review",
  UNIT_CHECKPOINT: "unit_checkpoint_review",
  LESSON_WORDING: "lesson_wording_review",
  LESSON_SOURCE_EVIDENCE: "lesson_source_evidence_review",
  LESSON_BOUNDARY: "lesson_boundary_review",
  LESSON_TEACHING_QUALITY: "lesson_teaching_quality_review",
  LESSON_HAND_AUTHORING: "lesson_hand_authoring_review",
};

const REVIEWERS = {
  product: "product_curriculum_reviewer",
  teacher: "trading_education_teacher_reviewer",
  source: "source_license_reviewer",
  boundary: "education_safety_boundary_reviewer",
};

function priorityForLesson(lesson) {
  if (lesson.sourceEvidence.reviewedSourceRefCount < 2) return "P0";
  if (lesson.sourceEvidence.authorityContextRefCount < 2) return "P1";
  if ((lesson.commonMistakes || []).length < 2) return "P1";
  return "P2";
}

function baseItem({
  id,
  reviewType,
  targetType,
  targetId,
  module,
  priority,
  requiredReviewer,
  checklist,
  riskIfSkipped,
}) {
  return {
    id,
    reviewType,
    targetType,
    targetId,
    module,
    priority,
    requiredReviewer,
    status: "needs_review",
    educationOnly: true,
    productionReady: false,
    checklist,
    riskIfSkipped,
    allowedOutcome: "revise_or_keep_as_draft",
    disallowedOutcome: "approved_final_or_trading_guidance",
    boundary: "Review items professionalize education-only curriculum drafts. They do not approve recommendations, signals, broker workflows, auto-trading, performance claims, or real-money guidance.",
  };
}

function pathReviewItems(path) {
  return [
    baseItem({
      id: `review_${path.id}_pacing`,
      reviewType: REVIEW_TYPES.PATH_PACING,
      targetType: "curriculum_path",
      targetId: path.id,
      module: path.module,
      priority: path.lessonCount > 35 ? "P1" : "P2",
      requiredReviewer: REVIEWERS.product,
      checklist: [
        "Confirm the path has a clear learner entry point.",
        "Check that estimated minutes are realistic for observation practice.",
        "Confirm prerequisites do not force unrelated modules too early.",
        "Flag any unit that feels like a raw taxonomy dump instead of a course step.",
      ],
      riskIfSkipped: "Learners may see a long list of topics rather than a guided learning sequence.",
    }),
    baseItem({
      id: `review_${path.id}_source_strategy`,
      reviewType: REVIEW_TYPES.PATH_SOURCE_STRATEGY,
      targetType: "curriculum_path",
      targetId: path.id,
      module: path.module,
      priority: "P1",
      requiredReviewer: REVIEWERS.source,
      checklist: [
        "Confirm path-level source mix includes authority context, not only package metadata.",
        "Check that research-only sources are not presented as learner-facing authority.",
        "Check source use stays at taxonomy, context, and boundary level unless license is clear.",
        "Identify missing official or public-document categories for the next harvest batch.",
      ],
      riskIfSkipped: "The module may look broad while relying on weak or uncleared sources.",
    }),
  ];
}

function unitReviewItems(path, unit) {
  return [
    baseItem({
      id: `review_${unit.id}_sequence`,
      reviewType: REVIEW_TYPES.UNIT_SEQUENCE,
      targetType: "curriculum_unit",
      targetId: unit.id,
      module: path.module,
      priority: unit.focus === "foundation" ? "P1" : "P2",
      requiredReviewer: REVIEWERS.teacher,
      checklist: [
        "Confirm the unit focus matches its lesson set.",
        "Check that prerequisite unit links are understandable to a new learner.",
        "Confirm each lesson can be taught without assuming real-trading experience.",
        "Flag topics that need a prerequisite explanation before practice.",
      ],
      riskIfSkipped: "The learner may be asked to practice before the needed mental model is introduced.",
    }),
    baseItem({
      id: `review_${unit.id}_checkpoint`,
      reviewType: REVIEW_TYPES.UNIT_CHECKPOINT,
      targetType: "curriculum_unit",
      targetId: unit.id,
      module: path.module,
      priority: "P2",
      requiredReviewer: REVIEWERS.product,
      checklist: [
        "Confirm checkpoint criteria evaluate learning process, not strategy outcome.",
        "Check whether the checkpoint produces a useful AI review prompt.",
        "Confirm pass criteria include uncertainty and counterexample review.",
        "Flag dense wording that would make the unit feel like an admin checklist.",
      ],
      riskIfSkipped: "The unit may pass verification while still feeling thin or hard to use.",
    }),
  ];
}

function lessonReviewItems(lesson) {
  const priority = priorityForLesson(lesson);
  return [
    baseItem({
      id: `review_${lesson.id}_wording`,
      reviewType: REVIEW_TYPES.LESSON_WORDING,
      targetType: "knowledge_lesson",
      targetId: lesson.id,
      module: lesson.module,
      priority,
      requiredReviewer: REVIEWERS.teacher,
      checklist: [
        "Rewrite robotic or repetitive wording into plain teaching language.",
        "Confirm the intro explains why the topic matters before asking for practice.",
        "Check that examples are framed as observation, not prediction.",
        "Flag jargon that needs a glossary link or simpler explanation.",
      ],
      riskIfSkipped: "The lesson may be structurally complete but still feel shallow or machine-generated.",
    }),
    baseItem({
      id: `review_${lesson.id}_source_evidence`,
      reviewType: REVIEW_TYPES.LESSON_SOURCE_EVIDENCE,
      targetType: "knowledge_lesson",
      targetId: lesson.id,
      module: lesson.module,
      priority,
      requiredReviewer: REVIEWERS.source,
      checklist: [
        "Confirm reviewed source references directly support the concept category.",
        "Confirm authority context is not presented as copied course content.",
        "Check license boundary and allowed use before any learner-facing promotion.",
        "Flag any dependency on search-result pages, screenshots, or unclear-license material.",
      ],
      riskIfSkipped: "The product could confuse source discovery with source permission or authority.",
    }),
    baseItem({
      id: `review_${lesson.id}_boundary`,
      reviewType: REVIEW_TYPES.LESSON_BOUNDARY,
      targetType: "knowledge_lesson",
      targetId: lesson.id,
      module: lesson.module,
      priority: "P0",
      requiredReviewer: REVIEWERS.boundary,
      checklist: [
        "Confirm prompts do not ask what to buy, sell, hold, short, or trade.",
        "Confirm no live signal, win-rate, return, broker, auto-order, or real-funds wording appears.",
        "Confirm AI review wording critiques reasoning instead of giving actions.",
        "Confirm boundary text is visible enough for learner-facing use.",
      ],
      riskIfSkipped: "Education content could drift into trading advice or real-money guidance.",
    }),
    baseItem({
      id: `review_${lesson.id}_teaching_quality`,
      reviewType: REVIEW_TYPES.LESSON_TEACHING_QUALITY,
      targetType: "knowledge_lesson",
      targetId: lesson.id,
      module: lesson.module,
      priority: priority === "P0" ? "P1" : "P2",
      requiredReviewer: REVIEWERS.product,
      checklist: [
        "Confirm the lesson has a teachable misconception, not only a definition.",
        "Confirm the practice prompt creates an observable learner response.",
        "Check whether AI review prompts map to the rubric draft.",
        "Flag lessons that need historical-case data before they feel useful.",
      ],
      riskIfSkipped: "The lesson may be safe but not educationally useful.",
    }),
    baseItem({
      id: `review_${lesson.id}_hand_authoring`,
      reviewType: REVIEW_TYPES.LESSON_HAND_AUTHORING,
      targetType: "knowledge_lesson",
      targetId: lesson.id,
      module: lesson.module,
      priority: lesson.handAuthored === true ? "P2" : "P1",
      requiredReviewer: REVIEWERS.teacher,
      checklist: [
        "Confirm whether this lesson has hand-authored teaching prose rather than only generated structure.",
        "Rewrite the intro, explanation, anti-examples, practice prompt, and closing prompt before promotion.",
        "Check factual accuracy against the cited evidence without copying source text.",
        "Keep the lesson as curriculum_draft unless a human reviewer signs off the writing and source fit.",
      ],
      riskIfSkipped: "A structurally complete lesson could be mistaken for final course copy while still reading like a template.",
    }),
  ];
}

const pathItems = curriculumPaths.flatMap(pathReviewItems);
const unitItems = curriculumPaths.flatMap((path) => path.units.flatMap((unit) => unitReviewItems(path, unit)));
const lessonItems = knowledgeLessons.flatMap(lessonReviewItems);
const curriculumReviewQueue = [...pathItems, ...unitItems, ...lessonItems];

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

const curriculumReviewQueueReport = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  reviewItems: curriculumReviewQueue.length,
  pathReviewItems: pathItems.length,
  unitReviewItems: unitItems.length,
  lessonReviewItems: lessonItems.length,
  pathsCovered: new Set(pathItems.map((item) => item.targetId)).size,
  unitsCovered: new Set(unitItems.map((item) => item.targetId)).size,
  lessonsCovered: new Set(lessonItems.map((item) => item.targetId)).size,
  reviewTypeCounts: countBy(curriculumReviewQueue, "reviewType"),
  priorityCounts: countBy(curriculumReviewQueue, "priority"),
  reviewerCounts: countBy(curriculumReviewQueue, "requiredReviewer"),
  handAuthoredSummary: {
    lessonsHandAuthored: knowledgeLessonReport.lessonsHandAuthored,
    lessonsNeedingHandAuthoring: knowledgeLessonReport.lessons - knowledgeLessonReport.lessonsHandAuthored,
    handAuthoredCoverage: Number((knowledgeLessonReport.lessonsHandAuthored / knowledgeLessonReport.lessons).toFixed(4)),
  },
  sourceSummary: knowledgeBrowserIndex.sourceSummary,
  curriculumSummary: {
    paths: curriculumPathReport.paths,
    units: curriculumPathReport.totalUnits,
    lessons: knowledgeLessonReport.lessons,
    learnerFacingNodes: knowledgeBrowserIndex.qualitySummary.learnerFacingNodes,
  },
  boundary: "The review queue is a control layer for draft curriculum quality. It is not approval, certification, production readiness, trading advice, or a performance claim.",
};

module.exports = {
  REVIEW_TYPES,
  curriculumReviewQueue,
  curriculumReviewQueueReport,
};
