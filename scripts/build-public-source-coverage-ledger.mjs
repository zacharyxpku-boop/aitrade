import fs from "node:fs";

const publicGapPath = "docs/PUBLIC_SOURCE_GAP_AUDIT.json";
const wikipediaPath = "docs/WIKIPEDIA_GROUNDING_AUDIT.json";
const publicAbsorptionPath = "docs/PUBLIC_SOURCE_ABSORPTION_MAP.json";
const triangulationPath = "docs/KNOWLEDGE_NODE_SOURCE_TRIANGULATION_AUDIT.json";
const candidatePackPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_CANDIDATE_PACK.json";
const rowBrowserPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_ROW_BROWSER.json";
const outputJsonPath = "docs/PUBLIC_SOURCE_COVERAGE_LEDGER.json";
const outputMdPath = "docs/PUBLIC_SOURCE_COVERAGE_LEDGER.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
}

function byModule(rows = []) {
  return new Map(rows.map((row) => [row.module, row]));
}

const publicGap = readJson(publicGapPath);
const wikipedia = readJson(wikipediaPath);
const publicAbsorption = readJson(publicAbsorptionPath);
const triangulation = readJson(triangulationPath);
const candidatePack = readJson(candidatePackPath);
const rowBrowser = readJson(rowBrowserPath);

for (const [name, artifact] of Object.entries({
  publicGap,
  wikipedia,
  publicAbsorption,
  triangulation,
  candidatePack,
  rowBrowser,
})) {
  assertBoundary(name, artifact);
}

if (publicGap.publicReferenceReadyModules !== 12) fail("public gap audit must have 12 ready modules");
if (wikipedia.auditStatus !== "wikipedia_grounding_ready_for_reviewer_not_release") fail("Wikipedia grounding status drift");
if (publicAbsorption.auditStatus !== "public_sources_mapped_to_knowledge_nodes_release_blocked") fail("public source absorption status drift");
if (triangulation.auditStatus !== "node_source_triangulation_ready_for_reviewer_release_blocked") fail("triangulation status drift");
if (candidatePack.packStatus !== "node_public_source_fit_candidate_pack_ready_for_reviewer_release_blocked") fail("candidate pack status drift");
if (rowBrowser.rowBrowserStatus !== "source_fit_reviewer_row_browser_ready_all_rows_blocked_on_real_input") fail("row browser status drift");

const gapByModule = byModule(publicGap.moduleRows || []);
const wikiByModule = byModule(wikipedia.moduleRows || []);
const absorptionByModule = byModule(publicAbsorption.moduleRows || []);
const triangulationByModule = byModule(triangulation.moduleRows || []);
const candidateByModule = byModule(candidatePack.moduleRows || []);
const reviewByModule = byModule(rowBrowser.moduleRows || []);

const moduleNames = [...new Set([
  ...(publicGap.moduleRows || []).map((row) => row.module),
  ...(triangulation.moduleRows || []).map((row) => row.module),
  ...(candidatePack.moduleRows || []).map((row) => row.module),
])].sort((left, right) => left.localeCompare(right, "zh-Hans-CN"));

const moduleRows = moduleNames.map((module) => {
  const gap = gapByModule.get(module) || {};
  const wiki = wikiByModule.get(module) || {};
  const absorption = absorptionByModule.get(module) || {};
  const tri = triangulationByModule.get(module) || {};
  const candidate = candidateByModule.get(module) || {};
  const review = reviewByModule.get(module) || {};
  return {
    module,
    learnerFacingNodes: gap.learnerFacingNodes || tri.nodes || 0,
    publicReferenceStatus: gap.readinessStatus || "public_reference_status_missing",
    matchedPublicDocs: gap.matchedPublicDocs || 0,
    topPublicEvidenceDocs: gap.topPublicEvidenceDocs || 0,
    wikipediaEvidenceDocs: gap.wikipediaEvidenceDocs || wiki.wikipediaEvidenceDocs || 0,
    officialLikeEvidenceDocs: gap.officialLikeEvidenceDocs || 0,
    uniqueHosts: gap.uniqueHosts || 0,
    mappedPublicDocuments: absorption.documents || absorption.mappedPublicDocuments || 0,
    directPublicReadyNodes: tri.directPublicReadyNodes || 0,
    directWikipediaReadyNodes: tri.directWikipediaReadyNodes || 0,
    directOfficialReadyNodes: tri.directOfficialReadyNodes || 0,
    directTriangulatedNodes: tri.directTriangulatedNodes || 0,
    moduleGroundedNodes: tri.moduleGroundedNodes || 0,
    nodesNeedingDirectTriangulation: candidate.nodesNeedingDirectTriangulation || 0,
    sourceFitCandidateRows: candidate.totalCandidates || 0,
    wikipediaCandidateRows: candidate.wikipediaCandidates || 0,
    officialCandidateRows: candidate.officialCandidates || 0,
    reviewRows: review.reviewRows || 0,
    readyReviewRows: review.readyRows || 0,
    blockedReviewRows: review.blockedRows || 0,
    realHumanInputEntries: review.realHumanInputEntries || 0,
    learnerCitationApprovedRows: review.learnerCitationApprovedRows || 0,
    status: "public_layer_mapped_source_fit_blocked_on_real_review",
    nextGate: (review.blockedRows || candidate.totalCandidates || 0) > 0
      ? "real_reviewer_accept_reject_or_background_each_source_fit_candidate"
      : "monitor_public_source_freshness_and_release_gate",
    sampleEvidence: [
      ...(gap.evidenceSamples || []).slice(0, 2),
      ...(wiki.wikipediaSamples || []).slice(0, 2),
    ].map((ref) => ({
      documentId: ref.documentId,
      sourceId: ref.sourceId,
      name: ref.name,
      url: ref.url,
      family: ref.family || (String(ref.name || "").startsWith("Wikipedia:") ? "Wikipedia" : ""),
      excerptPolicy: ref.excerptPolicy,
    })),
  };
});

const ledger = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  ledgerStatus: "public_source_coverage_ledger_ready_release_blocked",
  ledgerMode: "public_wikipedia_official_source_absorption_and_source_fit_queue",
  corpusDocuments: publicGap.corpusDocuments,
  publicCorpusDocuments: publicGap.publicCorpusDocuments,
  wikipediaDocuments: publicGap.wikipediaDocuments,
  officialLikeDocuments: publicGap.officialLikeDocuments,
  mappedPublicDocuments: publicAbsorption.mappedPublicDocuments,
  unmappedPublicDocuments: publicAbsorption.unmappedPublicDocuments,
  mappedWikipediaDocuments: publicAbsorption.mappedWikipediaDocuments,
  unmappedWikipediaDocuments: publicAbsorption.unmappedWikipediaDocuments,
  mappedOfficialLikeDocuments: publicAbsorption.mappedOfficialLikeDocuments,
  unmappedOfficialLikeDocuments: publicAbsorption.unmappedOfficialLikeDocuments,
  totalPublicDocumentNodeMatches: publicAbsorption.totalPublicDocumentNodeMatches,
  modules: publicGap.modules,
  publicReferenceReadyModules: publicGap.publicReferenceReadyModules,
  modulesWithWikipediaGrounding: wikipedia.modulesWithWikipediaGrounding,
  modulesWithTwoWikipediaGroundingDocs: wikipedia.modulesWithTwoWikipediaGroundingDocs,
  nodes: triangulation.nodes,
  localReadyNodes: triangulation.localReadyNodes,
  directPublicReadyNodes: triangulation.directPublicReadyNodes,
  directWikipediaReadyNodes: triangulation.directWikipediaReadyNodes,
  directOfficialReadyNodes: triangulation.directOfficialReadyNodes,
  directTriangulatedNodes: triangulation.directTriangulatedNodes,
  moduleGroundedNodes: triangulation.moduleGroundedNodes,
  candidateTargetNodes: candidatePack.candidateTargetNodes,
  sourceFitCandidates: candidatePack.totalCandidates,
  wikipediaCandidates: candidatePack.wikipediaCandidates,
  officialCandidates: candidatePack.officialCandidates,
  sourceFitReviewRows: rowBrowser.totalReviewRows,
  readySourceFitReviewRows: rowBrowser.readyRows,
  blockedSourceFitReviewRows: rowBrowser.blockedRows,
  rowsWithUrl: rowBrowser.rowsWithUrl,
  realHumanInputEntries: rowBrowser.realHumanInputEntries,
  learnerCitationApprovedDocuments: publicAbsorption.learnerCitationApprovedDocuments,
  learnerCitationApprovedNodes: triangulation.learnerCitationApprovedNodes,
  learnerCitationApprovedCandidates: candidatePack.learnerCitationApprovedCandidates,
  learnerCitationApprovedRows: rowBrowser.learnerCitationApprovedRows,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  moduleRows,
  topMappedPublicRows: (publicAbsorption.topMappedPublicRows || []).slice(0, 12),
  wikipediaDocSamples: (wikipedia.wikipediaDocSamples || []).slice(0, 12),
  nodeSpecificPublicGapSamples: (triangulation.nodeSpecificPublicGapSamples || []).slice(0, 12),
  commands: [
    "npm.cmd run build:public-source-coverage-ledger",
    "npm.cmd run check:public-source-coverage-ledger",
    "npm.cmd run check:public-source-absorption-map",
    "npm.cmd run check:knowledge-node-source-triangulation-audit",
    "npm.cmd run verify",
  ],
  completionRule: "This ledger is complete when public, Wikipedia, and official-like corpus documents are mapped to knowledge nodes, module-level public grounding is ready across all modules, and remaining node-specific source-fit rows are visible as real-reviewer work. It does not approve learner-facing citations or replace human source-fit review.",
  boundary: "Public source coverage ledger for reviewer-facing education-only governance. Public, Wikipedia, official/public-domain, open-access, and permissive sources support source-fit review and original lesson rewriting only; this ledger does not approve copied text, learner-facing citations, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

if (ledger.publicCorpusDocuments !== 1196) fail("public corpus count drift");
if (ledger.wikipediaDocuments !== 96) fail("Wikipedia corpus count drift");
if (ledger.mappedPublicDocuments !== 1196 || ledger.unmappedPublicDocuments !== 0) fail("public source mapping drift");
if (ledger.nodes !== 360 || ledger.moduleGroundedNodes !== 360) fail("node grounding drift");
if (ledger.sourceFitCandidates !== 1638 || ledger.blockedSourceFitReviewRows !== 1638) fail("source-fit review row drift");

fs.writeFileSync(outputJsonPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Public Source Coverage Ledger",
  "",
  `- Ledger status: ${ledger.ledgerStatus}`,
  `- Public corpus docs: ${ledger.publicCorpusDocuments}`,
  `- Wikipedia docs: ${ledger.wikipediaDocuments}`,
  `- Official-like docs: ${ledger.officialLikeDocuments}`,
  `- Mapped public docs: ${ledger.mappedPublicDocuments}/${ledger.publicCorpusDocuments}`,
  `- Public document-node matches: ${ledger.totalPublicDocumentNodeMatches}`,
  `- Module-grounded nodes: ${ledger.moduleGroundedNodes}/${ledger.nodes}`,
  `- Direct triangulated nodes: ${ledger.directTriangulatedNodes}/${ledger.nodes}`,
  `- Source-fit candidates: ${ledger.sourceFitCandidates}`,
  `- Source-fit review rows ready: ${ledger.readySourceFitReviewRows}/${ledger.sourceFitReviewRows}`,
  `- Real human input entries: ${ledger.realHumanInputEntries}`,
  `- Write allowed now: ${ledger.writeAllowedNow}`,
  "",
  "## Module Rows",
  "",
  "| Module | Nodes | Public docs | Wiki docs | Official docs | Direct triangulated | Candidates | Review ready | Status |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ...ledger.moduleRows.map((row) => `| ${row.module} | ${row.learnerFacingNodes} | ${row.topPublicEvidenceDocs} | ${row.wikipediaEvidenceDocs} | ${row.officialLikeEvidenceDocs} | ${row.directTriangulatedNodes} | ${row.sourceFitCandidateRows} | ${row.readyReviewRows}/${row.reviewRows} | ${row.status} |`),
  "",
  "## Boundary",
  "",
  ledger.boundary,
  "",
].join("\n"), "utf8");

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
