import fs from "node:fs";

const fixturePath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_POSITIVE_CONTROL_INPUT.json";
const validationPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_POSITIVE_CONTROL_VALIDATION.json";
const applyPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_POSITIVE_CONTROL_APPLY_REPORT.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const fixture = readJson(fixturePath);
const validation = readJson(validationPath);
const apply = readJson(applyPath);
const entries = fixture.inputEntries || [];

if (fixture.educationOnly !== true || validation.educationOnly !== true || apply.educationOnly !== true) fail("positive control must keep educationOnly:true");
if (fixture.productionReady !== false || validation.productionReady !== false || apply.productionReady !== false) fail("positive control must keep productionReady:false");
if (fixture.learnerFacingRelease !== false || validation.learnerFacingRelease !== false || apply.learnerFacingRelease !== false) fail("positive control must keep learnerFacingRelease:false");
if (fixture.approvalStatus !== "not_approved" || validation.approvalStatus !== "not_approved" || apply.approvalStatus !== "not_approved") fail("positive control must remain not_approved");
if (fixture.fixtureOnly !== true || validation.fixtureOnly !== true || apply.fixtureOnly !== true) fail("positive control must be fixtureOnly");
if (fixture.templateStatus !== "positive_control_fixture") fail(`unexpected fixture status: ${fixture.templateStatus}`);
if (fixture.totalEntries !== 22 || entries.length !== 22) fail(`expected 22 fixture entries, got ${fixture.totalEntries}/${entries.length}`);
if (fixture.filledEntries !== 1 || fixture.readyForValidationEntries !== 1) fail("positive control must fill exactly one entry");

const first = entries[0];
if (first.inputStatus !== "positive_control_fixture_ready") fail("first fixture entry must be ready");
if (!first.manualInput?.humanTranscription || !first.manualInput?.humanSummary) fail("first fixture entry missing text fields");
if (!Object.values(first.manualInput?.checklist || {}).every((value) => value === "done")) fail("first fixture checklist must be done");
for (const entry of entries.slice(1)) {
  if (entry.inputStatus !== "template_blank") fail(`${entry.id} should remain template_blank`);
  if (entry.category === "manual_transcription" && (entry.manualInput?.humanTranscription !== "" || entry.manualInput?.humanSummary !== "")) fail(`${entry.id} manual fields should remain blank`);
  if (entry.category === "source_replacement" && (entry.replacementInput?.replacementSourcePath !== "" || entry.replacementInput?.replacementNote !== "")) fail(`${entry.id} replacement fields should remain blank`);
}

if (validation.totalEntries !== 22 || validation.readyEntries !== 1 || validation.blockedEntries !== 21 || validation.forbiddenHitEntries !== 0) {
  fail(`positive validation drift: ${validation.readyEntries}/${validation.blockedEntries}/${validation.forbiddenHitEntries}`);
}
if (apply.applyMode !== "dry_run" || apply.readyToApplyEntries !== 1 || apply.blockedEntries !== 21 || apply.writtenEntries !== 0) {
  fail(`positive apply drift: ${apply.applyMode}/${apply.readyToApplyEntries}/${apply.blockedEntries}/${apply.writtenEntries}`);
}
if (apply.applyStatus !== "ready_entries_not_written") fail(`unexpected positive apply status: ${apply.applyStatus}`);

const boundaryText = `${fixture.boundary || ""} ${apply.boundary || ""}`.toLowerCase();
for (const phrase of [
  "fixture",
  "not a transcription",
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
  if (!boundaryText.includes(phrase)) fail(`positive-control boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  fixtureOnly: true,
  totalEntries: fixture.totalEntries,
  validationReadyEntries: validation.readyEntries,
  validationBlockedEntries: validation.blockedEntries,
  applyReadyToApplyEntries: apply.readyToApplyEntries,
  applyWrittenEntries: apply.writtenEntries,
}, null, 2));
