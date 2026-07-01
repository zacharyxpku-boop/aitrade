import fs from "node:fs";

const workbenchPath = "docs/LOCAL_COURSE_ABSORPTION_P0_WORKBENCH.json";
const outputJsonPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_OVERLAY.json";
const outputMdPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_OVERLAY.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const workbench = readJson(workbenchPath);
if (workbench.educationOnly !== true) fail("P0 workbench must keep educationOnly:true");
if (workbench.productionReady !== false) fail("P0 workbench must keep productionReady:false");
if (workbench.learnerFacingRelease !== false) fail("P0 workbench must keep learnerFacingRelease:false");
if (workbench.approvalStatus !== "not_approved") fail("P0 workbench must remain not_approved");

const reviewEntries = (workbench.workbenchTasks || []).map((task) => {
  const manual = task.category === "manual_transcription";
  return {
    id: `review_${task.id}`,
    taskId: task.id,
    category: task.category,
    priority: task.priority,
    sourceRelativePath: task.sourceRelativePath,
    sourceModule: task.sourceModule,
    documentId: task.documentId,
    pageNumber: task.pageNumber,
    previewPath: task.previewPath,
    previewUrl: task.previewUrl,
    workbenchMode: task.workbenchMode,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    reviewStatus: "not_started",
    reviewerName: "",
    reviewedAt: "",
    humanTranscription: manual ? "" : null,
    humanSummary: manual ? "" : null,
    uncertainWords: manual ? [] : null,
    replacementSourcePath: manual ? null : "",
    replacementNote: manual ? null : "",
    rerunEvidence: manual ? null : "",
    checklist: manual
      ? {
          visualTextCaptured: "not_started",
          chartLabelsCaptured: "not_started",
          unclearAreasFlagged: "not_started",
          noTradingAdviceAdded: "not_started",
          publicSourceGroundingReady: "not_started",
          originalRewriteReady: "not_started",
        }
      : {
          sourceIdentityConfirmed: "not_started",
          replacementSourceReadable: "not_started",
          readablePreviewGenerated: "not_started",
          harvestRerunEvidenceAttached: "not_started",
          qualityAndIntakeRerunReady: "not_started",
        },
    fieldCompletion: {
      requiredFieldsTotal: manual ? 5 : 5,
      requiredFieldsFilled: 0,
      complete: false,
    },
    validationStatus: "not_ready",
    acceptanceCriteria: task.acceptanceCriteria,
    nextCommandHints: task.nextCommandHints,
    nextGate: task.nextGate,
  };
});

const overlay = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  overlayStatus: "p0_review_not_started",
  sourceWorkbench: workbenchPath,
  totalP0Tasks: reviewEntries.length,
  manualTranscriptionTasks: reviewEntries.filter((entry) => entry.category === "manual_transcription").length,
  sourceReplacementTasks: reviewEntries.filter((entry) => entry.category === "source_replacement").length,
  notStartedTasks: reviewEntries.filter((entry) => entry.reviewStatus === "not_started").length,
  inProgressTasks: 0,
  readyForValidationTasks: 0,
  acceptedForNextGateTasks: 0,
  blockedTasks: reviewEntries.length,
  reviewEntries,
  completionRule: "P0 review overlay is complete only after reviewer fields are filled, required checklists pass, rerun evidence is attached for replacements, validationStatus is ready_for_next_gate, and separate source-fit/public-grounding/originality review still approves before learner-facing release.",
  boundary: "P0 review overlay stores human review status for local private course absorption blockers. It does not perform OCR, infer missing content, copy private course wording, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(overlay, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Absorption P0 Review Overlay",
  "",
  "Writable status layer for P0 absorption workbench tasks. Initial generation leaves all reviewer fields blank.",
  "",
  `- Overlay status: ${overlay.overlayStatus}`,
  `- Total P0 tasks: ${overlay.totalP0Tasks}`,
  `- Manual transcription tasks: ${overlay.manualTranscriptionTasks}`,
  `- Source replacement tasks: ${overlay.sourceReplacementTasks}`,
  `- Not started tasks: ${overlay.notStartedTasks}`,
  `- Ready for validation tasks: ${overlay.readyForValidationTasks}`,
  `- Accepted for next gate tasks: ${overlay.acceptedForNextGateTasks}`,
  "",
  "## First Tasks",
  "",
  "| Review entry | Category | Source | Page | Review status | Validation |",
  "| --- | --- | --- | ---: | --- | --- |",
  ...reviewEntries.slice(0, 12).map((entry) => `| ${entry.id} | ${entry.category} | ${entry.sourceRelativePath} | ${entry.pageNumber || ""} | ${entry.reviewStatus} | ${entry.validationStatus} |`),
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
  totalP0Tasks: overlay.totalP0Tasks,
  manualTranscriptionTasks: overlay.manualTranscriptionTasks,
  sourceReplacementTasks: overlay.sourceReplacementTasks,
  notStartedTasks: overlay.notStartedTasks,
  readyForValidationTasks: overlay.readyForValidationTasks,
  acceptedForNextGateTasks: overlay.acceptedForNextGateTasks,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
