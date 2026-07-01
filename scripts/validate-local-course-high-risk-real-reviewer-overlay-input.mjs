import fs from "node:fs";

const defaultInputPath = "docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json";
const defaultStarterPath = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_STARTER.json";
const defaultOutputJsonPath = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_INPUT_VALIDATION.json";
const defaultOutputMdPath = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_INPUT_VALIDATION.md";

const forbiddenPhrases = [
  "stock recommendation",
  "buy signal",
  "sell signal",
  "guaranteed return",
  "win rate promise",
  "broker workflow",
  "auto trading",
  "real money",
  "recommended buy",
  "recommended sell",
  "must buy",
  "must sell",
  "profit target",
  "stop loss instruction",
  "learner-facing approved",
  "approved for release",
  "write allowed",
  "release ready",
  "citation approved",
];

function fail(message) {
  throw new Error(message);
}

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(artifact, label) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function forbiddenHits(value) {
  const blob = JSON.stringify(value || {}).toLowerCase();
  return forbiddenPhrases.filter((phrase) => blob.includes(phrase.toLowerCase()));
}

function hasBoundaryStatement(value) {
  const blob = text(value).toLowerCase();
  return [
    "no setup",
    "no signal",
    "no future outcome",
    "no strategy edge",
    "no real-money action",
  ].every((phrase) => blob.includes(phrase));
}

function hasOriginalityStatement(value) {
  return /no copy|not copied|original wording|original language|paraphrased/i.test(text(value));
}

function checkedEvidenceCount(row) {
  return Array.isArray(row.evidenceChecked) ? row.evidenceChecked.filter(Boolean).length : 0;
}

const inputPath = argValue("--input", defaultInputPath);
const starterPath = argValue("--starter", defaultStarterPath);
const outputJsonPath = argValue("--output-json", defaultOutputJsonPath);
const outputMdPath = argValue("--output-md", defaultOutputMdPath);
const allowFixture = process.argv.includes("--allow-fixture");

const input = readJson(inputPath);
const starter = readJson(starterPath);
assertBoundary(input, "high-risk real reviewer overlay input");
assertBoundary(starter, "high-risk real reviewer overlay starter");

if (input.fixtureOnly === true && !allowFixture) {
  fail("high-risk real reviewer overlay validator rejects fixture-only files unless --allow-fixture is provided");
}

const starterLessonByCandidate = new Map((starter.lessonRows || []).map((row) => [row.candidateId, row]));
const starterDirectById = new Map((starter.directSourceDecisionRows || []).map((row) => [row.id, row]));

const noteValidationRows = [];
const lessonValidationRows = [];
for (const lesson of input.lessonRows || []) {
  const starterLesson = starterLessonByCandidate.get(lesson.candidateId);
  const lessonIssues = [];
  const lessonMissing = [];
  if (!starterLesson) lessonIssues.push("Lesson is missing from starter.");
  if (lesson.learnerFacingRelease !== false) lessonIssues.push("Lesson must keep learnerFacingRelease:false.");
  if (lesson.approvalStatus !== "not_approved") lessonIssues.push("Lesson must remain not_approved.");
  if (lesson.releaseBlocker !== true) lessonIssues.push("Lesson must remain a release blocker until separate approval.");
  if (!Array.isArray(lesson.realReviewerNotes) || lesson.realReviewerNotes.length !== 6) {
    lessonIssues.push("Lesson must contain exactly 6 real reviewer note slots.");
  }

  let readyNotes = 0;
  for (const note of lesson.realReviewerNotes || []) {
    const missingFields = [];
    const qualityIssues = [];
    const hits = forbiddenHits(note);
    if (!text(note.reviewerName)) missingFields.push("reviewerName");
    if (!text(note.reviewedAt)) missingFields.push("reviewedAt");
    if (!text(note.decision)) missingFields.push("decision");
    if (!Array.isArray(note.evidenceChecked) || note.evidenceChecked.length === 0) missingFields.push("evidenceChecked");
    if (!text(note.reviewerNote)) missingFields.push("reviewerNote");

    if (text(note.decision) && !(note.allowedDecisionValues || []).includes(note.decision)) {
      qualityIssues.push("decision must be one allowed reviewer note decision value.");
    }
    if (text(note.reviewerNote) && !hasBoundaryStatement(note.reviewerNote)) {
      qualityIssues.push("reviewerNote must explicitly preserve no setup/no signal/no future outcome/no strategy edge/no real-money action.");
    }
    if (text(note.reviewerNote) && !hasOriginalityStatement(note.reviewerNote)) {
      qualityIssues.push("reviewerNote must include an originality/no-copy statement.");
    }
    if (text(note.reviewerNote) && checkedEvidenceCount(note) < 2) {
      qualityIssues.push("evidenceChecked must include at least two evidence items.");
    }
    if (note.readyForApprovalGate !== false) qualityIssues.push("readyForApprovalGate must remain false until separate approval.");
    if (note.learnerFacingRelease !== false) qualityIssues.push("note must keep learnerFacingRelease:false.");
    if (note.approvalStatus !== "not_approved") qualityIssues.push("note must remain not_approved.");

    const ready = missingFields.length === 0 && qualityIssues.length === 0 && hits.length === 0;
    if (ready) readyNotes += 1;
    noteValidationRows.push({
      id: note.id,
      sourceNoteId: note.sourceNoteId,
      candidateId: lesson.candidateId,
      lessonId: lesson.lessonId,
      module: lesson.module,
      topic: lesson.topic,
      dimension: note.dimension,
      validationStatus: ready ? "ready_for_real_reviewer_overlay_gate" : "blocked_missing_real_reviewer_input",
      readyForApprovalGate: false,
      missingFields,
      qualityIssues,
      forbiddenHits: hits,
      nextGate: ready ? "validate_all_notes_then_separate_release_approval" : "fill_real_reviewer_note_then_revalidate",
    });
  }

  if (readyNotes !== 6) lessonMissing.push("six_ready_real_reviewer_notes");
  const lessonReady = lessonIssues.length === 0 && lessonMissing.length === 0;
  lessonValidationRows.push({
    candidateId: lesson.candidateId,
    nodeId: lesson.nodeId,
    lessonId: lesson.lessonId,
    module: lesson.module,
    topic: lesson.topic,
    validationStatus: lessonReady ? "ready_for_real_reviewer_overlay_gate" : "blocked_missing_real_reviewer_input",
    realReviewerNotesReady: readyNotes,
    realReviewerNotesRequired: 6,
    missingFields: lessonMissing,
    qualityIssues: lessonIssues,
    releaseBlocker: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    nextGate: lessonReady ? "direct_source_decisions_then_separate_release_approval" : "fill_6_real_reviewer_notes_then_revalidate",
  });
}

const directSourceValidationRows = [];
for (const row of input.directSourceDecisionRows || []) {
  const starterRow = starterDirectById.get(row.id);
  const missingFields = [];
  const qualityIssues = [];
  const hits = forbiddenHits(row);
  if (!starterRow) qualityIssues.push("Direct-source decision is missing from starter.");
  if (!text(row.reviewerName)) missingFields.push("reviewerName");
  if (!text(row.reviewedAt)) missingFields.push("reviewedAt");
  if (!text(row.decision)) missingFields.push("decision");
  if (!Array.isArray(row.evidenceChecked) || row.evidenceChecked.length === 0) missingFields.push("evidenceChecked");
  if (!text(row.reviewerNote)) missingFields.push("reviewerNote");
  if (text(row.decision) && !(row.allowedDecisionValues || []).includes(row.decision)) {
    qualityIssues.push("decision must be one allowed direct-source decision value.");
  }
  if (text(row.reviewerNote) && checkedEvidenceCount(row) < 2) {
    qualityIssues.push("evidenceChecked must include private/direct source plus public replacement/context evidence.");
  }
  if (text(row.reviewerNote) && !/private|direct source|reviewer-only|public ref|public source/i.test(row.reviewerNote)) {
    qualityIssues.push("reviewerNote must describe private/direct source boundary and public ref role.");
  }
  if (row.learnerCitationApproved !== false) qualityIssues.push("learnerCitationApproved must remain false until separate citation approval.");
  if (row.learnerFacingRelease !== false) qualityIssues.push("direct-source row must keep learnerFacingRelease:false.");
  if (row.approvalStatus !== "not_approved") qualityIssues.push("direct-source row must remain not_approved.");
  if (row.readyForApprovalGate !== false) qualityIssues.push("readyForApprovalGate must remain false until separate approval.");
  if (row.releaseBlocker !== true) qualityIssues.push("direct-source row must remain a release blocker.");

  const ready = missingFields.length === 0 && qualityIssues.length === 0 && hits.length === 0;
  directSourceValidationRows.push({
    id: row.id,
    sourceResolutionId: row.sourceResolutionId,
    candidateId: row.candidateId,
    module: row.module,
    topic: row.topic,
    privateOrDirectCandidateSource: row.privateOrDirectCandidateSource,
    validationStatus: ready ? "ready_for_real_reviewer_overlay_gate" : "blocked_missing_real_reviewer_input",
    readyForApprovalGate: false,
    missingFields,
    qualityIssues,
    forbiddenHits: hits,
    learnerCitationApproved: false,
    releaseBlocker: true,
    nextGate: ready ? "validate_all_direct_source_decisions_then_separate_release_approval" : "fill_direct_source_decision_then_revalidate",
  });
}

const readyReviewerNotes = noteValidationRows.filter((row) => row.validationStatus === "ready_for_real_reviewer_overlay_gate").length;
const readyLessons = lessonValidationRows.filter((row) => row.validationStatus === "ready_for_real_reviewer_overlay_gate").length;
const readyDirectSourceDecisions = directSourceValidationRows.filter((row) => row.validationStatus === "ready_for_real_reviewer_overlay_gate").length;
const blockedReviewerNotes = noteValidationRows.length - readyReviewerNotes;
const blockedLessons = lessonValidationRows.length - readyLessons;
const blockedDirectSourceDecisions = directSourceValidationRows.length - readyDirectSourceDecisions;
const forbiddenHitRows = [
  ...noteValidationRows,
  ...directSourceValidationRows,
].filter((row) => row.forbiddenHits.length).length;
const missingFieldRows = [
  ...noteValidationRows,
  ...lessonValidationRows,
  ...directSourceValidationRows,
].filter((row) => row.missingFields.length).length;
const qualityIssueRows = [
  ...noteValidationRows,
  ...lessonValidationRows,
  ...directSourceValidationRows,
].filter((row) => row.qualityIssues.length).length;

const allReady = readyLessons === 12 && readyReviewerNotes === 72 && readyDirectSourceDecisions === 5 && forbiddenHitRows === 0;

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  validationStatus: allReady ? "ready_for_separate_human_release_approval_gate" : "blocked_missing_real_reviewer_overlay_input",
  validationMode: "high_risk_real_reviewer_overlay_notes_and_direct_source_gate",
  inputPath,
  starterPath,
  fixtureOnly: input.fixtureOnly === true,
  fixtureValidationAllowed: allowFixture,
  lessonCount: lessonValidationRows.length,
  readyLessons,
  blockedLessons,
  totalReviewerNotes: noteValidationRows.length,
  readyReviewerNotes,
  blockedReviewerNotes,
  directSourceDecisionCount: directSourceValidationRows.length,
  readyDirectSourceDecisions,
  blockedDirectSourceDecisions,
  missingFieldRows,
  qualityIssueRows,
  forbiddenHitRows,
  realHumanInputEntries: input.fixtureOnly === true ? 0 : readyReviewerNotes + readyDirectSourceDecisions,
  generatedDecisions: 0,
  learnerCitationApprovedLessons: 0,
  learnerCitationApprovedDirectSources: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  allowedNoteDecisionValues: starter.allowedNoteDecisionValues || [],
  allowedDirectSourceDecisionValues: starter.allowedDirectSourceDecisionValues || [],
  forbiddenPhrases,
  lessonValidationRows,
  noteValidationRows,
  directSourceValidationRows,
  completionRule: "This validation checks whether a real reviewer-owned high-risk overlay input has complete notes and direct-source decisions for the next separate approval gate. It does not generate reviewer notes, approve learner-facing citations, approve release, or authorize overlay writes.",
  boundary: "High-risk real reviewer overlay input validation is reviewer-facing education-only operations material. It validates note shape, direct-source decision shape, forbidden wording, originality/no-copy statements, and no setup/no signal/no future outcome/no strategy edge/no real-money action boundaries; it does not provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, learner-facing approval, or write authorization.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course High-Risk Real Reviewer Overlay Input Validation",
  "",
  `- Validation status: ${report.validationStatus}`,
  `- Input path: \`${report.inputPath}\``,
  `- Starter path: \`${report.starterPath}\``,
  `- Lessons ready/blocked: ${report.readyLessons}/${report.blockedLessons}`,
  `- Reviewer notes ready/blocked: ${report.readyReviewerNotes}/${report.blockedReviewerNotes}`,
  `- Direct-source decisions ready/blocked: ${report.readyDirectSourceDecisions}/${report.blockedDirectSourceDecisions}`,
  `- Missing-field rows: ${report.missingFieldRows}`,
  `- Quality-issue rows: ${report.qualityIssueRows}`,
  `- Forbidden-hit rows: ${report.forbiddenHitRows}`,
  `- Real human input entries counted: ${report.realHumanInputEntries}`,
  `- Write allowed now: ${report.writeAllowedNow}`,
  "",
  "## Lesson Rows",
  "",
  "| Lesson | Module | Topic | Status | Ready notes | Missing | Issues |",
  "| --- | --- | --- | --- | ---: | --- | --- |",
  ...lessonValidationRows.map((row) => `| ${row.lessonId} | ${row.module} | ${row.topic} | ${row.validationStatus} | ${row.realReviewerNotesReady}/${row.realReviewerNotesRequired} | ${row.missingFields.join(", ")} | ${row.qualityIssues.join("; ")} |`),
  "",
  "## Direct-Source Rows",
  "",
  "| Row | Module | Topic | Status | Missing | Issues | Forbidden |",
  "| --- | --- | --- | --- | --- | --- | --- |",
  ...directSourceValidationRows.map((row) => `| ${row.id} | ${row.module} | ${row.topic} | ${row.validationStatus} | ${row.missingFields.join(", ")} | ${row.qualityIssues.join("; ")} | ${row.forbiddenHits.join(", ")} |`),
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
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  validationStatus: report.validationStatus,
  lessonCount: report.lessonCount,
  readyLessons: report.readyLessons,
  blockedLessons: report.blockedLessons,
  totalReviewerNotes: report.totalReviewerNotes,
  readyReviewerNotes: report.readyReviewerNotes,
  blockedReviewerNotes: report.blockedReviewerNotes,
  directSourceDecisionCount: report.directSourceDecisionCount,
  readyDirectSourceDecisions: report.readyDirectSourceDecisions,
  blockedDirectSourceDecisions: report.blockedDirectSourceDecisions,
  realHumanInputEntries: report.realHumanInputEntries,
  writeAllowedNow: report.writeAllowedNow,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
