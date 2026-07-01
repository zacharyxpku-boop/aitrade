import fs from "node:fs";

const workbenchPath = "docs/LOCAL_COURSE_ABSORPTION_P0_WORKBENCH.json";
const candidateIndexPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_INDEX.json";
const outputJsonPath = "docs/LOCAL_COURSE_P0_CANDIDATE_REVIEW_ASSIST_MAP.json";
const outputMdPath = "docs/LOCAL_COURSE_P0_CANDIDATE_REVIEW_ASSIST_MAP.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const workbench = readJson(workbenchPath);
const candidateIndex = readJson(candidateIndexPath);

for (const [name, artifact] of [["workbench", workbench], ["candidate index", candidateIndex]]) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false || artifact.approvalStatus !== "not_approved") {
    fail(`${name} release gate drift`);
  }
}

const candidatesByPage = new Map((candidateIndex.pageRows || []).map((page) => [`${page.documentId}:${page.pageNumber}`, page]));

const taskRows = (workbench.workbenchTasks || []).map((task) => {
  const manual = task.category === "manual_transcription";
  const candidate = manual ? candidatesByPage.get(`${task.documentId}:${task.pageNumber}`) : null;
  const matchStatus = manual
    ? candidate
      ? "candidate_available_for_human_review"
      : "missing_machine_candidate"
    : "source_replacement_decision_required";
  return {
    id: `assist_${task.id}`,
    taskId: task.id,
    category: task.category,
    priority: task.priority,
    documentId: task.documentId,
    pageNumber: task.pageNumber,
    sourceRelativePath: task.sourceRelativePath,
    sourceModule: task.sourceModule,
    previewUrl: task.previewUrl,
    highResPreviewPath: candidate?.highResPreviewPath || "",
    highResPreviewUrl: candidate?.highResPreviewPath ? `/${String(candidate.highResPreviewPath).replace(/\\/g, "/")}` : "",
    candidateId: candidate?.id || "",
    candidateStatus: candidate?.candidateStatus || "",
    matchStatus,
    acceptedForP0Overlay: false,
    reviewAssistUse: manual
      ? "Use the machine-assisted candidate only as a reviewer checklist against the high-resolution preview."
      : "Resolve source replacement before any transcription or rewrite.",
    candidateSummary: candidate?.educationOnlySummary || "",
    riskTermFlags: candidate?.riskTermFlags || [],
    uncertainRegions: candidate?.uncertainRegions || [],
    requiredReviewerActions: manual
      ? [
          "Open the original preview and the high-resolution candidate preview.",
          "Verify or correct each visible-text extract manually.",
          "Fill the P0 overlay or input copy with human transcription, summary, and checklist values.",
          "Run validation, source-fit, public-grounding, originality, and approval gates before learner-facing use.",
        ]
      : [
          "Choose locate_external_original, reexport_readable_pdf, mark_unrecoverable, or use_neighbor_as_context_only.",
          "Attach replacement source or rerun evidence before any absorption.",
          "Keep learner-facing release blocked until separate approval.",
        ],
    nextGate: manual
      ? "human_verify_candidate_then_fill_p0_review_input"
      : "source_replacement_decision_then_reexport_or_unrecoverable_review",
  };
});

const manualRows = taskRows.filter((row) => row.category === "manual_transcription");
const replacementRows = taskRows.filter((row) => row.category === "source_replacement");
const riskTermFlagCounts = manualRows.reduce((counts, row) => {
  for (const flag of row.riskTermFlags || []) counts[flag] = (counts[flag] || 0) + 1;
  return counts;
}, {});

const assistMap = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  assistMapStatus: "review_assist_map_ready_not_applied",
  sourceWorkbench: workbenchPath,
  sourceCandidateIndex: candidateIndexPath,
  totalP0Tasks: taskRows.length,
  manualTranscriptionTasks: manualRows.length,
  sourceReplacementTasks: replacementRows.length,
  manualTasksWithCandidate: manualRows.filter((row) => row.matchStatus === "candidate_available_for_human_review").length,
  manualTasksMissingCandidate: manualRows.filter((row) => row.matchStatus === "missing_machine_candidate").length,
  sourceReplacementTasksWithoutCandidate: replacementRows.length,
  acceptedForP0OverlayTasks: 0,
  blockedUntilHumanReviewedTasks: taskRows.length,
  candidatePagesIndexed: candidateIndex.candidatePages,
  riskTermFlagCounts,
  topRiskTermFlags: Object.entries(riskTermFlagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([flag, count]) => ({ flag, count })),
  taskRows,
  completionRule: "This map is complete only as a reviewer-assist lookup: every manual P0 transcription task can see its matching machine candidate, but no candidate is accepted into the P0 overlay until a human reviewer fills and validates the review input.",
  boundary: "P0 candidate review assist map is reviewer-only working material. It does not perform accepted OCR, fill reviewer fields, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(assistMap, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Candidate Review Assist Map",
  "",
  "Reviewer-only lookup that connects P0 workbench tasks to machine-assisted high-resolution transcription candidates.",
  "",
  `- Assist map status: ${assistMap.assistMapStatus}`,
  `- Total P0 tasks: ${assistMap.totalP0Tasks}`,
  `- Manual transcription tasks: ${assistMap.manualTranscriptionTasks}`,
  `- Manual tasks with candidate: ${assistMap.manualTasksWithCandidate}`,
  `- Manual tasks missing candidate: ${assistMap.manualTasksMissingCandidate}`,
  `- Source replacement tasks: ${assistMap.sourceReplacementTasks}`,
  `- Accepted for P0 overlay: ${assistMap.acceptedForP0OverlayTasks}`,
  `- Blocked until human reviewed: ${assistMap.blockedUntilHumanReviewedTasks}`,
  "",
  "## Top Risk Flags",
  "",
  "| Flag | Count |",
  "| --- | ---: |",
  ...assistMap.topRiskTermFlags.map((row) => `| ${row.flag} | ${row.count} |`),
  "",
  "## First Task Rows",
  "",
  "| Task | Category | Page | Match status | Candidate | Next gate |",
  "| --- | --- | ---: | --- | --- | --- |",
  ...taskRows.slice(0, 12).map((row) => `| ${row.taskId} | ${row.category} | ${row.pageNumber || ""} | ${row.matchStatus} | ${row.candidateId || ""} | ${row.nextGate} |`),
  "",
  "## Completion Rule",
  "",
  assistMap.completionRule,
  "",
  "## Boundary",
  "",
  assistMap.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: assistMap.educationOnly,
  productionReady: assistMap.productionReady,
  learnerFacingRelease: assistMap.learnerFacingRelease,
  approvalStatus: assistMap.approvalStatus,
  assistMapStatus: assistMap.assistMapStatus,
  totalP0Tasks: assistMap.totalP0Tasks,
  manualTasksWithCandidate: assistMap.manualTasksWithCandidate,
  manualTasksMissingCandidate: assistMap.manualTasksMissingCandidate,
  sourceReplacementTasks: assistMap.sourceReplacementTasks,
  acceptedForP0OverlayTasks: assistMap.acceptedForP0OverlayTasks,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
