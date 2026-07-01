import fs from "node:fs";

const packPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_CANDIDATE_PACK.json";
const packMdPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_CANDIDATE_PACK.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const pack = readJson(packPath);
if (!fs.existsSync(packMdPath)) fail(`missing ${packMdPath}`);

if (pack.educationOnly !== true) fail("candidate pack must keep educationOnly:true");
if (pack.productionReady !== false) fail("candidate pack must keep productionReady:false");
if (pack.learnerFacingRelease !== false) fail("candidate pack must keep learnerFacingRelease:false");
if (pack.approvalStatus !== "not_approved") fail("candidate pack must remain not_approved");
if (pack.packStatus !== "node_public_source_fit_candidate_pack_ready_for_reviewer_release_blocked") {
  fail(`unexpected packStatus: ${pack.packStatus}`);
}
if (pack.packMode !== "promote_module_public_grounding_to_node_specific_source_fit_candidates") fail("unexpected packMode");
if (pack.nodes !== 360) fail(`expected 360 nodes, got ${pack.nodes}`);
if (pack.directTriangulatedNodes < 80) fail("direct triangulated node baseline drifted");
if (pack.candidateTargetNodes !== 273) fail(`expected 273 target nodes, got ${pack.candidateTargetNodes}`);
if (pack.readyCandidateRows !== 273) fail(`expected 273 ready candidate rows, got ${pack.readyCandidateRows}`);
if (pack.attentionCandidateRows !== 0) fail("candidate pack should not have attention rows");
if (pack.totalCandidates < 1600) fail("total candidates too small");
if (pack.wikipediaCandidates < 1000) fail("Wikipedia candidates too small");
if (pack.officialCandidates < 200) fail("official candidates too small");
if (pack.learnerCitationApprovedCandidates !== 0) fail("learner citations must remain unapproved");
if (pack.reviewerAcceptedCandidates !== 0) fail("reviewer accepted candidates must remain zero");
if (pack.writeAllowedNow !== false) fail("candidate pack must not allow writes");
if (pack.manualAuthorizationRequired !== true) fail("manual authorization must be required");

if (!Array.isArray(pack.moduleRows) || pack.moduleRows.length < 10) fail("moduleRows too small");
if (!pack.moduleRows.every((row) => row.nodesNeedingDirectTriangulation > 0 && row.readyCandidateRows === row.nodesNeedingDirectTriangulation)) {
  fail("every module row must have ready candidates for its target nodes");
}
if (!Array.isArray(pack.candidateRows) || pack.candidateRows.length !== 273) fail("candidateRows must contain 273 target nodes");
for (const row of pack.candidateRows) {
  if (!row.nodeId || !row.title || !row.module || !row.topic) fail("candidate row missing node identity");
  if (row.candidateCount < 2) fail(`${row.nodeId} needs at least two candidates`);
  if (!Array.isArray(row.candidates) || row.candidates.length !== row.candidateCount) fail(`${row.nodeId} candidate count mismatch`);
  if (row.candidatePackStatus !== "node_public_source_fit_candidates_ready_for_reviewer") fail(`${row.nodeId} should be ready for reviewer`);
  if (!/reviewer_accepts_or_rejects/.test(row.nextGate || "")) fail(`${row.nodeId} next gate must require reviewer decision`);
  for (const candidate of row.candidates) {
    if (!candidate.documentId || !candidate.sourceId || !candidate.name || !candidate.url) fail(`${row.nodeId} candidate missing identity`);
    if (candidate.reviewerDecision !== "pending") fail(`${row.nodeId} candidate must remain pending`);
    if (candidate.learnerCitationApproved !== false) fail(`${row.nodeId} candidate citation must remain unapproved`);
    if (!/review_source_role_and_fit/.test(candidate.requiredAction || "")) fail(`${row.nodeId} candidate missing source-role action`);
  }
}
if (!Array.isArray(pack.attentionRows) || pack.attentionRows.length !== 0) fail("attentionRows must be empty");
if (!Array.isArray(pack.sampleCandidateRows) || pack.sampleCandidateRows.length < 12) fail("sample candidate rows too small");
if (!Array.isArray(pack.commands) || !pack.commands.some((item) => item.includes("check:knowledge-node-public-source-fit-candidate-pack"))) {
  fail("commands missing candidate pack check");
}

const boundaryText = `${pack.boundary || ""} ${pack.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "public/wikipedia/official",
  "source-role review",
  "does not accept sources",
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
  educationOnly: pack.educationOnly,
  productionReady: pack.productionReady,
  learnerFacingRelease: pack.learnerFacingRelease,
  approvalStatus: pack.approvalStatus,
  packStatus: pack.packStatus,
  candidateTargetNodes: pack.candidateTargetNodes,
  readyCandidateRows: pack.readyCandidateRows,
  attentionCandidateRows: pack.attentionCandidateRows,
  totalCandidates: pack.totalCandidates,
  wikipediaCandidates: pack.wikipediaCandidates,
  officialCandidates: pack.officialCandidates,
  writeAllowedNow: pack.writeAllowedNow,
}, null, 2));
