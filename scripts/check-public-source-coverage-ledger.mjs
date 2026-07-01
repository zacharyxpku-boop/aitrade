import fs from "node:fs";

const ledgerPath = "docs/PUBLIC_SOURCE_COVERAGE_LEDGER.json";
const ledgerMdPath = "docs/PUBLIC_SOURCE_COVERAGE_LEDGER.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const ledger = readJson(ledgerPath);
if (!fs.existsSync(ledgerMdPath)) fail(`missing ${ledgerMdPath}`);

if (ledger.educationOnly !== true) fail("ledger must keep educationOnly:true");
if (ledger.productionReady !== false) fail("ledger must keep productionReady:false");
if (ledger.learnerFacingRelease !== false) fail("ledger must keep learnerFacingRelease:false");
if (ledger.approvalStatus !== "not_approved") fail("ledger must remain not_approved");
if (ledger.ledgerStatus !== "public_source_coverage_ledger_ready_release_blocked") {
  fail(`unexpected ledgerStatus: ${ledger.ledgerStatus}`);
}
if (ledger.ledgerMode !== "public_wikipedia_official_source_absorption_and_source_fit_queue") fail("unexpected ledgerMode");
if (ledger.publicCorpusDocuments !== 1196) fail("expected 1196 public corpus docs");
if (ledger.wikipediaDocuments !== 96) fail("expected 96 Wikipedia docs");
if (ledger.officialLikeDocuments !== 202) fail("expected 202 official-like docs");
if (ledger.mappedPublicDocuments !== 1196 || ledger.unmappedPublicDocuments !== 0) fail("public doc mapping drift");
if (ledger.mappedWikipediaDocuments !== 96 || ledger.unmappedWikipediaDocuments !== 0) fail("Wikipedia mapping drift");
if (ledger.mappedOfficialLikeDocuments !== 202 || ledger.unmappedOfficialLikeDocuments !== 0) fail("official mapping drift");
if (ledger.totalPublicDocumentNodeMatches !== 9568) fail("public document-node match count drift");
if (ledger.modules !== 12 || ledger.publicReferenceReadyModules !== 12) fail("public module readiness drift");
if (ledger.modulesWithWikipediaGrounding !== 12 || ledger.modulesWithTwoWikipediaGroundingDocs !== 12) {
  fail("Wikipedia module grounding drift");
}
if (ledger.nodes !== 360 || ledger.localReadyNodes !== 360 || ledger.moduleGroundedNodes !== 360) {
  fail("node grounding coverage drift");
}
if (ledger.directPublicReadyNodes !== 103) fail("direct public-ready node count drift");
if (ledger.directWikipediaReadyNodes !== 84) fail("direct Wikipedia-ready node count drift");
if (ledger.directOfficialReadyNodes !== 83) fail("direct official-ready node count drift");
if (ledger.directTriangulatedNodes !== 87) fail("direct triangulated node count drift");
if (ledger.candidateTargetNodes !== 273) fail("candidate target node count drift");
if (ledger.sourceFitCandidates !== 1638) fail("source-fit candidate count drift");
if (ledger.wikipediaCandidates !== 1122) fail("Wikipedia candidate count drift");
if (ledger.officialCandidates !== 243) fail("official candidate count drift");
if (ledger.sourceFitReviewRows !== 1638 || ledger.readySourceFitReviewRows !== 0 || ledger.blockedSourceFitReviewRows !== 1638) {
  fail("source-fit review row readiness drift");
}
if (ledger.rowsWithUrl !== 1638) fail("all source-fit rows must have URLs");
if (ledger.realHumanInputEntries !== 0) fail("ledger must not claim real human input");
if (
  ledger.learnerCitationApprovedDocuments !== 0 ||
  ledger.learnerCitationApprovedNodes !== 0 ||
  ledger.learnerCitationApprovedCandidates !== 0 ||
  ledger.learnerCitationApprovedRows !== 0
) {
  fail("ledger must not approve learner-facing citations");
}
if (ledger.writeAllowedNow !== false || ledger.manualAuthorizationRequired !== true) fail("write gate must remain locked");

if (!Array.isArray(ledger.moduleRows) || ledger.moduleRows.length !== 12) fail("expected 12 module rows");
if (ledger.moduleRows.reduce((sum, row) => sum + (row.learnerFacingNodes || 0), 0) !== 360) {
  fail("module rows must cover 360 nodes");
}
if (ledger.moduleRows.reduce((sum, row) => sum + (row.sourceFitCandidateRows || 0), 0) !== 1638) {
  fail("module candidate rows must sum to 1638");
}
if (ledger.moduleRows.reduce((sum, row) => sum + (row.blockedReviewRows || 0), 0) !== 1638) {
  fail("module blocked review rows must sum to 1638");
}
if (!ledger.moduleRows.every((row) =>
  row.publicReferenceStatus === "public_reference_ready_for_reviewer" &&
  row.moduleGroundedNodes === row.learnerFacingNodes &&
  row.realHumanInputEntries === 0 &&
  row.learnerCitationApprovedRows === 0 &&
  row.status === "public_layer_mapped_source_fit_blocked_on_real_review"
)) {
  fail("module row readiness or boundary drift");
}
if (!Array.isArray(ledger.topMappedPublicRows) || ledger.topMappedPublicRows.length < 10) fail("top mapped public samples missing");
if (!Array.isArray(ledger.wikipediaDocSamples) || ledger.wikipediaDocSamples.length < 10) fail("Wikipedia samples missing");
if (!Array.isArray(ledger.nodeSpecificPublicGapSamples) || ledger.nodeSpecificPublicGapSamples.length < 10) {
  fail("node-specific public gap samples missing");
}
if (!Array.isArray(ledger.commands) || !ledger.commands.some((command) => /check:public-source-coverage-ledger/.test(command))) {
  fail("ledger commands must include its check command");
}

const boundaryText = `${ledger.boundary || ""} ${ledger.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "public, wikipedia, official/public-domain",
  "does not approve copied text",
  "learner-facing citations",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
  "does not approve learner-facing citations",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  ledgerStatus: ledger.ledgerStatus,
  publicCorpusDocuments: ledger.publicCorpusDocuments,
  wikipediaDocuments: ledger.wikipediaDocuments,
  officialLikeDocuments: ledger.officialLikeDocuments,
  mappedPublicDocuments: ledger.mappedPublicDocuments,
  totalPublicDocumentNodeMatches: ledger.totalPublicDocumentNodeMatches,
  moduleGroundedNodes: ledger.moduleGroundedNodes,
  sourceFitCandidates: ledger.sourceFitCandidates,
  blockedSourceFitReviewRows: ledger.blockedSourceFitReviewRows,
  realHumanInputEntries: ledger.realHumanInputEntries,
  writeAllowedNow: ledger.writeAllowedNow,
}, null, 2));
