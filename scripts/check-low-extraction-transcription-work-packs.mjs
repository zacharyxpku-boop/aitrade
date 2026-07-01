import fs from "node:fs";

const manualPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_MANUAL_TRANSCRIPTION_PACK.json";
const replacementPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_SOURCE_REPLACEMENT_PACK.json";
const blankPreviewByteThreshold = 5000;

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const manualPack = readJson(manualPath);
const replacementPack = readJson(replacementPath);
const manualCards = manualPack.transcriptionCards || [];
const replacementCards = replacementPack.replacementCards || [];

for (const [label, pack] of [["manual pack", manualPack], ["source replacement pack", replacementPack]]) {
  if (pack.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (pack.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (pack.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (pack.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
  if (pack.acceptedTranscriptPages !== 0) fail(`${label} must not auto-accept transcripts`);
  if (!/does not/i.test(pack.boundary || "")) fail(`${label} boundary must state what it does not do`);
}

if (manualPack.packStatus !== "manual_transcription_ready") fail(`unexpected manual packStatus: ${manualPack.packStatus}`);
if (manualPack.manualTranscriptionPages !== 19 || manualCards.length !== 19) {
  fail(`expected 19 manual transcription cards, got ${manualPack.manualTranscriptionPages}/${manualCards.length}`);
}
if (manualPack.manualTranscriptionDocuments !== 2 || (manualPack.documentRows || []).length !== 2) {
  fail(`expected 2 manual transcription documents, got ${manualPack.manualTranscriptionDocuments}`);
}

for (const card of manualCards) {
  if (card.educationOnly !== true || card.productionReady !== false) fail(`${card.id} boundary drift`);
  if (card.learnerFacingRelease !== false || card.approvalStatus !== "not_approved") fail(`${card.id} release gate drift`);
  if (card.intakeStatus !== "manual_transcription_candidate") fail(`${card.id} intakeStatus drift`);
  if (!card.previewPath || !fs.existsSync(card.previewPath)) fail(`${card.id} preview missing`);
  if ((card.previewBytes || 0) <= blankPreviewByteThreshold) fail(`${card.id} blank preview leaked into manual pack`);
  if (card.humanTranscription !== "" || card.humanSummary !== "") fail(`${card.id} must keep human fields blank`);
  if (!Array.isArray(card.uncertainWords) || card.uncertainWords.length !== 0) fail(`${card.id} uncertainWords must start empty`);
  if (card.nextGate !== "human_transcription_then_source_fit_public_grounding_originality_review") fail(`${card.id} next gate drift`);
  const checklist = card.qualityChecklist || {};
  const values = Object.values(checklist);
  if (values.length < 6 || values.some((value) => value !== "not_started")) fail(`${card.id} checklist must start not_started`);
}

if (replacementPack.packStatus !== "source_replacement_required") fail(`unexpected replacement packStatus: ${replacementPack.packStatus}`);
if (replacementPack.replacementCandidates !== 3 || replacementCards.length !== 3) {
  fail(`expected 3 replacement cards, got ${replacementPack.replacementCandidates}/${replacementCards.length}`);
}
if (replacementPack.replacementDocuments !== 3 || (replacementPack.documentRows || []).length !== 3) {
  fail(`expected 3 replacement documents, got ${replacementPack.replacementDocuments}`);
}
if (replacementPack.blankPreviewPages !== 3) fail(`expected 3 blank preview pages, got ${replacementPack.blankPreviewPages}`);
if (!Array.isArray(replacementPack.actions) || replacementPack.actions.length < 5) fail("replacement pack missing required action list");

for (const card of replacementCards) {
  if (card.educationOnly !== true || card.productionReady !== false) fail(`${card.id} boundary drift`);
  if (card.learnerFacingRelease !== false || card.approvalStatus !== "not_approved") fail(`${card.id} release gate drift`);
  if (card.intakeStatus !== "blank_preview_needs_source_replacement") fail(`${card.id} intakeStatus drift`);
  if (card.replacementStatus !== "source_replacement_required") fail(`${card.id} replacementStatus drift`);
  if (!card.previewPath || !fs.existsSync(card.previewPath)) fail(`${card.id} preview missing`);
  if ((card.previewBytes || 0) > blankPreviewByteThreshold) fail(`${card.id} nonblank preview leaked into replacement pack`);
  if (card.nextGate !== "replace_or_reexport_source_pdf_before_absorption") fail(`${card.id} next gate drift`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  manualTranscriptionPages: manualPack.manualTranscriptionPages,
  manualTranscriptionDocuments: manualPack.manualTranscriptionDocuments,
  replacementCandidates: replacementPack.replacementCandidates,
  replacementDocuments: replacementPack.replacementDocuments,
  blankPreviewPages: replacementPack.blankPreviewPages,
  acceptedTranscriptPages: 0,
}, null, 2));
