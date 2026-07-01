import fs from "node:fs";

const workPacksPath = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json";
const deletionPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";
const p0WorkbenchPath = "docs/LOCAL_COURSE_5_P0_VISUAL_REVIEWER_WORKBENCH.json";
const p0DraftsPath = "docs/LOCAL_COURSE_5_P0_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";
const nonP0WorkbenchPath = "docs/LOCAL_COURSE_5_NON_P0_VISUAL_REVIEWER_WORKBENCH.json";
const nonP0DraftsPath = "docs/LOCAL_COURSE_5_NON_P0_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";
const outputJsonPath = "docs/LOCAL_COURSE_5_FOLLOWUP_ABSORPTION_CONTROL_AUDIT.json";
const outputMdPath = "docs/LOCAL_COURSE_5_FOLLOWUP_ABSORPTION_CONTROL_AUDIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function requireLocked(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if ("writeAllowedNow" in artifact && artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

const workPacks = readJson(workPacksPath);
const deletion = readJson(deletionPath);
const p0Workbench = readJson(p0WorkbenchPath);
const p0Drafts = readJson(p0DraftsPath);
const nonP0Workbench = readJson(nonP0WorkbenchPath);
const nonP0Drafts = readJson(nonP0DraftsPath);

for (const [name, artifact] of [
  ["workPacks", workPacks],
  ["deletion", deletion],
  ["p0Workbench", p0Workbench],
  ["p0Drafts", p0Drafts],
  ["nonP0Workbench", nonP0Workbench],
  ["nonP0Drafts", nonP0Drafts],
]) {
  requireLocked(name, artifact);
}

if (workPacks.followupRows !== 49) fail("Course 5 follow-up count drift");
if (deletion.sourceFolderMayBeDeleted !== false) fail("Course 5 source folder must remain non-deletable");
if (p0Workbench.p0SourceRows + nonP0Workbench.nonP0SourceRows !== workPacks.followupRows) {
  fail("P0 and non-P0 source rows do not cover every follow-up row");
}
if (p0Workbench.p0SampleCards !== p0Drafts.p0DraftRows) fail("P0 card/draft count mismatch");
if (nonP0Workbench.nonP0SampleCards !== nonP0Drafts.nonP0DraftRows) fail("non-P0 card/draft count mismatch");

const followupIds = new Set(workPacks.workItems.map((item) => item.recordId));
const coveredIds = new Set([
  ...p0Workbench.sourceRows.map((row) => row.recordId),
  ...nonP0Workbench.sourceRows.map((row) => row.recordId),
]);
const missingCoverageIds = [...followupIds].filter((id) => !coveredIds.has(id));
const unexpectedCoverageIds = [...coveredIds].filter((id) => !followupIds.has(id));

const cardCount = p0Workbench.p0SampleCards + nonP0Workbench.nonP0SampleCards;
const draftCount = p0Drafts.p0DraftRows + nonP0Drafts.nonP0DraftRows;
const readyReviewerNotes = p0Workbench.readyReviewerNotes + nonP0Workbench.readyReviewerNotes + p0Drafts.readyReviewerNotes + nonP0Drafts.readyReviewerNotes;
const acceptedForModuleDistillationRows = p0Drafts.acceptedForModuleDistillationRows + nonP0Drafts.acceptedForModuleDistillationRows;
const acceptedForDeletionReadinessRows = p0Drafts.acceptedForDeletionReadinessRows + nonP0Drafts.acceptedForDeletionReadinessRows;

const moduleCoverage = new Map();
for (const row of [...p0Drafts.moduleRows, ...nonP0Drafts.moduleRows]) {
  const current = moduleCoverage.get(row.moduleId) || {
    moduleId: row.moduleId,
    moduleLabel: row.moduleLabel,
    p0DraftRows: 0,
    nonP0DraftRows: 0,
  };
  current.p0DraftRows += row.p0DraftRows || 0;
  current.nonP0DraftRows += row.nonP0DraftRows || 0;
  moduleCoverage.set(row.moduleId, current);
}
const moduleRows = [...moduleCoverage.values()].map((row) => ({
  ...row,
  totalDraftRows: row.p0DraftRows + row.nonP0DraftRows,
  reviewerNextGate: "validate_machine_drafts_with_ocr_or_human_notes_then_distill_or_archive",
}));

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  sourceWorkPacks: workPacksPath,
  sourceDeletionReadiness: deletionPath,
  sourceP0Workbench: p0WorkbenchPath,
  sourceP0Drafts: p0DraftsPath,
  sourceNonP0Workbench: nonP0WorkbenchPath,
  sourceNonP0Drafts: nonP0DraftsPath,
  auditStatus: "course_5_followup_absorption_control_audit_ready_release_blocked",
  absorptionControlStatus: "all_followup_sources_have_visual_reviewer_cards_and_machine_drafts_not_ocr_or_human_review",
  followupRows: workPacks.followupRows,
  p0SourceRows: p0Workbench.p0SourceRows,
  nonP0SourceRows: nonP0Workbench.nonP0SourceRows,
  cardRows: cardCount,
  draftRows: draftCount,
  p0DraftRows: p0Drafts.p0DraftRows,
  nonP0DraftRows: nonP0Drafts.nonP0DraftRows,
  modulesWithDraftCoverage: moduleRows.length,
  readyReviewerNotes,
  acceptedForModuleDistillationRows,
  acceptedForDeletionReadinessRows,
  missingCoverageIds,
  unexpectedCoverageIds,
  allFollowupSourcesHaveWorkbenchCoverage: missingCoverageIds.length === 0 && unexpectedCoverageIds.length === 0,
  allWorkbenchCardsHaveMachineDrafts: cardCount === draftCount,
  ocrEngineAvailable: workPacks.ocrEngineAvailable,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  remainingHardGates: [
    "OCR or human visual notes must validate visible text, labels, and chart semantics.",
    "Reviewer notes must decide module distillation versus archive-only status for each blocker source.",
    "Public grounding and originality checks must be completed before learner-facing course use.",
    "Deletion readiness remains false until blocker rows are resolved or explicitly accepted as future-loss limitations.",
  ],
  moduleRows,
  commands: [
    "npm.cmd run build:local-course-5-followup-absorption-control-audit",
    "npm.cmd run check:local-course-5-followup-absorption-control-audit",
    "npm.cmd run verify",
  ],
  completionRule: "Course 5 follow-up absorption control is operational when all 49 follow-up source rows have reviewer cards and matching machine visual semantic drafts with locked release/delete status. This still does not mean OCR complete, human-reviewed, module-accepted, learner-facing, or deletion-ready.",
  boundary: "Course 5 follow-up absorption control audit is private reviewer-facing education operations material. It summarizes coverage of OCR/visual-review blockers and keeps deletion blocked while reviewer notes, OCR, public grounding, originality checks, and explicit approval remain incomplete. It does not read or transcribe source text, fill reviewer conclusions, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Course 5 Follow-up Absorption Control Audit",
  "",
  `- Audit status: ${artifact.auditStatus}`,
  `- Absorption control status: ${artifact.absorptionControlStatus}`,
  `- Follow-up rows: ${artifact.followupRows}`,
  `- P0 source rows: ${artifact.p0SourceRows}`,
  `- Non-P0 source rows: ${artifact.nonP0SourceRows}`,
  `- Reviewer card rows: ${artifact.cardRows}`,
  `- Machine draft rows: ${artifact.draftRows}`,
  `- Modules with draft coverage: ${artifact.modulesWithDraftCoverage}`,
  `- Ready reviewer notes: ${artifact.readyReviewerNotes}`,
  `- Accepted for module distillation: ${artifact.acceptedForModuleDistillationRows}`,
  `- Accepted for deletion readiness: ${artifact.acceptedForDeletionReadinessRows}`,
  `- Source folder may be deleted: ${artifact.sourceFolderMayBeDeleted}`,
  "",
  "## Module Coverage",
  "",
  "| Module | P0 drafts | Non-P0 drafts | Total drafts | Next gate |",
  "| --- | ---: | ---: | ---: | --- |",
  ...moduleRows.map((row) => `| ${row.moduleId} | ${row.p0DraftRows} | ${row.nonP0DraftRows} | ${row.totalDraftRows} | ${row.reviewerNextGate} |`),
  "",
  "## Remaining Hard Gates",
  "",
  ...artifact.remainingHardGates.map((gate) => `- ${gate}`),
  "",
  "## Boundary",
  "",
  artifact.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  auditStatus: artifact.auditStatus,
  followupRows: artifact.followupRows,
  cardRows: artifact.cardRows,
  draftRows: artifact.draftRows,
  allFollowupSourcesHaveWorkbenchCoverage: artifact.allFollowupSourcesHaveWorkbenchCoverage,
  allWorkbenchCardsHaveMachineDrafts: artifact.allWorkbenchCardsHaveMachineDrafts,
  readyReviewerNotes: artifact.readyReviewerNotes,
  acceptedForModuleDistillationRows: artifact.acceptedForModuleDistillationRows,
  acceptedForDeletionReadinessRows: artifact.acceptedForDeletionReadinessRows,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
