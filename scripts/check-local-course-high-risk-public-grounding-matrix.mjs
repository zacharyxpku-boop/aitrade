import fs from "node:fs";

const matrixPath = "docs/LOCAL_COURSE_HIGH_RISK_PUBLIC_GROUNDING_MATRIX.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const matrix = readJson(matrixPath);
const lessonRows = matrix.lessonRows || [];
const directRows = matrix.directSourceRows || [];
const serialized = JSON.stringify(matrix);

if (matrix.educationOnly !== true) fail("public grounding matrix must keep educationOnly:true");
if (matrix.productionReady !== false) fail("public grounding matrix must keep productionReady:false");
if (matrix.learnerFacingRelease !== false) fail("public grounding matrix must keep learnerFacingRelease:false");
if (matrix.approvalStatus !== "not_approved") fail("public grounding matrix must remain not_approved");
if (matrix.matrixStatus !== "high_risk_public_grounding_mapped_not_approved") fail(`unexpected matrixStatus: ${matrix.matrixStatus}`);
if (matrix.lessonCount !== 12 || lessonRows.length !== 12) fail("matrix must cover 12 high-risk lessons");
if (matrix.lessonsWithPublicGrounding !== 12) fail("all 12 lessons must have public grounding mapped");
if (matrix.lessonsMissingPublicGrounding !== 0) fail("no high-risk lesson should be missing public grounding");
if (matrix.lessonsWithAtLeastThreeWikipediaRefs !== 12) fail("each high-risk lesson needs at least 3 Wikipedia refs");
if (matrix.totalWikipediaRefs < 36) fail("expected at least 36 selected Wikipedia refs");
if (matrix.totalPublicContextRefs < 8) fail("expected public/open context refs alongside Wikipedia refs");
if (matrix.directSourceCandidateResolutionsMapped !== 5 || directRows.length !== 5) fail("expected 5 direct source rows mapped");
if (matrix.directSourceCandidatesApprovedForLearnerCitation !== 0) fail("direct source candidates must not be approved for learner citation");
if (matrix.publicGroundingMappedNotes !== 12) fail("expected one public grounding mapping per lesson");
if (matrix.releaseReadyLessons !== 0) fail("public grounding matrix must not mark lessons release-ready");
if (matrix.learnerCitationApprovedLessons !== 0) fail("public grounding matrix must not approve learner citations");
if (matrix.releaseBlockingLessons !== 12) fail("all high-risk lessons must remain release-blocked");
if (matrix.humanApprovalRequired !== true) fail("human approval must remain required");
if (matrix.writeAllowedNow !== false) fail("writeAllowedNow must remain false");
if (matrix.approvalGatePassed !== false) fail("approval gate must not pass");
if (matrix.modulesCovered !== 4) fail(`expected 4 high-risk modules covered, got ${matrix.modulesCovered}`);
if (!Array.isArray(matrix.moduleRows) || matrix.moduleRows.length !== 4) fail("moduleRows must cover the 4 high-risk modules");

for (const row of lessonRows) {
  if (row.publicGroundingStatus !== "mapped_for_reviewer_not_release_approved") fail(`lesson ${row.candidateId} grounding status drift`);
  if (row.publicModuleReadinessStatus !== "public_reference_ready_for_reviewer") fail(`lesson ${row.candidateId} module public readiness drift`);
  if (!Array.isArray(row.wikipediaRefs) || row.wikipediaRefs.length < 3) fail(`lesson ${row.candidateId} needs at least 3 Wikipedia refs`);
  if (!Array.isArray(row.publicContextRefs)) fail(`lesson ${row.candidateId} missing public context refs`);
  if (row.selectedPublicRefCount < 3) fail(`lesson ${row.candidateId} selected public refs too thin`);
  if (row.shareAlikeAttributionRequiredRefs < 3) fail(`lesson ${row.candidateId} must track share-alike attribution`);
  if (row.publicGroundingMapped !== true) fail(`lesson ${row.candidateId} public grounding not mapped`);
  if (row.learnerCitationApproved !== false || row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved") {
    fail(`lesson ${row.candidateId} release/approval drift`);
  }
  if (row.releaseBlocker !== true || row.humanApprovalRequired !== true) fail(`lesson ${row.candidateId} must remain blocked for human approval`);
  if (row.nextGate !== "human_public_grounding_review_then_originality_and_release_gate") fail(`lesson ${row.candidateId} next gate drift`);
  for (const ref of row.wikipediaRefs) {
    if (ref.family !== "Wikipedia") fail(`lesson ${row.candidateId} has non-Wikipedia ref in wikipediaRefs`);
    if (!/^https:\/\/en\.wikipedia\.org\/wiki\//.test(ref.url || "")) fail(`lesson ${row.candidateId} Wikipedia ref URL drift`);
    if (ref.excerptPolicy !== "attribution_and_share_alike_required") fail(`lesson ${row.candidateId} Wikipedia attribution policy drift`);
  }
}

for (const row of directRows) {
  if (row.selfReviewDecision !== "keep_reviewer_only_background") fail(`direct source ${row.id} self-review decision drift`);
  if (row.learnerCitationApproved !== false || row.releaseBlocker !== true) fail(`direct source ${row.id} release boundary drift`);
  if (!Array.isArray(row.publicReplacementRefs) || row.publicReplacementRefs.length < 3) fail(`direct source ${row.id} needs public replacement refs`);
}

for (const phrase of [
  "internal reviewer evidence planning only",
  "wikipedia and public sources support terminology",
  "do not approve learner-facing release",
  "make private pdfs public citations",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!serialized.toLowerCase().includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: matrix.educationOnly,
  productionReady: matrix.productionReady,
  learnerFacingRelease: matrix.learnerFacingRelease,
  approvalStatus: matrix.approvalStatus,
  matrixStatus: matrix.matrixStatus,
  lessonCount: matrix.lessonCount,
  lessonsWithPublicGrounding: matrix.lessonsWithPublicGrounding,
  lessonsWithAtLeastThreeWikipediaRefs: matrix.lessonsWithAtLeastThreeWikipediaRefs,
  totalWikipediaRefs: matrix.totalWikipediaRefs,
  totalPublicContextRefs: matrix.totalPublicContextRefs,
  directSourceCandidateResolutionsMapped: matrix.directSourceCandidateResolutionsMapped,
  releaseReadyLessons: matrix.releaseReadyLessons,
  writeAllowedNow: matrix.writeAllowedNow,
}, null, 2));
