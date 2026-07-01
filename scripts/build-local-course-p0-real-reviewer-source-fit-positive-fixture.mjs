import fs from "node:fs";

const draftInputPath = "docs/reviewer-inputs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_REAL_INPUT_DRAFT.json";
const guidePath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_INPUT_GUIDE.json";
const fixturePath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_POSITIVE_FIXTURE.json";
const validationJsonPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_POSITIVE_FIXTURE_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_POSITIVE_FIXTURE_VALIDATION.md";
const fixtureMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_POSITIVE_FIXTURE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(artifact, label) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

function setPath(obj, path, value) {
  const parts = path.split(".");
  let target = obj;
  for (const part of parts.slice(0, -1)) {
    if (!target[part] || typeof target[part] !== "object") target[part] = {};
    target = target[part];
  }
  target[parts.at(-1)] = value;
}

const draft = readJson(draftInputPath);
const guide = readJson(guidePath);
assertBoundary(draft, "draft input");
assertBoundary(guide, "source-fit guide");

const guideByEntryId = new Map((guide.guideRows || []).map((row) => [row.inputEntryId, row]));
const inputEntries = (draft.inputEntries || []).map((entry, index) => {
  const guideRow = guideByEntryId.get(entry.id);
  if (!guideRow) fail(`missing guide row for ${entry.id}`);
  const refId = guideRow.suggestedRefIds?.[0] || "fixture_public_ref";
  const decision = guideRow.requiredReviewerDecisionValues?.[0] || "confirm_public_refs_support_neutral_vocabulary_only";
  const note = [
    `decision:${decision}`,
    `source ids:${refId}`,
    "source role: public refs support neutral vocabulary, taxonomy, attribution-aware context, and source-boundary review only.",
    "claim boundary: these refs do not prove a setup, signal, future outcome, strategy edge, or real-money action.",
    "originality/no copy: fixture note uses original wording and does not copy private course wording or public-source passages.",
    "release boundary: this is fixture-only validation control, not learner-facing approval, not write authorization.",
  ].join(" ");
  const copy = JSON.parse(JSON.stringify(entry));
  copy.reviewerName = "Fixture Source-Fit Reviewer";
  copy.reviewedAt = "2026-06-22T00:00:00.000Z";
  copy.fixtureOnlyReason = "Positive control for source-fit validator. Not real human review and cannot authorize writes.";
  setPath(copy, guideRow.sourceFitFieldPath, note);
  setPath(copy, guideRow.publicReferenceNotesFieldPath, note);
  copy.sourceFitFixture = {
    fixtureOnly: true,
    guideRowId: guideRow.id,
    suggestedRefId: refId,
    allowedDecisionValue: decision,
    rowNumber: index + 1,
  };
  return copy;
});

const fixture = {
  ...draft,
  generatedAt: new Date().toISOString(),
  fixtureOnly: true,
  fixtureStatus: "p0_real_reviewer_source_fit_positive_fixture_ready",
  fixtureMode: "positive_control_for_source_fit_validator_only",
  sourceDraftInput: draftInputPath,
  sourceGuide: guidePath,
  validationJsonPath,
  validationMdPath,
  totalEntries: inputEntries.length,
  filledSourceFitEntries: inputEntries.length,
  realHumanInputEntries: 0,
  generatedDecisions: 0,
  learnerCitationApprovedRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  inputEntries,
  completionRule: "This positive fixture proves the source-fit validator can pass safe boundary-shaped notes. It is fixture-only, does not create real reviewer judgment, does not approve learner-facing citations, and does not authorize overlay writes.",
  boundary: "P0 source-fit positive fixture is reviewer-facing education-only test material. It validates the machine gate shape only; it is not real human input, not learner-facing approval, not a stock recommendation, not a live signal, not a return promise, not a broker workflow, not automation, and not real-money guidance.",
};

fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
fs.writeFileSync(fixtureMdPath, [
  "# Local Course P0 Real Reviewer Source-Fit Positive Fixture",
  "",
  `- Status: ${fixture.fixtureStatus}`,
  `- Fixture only: ${fixture.fixtureOnly}`,
  `- Entries: ${fixture.totalEntries}`,
  `- Filled source-fit entries: ${fixture.filledSourceFitEntries}`,
  `- Real human input entries: ${fixture.realHumanInputEntries}`,
  `- Write allowed now: ${fixture.writeAllowedNow}`,
  "",
  "## Boundary",
  "",
  fixture.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: fixture.educationOnly,
  productionReady: fixture.productionReady,
  learnerFacingRelease: fixture.learnerFacingRelease,
  approvalStatus: fixture.approvalStatus,
  fixtureOnly: fixture.fixtureOnly,
  fixtureStatus: fixture.fixtureStatus,
  totalEntries: fixture.totalEntries,
  filledSourceFitEntries: fixture.filledSourceFitEntries,
  realHumanInputEntries: fixture.realHumanInputEntries,
  writeAllowedNow: fixture.writeAllowedNow,
  fixturePath,
  fixtureMdPath,
  validationJsonPath,
  validationMdPath,
}, null, 2));
