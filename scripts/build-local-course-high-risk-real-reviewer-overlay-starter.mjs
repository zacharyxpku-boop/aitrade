import fs from "node:fs";

const outputJson = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_STARTER.json";
const outputMd = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_STARTER.md";
const draftJson = "docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json";
const draftMd = "docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.md";

const allowedNoteDecisions = [
  "accept_as_education_only_after_public_grounding",
  "accept_with_rewrite_required",
  "keep_blocked_private_source_dependency",
  "reject_until_source_replacement",
  "reject_safety_or_originality_risk",
];

const allowedDirectSourceDecisions = [
  "keep_private_source_reviewer_only",
  "replace_with_public_refs_for_context_only",
  "reject_public_refs_as_not_fit",
  "mark_unrecoverable_until_new_source",
];

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

const refinementPacket = readJson("docs/LOCAL_COURSE_REFINEMENT_PACKET.json");
const codexSelfReview = readJson("docs/LOCAL_COURSE_HIGH_RISK_SELF_REVIEW_OVERLAY.json");
const publicGrounding = readJson("docs/LOCAL_COURSE_HIGH_RISK_PUBLIC_GROUNDING_MATRIX.json");
const reviewGateDashboard = readJson("docs/LOCAL_COURSE_REVIEW_GATE_DASHBOARD.json");

for (const [name, artifact] of Object.entries({
  refinementPacket,
  codexSelfReview,
  publicGrounding,
  reviewGateDashboard,
})) {
  assertBoundary(name, artifact);
}

const publicByCandidate = new Map((publicGrounding.lessonRows || []).map((row) => [row.candidateId, row]));
const selfByCandidate = new Map((codexSelfReview.lessons || []).map((row) => [row.candidateId, row]));
const sourceRowsByCandidate = new Map((publicGrounding.directSourceRows || []).map((row) => [row.candidateId, row]));
const highRiskLessons = refinementPacket.highRiskOverlay?.lessons || [];
const directSourceRows = publicGrounding.directSourceRows || [];

if (highRiskLessons.length !== 12) fail(`expected 12 high-risk lessons, got ${highRiskLessons.length}`);
if (directSourceRows.length !== 5) fail(`expected 5 direct source rows, got ${directSourceRows.length}`);

const lessonRows = highRiskLessons.map((lesson, lessonIndex) => {
  const publicRow = publicByCandidate.get(lesson.candidateId) || {};
  const selfRow = selfByCandidate.get(lesson.candidateId) || {};
  const noteRows = (lesson.reviewerNotes || []).map((note, noteIndex) => {
    const selfNote = (selfRow.noteResponses || []).find((item) => item.noteId === note.id) || {};
    return {
      id: `real_${note.id}`,
      sourceNoteId: note.id,
      dimension: note.dimension,
      prompt: note.note,
      codexSelfReviewConclusion: selfNote.conclusion || "",
      codexSelfReviewReleaseBlocker: selfNote.releaseBlocker === true,
      requiredReviewerFields: [
        "reviewerName",
        "reviewedAt",
        "decision",
        "evidenceChecked",
        "reviewerNote",
      ],
      allowedDecisionValues: allowedNoteDecisions,
      reviewerName: "",
      reviewedAt: "",
      decision: "",
      evidenceChecked: [],
      reviewerNote: "",
      readyForApprovalGate: false,
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      noteStatus: "blank_waiting_real_reviewer",
      nextGate: "real_reviewer_fill_note_then_validate",
      order: noteIndex + 1,
    };
  });

  return {
    order: lessonIndex + 1,
    overlayId: lesson.overlayId,
    candidateId: lesson.candidateId,
    batchId: lesson.batchId,
    nodeId: lesson.nodeId,
    lessonId: lesson.lessonId,
    module: lesson.module,
    topic: lesson.topic,
    maxSourceOverlap: lesson.maxSourceOverlap,
    sourceFitScore: lesson.sourceFitScore,
    localEvidenceCount: selfRow.localEvidenceCount || 0,
    publicGroundingStatus: publicRow.publicGroundingStatus || "not_mapped",
    wikipediaRefCount: (publicRow.wikipediaRefs || []).length,
    publicContextRefCount: (publicRow.publicContextRefs || []).length,
    selectedPublicRefCount: publicRow.selectedPublicRefCount || 0,
    shareAlikeAttributionRequiredRefs: publicRow.shareAlikeAttributionRequiredRefs || 0,
    publicRefSamples: [
      ...(publicRow.wikipediaRefs || []).slice(0, 2),
      ...(publicRow.publicContextRefs || []).slice(0, 1),
    ].map((ref) => ({
      name: ref.name,
      url: ref.url,
      family: ref.family,
      excerptPolicy: ref.excerptPolicy,
      groundingRole: ref.groundingRole,
    })),
    directSourceCandidate: sourceRowsByCandidate.has(lesson.candidateId),
    sourceSelfReviewStatus: publicRow.sourceSelfReviewStatus || selfRow.selfReviewStatus || "",
    codexSelfReviewNotes: selfRow.reviewerNotesReviewed || 0,
    realReviewerNotes: noteRows,
    realReviewerNotesRequired: noteRows.length,
    realReviewerNotesReady: 0,
    releaseBlocker: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    nextGate: "fill_6_real_reviewer_notes_then_public_grounding_and_release_gate",
  };
});

const directSourceDecisionRows = directSourceRows.map((row, index) => ({
  order: index + 1,
  id: `real_${row.id}`,
  sourceResolutionId: row.id,
  candidateId: row.candidateId,
  nodeId: row.nodeId || "",
  module: row.module,
  topic: row.topic,
  privateOrDirectCandidateSource: row.privateOrDirectCandidateSource || row.candidateSource || "",
  codexSelfReviewDecision: row.selfReviewDecision || "",
  publicReplacementRefCount: (row.publicReplacementRefs || []).length,
  publicReplacementRefSamples: (row.publicReplacementRefs || []).slice(0, 3).map((ref) => ({
    name: ref.name,
    url: ref.url,
    family: ref.family,
    excerptPolicy: ref.excerptPolicy,
    groundingRole: ref.groundingRole,
  })),
  requiredReviewerFields: [
    "reviewerName",
    "reviewedAt",
    "decision",
    "evidenceChecked",
    "reviewerNote",
  ],
  allowedDecisionValues: allowedDirectSourceDecisions,
  reviewerName: "",
  reviewedAt: "",
  decision: "",
  evidenceChecked: [],
  reviewerNote: "",
  learnerCitationApproved: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  decisionStatus: "blank_waiting_real_reviewer",
  readyForApprovalGate: false,
  releaseBlocker: true,
  nextGate: "real_reviewer_resolves_direct_source_candidate_then_validate",
}));

const totalReviewerNotes = lessonRows.reduce((sum, row) => sum + row.realReviewerNotes.length, 0);
const starter = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  starterStatus: "high_risk_real_reviewer_overlay_starter_ready_blank",
  starterMode: "blank_real_reviewer_overlay_draft_for_12_high_risk_lessons",
  sourceRefinementPacket: "docs/LOCAL_COURSE_REFINEMENT_PACKET.json",
  sourceCodexSelfReview: "docs/LOCAL_COURSE_HIGH_RISK_SELF_REVIEW_OVERLAY.json",
  sourcePublicGroundingMatrix: "docs/LOCAL_COURSE_HIGH_RISK_PUBLIC_GROUNDING_MATRIX.json",
  sourceReviewGateDashboard: "docs/LOCAL_COURSE_REVIEW_GATE_DASHBOARD.json",
  draftInputPath: draftJson,
  lessonCount: lessonRows.length,
  directSourceDecisionCount: directSourceDecisionRows.length,
  expectedReviewerNotes: 72,
  totalReviewerNotes,
  blankReviewerNotes: totalReviewerNotes,
  readyReviewerNotes: 0,
  blankDirectSourceDecisions: directSourceDecisionRows.length,
  readyDirectSourceDecisions: 0,
  codexSelfReviewNotes: codexSelfReview.reviewerNotesReviewed,
  realHumanInputEntries: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  allowedNoteDecisionValues: allowedNoteDecisions,
  allowedDirectSourceDecisionValues: allowedDirectSourceDecisions,
  lessonRows,
  directSourceDecisionRows,
  validationSummary: {
    validationStatus: "blocked_missing_real_reviewer_overlay_input",
    readyLessons: 0,
    blockedLessons: lessonRows.length,
    readyReviewerNotes: 0,
    blockedReviewerNotes: totalReviewerNotes,
    readyDirectSourceDecisions: 0,
    blockedDirectSourceDecisions: directSourceDecisionRows.length,
    forbiddenHitRows: 0,
  },
  commands: [
    "npm.cmd run build:local-course-high-risk-real-reviewer-overlay-starter",
    "npm.cmd run check:local-course-high-risk-real-reviewer-overlay-starter",
    "npm.cmd run check:local-course-high-risk-public-grounding-matrix",
    "npm.cmd run check:local-course-review-gate-dashboard",
  ],
  completionRule: "This starter creates a blank reviewer-owned draft for the 12 high-risk lessons, 72 required real reviewer notes, and 5 direct-source decisions. It does not complete human review; all notes and decisions remain blocked until a real reviewer fills the draft and a separate approval gate passes.",
  boundary: "Reviewer-facing education-only starter. It may show Codex self-review and public/Wikipedia grounding as context, but it must not copy generated self-review into real notes, approve learner-facing citations, write course overlays, publish private PDFs, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

const draft = {
  generatedAt: starter.generatedAt,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  draftStatus: "blank_waiting_real_reviewer",
  draftMode: "human_owned_edit_copy_do_not_use_fixtures",
  sourceStarter: outputJson,
  reviewerIdentity: {
    reviewerName: "",
    reviewerRole: "",
    reviewedAt: "",
  },
  lessonRows,
  directSourceDecisionRows,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  completionRule: starter.completionRule,
  boundary: starter.boundary,
};

fs.mkdirSync("docs/reviewer-inputs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(starter, null, 2)}\n`, "utf8");
fs.writeFileSync(draftJson, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course High-Risk Real Reviewer Overlay Starter",
  "",
  "Blank real-reviewer starter for the 12 high-risk local-course lessons.",
  "",
  `- Starter status: ${starter.starterStatus}`,
  `- Draft input: ${starter.draftInputPath}`,
  `- Lessons: ${starter.lessonCount}`,
  `- Required reviewer notes: ${starter.totalReviewerNotes}`,
  `- Direct-source decisions: ${starter.directSourceDecisionCount}`,
  `- Ready reviewer notes: ${starter.readyReviewerNotes}`,
  `- Real human inputs: ${starter.realHumanInputEntries}`,
  `- Write allowed now: ${starter.writeAllowedNow}`,
  "",
  "## Lesson Rows",
  "",
  "| # | Module | Lesson | Topic | Wiki refs | Public context | Direct source | Notes | Next gate |",
  "| ---: | --- | --- | --- | ---: | ---: | --- | ---: | --- |",
  ...lessonRows.map((row) => `| ${row.order} | ${row.module} | ${row.lessonId} | ${row.topic} | ${row.wikipediaRefCount} | ${row.publicContextRefCount} | ${row.directSourceCandidate} | ${row.realReviewerNotes.length} | ${row.nextGate} |`),
  "",
  "## Direct-Source Decision Rows",
  "",
  "| # | Module | Topic | Source | Public refs | Status |",
  "| ---: | --- | --- | --- | ---: | --- |",
  ...directSourceDecisionRows.map((row) => `| ${row.order} | ${row.module} | ${row.topic} | ${row.privateOrDirectCandidateSource} | ${row.publicReplacementRefCount} | ${row.decisionStatus} |`),
  "",
  "## Completion Rule",
  "",
  starter.completionRule,
  "",
  "## Boundary",
  "",
  starter.boundary,
  "",
].join("\n"), "utf8");
fs.writeFileSync(draftMd, [
  "# Local Course High-Risk Real Reviewer Overlay Draft",
  "",
  "Human-owned blank draft. Fill a copied working file if preferred; do not paste fixture or Codex self-review text as real reviewer evidence.",
  "",
  `- Lessons: ${draft.lessonRows.length}`,
  `- Reviewer notes: ${totalReviewerNotes}`,
  `- Direct-source decisions: ${directSourceDecisionRows.length}`,
  `- Status: ${draft.draftStatus}`,
  "",
  "## Required Note Dimensions",
  "",
  ...allowedNoteDecisions.map((value) => `- ${value}`),
  "",
  "## Direct-Source Decisions",
  "",
  ...allowedDirectSourceDecisions.map((value) => `- ${value}`),
  "",
  "## Boundary",
  "",
  draft.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: starter.educationOnly,
  productionReady: starter.productionReady,
  learnerFacingRelease: starter.learnerFacingRelease,
  approvalStatus: starter.approvalStatus,
  starterStatus: starter.starterStatus,
  lessonCount: starter.lessonCount,
  totalReviewerNotes: starter.totalReviewerNotes,
  directSourceDecisionCount: starter.directSourceDecisionCount,
  realHumanInputEntries: starter.realHumanInputEntries,
  writeAllowedNow: starter.writeAllowedNow,
  outputJson,
  draftJson,
}, null, 2));
