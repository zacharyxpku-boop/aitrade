import fs from "node:fs";

const auditPath = "docs/PUBLIC_SOURCE_ABSORPTION_MAP.json";
const auditMdPath = "docs/PUBLIC_SOURCE_ABSORPTION_MAP.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const audit = readJson(auditPath);
if (!fs.existsSync(auditMdPath)) fail(`missing ${auditMdPath}`);

if (audit.educationOnly !== true) fail("public source absorption map must keep educationOnly:true");
if (audit.productionReady !== false) fail("public source absorption map must keep productionReady:false");
if (audit.learnerFacingRelease !== false) fail("public source absorption map must keep learnerFacingRelease:false");
if (audit.approvalStatus !== "not_approved") fail("public source absorption map must remain not_approved");
if (audit.auditStatus !== "public_sources_mapped_to_knowledge_nodes_release_blocked") {
  fail(`unexpected auditStatus: ${audit.auditStatus}`);
}
if (audit.auditMode !== "reverse_public_source_to_knowledge_node_absorption_map") fail("unexpected auditMode");
if (audit.corpusDocuments !== 1494) fail(`expected 1494 corpus docs, got ${audit.corpusDocuments}`);
if (audit.publicCorpusDocuments !== 1196) fail(`expected 1196 public docs, got ${audit.publicCorpusDocuments}`);
if (audit.wikipediaDocuments !== 96) fail(`expected 96 Wikipedia docs, got ${audit.wikipediaDocuments}`);
if (audit.officialLikeDocuments !== 202) fail(`expected 202 official-like docs, got ${audit.officialLikeDocuments}`);
if (audit.mappedPublicDocuments !== 1196) fail("all public docs must be mapped");
if (audit.unmappedPublicDocuments !== 0) fail("public docs must not be unmapped");
if (audit.mappedWikipediaDocuments !== 96) fail("all Wikipedia docs must be mapped");
if (audit.unmappedWikipediaDocuments !== 0) fail("Wikipedia docs must not be unmapped");
if (audit.mappedOfficialLikeDocuments !== 202) fail("all official-like docs must be mapped");
if (audit.unmappedOfficialLikeDocuments !== 0) fail("official-like docs must not be unmapped");
if (audit.totalPublicDocumentNodeMatches < 9000) fail("public document-node matches too small");
if (audit.modulesWithPublicSourceMapping !== 12) fail("all modules must have public source mapping");
if (audit.modulesWithWikipediaMapping < 10) fail("direct reverse Wikipedia mapping below expected module baseline");
if (audit.learnerCitationApprovedDocuments !== 0) fail("learner citations must remain unapproved");
if (audit.writeAllowedNow !== false) fail("public source absorption map must not allow writes");
if (audit.manualAuthorizationRequired !== true) fail("manual authorization must be required");

if (!Array.isArray(audit.documentRows) || audit.documentRows.length !== 1196) fail("documentRows must contain 1196 public docs");
for (const row of audit.documentRows) {
  if (!row.documentId || !row.sourceId || !row.name || !row.url || !row.tier) fail("public document row missing identity fields");
  if (row.matchedNodeCount < 1) fail(`${row.documentId} is not mapped to any knowledge node`);
  if (!Array.isArray(row.matchedModules) || row.matchedModules.length < 1) fail(`${row.documentId} missing matched modules`);
  if (!Array.isArray(row.topNodeMatches) || row.topNodeMatches.length < 1) fail(`${row.documentId} missing top node matches`);
  if (row.learnerCitationApproved !== false) fail(`${row.documentId} learner citation must remain unapproved`);
  if (!/research_only/.test(row.absorptionStatus || "")) fail(`${row.documentId} missing research-only absorption status`);
  if (!/reviewer_selects_source_role|retune_public_source_terms/.test(row.nextGate || "")) fail(`${row.documentId} missing reviewer next gate`);
}

if (!Array.isArray(audit.unmappedRows) || audit.unmappedRows.length !== 0) fail("unmappedRows must be empty");
if (!Array.isArray(audit.moduleRows) || audit.moduleRows.length !== 12) fail("moduleRows must cover 12 modules");
if (!audit.moduleRows.every((row) => row.publicDocuments > 0 && row.nodeMatches > 0)) {
  fail("every module row must include public docs and node matches");
}
if (!Array.isArray(audit.wikipediaRows) || audit.wikipediaRows.length < 40) fail("Wikipedia sample rows too small");
if (!Array.isArray(audit.officialLikeRows) || audit.officialLikeRows.length < 40) fail("official-like sample rows too small");
if (!Array.isArray(audit.topMappedPublicRows) || audit.topMappedPublicRows.length < 10) fail("top mapped public rows too small");
if (!Array.isArray(audit.commands) || !audit.commands.some((item) => item.includes("check:public-source-absorption-map"))) {
  fail("commands missing public source absorption check");
}

const boundaryText = `${audit.boundary || ""} ${audit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "wikipedia",
  "source-fit review",
  "original lesson rewrites",
  "does not approve copied text",
  "learner-facing citations",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: audit.educationOnly,
  productionReady: audit.productionReady,
  learnerFacingRelease: audit.learnerFacingRelease,
  approvalStatus: audit.approvalStatus,
  auditStatus: audit.auditStatus,
  publicCorpusDocuments: audit.publicCorpusDocuments,
  mappedPublicDocuments: audit.mappedPublicDocuments,
  unmappedPublicDocuments: audit.unmappedPublicDocuments,
  mappedWikipediaDocuments: audit.mappedWikipediaDocuments,
  mappedOfficialLikeDocuments: audit.mappedOfficialLikeDocuments,
  totalPublicDocumentNodeMatches: audit.totalPublicDocumentNodeMatches,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
