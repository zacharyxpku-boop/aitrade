import fs from "node:fs";

const templatePath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_INPUT_COPY_TEMPLATE.json";
const validationPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_INPUT_COPY_VALIDATION.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const template = readJson(templatePath);
const validation = readJson(validationPath);
const entries = template.inputEntries || [];
const normalizePath = (value) => String(value || "").replace(/\\/g, "/");

if (template.educationOnly !== true || validation.educationOnly !== true) fail("input copy must keep educationOnly:true");
if (template.productionReady !== false || validation.productionReady !== false) fail("input copy must keep productionReady:false");
if (template.learnerFacingRelease !== false || validation.learnerFacingRelease !== false) fail("input copy must keep learnerFacingRelease:false");
if (template.approvalStatus !== "not_approved" || validation.approvalStatus !== "not_approved") fail("input copy must remain not_approved");
if (template.fixtureOnly !== false) fail("input copy template must not be fixtureOnly");
if (template.templateStatus !== "pack_01_input_copy_blank") fail(`unexpected templateStatus: ${template.templateStatus}`);
if (template.packId !== "local_course_p0_human_fill_pack_01") fail(`unexpected packId: ${template.packId}`);
if (template.totalEntries !== 4 || entries.length !== 4) fail(`expected 4 entries, got ${template.totalEntries}/${entries.length}`);
if (template.manualTranscriptionEntries !== 4 || template.sourceReplacementEntries !== 0) fail("pack 01 copy must be manual-only");
if (template.filledEntries !== 0 || template.readyForValidationEntries !== 0) fail("blank input copy must not be filled or ready");
if (!Array.isArray(template.targetTaskIds) || template.targetTaskIds.length !== 4) fail("targetTaskIds must include 4 tasks");
if (!Array.isArray(template.targetDocumentIds) || !template.targetDocumentIds.includes("corpus_1580")) fail("targetDocumentIds must include corpus_1580");
for (const expected of [1, 2, 3, 4]) {
  if (!template.targetPageNumbers?.includes(expected)) fail(`missing page ${expected}`);
}

for (const entry of entries) {
  if (entry.category !== "manual_transcription") fail(`${entry.id} must be manual transcription`);
  if (entry.documentId !== "corpus_1580") fail(`${entry.id} document drift`);
  if (entry.inputStatus !== "human_fill_copy_blank") fail(`${entry.id} must remain blank`);
  if (entry.reviewerName !== "" || entry.reviewedAt !== "") fail(`${entry.id} reviewer fields must be blank`);
  if (!entry.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/")) fail(`${entry.id} high-res URL drift`);
  if (!entry.candidateId) fail(`${entry.id} missing candidate id`);
  if (entry.manualInput?.humanTranscription !== "" || entry.manualInput?.humanSummary !== "") fail(`${entry.id} manual text fields must be blank`);
  if (entry.manualInput?.publicReferenceNotes !== "" || entry.manualInput?.originalityNotes !== "" || entry.manualInput?.riskRewriteNotes !== "") {
    fail(`${entry.id} review note fields must be blank`);
  }
  if (!Array.isArray(entry.packQualityRequirements?.riskTermFlags) || entry.packQualityRequirements.riskTermFlags.length < 4) {
    fail(`${entry.id} risk flags too thin`);
  }
  if (!Array.isArray(entry.packQualityRequirements?.riskRewriteChecklist) ||
      entry.packQualityRequirements.riskRewriteChecklist.length !== entry.packQualityRequirements.riskTermFlags.length) {
    fail(`${entry.id} risk rewrite checklist must cover every risk flag`);
  }
  if (!Array.isArray(entry.packQualityRequirements?.qualityLintRules) ||
      !entry.packQualityRequirements.qualityLintRules.some((rule) => /not copied from the machine candidate/i.test(rule))) {
    fail(`${entry.id} must include anti-copy lint rule`);
  }
  if (!/Do not copy machine candidate text/i.test(entry.packQualityRequirements?.warning || "")) {
    fail(`${entry.id} must include candidate-copy warning`);
  }
  if (!Array.isArray(entry.acceptanceCriteria) || entry.acceptanceCriteria.length < 5) fail(`${entry.id} acceptance criteria too thin`);
  if (entry.nextGate !== "validate_pack_01_input_then_apply_dry_run_only") fail(`${entry.id} next gate drift`);
}

if (normalizePath(validation.inputPath) !== normalizePath(templatePath)) fail(`validation should point to ${templatePath}`);
if (validation.totalEntries !== 4 || validation.readyEntries !== 0 || validation.blockedEntries !== 4 || validation.forbiddenHitEntries !== 0) {
  fail(`validation drift: ${validation.readyEntries}/${validation.blockedEntries}/${validation.forbiddenHitEntries}`);
}
if (!Array.isArray(validation.validationRows) || validation.validationRows.length !== 4) fail("validation rows must include 4 entries");
for (const row of validation.validationRows) {
  if (row.validationStatus !== "blocked_missing_reviewer_input") fail(`${row.id} should be blocked`);
  for (const field of ["reviewerName", "reviewedAt", "humanTranscription", "humanSummary", "manualChecklist"]) {
    if (!row.missingFields.includes(field)) fail(`${row.id} missing expected field ${field}`);
  }
}

const boundaryText = `${template.boundary || ""} ${template.completionRule || ""} ${validation.boundary || ""}`.toLowerCase();
for (const phrase of [
  "blank reviewer input material",
  "does not perform ocr",
  "fill reviewer fields",
  "approve learner-facing release",
  "copy private course wording",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`input copy boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: template.educationOnly,
  productionReady: template.productionReady,
  learnerFacingRelease: template.learnerFacingRelease,
  approvalStatus: template.approvalStatus,
  templateStatus: template.templateStatus,
  totalEntries: template.totalEntries,
  validationReadyEntries: validation.readyEntries,
  validationBlockedEntries: validation.blockedEntries,
  forbiddenHitEntries: validation.forbiddenHitEntries,
}, null, 2));
