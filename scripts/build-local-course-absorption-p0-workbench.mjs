import fs from "node:fs";

const queuePath = "docs/LOCAL_COURSE_ABSORPTION_OPERATOR_QUEUE.json";
const outputJsonPath = "docs/LOCAL_COURSE_ABSORPTION_P0_WORKBENCH.json";
const outputMdPath = "docs/LOCAL_COURSE_ABSORPTION_P0_WORKBENCH.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function previewUrl(previewPath = "") {
  return previewPath ? `/${previewPath.replace(/\\/g, "/")}` : "";
}

const queue = readJson(queuePath);
if (queue.educationOnly !== true) fail("queue must keep educationOnly:true");
if (queue.productionReady !== false) fail("queue must keep productionReady:false");
if (queue.learnerFacingRelease !== false) fail("queue must keep learnerFacingRelease:false");
if (queue.approvalStatus !== "not_approved") fail("queue must remain not_approved");

const p0Tasks = (queue.queueItems || []).filter((item) => item.priority === "P0");
const workbenchTasks = p0Tasks.map((task) => {
  const manual = task.category === "manual_transcription";
  return {
    id: task.id,
    category: task.category,
    priority: task.priority,
    status: task.status,
    title: task.title,
    documentId: task.documentId,
    sourceId: task.sourceId,
    sourceRelativePath: task.sourceRelativePath,
    sourceModule: task.sourceModule,
    pageNumber: task.pageNumber,
    previewPath: task.previewPath,
    previewUrl: previewUrl(task.previewPath),
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    workbenchMode: manual ? "manual_visual_transcription" : "source_replacement_intake",
    fieldSchema: manual
      ? [
          { id: "humanTranscription", label: "Human transcription", required: true, value: "" },
          { id: "humanSummary", label: "Education-only summary", required: true, value: "" },
          { id: "uncertainWords", label: "Uncertain words / unclear regions", required: false, value: [] },
          { id: "visualTextCaptured", label: "Visible text captured", required: true, value: "not_started" },
          { id: "chartLabelsCaptured", label: "Chart labels captured", required: true, value: "not_started" },
          { id: "noTradingAdviceAdded", label: "No trading advice added", required: true, value: "not_started" },
        ]
      : [
          { id: "replacementSourcePath", label: "Replacement source path", required: true, value: "" },
          { id: "replacementNote", label: "Replacement / re-export note", required: true, value: "" },
          { id: "rerunEvidence", label: "Rerun evidence", required: true, value: "" },
          { id: "sourceIdentityConfirmed", label: "Same source identity confirmed", required: true, value: "not_started" },
          { id: "readablePreviewGenerated", label: "Readable preview generated", required: true, value: "not_started" },
        ],
    acceptanceCriteria: task.acceptanceCriteria,
    nextCommandHints: task.nextCommandHints,
    nextGate: task.nextGate,
  };
});

const workbench = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  workbenchStatus: "p0_execution_ready",
  sourceQueue: queuePath,
  totalP0Tasks: workbenchTasks.length,
  manualTranscriptionTasks: workbenchTasks.filter((task) => task.category === "manual_transcription").length,
  sourceReplacementTasks: workbenchTasks.filter((task) => task.category === "source_replacement").length,
  completedTasks: 0,
  openTasks: workbenchTasks.length,
  workbenchTasks,
  completionRule: "P0 workbench is complete only when all human transcription fields or source replacement fields are filled by a reviewer, rerun evidence is attached, transcript/source quality gates pass, and learner-facing release remains blocked until separate approval.",
  boundary: "P0 absorption workbench prepares human execution fields for low-extraction local course blockers. It does not perform OCR, infer missing content, copy private course wording, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(workbench, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Absorption P0 Workbench",
  "",
  "Execution workbench for P0 absorption blockers.",
  "",
  `- Workbench status: ${workbench.workbenchStatus}`,
  `- Total P0 tasks: ${workbench.totalP0Tasks}`,
  `- Manual transcription tasks: ${workbench.manualTranscriptionTasks}`,
  `- Source replacement tasks: ${workbench.sourceReplacementTasks}`,
  `- Completed tasks: ${workbench.completedTasks}`,
  `- Open tasks: ${workbench.openTasks}`,
  "",
  "## Tasks",
  "",
  "| Task | Category | Source | Page | Mode | Next gate |",
  "| --- | --- | --- | ---: | --- | --- |",
  ...workbenchTasks.map((task) => `| ${task.id} | ${task.category} | ${task.sourceRelativePath} | ${task.pageNumber || ""} | ${task.workbenchMode} | ${task.nextGate} |`),
  "",
  "## Completion Rule",
  "",
  workbench.completionRule,
  "",
  "## Boundary",
  "",
  workbench.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: workbench.educationOnly,
  productionReady: workbench.productionReady,
  learnerFacingRelease: workbench.learnerFacingRelease,
  approvalStatus: workbench.approvalStatus,
  workbenchStatus: workbench.workbenchStatus,
  totalP0Tasks: workbench.totalP0Tasks,
  manualTranscriptionTasks: workbench.manualTranscriptionTasks,
  sourceReplacementTasks: workbench.sourceReplacementTasks,
  completedTasks: workbench.completedTasks,
  openTasks: workbench.openTasks,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
