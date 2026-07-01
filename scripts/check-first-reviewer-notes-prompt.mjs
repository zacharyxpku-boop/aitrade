import fs from "node:fs/promises";

const worksheetPath = "docs/FIRST_REVIEWER_WORKSHEET.json";
const draftTemplatePath = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const gateSummaryPath = "docs/REVIEW_STATUS_GATE_SUMMARY.json";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_NOTES_PROMPT.json";
const outputMd = "docs/FIRST_REVIEWER_NOTES_PROMPT.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const REQUIRED_NOTE_FIELDS = [
  "originalRewriteNotes",
  "sourceFitNotes",
  "factCheckNotes",
  "boundaryCheckNotes",
  "copyingRiskNotes",
  "humanReviewerInitials",
];

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

async function exists(path) {
  return fs.access(path).then(() => true, () => false);
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function assertBlankDraft(draft) {
  const missing = [];
  for (const batch of draft.batches || []) {
    assertEnvelope(batch, `draft batch ${batch.batchId}`);
    if (batch.reviewStatus !== "not_started") fail(`${batch.batchId} must stay not_started in notes prompt input`);
    for (const card of batch.lessonCards || []) {
      if (card.trackingStatus !== "not_started") fail(`${card.lessonId} must stay not_started in notes prompt input`);
      if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} must remain structural draft`);
      for (const field of REQUIRED_NOTE_FIELDS) {
        if (card[field] !== "") missing.push(`${card.lessonId}.${field}`);
      }
    }
  }
  if (missing.length) fail(`draft template already has reviewer notes: ${missing.slice(0, 8).join(", ")}`);
}

function sourceRoleForFamily(family) {
  if (family === "SEC") return "filing/data-access boundary or disclosure-literacy context";
  if (family === "Investor.gov") return "investor-protection, glossary, or fraud-warning boundary";
  if (family === "CFTC") return "commodity/fraud/system-risk boundary, not chart-pattern authority";
  if (family === "BLS" || family === "BEA") return "macro data definition and release-reading boundary";
  if (family === "Project Gutenberg" || family === "Internet Archive") return "public-domain historical language only";
  if (family === "Federal Reserve" || family === "Treasury") return "macro/rates context and data-boundary reference";
  if (family === "nist.gov") return "technical/data-integrity boundary reference";
  return "metadata or source-boundary reference only until reviewer confirms direct fit";
}

function requiredPromptsForLesson(lesson) {
  const riskPrefix = lesson.riskLevel === "high"
    ? "High-risk source-fit first: decide direct evidence vs boundary-only before any prose rewrite."
    : "Resolve this after the batch high-risk lesson is reviewed.";
  return [
    {
      field: "originalRewriteNotes",
      prompt: `${riskPrefix} State how the lesson should be rewritten as original education prose or observation practice, without copying source body text.`,
      passCriteria: "Names the intended rewrite angle and keeps the lesson structural_draft.",
    },
    {
      field: "sourceFitNotes",
      prompt: "Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose.",
      passCriteria: "Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose.",
    },
    {
      field: "factCheckNotes",
      prompt: "List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved.",
      passCriteria: "Does not invent facts and does not rely on yellow/red/research-only evidence.",
    },
    {
      field: "boundaryCheckNotes",
      prompt: "Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance.",
      passCriteria: "Explicitly states that the lesson remains education-only and non-production.",
    },
    {
      field: "copyingRiskNotes",
      prompt: "Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only.",
      passCriteria: "Mentions no-copy and no source-body reuse.",
    },
    {
      field: "humanReviewerInitials",
      prompt: "Add the human reviewer's initials only after real review work is performed.",
      passCriteria: "Not filled by generated examples or automation.",
    },
  ];
}

function flattenWorksheetLessons(worksheet) {
  return (worksheet.batchWorksheets || []).flatMap((batch) => (batch.lessons || []).map((lesson) => ({
    ...lesson,
    batchId: batch.batchId,
  })));
}

function renderMarkdown(report) {
  const lines = [
    "# First Reviewer Notes Prompt",
    "",
    "This prompt helps a human reviewer fill real notes for the first two review batches.",
    "It is not completed review, approval, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson prompts: ${report.lessonPrompts.length}`,
    `- High-risk lessons: ${report.highRiskLessons}`,
    `- Required note fields: ${report.requiredNoteFields.length}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Batch Use",
    "",
    ...report.operatingRules.map((rule) => `- ${rule}`),
    "",
    "## Source Family Roles",
    "",
    "| Family | Reviewer role |",
    "| --- | --- |",
    ...report.sourceFamilyRoles.map((row) => `| ${row.family} | ${row.reviewerRole} |`),
    "",
    "## Lesson Prompts",
    "",
  ];
  for (const lesson of report.lessonPrompts) {
    lines.push(`### ${lesson.batchId} / ${lesson.lessonId}`);
    lines.push("");
    lines.push(`- Risk: ${lesson.riskLevel}`);
    lines.push(`- Current grade: ${lesson.currentGrade}`);
    lines.push(`- Source families: ${lesson.sourceFamilies.join(", ")}`);
    lines.push(`- First decision: ${lesson.firstDecision}`);
    lines.push("");
    lines.push("| Note field | Prompt | Pass criteria |");
    lines.push("| --- | --- | --- |");
    for (const prompt of lesson.notePrompts) {
      lines.push(`| ${prompt.field} | ${prompt.prompt.replaceAll("|", "/")} | ${prompt.passCriteria.replaceAll("|", "/")} |`);
    }
    lines.push("");
  }
  lines.push("## Boundary");
  lines.push("");
  lines.push(report.boundary);
  lines.push("");
  return lines.join("\n");
}

const [worksheet, draftTemplate, gateSummary, realStatusOverlayPresent] = await Promise.all([
  readJson(worksheetPath),
  readJson(draftTemplatePath),
  readJson(gateSummaryPath),
  exists(realStatusPath),
]);

assertEnvelope(worksheet, "first reviewer worksheet");
assertEnvelope(draftTemplate, "first reviewer draft template");
assertEnvelope(gateSummary, "review status gate summary");
assertBlankDraft(draftTemplate);

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; notes prompt must not run against real status notes`);
if (gateSummary.realStatusOverlayPresent !== false || gateSummary.realReadyBatches !== 0) fail("gate summary must show no real ready batches");
if (worksheet.worksheetLessons !== 12) fail("notes prompt must cover the 12 first-reviewer lessons");
if (worksheet.highRiskLessons !== 2) fail("notes prompt must keep the two high-risk lessons visible");
if (draftTemplate.notesFilled !== 0) fail("draft template must keep notes blank");

const lessons = flattenWorksheetLessons(worksheet);
if (lessons.length !== worksheet.worksheetLessons) fail("worksheet lesson count mismatch");

const sourceFamilies = [...new Set(lessons.flatMap((lesson) => lesson.sourceFamilies || []))].sort();
const lessonPrompts = lessons.map((lesson) => {
  if (lesson.currentGrade !== "structural_draft") fail(`${lesson.lessonId} must remain structural_draft`);
  if (lesson.mustRemainStructuralDraft !== true) fail(`${lesson.lessonId} must keep mustRemainStructuralDraft true`);
  if (lesson.approvalStatus !== "not_approved") fail(`${lesson.lessonId} must stay not_approved`);
  if (lesson.learnerFacingRelease !== false) fail(`${lesson.lessonId} cannot be learner-facing release`);
  for (const field of REQUIRED_NOTE_FIELDS) {
    if (!(lesson.requiredReviewerNotes || []).includes(field)) fail(`${lesson.lessonId} missing required reviewer note ${field}`);
  }
  for (const source of lesson.sourceRefsToInspect || []) {
    if (!String(source.sourceUseTier || "").startsWith("green_")) fail(`${lesson.lessonId} has non-green source ref ${source.sourceId}`);
  }
  return {
    lessonId: lesson.lessonId,
    batchId: lesson.batchId,
    module: lesson.module,
    topic: lesson.topic,
    riskLevel: lesson.riskLevel,
    currentGrade: lesson.currentGrade,
    rewritePriority: lesson.rewritePriority,
    sourceFamilies: lesson.sourceFamilies || [],
    firstDecision: lesson.riskLevel === "high"
      ? "Classify each attached source before any prose rewrite."
      : "Use the batch high-risk decision as context, then write targeted source-fit notes.",
    notePrompts: requiredPromptsForLesson(lesson),
    sourceRefsToInspect: lesson.sourceRefsToInspect || [],
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  targetBatches: worksheet.targetBatches,
  sourceWorksheet: worksheetPath,
  sourceDraftTemplate: draftTemplatePath,
  sourceGateSummary: gateSummaryPath,
  realStatusPath,
  realStatusOverlayPresent,
  highRiskLessons: worksheet.highRiskLessons,
  requiredNoteFields: REQUIRED_NOTE_FIELDS,
  sourceFamilyRoles: sourceFamilies.map((family) => ({
    family,
    reviewerRole: sourceRoleForFamily(family),
  })),
  operatingRules: [
    "Use this prompt before creating or filling the real status overlay.",
    "Start with the high-risk lesson in each batch.",
    "Write real reviewer notes only after source-fit, fact-check, boundary, copying-risk, and original-rewrite checks are actually performed.",
    "Keep approvalStatus:not_approved, learnerFacingRelease:false, productionReady:false, and currentGrade:structural_draft.",
    "Do not paste source body text into notes or lesson prose.",
  ],
  lessonPrompts,
  boundary: "This prompt is reviewer-facing scaffolding only. It does not create real reviewer notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  targetBatches: report.targetBatches,
  lessonPrompts: report.lessonPrompts.length,
  highRiskLessons: report.highRiskLessons,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  outputJson,
  outputMd,
}, null, 2));
