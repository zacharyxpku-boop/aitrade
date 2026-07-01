import fs from "node:fs";

const reviewReportPath = "docs/LOCAL_COURSE_REWRITE_REVIEW_REPORT.json";
const batchIndexPath = "docs/LOCAL_COURSE_REWRITE_BATCH_INDEX.json";
const outputJsonPath = "docs/LOCAL_COURSE_REFINEMENT_PACKET.json";
const outputMdPath = "docs/LOCAL_COURSE_REFINEMENT_PACKET.md";

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

function evidenceSummary(evidence) {
  return {
    documentId: evidence.documentId,
    name: evidence.name,
    sourceRelativePath: evidence.sourceRelativePath,
    sourceModule: evidence.sourceModule,
    score: evidence.score,
    useBoundary: evidence.useBoundary,
  };
}

function reviewerChecklist() {
  return [
    {
      id: "source_fit",
      label: "Confirm the local private course evidence supports the teaching point.",
      required: true,
      status: "pending_human_review",
      blockingRule: "Block if the draft relies on private PDFs as learner-facing citations.",
    },
    {
      id: "originality",
      label: "Confirm the lesson is an original rewrite, not copied or closely paraphrased.",
      required: true,
      status: "pending_human_review",
      blockingRule: "Block if phrasing or sequence mirrors a source passage.",
    },
    {
      id: "green_source_alignment",
      label: "Map terminology and claims to green/public source boundaries before release.",
      required: true,
      status: "pending_human_review",
      blockingRule: "Block if no public/green citation can support the learner-facing claim.",
    },
    {
      id: "education_safety",
      label: "Confirm the lesson is observation-first education, not trading advice.",
      required: true,
      status: "pending_human_review",
      blockingRule: "Block if it contains buy/sell instructions, return promises, broker flows, or real-money guidance.",
    },
  ];
}

function highRiskNotes(candidate) {
  const evidenceList = candidate.localCourseEvidence
    .slice(0, 3)
    .map((evidence) => evidence.sourceRelativePath || evidence.documentId)
    .join("; ");
  return [
    {
      dimension: "source_fit",
      status: "pending_human_review",
      note: `Check whether ${candidate.module} / ${candidate.topic} is truly supported by the listed local course evidence: ${evidenceList}.`,
    },
    {
      dimension: "originality",
      status: "pending_human_review",
      note: `Review the rewritten intro, concept teaching, synthesis, and practice prompt against the highest-overlap local source; current max overlap is ${candidate.maxSourceOverlap}.`,
    },
    {
      dimension: "green_source_boundary",
      status: "pending_human_review",
      note: "Before learner-facing use, replace private-course dependency with public/green citations or keep the lesson blocked.",
    },
    {
      dimension: "education_safety",
      status: "pending_human_review",
      note: "Confirm the lesson asks learners to observe facts, explain uncertainty, and write invalidation conditions without giving trading instructions.",
    },
    {
      dimension: "pedagogy",
      status: "pending_human_review",
      note: "Confirm the practice task is answerable from a historical chart and can be graded by evidence quality rather than market outcome.",
    },
    {
      dimension: "release_gate",
      status: "pending_human_review",
      note: "Keep approvalStatus not_approved and learnerFacingRelease false until a separate human reviewer signs off.",
    },
  ].map((note, index) => ({
    id: `${candidate.id}_reviewer_note_${String(index + 1).padStart(2, "0")}`,
    ...note,
  }));
}

const reviewReport = readJson(reviewReportPath);
const batchIndex = readJson(batchIndexPath);
const batches = (batchIndex.batches || []).map((batchRef) => ({
  ...batchRef,
  data: readJson(batchRef.json),
}));
const draftById = new Map();
for (const batch of batches) {
  for (const draft of batch.data.draftItems || []) {
    draftById.set(draft.id, { ...draft, batchNumber: batch.batchNumber });
  }
}

if (reviewReport.educationOnly !== true) fail("review report is not education-only");
if (reviewReport.productionReady !== false) fail("review report productionReady drift");
if (reviewReport.approvalStatus !== "not_approved") fail("review report approval drift");
if ((reviewReport.rows || []).length < 120) fail("expected at least 120 review rows");

const candidateCards = (reviewReport.rows || []).map((row) => {
  const draft = draftById.get(row.id);
  if (!draft) fail(`missing draft for review row ${row.id}`);
  return {
    id: row.id,
    batchId: row.batchId,
    batchNumber: draft.batchNumber,
    nodeId: row.nodeId,
    lessonId: row.lessonId,
    module: row.module,
    topic: row.topic,
    title: draft.title,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    packetStatus: "ready_for_reviewer_refinement",
    originalityStatus: row.originalityStatus,
    sourceFitStatus: row.sourceFitStatus,
    sourceFitScore: row.sourceFitScore,
    maxSourceOverlap: row.maxSourceOverlap,
    localEvidenceCount: row.localEvidenceCount,
    localCourseEvidence: (draft.localCourseEvidence || []).slice(0, 3).map(evidenceSummary),
    overlapScores: row.overlapScores || [],
    reviewerNotesFromDraft: draft.reviewerNotes || [],
    forbiddenDrift: draft.forbiddenDrift || [],
    reviewerChecklist: reviewerChecklist(),
    requiredHumanDecision: {
      status: "pending_human_review",
      allowedDecisions: ["approve_for_green_source_rewrite", "request_rework", "reject"],
      releaseBlocker: "No candidate may become learner-facing until source-fit, originality, green-source alignment, and education-safety review are complete.",
    },
  };
});

const highRiskCandidates = [...candidateCards]
  .sort((a, b) => (b.maxSourceOverlap - a.maxSourceOverlap) || (a.id.localeCompare(b.id)))
  .slice(0, 12);
const overlayLessons = highRiskCandidates.map((candidate) => ({
  overlayId: `overlay_${candidate.id}`,
  candidateId: candidate.id,
  batchId: candidate.batchId,
  nodeId: candidate.nodeId,
  lessonId: candidate.lessonId,
  module: candidate.module,
  topic: candidate.topic,
  maxSourceOverlap: candidate.maxSourceOverlap,
  sourceFitScore: candidate.sourceFitScore,
  approvalStatus: "not_approved",
  learnerFacingRelease: false,
  reviewerNotes: highRiskNotes(candidate),
}));

const directSourceCandidateResolutions = highRiskCandidates.slice(0, 5).map((candidate, index) => {
  const topSource = [...(candidate.overlapScores || [])].sort((a, b) => b.overlapRate - a.overlapRate)[0] || {};
  return {
    id: `direct_source_candidate_resolution_${String(index + 1).padStart(2, "0")}`,
    candidateId: candidate.id,
    nodeId: candidate.nodeId,
    module: candidate.module,
    topic: candidate.topic,
    candidateSource: topSource.sourceRelativePath || candidate.localCourseEvidence[0]?.sourceRelativePath || "unknown",
    overlapRate: topSource.overlapRate || 0,
    status: "resolved_to_reviewer_only_background",
    resolution: "Do not cite the local private PDF directly in learner-facing content. Use it only as reviewer background and require a green/public source before release.",
    approvalStatus: "not_approved",
  };
});

const packet = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packetStatus: "ready_for_reviewer_refinement",
  sourceReport: reviewReportPath,
  sourceBatchIndex: batchIndexPath,
  batches: reviewReport.batches,
  modules: Object.keys(reviewReport.moduleCounts || {}).length,
  draftsReviewed: reviewReport.draftsReviewed,
  readyForSeparateReviewCandidates: reviewReport.readyForSeparateReviewCandidates,
  candidateCards: candidateCards.length,
  copyRiskIssues: reviewReport.copyRiskIssues,
  safetyIssues: reviewReport.safetyIssues,
  structureIssues: reviewReport.structureIssues,
  maxSourceOverlap: reviewReport.maxSourceOverlap,
  moduleCounts: reviewReport.moduleCounts,
  highRiskOverlay: {
    overlayId: "local_course_high_risk_review_overlay_01",
    status: "active_not_approved",
    selectionRule: "Top 12 candidates by max source overlap after automated originality/source-fit screen.",
    lessonCount: overlayLessons.length,
    reviewerNoteCount: overlayLessons.reduce((sum, lesson) => sum + lesson.reviewerNotes.length, 0),
    lessons: overlayLessons,
  },
  directSourceCandidateResolutions,
  candidateCardsList: candidateCards,
  boundary: "Internal reviewer refinement packet only. It does not approve learner-facing release, does not make private PDFs public citations, and does not provide trading advice or real-money guidance.",
};

fs.mkdirSync("docs", { recursive: true });
writeJson(outputJsonPath, packet);
fs.writeFileSync(outputMdPath, [
  "# Local Course Refinement Packet",
  "",
  "Internal reviewer refinement packet for local-course-assisted rewrite candidates.",
  "",
  `- Packet status: ${packet.packetStatus}`,
  `- Candidate cards: ${packet.candidateCards}`,
  `- Batches: ${packet.batches}`,
  `- Modules: ${packet.modules}`,
  `- High-risk overlay lessons: ${packet.highRiskOverlay.lessonCount}`,
  `- Reviewer notes in overlay: ${packet.highRiskOverlay.reviewerNoteCount}`,
  `- Direct source candidate resolutions: ${packet.directSourceCandidateResolutions.length}`,
  `- Copy-risk issues: ${packet.copyRiskIssues}`,
  `- Safety issues: ${packet.safetyIssues}`,
  `- Structure issues: ${packet.structureIssues}`,
  `- Max source overlap: ${packet.maxSourceOverlap}`,
  `- Approval status: ${packet.approvalStatus}`,
  `- Learner-facing release: ${packet.learnerFacingRelease}`,
  "",
  "## High-Risk Overlay",
  "",
  ...packet.highRiskOverlay.lessons.map((lesson) =>
    `- ${lesson.id || lesson.overlayId}: ${lesson.module} / ${lesson.topic} / notes ${lesson.reviewerNotes.length} / max overlap ${lesson.maxSourceOverlap}`
  ),
  "",
  "## Direct Source Candidate Resolutions",
  "",
  ...packet.directSourceCandidateResolutions.map((item) =>
    `- ${item.id}: ${item.module} / ${item.topic} / ${item.status} / ${item.candidateSource}`
  ),
  "",
  "## Boundary",
  "",
  packet.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: packet.educationOnly,
  productionReady: packet.productionReady,
  learnerFacingRelease: packet.learnerFacingRelease,
  approvalStatus: packet.approvalStatus,
  packetStatus: packet.packetStatus,
  candidateCards: packet.candidateCards,
  highRiskOverlayLessons: packet.highRiskOverlay.lessonCount,
  reviewerNotes: packet.highRiskOverlay.reviewerNoteCount,
  directSourceCandidateResolutions: packet.directSourceCandidateResolutions.length,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
