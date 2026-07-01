import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { knowledgeLessons, knowledgeLessonReport } = require("../education-knowledge-lessons.js");

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
  if (missing.length) fail(`${label} ${item.id || item.title || "item"} missing fields: ${missing.join(", ")}`);
}

const text = JSON.stringify({ knowledgeLessons, knowledgeLessonReport });
const found = forbidden.filter((word) => text.includes(word));
if (found.length) fail(`knowledge lessons contain forbidden terms: ${found.join(", ")}`);

if (knowledgeLessonReport.educationOnly !== true) fail("lesson report must keep educationOnly true");
if (knowledgeLessonReport.productionReady !== false) fail("lesson report must keep productionReady false");
if (knowledgeLessons.length < 360) fail(`expected at least 360 lesson drafts, got ${knowledgeLessons.length}`);
if (knowledgeLessonReport.lessonsWithReviewedSources < 360) fail("each lesson must have reviewed source refs");
if (knowledgeLessonReport.lessonsWithAuthorityContext < 360) fail("each lesson must have authority context refs");
if (knowledgeLessonReport.uniquePlainLanguageIntros < 350) fail(`lesson intros too repetitive: ${knowledgeLessonReport.uniquePlainLanguageIntros}`);

const vagueMistakePhrases = ["不要情绪化", "保持纪律", "心态要好", "管住手"];
const timeframeKeys = ["D1", "H4", "H1", "M15"];

const requiredLessonFields = [
  "id",
  "nodeId",
  "module",
  "topic",
  "title",
  "learningGoal",
  "plainLanguageIntro",
  "teacherScript",
  "conceptExplanation",
  "principleExplanation",
  "observationChecklist",
  "multiTimeframeWalkthrough",
  "commonMistakes",
  "antiExamples",
  "practicePrompt",
  "caseDiscussionPrompt",
  "aiReviewPrompts",
  "rubricDraft",
  "sourceEvidence",
  "learnerBoundary",
  "closingReviewPrompt",
  "reviewStatus",
];

for (const lesson of knowledgeLessons) {
  requireFields("KnowledgeLesson", lesson, requiredLessonFields);
  if (lesson.educationOnly !== true) fail(`lesson ${lesson.id} must keep educationOnly true`);
  if (lesson.productionReady !== false) fail(`lesson ${lesson.id} must keep productionReady false`);
  if (lesson.reviewStatus !== "curriculum_draft") fail(`lesson ${lesson.id} must remain curriculum_draft`);
  if (lesson.teacherScript.length < 3) fail(`lesson ${lesson.id} teacherScript too thin`);
  if (lesson.observationChecklist.length < 4) fail(`lesson ${lesson.id} observationChecklist too thin`);
  if (lesson.aiReviewPrompts.length < 4) fail(`lesson ${lesson.id} aiReviewPrompts too thin`);
  if (lesson.sourceEvidence.reviewedSourceRefCount < 1) fail(`lesson ${lesson.id} missing reviewed source evidence`);
  if (lesson.sourceEvidence.authorityContextRefCount < 1) fail(`lesson ${lesson.id} missing authority context evidence`);
  if (!/education/i.test(lesson.learnerBoundary)) fail(`lesson ${lesson.id} missing education boundary`);
  if (/buy|sell|signal|broker|funds/i.test(`${lesson.caseDiscussionPrompt} ${lesson.closingReviewPrompt}`) && !/Do not ask/i.test(lesson.caseDiscussionPrompt)) {
    fail(`lesson ${lesson.id} discussion prompts may drift into action language`);
  }

  // Quantitative teaching-quality assertions (phase A uplift).
  if (lesson.plainLanguageIntro.length < 60) fail(`lesson ${lesson.id} intro too short for a teaching introduction`);
  if (!/不着急做题|先读讲解|先讲|先把概念/.test(lesson.plainLanguageIntro)) {
    fail(`lesson ${lesson.id} intro must teach before practice`);
  }
  if (/^请[写做答]/.test(lesson.plainLanguageIntro.trim())) fail(`lesson ${lesson.id} intro must not open with a practice instruction`);
  if (lesson.conceptExplanation.length < 60) fail(`lesson ${lesson.id} concept explanation too thin`);
  if (lesson.principleExplanation.length < 30) fail(`lesson ${lesson.id} principle explanation too thin`);
  if (lesson.principleExplanation === lesson.conceptExplanation) fail(`lesson ${lesson.id} principle must not repeat the definition`);

  const walkthrough = lesson.multiTimeframeWalkthrough || {};
  const tfValues = timeframeKeys.map((key) => walkthrough[key]);
  if (tfValues.some((value) => typeof value !== "string" || value.length < 15)) {
    fail(`lesson ${lesson.id} multi-timeframe walkthrough has missing or thin timeframe tasks`);
  }
  if (new Set(tfValues).size !== timeframeKeys.length) {
    fail(`lesson ${lesson.id} multi-timeframe tasks must be pairwise distinct`);
  }

  if ((lesson.antiExamples || []).length < 3) fail(`lesson ${lesson.id} needs at least 3 anti-examples`);
  for (const antiExample of lesson.antiExamples) {
    if (antiExample.length < 30) fail(`lesson ${lesson.id} anti-example too thin: ${antiExample}`);
    if (!antiExample.includes("错在")) fail(`lesson ${lesson.id} anti-example must explain what went wrong: ${antiExample}`);
  }

  if ((lesson.commonMistakes || []).length < 3) fail(`lesson ${lesson.id} needs at least 3 common mistakes`);
  for (const mistake of lesson.commonMistakes) {
    if (mistake.length < 12) fail(`lesson ${lesson.id} common mistake too thin: ${mistake}`);
    if (vagueMistakePhrases.includes(mistake)) fail(`lesson ${lesson.id} common mistake too vague: ${mistake}`);
  }

  if ((lesson.rubricDraft || []).length < 4) fail(`lesson ${lesson.id} rubric needs at least 4 criteria`);
  for (const criterion of lesson.rubricDraft) {
    if (!criterion.startsWith("是否")) fail(`lesson ${lesson.id} rubric criterion must be binary-checkable (start with 是否): ${criterion}`);
    if (criterion.length < 15) fail(`lesson ${lesson.id} rubric criterion too thin: ${criterion}`);
  }

  if ((lesson.aiReviewPrompts || []).length < 5) fail(`lesson ${lesson.id} needs at least 5 AI review prompts`);

  // Bilingual term bridge: each lesson surfaces ≥3 zh/en key terms with original glosses.
  if ((lesson.bilingualKeyTerms || []).length < 3) fail(`lesson ${lesson.id} needs at least 3 bilingual key terms`);
  for (const term of lesson.bilingualKeyTerms) {
    if (!term.en || !term.zh) fail(`lesson ${lesson.id} bilingual term missing en/zh pair`);
    if (!term.gloss || term.gloss.length < 15) fail(`lesson ${lesson.id} bilingual gloss too thin: ${term.en}`);
    if (/买入|卖出|加仓|减仓|止盈点|建议持有/.test(term.gloss)) fail(`lesson ${lesson.id} bilingual gloss drifts into action language: ${term.en}`);
  }

  // Authority-backed reading: each lesson names ≥1 real source with provenance.
  if ((lesson.authorityBackedReading || []).length < 1) fail(`lesson ${lesson.id} has no authority-backed reading`);
  for (const reading of lesson.authorityBackedReading) {
    if (!reading.sourceName || reading.sourceName.length < 3) fail(`lesson ${lesson.id} authority reading missing source name`);
    if (!["public_domain", "open_access", "share_alike", "permissive"].includes(reading.licenseTier)) {
      fail(`lesson ${lesson.id} authority reading has disallowed tier ${reading.licenseTier}`);
    }
    if (reading.excerpt || reading.text || reading.body) fail(`lesson ${lesson.id} authority reading must cite, not copy source text`);
    if (!reading.relevanceFraming || !/原创/.test(reading.relevanceFraming)) {
      fail(`lesson ${lesson.id} authority reading missing original-expression framing`);
    }
  }

  // Corpus evidence wiring (research-layer references only; no chunk text in lessons).
  if ((lesson.corpusEvidenceRefs || []).length < 1) fail(`lesson ${lesson.id} has no corpus evidence refs`);
  for (const ref of lesson.corpusEvidenceRefs) {
    if (!["public_domain", "open_access", "share_alike", "permissive"].includes(ref.licenseTier)) {
      fail(`lesson ${lesson.id} corpus evidence ${ref.chunkId} has disallowed tier ${ref.licenseTier}`);
    }
    if (ref.text) fail(`lesson ${lesson.id} corpus evidence ${ref.chunkId} must not embed chunk text`);
    if (!ref.evidenceUse || !/original/i.test(ref.evidenceUse)) {
      fail(`lesson ${lesson.id} corpus evidence ${ref.chunkId} missing original-wording boundary`);
    }
  }
}

const uniqueAntiExampleSets = new Set(knowledgeLessons.map((lesson) => JSON.stringify(lesson.antiExamples))).size;
if (uniqueAntiExampleSets < 120) fail(`anti-example sets too repetitive across lessons: ${uniqueAntiExampleSets}`);
const uniqueWalkthroughs = new Set(knowledgeLessons.map((lesson) => JSON.stringify(lesson.multiTimeframeWalkthrough))).size;
if (uniqueWalkthroughs < 120) fail(`multi-timeframe walkthroughs too repetitive across lessons: ${uniqueWalkthroughs}`);

console.log(JSON.stringify({
  ok: true,
  productionReady: false,
  educationOnly: true,
  lessons: knowledgeLessons.length,
  modules: knowledgeLessonReport.modules,
  uniquePlainLanguageIntros: knowledgeLessonReport.uniquePlainLanguageIntros,
  uniqueAntiExampleSets,
  uniqueMultiTimeframeWalkthroughs: uniqueWalkthroughs,
  lessonsWithReviewedSources: knowledgeLessonReport.lessonsWithReviewedSources,
  lessonsWithAuthorityContext: knowledgeLessonReport.lessonsWithAuthorityContext,
  lessonsWithCorpusEvidence: knowledgeLessonReport.lessonsWithCorpusEvidence,
  lessonsWithBilingualTerms: knowledgeLessonReport.lessonsWithBilingualTerms,
  lessonsWithAuthorityReading: knowledgeLessonReport.lessonsWithAuthorityReading,
}, null, 2));
