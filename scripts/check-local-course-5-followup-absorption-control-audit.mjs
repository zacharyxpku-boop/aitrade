import fs from "node:fs";

const auditPath = "docs/LOCAL_COURSE_5_FOLLOWUP_ABSORPTION_CONTROL_AUDIT.json";
const auditMdPath = "docs/LOCAL_COURSE_5_FOLLOWUP_ABSORPTION_CONTROL_AUDIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const audit = readJson(auditPath);
if (!fs.existsSync(auditMdPath)) fail(`missing ${auditMdPath}`);

if (audit.educationOnly !== true) fail("audit must keep educationOnly:true");
if (audit.productionReady !== false) fail("audit must keep productionReady:false");
if (audit.learnerFacingRelease !== false) fail("audit must keep learnerFacingRelease:false");
if (audit.approvalStatus !== "not_approved") fail("audit must keep approvalStatus:not_approved");
if (audit.writeAllowedNow !== false) fail("audit must keep writeAllowedNow:false");
if (audit.auditStatus !== "course_5_followup_absorption_control_audit_ready_release_blocked") fail("unexpected auditStatus");
if (audit.absorptionControlStatus !== "all_followup_sources_have_visual_reviewer_cards_and_machine_drafts_not_ocr_or_human_review") {
  fail("unexpected absorptionControlStatus");
}

if (audit.followupRows !== 49) fail("expected 49 follow-up rows");
if (audit.p0SourceRows !== 28) fail("expected 28 P0 source rows");
if (audit.nonP0SourceRows !== 21) fail("expected 21 non-P0 source rows");
if (audit.cardRows !== 386) fail("expected 386 reviewer card rows");
if (audit.draftRows !== 386) fail("expected 386 machine draft rows");
if (audit.p0DraftRows !== 282) fail("expected 282 P0 draft rows");
if (audit.nonP0DraftRows !== 104) fail("expected 104 non-P0 draft rows");
if (audit.modulesWithDraftCoverage < 9) fail("module coverage unexpectedly low");
if (audit.readyReviewerNotes !== 0) fail("reviewer notes must not be fabricated");
if (audit.acceptedForModuleDistillationRows !== 0) fail("machine drafts must not be module-accepted");
if (audit.acceptedForDeletionReadinessRows !== 0) fail("machine drafts must not count for deletion readiness");
if (audit.allFollowupSourcesHaveWorkbenchCoverage !== true) fail("every follow-up source must have workbench coverage");
if (audit.allWorkbenchCardsHaveMachineDrafts !== true) fail("every card must have a machine draft");
if (Array.isArray(audit.missingCoverageIds) && audit.missingCoverageIds.length !== 0) fail("missing coverage IDs must be empty");
if (Array.isArray(audit.unexpectedCoverageIds) && audit.unexpectedCoverageIds.length !== 0) fail("unexpected coverage IDs must be empty");
if (audit.ocrEngineAvailable !== false) fail("OCR must not be claimed available");
if (audit.sourceFolderMayBeDeleted !== false) fail("source folder deletion must remain blocked");
if (audit.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("artifacts must not claim source replacement");

if (!Array.isArray(audit.moduleRows) || audit.moduleRows.length < 9) fail("moduleRows missing");
const chart = audit.moduleRows.find((row) => row.moduleId === "chart_pattern_encyclopedia");
if (!chart || chart.totalDraftRows < 250) fail("chart pattern draft coverage missing");
const reversals = audit.moduleRows.find((row) => row.moduleId === "reversals");
if (!reversals || reversals.totalDraftRows < 50) fail("reversal draft coverage missing");
const trends = audit.moduleRows.find((row) => row.moduleId === "trends_and_channels");
if (!trends || trends.totalDraftRows < 50) fail("trend/channel draft coverage missing");

const gateText = `${(audit.remainingHardGates || []).join(" ")} ${audit.completionRule || ""} ${audit.boundary || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education",
  "all 49 follow-up source rows",
  "reviewer cards",
  "machine visual semantic drafts",
  "does not mean ocr complete",
  "human-reviewed",
  "module-accepted",
  "deletion-ready",
  "public grounding",
  "originality checks",
  "delete files",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
]) {
  if (!gateText.includes(phrase)) fail(`boundary/completion missing phrase: ${phrase}`);
}

if (!Array.isArray(audit.commands) || !audit.commands.some((command) => /check:local-course-5-followup-absorption-control-audit/.test(command))) {
  fail("commands must include control audit check");
}

console.log(JSON.stringify({
  ok: true,
  auditStatus: audit.auditStatus,
  followupRows: audit.followupRows,
  cardRows: audit.cardRows,
  draftRows: audit.draftRows,
  allFollowupSourcesHaveWorkbenchCoverage: audit.allFollowupSourcesHaveWorkbenchCoverage,
  allWorkbenchCardsHaveMachineDrafts: audit.allWorkbenchCardsHaveMachineDrafts,
  readyReviewerNotes: audit.readyReviewerNotes,
  acceptedForModuleDistillationRows: audit.acceptedForModuleDistillationRows,
  acceptedForDeletionReadinessRows: audit.acceptedForDeletionReadinessRows,
  sourceFolderMayBeDeleted: audit.sourceFolderMayBeDeleted,
}, null, 2));
