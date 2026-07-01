import fs from "node:fs";

const inputPath = "docs/LOCAL_COURSE_REFINEMENT_PACKET.json";
const outputJsonPath = "docs/LOCAL_COURSE_HIGH_RISK_SELF_REVIEW_OVERLAY.json";
const outputMdPath = "docs/LOCAL_COURSE_HIGH_RISK_SELF_REVIEW_OVERLAY.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function assertBoundary(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (record.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

function responseForNote(note, lesson) {
  const evidenceCount = Array.isArray(lesson.localCourseEvidence) ? lesson.localCourseEvidence.length : 0;
  const dimension = note.dimension || "unknown";
  const base = {
    noteId: note.id,
    dimension,
    sourceStatus: note.status,
    selfReviewStatus: "codex_self_reviewed_not_human_approved",
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    reviewerType: "codex_self_review",
  };

  if (dimension === "source_fit") {
    return {
      ...base,
      conclusion: "supported_as_private_reviewer_background_only",
      releaseBlocker: true,
      action: "Keep the local course evidence as reviewer background. Before release, map the teaching point to public or green sources and keep private PDFs out of learner-facing citations.",
      evidence: `${evidenceCount} local course evidence items; max overlap ${lesson.maxSourceOverlap}.`,
    };
  }
  if (dimension === "originality") {
    return {
      ...base,
      conclusion: "automated_originality_screen_passed_requires_spot_check",
      releaseBlocker: true,
      action: "Use the low overlap score as a screening signal only. A separate reviewer must spot-check the draft against the highest-overlap source before approval.",
      evidence: `maxSourceOverlap ${lesson.maxSourceOverlap}; auto screen is not final approval.`,
    };
  }
  if (dimension === "green_source_boundary") {
    return {
      ...base,
      conclusion: "public_grounding_required_before_release",
      releaseBlocker: true,
      action: "Require a public-source mapping pass. If no public source supports the learner-facing claim, keep the lesson blocked or rewrite the claim narrower.",
      evidence: "Private course dependency remains reviewer-only until public grounding is attached.",
    };
  }
  if (dimension === "education_safety") {
    return {
      ...base,
      conclusion: "education_safety_surface_passed",
      releaseBlocker: false,
      action: "Keep the lesson observation-first: facts, uncertainty, invalidation, and reflection. Do not introduce action instructions or outcome promises.",
      evidence: "Self-review accepts only education framing, not trading execution.",
    };
  }
  if (dimension === "pedagogy") {
    return {
      ...base,
      conclusion: "pedagogy_surface_passed_for_historical_practice",
      releaseBlocker: false,
      action: "Use historical chart tasks graded by evidence quality, reasoning boundaries, and invalidation clarity.",
      evidence: "Practice remains answerable without market outcome grading.",
    };
  }
  if (dimension === "release_gate") {
    return {
      ...base,
      conclusion: "release_blocked_until_separate_human_approval",
      releaseBlocker: true,
      action: "Keep approvalStatus:not_approved and learnerFacingRelease:false. This Codex self-review cannot authorize release.",
      evidence: "Separate approval artifact and real reviewer sign-off are absent.",
    };
  }
  return {
    ...base,
    conclusion: "unknown_dimension_requires_manual_review",
    releaseBlocker: true,
    action: "Block until the review dimension is classified and separately checked.",
    evidence: "Unknown note dimension.",
  };
}

const packet = readJson(inputPath);
assertBoundary(packet, "refinement packet");
if (packet.packetStatus !== "ready_for_reviewer_refinement") fail("refinement packet must be ready for reviewer refinement");

const lessons = packet.highRiskOverlay?.lessons || [];
if (lessons.length !== 12) fail(`expected 12 high-risk lessons, got ${lessons.length}`);

const candidateById = new Map((packet.candidateCardsList || []).map((candidate) => [candidate.id, candidate]));
const selfReviewedLessons = lessons.map((lesson) => {
  const candidate = candidateById.get(lesson.candidateId) || {};
  const enrichedLesson = {
    ...lesson,
    localCourseEvidence: candidate.localCourseEvidence || [],
  };
  const noteResponses = (lesson.reviewerNotes || []).map((note) => responseForNote(note, enrichedLesson));
  return {
    overlayId: lesson.overlayId,
    candidateId: lesson.candidateId,
    batchId: lesson.batchId,
    nodeId: lesson.nodeId,
    lessonId: lesson.lessonId,
    module: lesson.module,
    topic: lesson.topic,
    maxSourceOverlap: lesson.maxSourceOverlap,
    sourceFitScore: lesson.sourceFitScore,
    localEvidenceCount: candidate.localEvidenceCount || candidate.localCourseEvidence?.length || 0,
    approvalStatus: "not_approved",
    learnerFacingRelease: false,
    selfReviewStatus: "codex_self_review_complete_not_approved",
    sourceNoteStatusBeforeSelfReview: [...new Set((lesson.reviewerNotes || []).map((note) => note.status))],
    reviewerNotesReviewed: noteResponses.length,
    releaseBlockingNotes: noteResponses.filter((note) => note.releaseBlocker).length,
    releaseReadyNotes: 0,
    noteResponses,
  };
});

const directSourceSelfReview = (packet.directSourceCandidateResolutions || []).map((item) => ({
  id: item.id,
  candidateId: item.candidateId,
  nodeId: item.nodeId,
  module: item.module,
  topic: item.topic,
  candidateSource: item.candidateSource,
  overlapRate: item.overlapRate,
  sourceStatus: item.status,
  selfReviewDecision: "keep_reviewer_only_background",
  approvalStatus: "not_approved",
  learnerFacingRelease: false,
  releaseBlocker: true,
  action: "Do not promote this local/private or direct candidate source to a learner-facing citation. Use it to guide rewrite review, then require public grounding or a narrower claim before release.",
}));

const reviewerNotesReviewed = selfReviewedLessons.reduce((sum, lesson) => sum + lesson.reviewerNotesReviewed, 0);
const releaseBlockingNotes = selfReviewedLessons.reduce((sum, lesson) => sum + lesson.releaseBlockingNotes, 0);
const dimensionCounts = {};
for (const lesson of selfReviewedLessons) {
  for (const note of lesson.noteResponses) {
    dimensionCounts[note.dimension] = (dimensionCounts[note.dimension] || 0) + 1;
  }
}

const overlay = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  sourcePacket: inputPath,
  overlayId: "local_course_high_risk_codex_self_review_overlay_01",
  overlayStatus: "codex_self_review_complete_not_approved",
  reviewerType: "codex_self_review",
  selfReviewScope: "12 high-risk local-course-assisted rewrite lessons from the refinement packet",
  lessonCount: selfReviewedLessons.length,
  reviewerNotesReviewed,
  expectedReviewerNotes: packet.highRiskOverlay?.reviewerNoteCount || 0,
  releaseBlockingNotes,
  releaseReadyNotes: 0,
  directSourceCandidateResolutionsReviewed: directSourceSelfReview.length,
  directSourceCandidatesApprovedForLearnerCitation: 0,
  writeAllowedNow: false,
  approvalGatePassed: false,
  humanApprovalRequired: true,
  publicGroundingRequired: true,
  dimensionCounts,
  lessons: selfReviewedLessons,
  directSourceSelfReview,
  completionRule: "This overlay is complete only as Codex self-review scaffolding: all 72 high-risk notes and 5 direct source candidate resolutions are answered, but release remains blocked until separate human approval and public-source grounding exist.",
  boundary: "Codex self-review overlay for internal course absorption only. It does not approve learner-facing release, does not make private PDFs public citations, does not create real human reviewer approval, does not provide stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

writeJson(outputJsonPath, overlay);
fs.writeFileSync(outputMdPath, [
  "# Local Course High-Risk Codex Self-Review Overlay",
  "",
  "Codex self-review layer for the 12 high-risk local-course-assisted rewrite lessons.",
  "",
  `- Overlay status: ${overlay.overlayStatus}`,
  `- Lessons: ${overlay.lessonCount}`,
  `- Reviewer notes reviewed: ${overlay.reviewerNotesReviewed}/${overlay.expectedReviewerNotes}`,
  `- Release blocking notes: ${overlay.releaseBlockingNotes}`,
  `- Release ready notes: ${overlay.releaseReadyNotes}`,
  `- Direct source resolutions reviewed: ${overlay.directSourceCandidateResolutionsReviewed}`,
  `- Direct sources approved for learner citation: ${overlay.directSourceCandidatesApprovedForLearnerCitation}`,
  `- Write allowed now: ${overlay.writeAllowedNow}`,
  `- Approval gate passed: ${overlay.approvalGatePassed}`,
  `- Approval status: ${overlay.approvalStatus}`,
  `- Learner-facing release: ${overlay.learnerFacingRelease}`,
  "",
  "## Lessons",
  "",
  "| Candidate | Module | Topic | Notes | Blocking | Status |",
  "| --- | --- | --- | ---: | ---: | --- |",
  ...overlay.lessons.map((lesson) => `| ${lesson.candidateId} | ${lesson.module} | ${lesson.topic} | ${lesson.reviewerNotesReviewed} | ${lesson.releaseBlockingNotes} | ${lesson.selfReviewStatus} |`),
  "",
  "## Direct Source Self-Review",
  "",
  "| Resolution | Candidate | Source | Decision |",
  "| --- | --- | --- | --- |",
  ...overlay.directSourceSelfReview.map((item) => `| ${item.id} | ${item.candidateId} | ${item.candidateSource} | ${item.selfReviewDecision} |`),
  "",
  "## Completion Rule",
  "",
  overlay.completionRule,
  "",
  "## Boundary",
  "",
  overlay.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: overlay.educationOnly,
  productionReady: overlay.productionReady,
  learnerFacingRelease: overlay.learnerFacingRelease,
  approvalStatus: overlay.approvalStatus,
  overlayStatus: overlay.overlayStatus,
  lessonCount: overlay.lessonCount,
  reviewerNotesReviewed: overlay.reviewerNotesReviewed,
  releaseBlockingNotes: overlay.releaseBlockingNotes,
  directSourceCandidateResolutionsReviewed: overlay.directSourceCandidateResolutionsReviewed,
  writeAllowedNow: overlay.writeAllowedNow,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
