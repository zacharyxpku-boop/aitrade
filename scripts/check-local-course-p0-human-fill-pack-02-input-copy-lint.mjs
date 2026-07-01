import fs from "node:fs";

const lintPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02_INPUT_COPY_LINT.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const lint = readJson(lintPath);
const rows = lint.lintRows || [];

if (lint.educationOnly !== true) fail("lint must keep educationOnly:true");
if (lint.productionReady !== false) fail("lint must keep productionReady:false");
if (lint.learnerFacingRelease !== false) fail("lint must keep learnerFacingRelease:false");
if (lint.approvalStatus !== "not_approved") fail("lint must remain not_approved");
if (lint.packId !== "local_course_p0_human_fill_pack_02") fail(`unexpected packId: ${lint.packId}`);
if (lint.lintStatus !== "blocked_quality_lint") fail(`expected blocked_quality_lint, got ${lint.lintStatus}`);
if (lint.totalEntries !== 4 || rows.length !== 4) fail(`expected 4 rows, got ${lint.totalEntries}/${rows.length}`);
if (lint.readyEntries !== 0 || lint.blockedEntries !== 4) fail(`expected 0/4 ready/blocked, got ${lint.readyEntries}/${lint.blockedEntries}`);
if (lint.candidateCopyIssueEntries !== 0) fail(`blank template should not have candidate-copy issues, got ${lint.candidateCopyIssueEntries}`);
if (lint.riskRewriteIncompleteEntries !== 4) fail(`expected 4 risk-incomplete rows, got ${lint.riskRewriteIncompleteEntries}`);
if (lint.publicReferenceMissingEntries !== 4) fail(`expected 4 public-reference-missing rows, got ${lint.publicReferenceMissingEntries}`);
if (lint.originalityMissingEntries !== 4) fail(`expected 4 originality-missing rows, got ${lint.originalityMissingEntries}`);
if (lint.forbiddenHitEntries !== 0) fail(`expected 0 forbidden hits, got ${lint.forbiddenHitEntries}`);

for (const row of rows) {
  if (row.category !== "manual_transcription") fail(`${row.id} must be manual_transcription`);
  if (row.documentId !== "corpus_1580") fail(`${row.id} document drift`);
  if (![5, 6, 7, 8].includes(row.pageNumber)) fail(`${row.id} page drift`);
  if (row.lintStatus !== "blocked_quality_lint" || row.readyForValidation !== false) fail(`${row.id} should be blocked`);
  for (const field of ["reviewerName", "reviewedAt", "humanTranscription", "humanSummary", "publicReferenceNotes", "originalityNotes", "riskRewriteNotes", "manualChecklist"]) {
    if (!row.missingFields.includes(field)) fail(`${row.id} missing expected missing field ${field}`);
  }
  if (!Array.isArray(row.riskRewriteMissingFlags) || row.riskRewriteMissingFlags.length < 5) fail(`${row.id} should report missing risk rewrites`);
  if (row.publicReferenceMissing !== true || row.originalityMissing !== true) fail(`${row.id} should require public/originality notes`);
  if (!Array.isArray(row.forbiddenHits) || row.forbiddenHits.length !== 0) fail(`${row.id} forbidden hits drift`);
}

const allMissingFlags = new Set(rows.flatMap((row) => row.riskRewriteMissingFlags));
for (const flag of ["signal_language", "forecast_language", "support_resistance_language", "study_advice_language", "source_recommendation_language"]) {
  if (!allMissingFlags.has(flag)) fail(`lint must surface high-risk flag ${flag}`);
}

const boundaryText = `${lint.boundary || ""} ${lint.nextStep || ""}`.toLowerCase();
for (const phrase of [
  "dry-run quality gate",
  "does not write overlay changes",
  "perform ocr",
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
  if (!boundaryText.includes(phrase)) fail(`lint boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: lint.educationOnly,
  productionReady: lint.productionReady,
  learnerFacingRelease: lint.learnerFacingRelease,
  approvalStatus: lint.approvalStatus,
  lintStatus: lint.lintStatus,
  totalEntries: lint.totalEntries,
  readyEntries: lint.readyEntries,
  blockedEntries: lint.blockedEntries,
  riskRewriteIncompleteEntries: lint.riskRewriteIncompleteEntries,
}, null, 2));
