import fs from "node:fs";

const fixturePath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_POSITIVE_LINT_FIXTURE.json";
const lintPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_POSITIVE_LINT_FIXTURE_LINT.json";
const validationPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_POSITIVE_LINT_FIXTURE_VALIDATION.json";
const applyPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_POSITIVE_LINT_FIXTURE_APPLY_REPORT.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const fixture = readJson(fixturePath);
const lint = readJson(lintPath);
const validation = readJson(validationPath);
const apply = readJson(applyPath);

for (const [name, artifact] of [["fixture", fixture], ["lint", lint], ["validation", validation], ["apply", apply]]) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false || artifact.approvalStatus !== "not_approved") fail(`${name} release gate drift`);
  if (artifact.fixtureOnly !== true) fail(`${name} must be fixtureOnly`);
}

if (fixture.templateStatus !== "pack_01_positive_lint_fixture") fail(`unexpected fixture status: ${fixture.templateStatus}`);
if (fixture.totalEntries !== 4 || fixture.filledEntries !== 4 || fixture.readyForValidationEntries !== 4) fail("fixture should fill all 4 entries");
if (lint.lintStatus !== "ready_for_validation" || lint.readyEntries !== 4 || lint.blockedEntries !== 0) fail("positive fixture lint should be ready");
if (lint.candidateCopyIssueEntries !== 0 || lint.riskRewriteIncompleteEntries !== 0 || lint.publicReferenceMissingEntries !== 0 || lint.originalityMissingEntries !== 0 || lint.forbiddenHitEntries !== 0) {
  fail("positive fixture lint should have no quality issues");
}
if (validation.totalEntries !== 4 || validation.readyEntries !== 4 || validation.blockedEntries !== 0 || validation.forbiddenHitEntries !== 0) {
  fail("positive fixture validation should be ready");
}
if (apply.applyMode !== "dry_run" || apply.readyToApplyEntries !== 4 || apply.blockedEntries !== 0 || apply.writtenEntries !== 0) {
  fail(`positive fixture apply drift: ${apply.applyMode}/${apply.readyToApplyEntries}/${apply.blockedEntries}/${apply.writtenEntries}`);
}
if (apply.applyStatus !== "ready_entries_not_written") fail(`unexpected applyStatus: ${apply.applyStatus}`);

const boundaryText = `${fixture.boundary || ""} ${apply.boundary || ""}`.toLowerCase();
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
  if (!boundaryText.includes(phrase)) fail(`positive fixture boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  fixtureOnly: true,
  lintReadyEntries: lint.readyEntries,
  validationReadyEntries: validation.readyEntries,
  applyReadyToApplyEntries: apply.readyToApplyEntries,
  applyWrittenEntries: apply.writtenEntries,
}, null, 2));
