import fs from "node:fs";

const selfReviewPath = "docs/LOCAL_COURSE_HIGH_RISK_SELF_REVIEW_OVERLAY.json";
const groundingPath = "docs/LOCAL_COURSE_HIGH_RISK_PUBLIC_GROUNDING_MATRIX.json";
const starterPath = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_STARTER.json";
const validationPath = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_INPUT_VALIDATION.json";
const outputJsonPath = "docs/LOCAL_COURSE_HIGH_RISK_REVIEW_COCKPIT.json";
const outputMdPath = "docs/LOCAL_COURSE_HIGH_RISK_REVIEW_COCKPIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
}

function groupBy(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean)).size;
}

const selfReview = readJson(selfReviewPath);
const grounding = readJson(groundingPath);
const starter = readJson(starterPath);
const validation = readJson(validationPath);

for (const [name, artifact] of Object.entries({
  selfReview,
  grounding,
  starter,
  validation,
})) {
  assertBoundary(name, artifact);
}

if (selfReview.overlayStatus !== "codex_self_review_complete_not_approved") fail("self-review overlay status drift");
if (grounding.matrixStatus !== "high_risk_public_grounding_mapped_not_approved") fail("public grounding matrix status drift");
if (starter.starterStatus !== "high_risk_real_reviewer_overlay_starter_ready_blank") fail("real reviewer starter status drift");
if (validation.validationStatus !== "blocked_missing_real_reviewer_overlay_input") fail("real reviewer validation status drift");

const selfByCandidate = new Map((selfReview.lessons || []).map((row) => [row.candidateId, row]));
const groundingByCandidate = new Map((grounding.lessonRows || []).map((row) => [row.candidateId, row]));
const starterByCandidate = new Map((starter.lessonRows || []).map((row) => [row.candidateId, row]));
const validationByCandidate = new Map((validation.lessonValidationRows || []).map((row) => [row.candidateId, row]));
const noteValidationByCandidate = groupBy(validation.noteValidationRows || [], (row) => row.candidateId);
const directValidationBySource = new Map((validation.directSourceValidationRows || []).map((row) => [row.sourceResolutionId, row]));
const starterDirectBySource = new Map((starter.directSourceDecisionRows || []).map((row) => [row.sourceResolutionId, row]));

const lessonRows = (starter.lessonRows || []).map((starterRow, index) => {
  const candidateId = starterRow.candidateId;
  const selfRow = selfByCandidate.get(candidateId) || {};
  const groundingRow = groundingByCandidate.get(candidateId) || {};
  const validationRow = validationByCandidate.get(candidateId) || {};
  const noteRows = noteValidationByCandidate.get(candidateId) || [];
  const missingFieldCount = noteRows.reduce((sum, row) => sum + (row.missingFields || []).length, 0);
  const publicRefs = [
    ...(groundingRow.wikipediaRefs || []).slice(0, 2),
    ...(groundingRow.publicContextRefs || []).slice(0, 2),
  ].map((ref) => ({
    name: ref.name,
    url: ref.url,
    family: ref.family,
    excerptPolicy: ref.excerptPolicy,
    groundingRole: ref.groundingRole,
  }));

  return {
    queueRank: index + 1,
    candidateId,
    overlayId: starterRow.overlayId,
    batchId: starterRow.batchId,
    nodeId: starterRow.nodeId,
    lessonId: starterRow.lessonId,
    module: starterRow.module,
    topic: starterRow.topic,
    sourceFitScore: starterRow.sourceFitScore,
    maxSourceOverlap: starterRow.maxSourceOverlap,
    localEvidenceCount: starterRow.localEvidenceCount,
    codexSelfReviewStatus: selfRow.selfReviewStatus || "missing_self_review",
    codexSelfReviewNotes: selfRow.reviewerNotesReviewed || 0,
    codexReleaseBlockingNotes: selfRow.releaseBlockingNotes || 0,
    publicGroundingStatus: groundingRow.publicGroundingStatus || "missing_public_grounding",
    wikipediaRefCount: starterRow.wikipediaRefCount || (groundingRow.wikipediaRefs || []).length,
    publicContextRefCount: starterRow.publicContextRefCount || (groundingRow.publicContextRefs || []).length,
    selectedPublicRefCount: starterRow.selectedPublicRefCount || groundingRow.selectedPublicRefCount || 0,
    publicRefSamples: publicRefs,
    validationStatus: validationRow.validationStatus || "missing_validation",
    realReviewerNotesReady: validationRow.realReviewerNotesReady || 0,
    realReviewerNotesRequired: validationRow.realReviewerNotesRequired || 6,
    blockedReviewerNotes: Math.max(0, (validationRow.realReviewerNotesRequired || 6) - (validationRow.realReviewerNotesReady || 0)),
    missingFieldCount,
    missingFields: validationRow.missingFields || [],
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    releaseBlocker: true,
    nextGate: validationRow.nextGate || "fill_6_real_reviewer_notes_then_revalidate",
    nextReviewerAction: "Open this lesson, inspect Codex self-review and public references, then fill six real reviewer notes in the human-owned draft input copy.",
  };
});

const directSourceRows = (grounding.directSourceRows || []).map((row, index) => {
  const starterRow = starterDirectBySource.get(row.id) || {};
  const validationRow = directValidationBySource.get(row.id) || {};
  return {
    queueRank: index + 1,
    sourceResolutionId: row.id,
    reviewerDecisionId: starterRow.id || "",
    candidateId: row.candidateId,
    nodeId: row.nodeId || starterRow.nodeId || "",
    module: row.module,
    topic: row.topic,
    privateOrDirectCandidateSource: row.privateOrDirectCandidateSource || "",
    codexSelfReviewDecision: row.selfReviewDecision || starterRow.codexSelfReviewDecision || "",
    publicReplacementRefCount: (row.publicReplacementRefs || []).length,
    publicReplacementRefSamples: (row.publicReplacementRefs || []).slice(0, 3).map((ref) => ({
      name: ref.name,
      url: ref.url,
      family: ref.family,
      excerptPolicy: ref.excerptPolicy,
      groundingRole: ref.groundingRole,
    })),
    validationStatus: validationRow.validationStatus || "missing_validation",
    missingFields: validationRow.missingFields || [],
    learnerCitationApproved: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    readyForApprovalGate: false,
    releaseBlocker: true,
    nextGate: validationRow.nextGate || "fill_direct_source_decision_then_revalidate",
    nextReviewerAction: "Decide whether this private/direct source stays reviewer-only or is replaced by public context references; do not promote private PDFs to learner citations.",
  };
});

const lessonsByModule = groupBy(lessonRows, (row) => row.module);
const directByModule = groupBy(directSourceRows, (row) => row.module);
const moduleRows = [...lessonsByModule.entries()].map(([module, rows]) => {
  const directRows = directByModule.get(module) || [];
  const readyReviewerNotes = rows.reduce((sum, row) => sum + row.realReviewerNotesReady, 0);
  const requiredReviewerNotes = rows.reduce((sum, row) => sum + row.realReviewerNotesRequired, 0);
  return {
    module,
    lessons: rows.length,
    uniqueNodes: uniqueCount(rows.map((row) => row.nodeId)),
    codexSelfReviewNotes: rows.reduce((sum, row) => sum + row.codexSelfReviewNotes, 0),
    codexReleaseBlockingNotes: rows.reduce((sum, row) => sum + row.codexReleaseBlockingNotes, 0),
    readyReviewerNotes,
    requiredReviewerNotes,
    blockedReviewerNotes: requiredReviewerNotes - readyReviewerNotes,
    directSourceDecisions: directRows.length,
    readyDirectSourceDecisions: 0,
    wikipediaRefCount: rows.reduce((sum, row) => sum + row.wikipediaRefCount, 0),
    publicContextRefCount: rows.reduce((sum, row) => sum + row.publicContextRefCount, 0),
    status: "blocked_missing_real_reviewer_input",
    firstCandidateId: rows[0]?.candidateId || "",
    nextGate: "fill_real_reviewer_notes_and_direct_source_decisions_then_revalidate",
  };
});

const cockpit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  cockpitStatus: "high_risk_review_cockpit_ready_blocked_on_real_input",
  cockpitMode: "codex_self_review_public_grounding_real_reviewer_queue",
  sourceCodexSelfReview: selfReviewPath,
  sourcePublicGroundingMatrix: groundingPath,
  sourceRealReviewerOverlayStarter: starterPath,
  sourceRealReviewerInputValidation: validationPath,
  lessonCount: lessonRows.length,
  modules: moduleRows.length,
  lessonsWithCodexSelfReview: lessonRows.filter((row) => row.codexSelfReviewNotes === 6).length,
  lessonsWithPublicGrounding: grounding.lessonsWithPublicGrounding || 0,
  lessonsMissingPublicGrounding: grounding.lessonsMissingPublicGrounding || 0,
  expectedReviewerNotes: starter.expectedReviewerNotes,
  codexSelfReviewNotes: selfReview.reviewerNotesReviewed,
  readyReviewerNotes: validation.readyReviewerNotes,
  blockedReviewerNotes: validation.blockedReviewerNotes,
  directSourceDecisionCount: directSourceRows.length,
  readyDirectSourceDecisions: validation.readyDirectSourceDecisions,
  blockedDirectSourceDecisions: validation.blockedDirectSourceDecisions,
  readyLessons: validation.readyLessons,
  blockedLessons: validation.blockedLessons,
  realHumanInputEntries: validation.realHumanInputEntries,
  learnerCitationApprovedLessons: validation.learnerCitationApprovedLessons,
  learnerCitationApprovedDirectSources: validation.learnerCitationApprovedDirectSources,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  approvalGatePassed: false,
  moduleRows,
  lessonRows,
  directSourceRows,
  reviewerQueue: [
    ...lessonRows.map((row) => ({
      type: "lesson_notes",
      id: row.candidateId,
      module: row.module,
      topic: row.topic,
      blockedItems: row.blockedReviewerNotes,
      nextGate: row.nextGate,
    })),
    ...directSourceRows.map((row) => ({
      type: "direct_source_decision",
      id: row.sourceResolutionId,
      module: row.module,
      topic: row.topic,
      blockedItems: 1,
      nextGate: row.nextGate,
    })),
  ],
  commands: [
    "npm.cmd run build:local-course-high-risk-review-cockpit",
    "npm.cmd run check:local-course-high-risk-review-cockpit",
    "npm.cmd run check:local-course-high-risk-real-reviewer-overlay-input-validation",
    "npm.cmd run verify",
  ],
  completionRule: "This cockpit is complete when it shows all 12 high-risk lessons, 72 Codex self-review notes, 72 blocked real reviewer notes, and 5 blocked direct-source decisions with public grounding context. It does not complete human review or learner-facing approval.",
  boundary: "Reviewer-facing education-only cockpit. It organizes Codex self-review, public/Wikipedia grounding, and real reviewer queue status, but it does not generate real reviewer notes, approve learner-facing release, approve private PDFs as public citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

if (cockpit.lessonCount !== 12) fail(`expected 12 lessons, got ${cockpit.lessonCount}`);
if (cockpit.expectedReviewerNotes !== 72 || cockpit.codexSelfReviewNotes !== 72) fail("expected 72 self-review/reviewer note slots");
if (cockpit.directSourceDecisionCount !== 5) fail("expected 5 direct-source decisions");

fs.writeFileSync(outputJsonPath, `${JSON.stringify(cockpit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course High-Risk Review Cockpit",
  "",
  "Read-only cockpit for the 12 high-risk local-course lessons.",
  "",
  `- Status: ${cockpit.cockpitStatus}`,
  `- Lessons: ${cockpit.lessonCount}`,
  `- Modules: ${cockpit.modules}`,
  `- Codex self-review notes: ${cockpit.codexSelfReviewNotes}`,
  `- Ready real reviewer notes: ${cockpit.readyReviewerNotes}/${cockpit.expectedReviewerNotes}`,
  `- Direct-source decisions ready: ${cockpit.readyDirectSourceDecisions}/${cockpit.directSourceDecisionCount}`,
  `- Real human input entries: ${cockpit.realHumanInputEntries}`,
  `- Write allowed now: ${cockpit.writeAllowedNow}`,
  "",
  "## Module Queue",
  "",
  "| Module | Lessons | Notes ready | Direct decisions | Wikipedia refs | Status |",
  "| --- | ---: | ---: | ---: | ---: | --- |",
  ...cockpit.moduleRows.map((row) => `| ${row.module} | ${row.lessons} | ${row.readyReviewerNotes}/${row.requiredReviewerNotes} | ${row.readyDirectSourceDecisions}/${row.directSourceDecisions} | ${row.wikipediaRefCount} | ${row.status} |`),
  "",
  "## Lesson Queue",
  "",
  "| Candidate | Module | Topic | Public refs | Real notes | Next gate |",
  "| --- | --- | --- | ---: | ---: | --- |",
  ...cockpit.lessonRows.map((row) => `| ${row.candidateId} | ${row.module} | ${row.topic} | ${row.selectedPublicRefCount} | ${row.realReviewerNotesReady}/${row.realReviewerNotesRequired} | ${row.nextGate} |`),
  "",
  "## Direct Source Queue",
  "",
  "| Resolution | Module | Topic | Public replacements | Status |",
  "| --- | --- | --- | ---: | --- |",
  ...cockpit.directSourceRows.map((row) => `| ${row.sourceResolutionId} | ${row.module} | ${row.topic} | ${row.publicReplacementRefCount} | ${row.validationStatus} |`),
  "",
  "## Boundary",
  "",
  cockpit.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  cockpitStatus: cockpit.cockpitStatus,
  lessonCount: cockpit.lessonCount,
  modules: cockpit.modules,
  codexSelfReviewNotes: cockpit.codexSelfReviewNotes,
  readyReviewerNotes: cockpit.readyReviewerNotes,
  blockedReviewerNotes: cockpit.blockedReviewerNotes,
  directSourceDecisionCount: cockpit.directSourceDecisionCount,
  realHumanInputEntries: cockpit.realHumanInputEntries,
  writeAllowedNow: cockpit.writeAllowedNow,
}, null, 2));
