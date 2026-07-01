import fs from "node:fs";

const samplePath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_DRY_RUN_SAMPLE.json";
const validationPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_DRY_RUN_SAMPLE_VALIDATION.json";
const applyPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_DRY_RUN_SAMPLE_APPLY_REPORT.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const sample = readJson(samplePath);
const validation = readJson(validationPath);
const apply = readJson(applyPath);
const entries = sample.inputEntries || [];
const targetIds = new Set(sample.dryRunTargetTaskIds || []);

for (const [name, artifact] of [["sample", sample], ["validation", validation], ["apply", apply]]) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false || artifact.approvalStatus !== "not_approved") {
    fail(`${name} release gate drift`);
  }
  if (artifact.fixtureOnly !== true) fail(`${name} must be fixtureOnly`);
}

if (sample.templateStatus !== "candidate_review_dry_run_fixture") fail(`unexpected sample status: ${sample.templateStatus}`);
if (sample.totalEntries !== 22 || entries.length !== 22) fail(`expected 22 sample entries, got ${sample.totalEntries}/${entries.length}`);
if (sample.filledEntries !== 2 || sample.readyForValidationEntries !== 2 || targetIds.size !== 2) fail("sample must fill exactly two entries");

for (const entry of entries) {
  if (targetIds.has(entry.taskId)) {
    if (entry.inputStatus !== "candidate_review_fixture_ready") fail(`${entry.id} should be candidate-review ready`);
    if (!entry.dryRunCandidateAssist?.candidateId) fail(`${entry.id} missing candidate assist link`);
    if (!entry.dryRunCandidateAssist?.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/")) {
      fail(`${entry.id} high-res assist URL drift`);
    }
    if (!/Fixture-only/i.test(entry.manualInput?.humanTranscription || "")) fail(`${entry.id} must explicitly say fixture-only`);
    if (!/not a human transcription/i.test(entry.dryRunCandidateAssist?.fixtureOnlyReason || "")) fail(`${entry.id} must reject human transcription claim`);
    if (!Object.values(entry.manualInput?.checklist || {}).every((value) => value === "done")) fail(`${entry.id} checklist must be done`);
  } else {
    if (entry.inputStatus !== "template_blank") fail(`${entry.id} should remain template_blank`);
    if (entry.category === "manual_transcription" && (entry.manualInput?.humanTranscription !== "" || entry.manualInput?.humanSummary !== "")) {
      fail(`${entry.id} manual fields should remain blank`);
    }
    if (entry.category === "source_replacement" && (entry.replacementInput?.replacementSourcePath !== "" || entry.replacementInput?.replacementNote !== "")) {
      fail(`${entry.id} replacement fields should remain blank`);
    }
  }
}

if (validation.totalEntries !== 22 || validation.readyEntries !== 2 || validation.blockedEntries !== 20 || validation.forbiddenHitEntries !== 0) {
  fail(`validation drift: ${validation.readyEntries}/${validation.blockedEntries}/${validation.forbiddenHitEntries}`);
}
if (apply.applyMode !== "dry_run" || apply.readyToApplyEntries !== 2 || apply.blockedEntries !== 20 || apply.writtenEntries !== 0) {
  fail(`apply drift: ${apply.applyMode}/${apply.readyToApplyEntries}/${apply.blockedEntries}/${apply.writtenEntries}`);
}
if (apply.applyStatus !== "ready_entries_not_written") fail(`unexpected apply status: ${apply.applyStatus}`);

const boundaryText = `${sample.boundary || ""} ${apply.boundary || ""}`.toLowerCase();
for (const phrase of [
  "fixture",
  "not a human transcription",
  "must not be written",
  "does not approve learner-facing release",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`dry-run boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  fixtureOnly: true,
  totalEntries: sample.totalEntries,
  validationReadyEntries: validation.readyEntries,
  validationBlockedEntries: validation.blockedEntries,
  applyReadyToApplyEntries: apply.readyToApplyEntries,
  applyWrittenEntries: apply.writtenEntries,
}, null, 2));
