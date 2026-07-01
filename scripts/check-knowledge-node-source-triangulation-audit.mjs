import fs from "node:fs";

const auditPath = "docs/KNOWLEDGE_NODE_SOURCE_TRIANGULATION_AUDIT.json";
const auditMdPath = "docs/KNOWLEDGE_NODE_SOURCE_TRIANGULATION_AUDIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const audit = readJson(auditPath);
if (!fs.existsSync(auditMdPath)) fail(`missing ${auditMdPath}`);

if (audit.educationOnly !== true) fail("triangulation audit must keep educationOnly:true");
if (audit.productionReady !== false) fail("triangulation audit must keep productionReady:false");
if (audit.learnerFacingRelease !== false) fail("triangulation audit must keep learnerFacingRelease:false");
if (audit.approvalStatus !== "not_approved") fail("triangulation audit must remain not_approved");
if (audit.auditStatus !== "node_source_triangulation_ready_for_reviewer_release_blocked") {
  fail(`unexpected auditStatus: ${audit.auditStatus}`);
}
if (audit.auditMode !== "local_private_plus_public_wikipedia_node_triangulation") fail("unexpected auditMode");
if (audit.nodes !== 360) fail(`expected 360 nodes, got ${audit.nodes}`);
if (audit.modules !== 12) fail(`expected 12 modules, got ${audit.modules}`);
if (audit.localReadyNodes !== 360) fail("all nodes must have local evidence");
if (audit.directPublicReadyNodes < 100) fail("direct public-ready nodes below expected review baseline");
if (audit.directWikipediaReadyNodes < 80) fail("direct Wikipedia-ready nodes below expected review baseline");
if (audit.directOfficialReadyNodes < 70) fail("direct official-ready nodes below expected review baseline");
if (audit.directTriangulatedNodes < 80) fail("direct triangulated nodes below expected review baseline");
if (audit.moduleGroundedNodes !== 360) fail("all nodes must remain module-grounded");
if (audit.attentionNodes !== 0) fail("triangulation attention nodes should be zero after module grounding");
if (audit.learnerCitationApprovedNodes !== 0) fail("learner citations must remain unapproved");
if (audit.writeAllowedNow !== false) fail("triangulation audit must not allow writes");
if (audit.manualAuthorizationRequired !== true) fail("manual authorization must be required");

if (!Array.isArray(audit.moduleRows) || audit.moduleRows.length !== 12) fail("moduleRows must cover 12 modules");
for (const row of audit.moduleRows) {
  if (row.nodes < 1) fail(`${row.module} missing nodes`);
  if (row.localReadyNodes !== row.nodes) fail(`${row.module} must have local-ready coverage`);
  if (row.moduleGroundedNodes !== row.nodes) fail(`${row.module} must be module-grounded`);
  if (row.attentionNodes !== 0) fail(`${row.module} should not have attention nodes`);
}

if (!Array.isArray(audit.nodeRows) || audit.nodeRows.length !== 360) fail("nodeRows must contain 360 nodes");
for (const row of audit.nodeRows) {
  if (!row.nodeId || !row.title || !row.module || !row.topic) fail("node row missing identity fields");
  if (row.localEvidenceCount < 2) fail(`${row.nodeId} missing local evidence`);
  if (row.modulePublicEvidenceDocs < 12) fail(`${row.nodeId} missing module public evidence`);
  if (row.moduleWikipediaEvidenceDocs < 1) fail(`${row.nodeId} missing module Wikipedia evidence`);
  if (row.learnerCitationApproved !== false) fail(`${row.nodeId} learner citation must remain unapproved`);
  if (row.writeAllowedNow !== false) fail(`${row.nodeId} must not allow writes`);
  if (!Array.isArray(row.localEvidence) || row.localEvidence.length < 2) fail(`${row.nodeId} local evidence samples missing`);
  if (!Array.isArray(row.modulePublicEvidenceSamples) || row.modulePublicEvidenceSamples.length < 1) fail(`${row.nodeId} module public samples missing`);
  if (!Array.isArray(row.moduleWikipediaEvidenceSamples) || row.moduleWikipediaEvidenceSamples.length < 1) fail(`${row.nodeId} module Wikipedia samples missing`);
  if (![
    "node_direct_triangulated_not_release_approved",
    "module_grounded_pending_node_specific_public_review",
  ].includes(row.triangulationStatus)) {
    fail(`${row.nodeId} has unexpected triangulation status ${row.triangulationStatus}`);
  }
}

if (!Array.isArray(audit.directTriangulatedSamples) || audit.directTriangulatedSamples.length < 8) {
  fail("direct triangulated samples too small");
}
if (!Array.isArray(audit.nodeSpecificPublicGapSamples) || audit.nodeSpecificPublicGapSamples.length < 12) {
  fail("node-specific public gap samples too small");
}
if (!Array.isArray(audit.commands) || !audit.commands.some((item) => item.includes("check:knowledge-node-source-triangulation-audit"))) {
  fail("commands missing triangulation check");
}

const boundaryText = `${audit.boundary || ""} ${audit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "local private pdfs",
  "wikipedia",
  "source-fit review",
  "module-level grounding",
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
  nodes: audit.nodes,
  localReadyNodes: audit.localReadyNodes,
  directPublicReadyNodes: audit.directPublicReadyNodes,
  directWikipediaReadyNodes: audit.directWikipediaReadyNodes,
  directOfficialReadyNodes: audit.directOfficialReadyNodes,
  directTriangulatedNodes: audit.directTriangulatedNodes,
  moduleGroundedNodes: audit.moduleGroundedNodes,
  attentionNodes: audit.attentionNodes,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
