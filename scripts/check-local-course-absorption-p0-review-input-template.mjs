import fs from "node:fs";

const templatePath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_INPUT_TEMPLATE.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const template = readJson(templatePath);
const entries = template.inputEntries || [];

if (template.educationOnly !== true) fail("input template must keep educationOnly:true");
if (template.productionReady !== false) fail("input template must keep productionReady:false");
if (template.learnerFacingRelease !== false) fail("input template must keep learnerFacingRelease:false");
if (template.approvalStatus !== "not_approved") fail("input template must remain not_approved");
if (template.templateStatus !== "blank_reviewer_input_template") fail(`unexpected templateStatus: ${template.templateStatus}`);
if (template.totalEntries !== 22 || entries.length !== 22) fail(`expected 22 entries, got ${template.totalEntries}/${entries.length}`);
if (template.manualTranscriptionEntries !== 19) fail(`expected 19 manual entries, got ${template.manualTranscriptionEntries}`);
if (template.sourceReplacementEntries !== 3) fail(`expected 3 replacement entries, got ${template.sourceReplacementEntries}`);
if (template.filledEntries !== 0 || template.readyForValidationEntries !== 0) fail("blank template must not mark filled entries");

for (const entry of entries) {
  if (entry.educationOnly !== true || entry.productionReady !== false) fail(`${entry.id} boundary drift`);
  if (entry.learnerFacingRelease !== false || entry.approvalStatus !== "not_approved") fail(`${entry.id} release gate drift`);
  if (entry.inputStatus !== "template_blank") fail(`${entry.id} must start template_blank`);
  if (entry.reviewerName !== "" || entry.reviewedAt !== "") fail(`${entry.id} reviewer fields must start blank`);
  if (!entry.previewUrl?.startsWith("/docs/local-course-low-extraction-previews/")) fail(`${entry.id} previewUrl missing`);
  if (!Array.isArray(entry.acceptanceCriteria) || entry.acceptanceCriteria.length < 4) fail(`${entry.id} missing acceptance criteria`);
}

for (const entry of entries.filter((item) => item.category === "manual_transcription")) {
  if (!entry.manualInput || entry.replacementInput !== null) fail(`${entry.id} manual/replacement input shape drift`);
  if (entry.manualInput.humanTranscription !== "" || entry.manualInput.humanSummary !== "") fail(`${entry.id} manual text fields must start blank`);
  if (!Array.isArray(entry.manualInput.uncertainWords) || entry.manualInput.uncertainWords.length !== 0) fail(`${entry.id} uncertainWords must start empty`);
  if (!Object.values(entry.manualInput.checklist || {}).every((value) => value === "not_started")) fail(`${entry.id} checklist must start not_started`);
}

for (const entry of entries.filter((item) => item.category === "source_replacement")) {
  if (!entry.replacementInput || entry.manualInput !== null) fail(`${entry.id} manual/replacement input shape drift`);
  if (entry.replacementInput.replacementSourcePath !== "" || entry.replacementInput.replacementNote !== "" || entry.replacementInput.rerunEvidence !== "") {
    fail(`${entry.id} replacement fields must start blank`);
  }
  if (!Object.values(entry.replacementInput.checklist || {}).every((value) => value === "not_started")) fail(`${entry.id} replacement checklist must start not_started`);
}

const boundaryText = `${template.boundary || ""} ${(template.usage || []).join(" ")}`.toLowerCase();
for (const phrase of [
  "does not perform ocr",
  "infer missing content",
  "approve learner-facing release",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`template boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: template.educationOnly,
  productionReady: template.productionReady,
  learnerFacingRelease: template.learnerFacingRelease,
  approvalStatus: template.approvalStatus,
  templateStatus: template.templateStatus,
  totalEntries: template.totalEntries,
  manualTranscriptionEntries: template.manualTranscriptionEntries,
  sourceReplacementEntries: template.sourceReplacementEntries,
  filledEntries: template.filledEntries,
  readyForValidationEntries: template.readyForValidationEntries,
}, null, 2));
