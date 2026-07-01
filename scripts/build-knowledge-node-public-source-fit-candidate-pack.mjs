import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_CANDIDATE_PACK.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_CANDIDATE_PACK.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function tokensFor(value) {
  const text = String(value || "").toLowerCase();
  const latin = text.match(/[a-z0-9]{3,}/g) || [];
  const chinese = text.match(/[\u4e00-\u9fff]{2,}/g) || [];
  const chinesePairs = [];
  for (const word of chinese) {
    for (let index = 0; index < word.length - 1; index += 1) {
      chinesePairs.push(word.slice(index, index + 2));
    }
  }
  return [...new Set([...latin, ...chinese, ...chinesePairs])].filter((token) => token.length >= 2);
}

function scoreCandidateForNode(candidate, node) {
  const haystack = [
    candidate.name,
    candidate.url,
    candidate.family,
    candidate.tier,
    ...(candidate.matchedTerms || []),
  ].join(" ").toLowerCase();
  let score = 0;
  for (const token of tokensFor([node.title, node.module, node.topic].join(" ")).slice(0, 40)) {
    if (haystack.includes(token)) score += token.length > 2 ? 2 : 1;
  }
  if (/wikipedia/i.test(candidate.family || candidate.name || candidate.url || "")) score += 8;
  if (/official|public domain/i.test(candidate.family || "")) score += 6;
  if ((candidate.excerptPolicy || "").includes("share_alike")) score += 2;
  return score;
}

function normalizeCandidate(row = {}, sourceRole = "module_public_candidate") {
  return {
    documentId: row.documentId,
    sourceId: row.sourceId,
    name: row.name,
    url: row.url,
    tier: row.tier,
    family: row.family || (String(row.url || "").includes("wikipedia.org") ? "Wikipedia" : "public"),
    matchedTerms: row.matchedTerms || [],
    excerptPolicy: row.excerptPolicy || "cite_and_paraphrase_for_original_lesson",
    sourceRole,
  };
}

const triangulation = readJson("docs/KNOWLEDGE_NODE_SOURCE_TRIANGULATION_AUDIT.json");
const publicGap = readJson("docs/PUBLIC_SOURCE_GAP_AUDIT.json");
const publicAbsorption = readJson("docs/PUBLIC_SOURCE_ABSORPTION_MAP.json");
const wikipediaGrounding = readJson("docs/WIKIPEDIA_GROUNDING_AUDIT.json");

for (const [name, data] of Object.entries({ triangulation, publicGap, publicAbsorption, wikipediaGrounding })) {
  if (data.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${name} must keep productionReady:false`);
}

const publicGapByModule = new Map((publicGap.moduleRows || []).map((row) => [row.module, row]));
const wikiByModule = new Map((wikipediaGrounding.moduleRows || []).map((row) => [row.module, row]));
const absorptionModuleRows = new Map((publicAbsorption.moduleRows || []).map((row) => [row.module, row]));
const publicDocsByModule = new Map();
for (const doc of publicAbsorption.documentRows || []) {
  for (const module of doc.matchedModules || []) {
    if (!publicDocsByModule.has(module)) publicDocsByModule.set(module, []);
    publicDocsByModule.get(module).push(doc);
  }
}

const gapNodes = (triangulation.nodeRows || [])
  .filter((row) => row.triangulationStatus === "module_grounded_pending_node_specific_public_review");

const candidateRows = gapNodes.map((node) => {
  const publicModule = publicGapByModule.get(node.module) || {};
  const wikiModule = wikiByModule.get(node.module) || {};
  const absorptionModule = absorptionModuleRows.get(node.module) || {};
  const modulePublicDocs = publicDocsByModule.get(node.module) || [];
  const existingDirectIds = new Set((node.directPublicEvidence || []).map((row) => row.documentId));
  const rawCandidates = [
    ...(publicModule.wikipediaEvidenceSamples || []).map((row) => normalizeCandidate(row, "module_wikipedia_candidate")),
    ...(wikiModule.wikipediaSamples || []).map((row) => normalizeCandidate(row, "wikipedia_grounding_candidate")),
    ...modulePublicDocs
      .filter((row) => row.isOfficialLike)
      .slice(0, 12)
      .map((row) => normalizeCandidate(row, "module_official_candidate")),
    ...modulePublicDocs
      .filter((row) => !row.isWikipedia && !row.isOfficialLike)
      .slice(0, 12)
      .map((row) => normalizeCandidate(row, "module_public_non_wiki_candidate")),
    ...(publicModule.evidenceSamples || []).map((row) => normalizeCandidate(row, "module_public_candidate")),
    ...(absorptionModule.sampleDocuments || []).map((row) => normalizeCandidate(row, "public_absorption_module_sample")),
  ].filter((row) => row.documentId && !existingDirectIds.has(row.documentId));
  const deduped = [];
  const seen = new Set();
  for (const candidate of rawCandidates) {
    if (seen.has(candidate.documentId)) continue;
    seen.add(candidate.documentId);
    deduped.push(candidate);
  }
  const rankedCandidates = deduped
    .map((candidate) => ({
      ...candidate,
      fitScore: scoreCandidateForNode(candidate, node),
      reviewerDecision: "pending",
      learnerCitationApproved: false,
      requiredAction: "review_source_role_and_fit_before_any_lesson_write",
    }))
    .sort((left, right) => right.fitScore - left.fitScore || String(left.name).localeCompare(String(right.name)));
  const requiredCandidates = [];
  for (const predicate of [
    (row) => /wikipedia/i.test(`${row.family} ${row.name} ${row.url}`),
    (row) => /official|public domain/i.test(row.family || ""),
    (row) => !/wikipedia|official|public domain/i.test(`${row.family} ${row.name} ${row.url}`),
  ]) {
    const candidate = rankedCandidates.find((row) => predicate(row));
    if (candidate && !requiredCandidates.some((row) => row.documentId === candidate.documentId)) requiredCandidates.push(candidate);
  }
  const candidates = [
    ...requiredCandidates,
    ...rankedCandidates.filter((row) => !requiredCandidates.some((candidate) => candidate.documentId === row.documentId)),
  ].slice(0, 6);
  return {
    nodeId: node.nodeId,
    title: node.title,
    module: node.module,
    topic: node.topic,
    currentDirectPublicEvidenceCount: node.directPublicEvidenceCount,
    currentDirectWikipediaEvidenceCount: node.directWikipediaEvidenceCount,
    currentDirectOfficialEvidenceCount: node.directOfficialEvidenceCount,
    modulePublicEvidenceDocs: node.modulePublicEvidenceDocs,
    moduleWikipediaEvidenceDocs: node.moduleWikipediaEvidenceDocs,
    candidateCount: candidates.length,
    wikipediaCandidateCount: candidates.filter((row) => /wikipedia/i.test(`${row.family} ${row.name} ${row.url}`)).length,
    officialCandidateCount: candidates.filter((row) => /official|public domain/i.test(row.family || "")).length,
    candidates,
    candidatePackStatus: candidates.length >= 2
      ? "node_public_source_fit_candidates_ready_for_reviewer"
      : "node_public_source_fit_candidates_attention_required",
    nextGate: "reviewer_accepts_or_rejects_candidate_source_roles_then_rerun_triangulation",
  };
});

const readyRows = candidateRows.filter((row) => row.candidatePackStatus === "node_public_source_fit_candidates_ready_for_reviewer");
const attentionRows = candidateRows.filter((row) => row.candidatePackStatus !== "node_public_source_fit_candidates_ready_for_reviewer");
const modules = new Map();
for (const row of candidateRows) {
  const moduleRow = modules.get(row.module) || {
    module: row.module,
    nodesNeedingDirectTriangulation: 0,
    readyCandidateRows: 0,
    attentionCandidateRows: 0,
    totalCandidates: 0,
    wikipediaCandidates: 0,
    officialCandidates: 0,
    sampleRows: [],
  };
  moduleRow.nodesNeedingDirectTriangulation += 1;
  moduleRow.totalCandidates += row.candidateCount;
  moduleRow.wikipediaCandidates += row.wikipediaCandidateCount;
  moduleRow.officialCandidates += row.officialCandidateCount;
  if (row.candidatePackStatus === "node_public_source_fit_candidates_ready_for_reviewer") moduleRow.readyCandidateRows += 1;
  else moduleRow.attentionCandidateRows += 1;
  if (moduleRow.sampleRows.length < 4) {
    moduleRow.sampleRows.push({
      nodeId: row.nodeId,
      title: row.title,
      candidateCount: row.candidateCount,
    });
  }
  modules.set(row.module, moduleRow);
}

const pack = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packStatus: "node_public_source_fit_candidate_pack_ready_for_reviewer_release_blocked",
  packMode: "promote_module_public_grounding_to_node_specific_source_fit_candidates",
  nodes: triangulation.nodes,
  directTriangulatedNodes: triangulation.directTriangulatedNodes,
  candidateTargetNodes: candidateRows.length,
  readyCandidateRows: readyRows.length,
  attentionCandidateRows: attentionRows.length,
  totalCandidates: candidateRows.reduce((sum, row) => sum + row.candidateCount, 0),
  wikipediaCandidates: candidateRows.reduce((sum, row) => sum + row.wikipediaCandidateCount, 0),
  officialCandidates: candidateRows.reduce((sum, row) => sum + row.officialCandidateCount, 0),
  learnerCitationApprovedCandidates: 0,
  reviewerAcceptedCandidates: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  moduleRows: [...modules.values()].sort((left, right) => right.nodesNeedingDirectTriangulation - left.nodesNeedingDirectTriangulation || left.module.localeCompare(right.module, "zh-Hans-CN")),
  candidateRows,
  attentionRows,
  sampleCandidateRows: candidateRows.slice(0, 20),
  commands: [
    "npm.cmd run check:knowledge-node-public-source-fit-candidate-pack",
    "npm.cmd run check:knowledge-node-source-triangulation-audit",
    "npm.cmd run verify",
  ],
  completionRule: "This pack only proposes node-specific public/Wikipedia/official source-fit candidates for reviewer review. It does not accept sources, approve learner-facing citations, write lessons, or change triangulation counts until human source-role decisions are recorded and the triangulation audit is rerun.",
  boundary: "Node public source-fit candidate pack is reviewer-facing education-only governance. Public/Wikipedia/official candidates support source-role review and original lesson rewriting only; this does not approve copied text, learner-facing citations, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Knowledge Node Public Source-Fit Candidate Pack",
  "",
  "Promotes module-level public grounding into node-specific reviewer candidates.",
  "",
  `- Pack status: ${pack.packStatus}`,
  `- Direct triangulated nodes: ${pack.directTriangulatedNodes}/${pack.nodes}`,
  `- Candidate target nodes: ${pack.candidateTargetNodes}`,
  `- Ready candidate rows: ${pack.readyCandidateRows}`,
  `- Attention candidate rows: ${pack.attentionCandidateRows}`,
  `- Total candidates: ${pack.totalCandidates}`,
  `- Wikipedia candidates: ${pack.wikipediaCandidates}`,
  `- Official candidates: ${pack.officialCandidates}`,
  `- Learner citation approved candidates: ${pack.learnerCitationApprovedCandidates}`,
  `- Write allowed now: ${pack.writeAllowedNow}`,
  "",
  "## Module Rows",
  "",
  "| Module | Target nodes | Ready | Attention | Candidates | Wikipedia | Official |",
  "|---|---:|---:|---:|---:|---:|---:|",
  ...pack.moduleRows.map((row) => `| ${row.module} | ${row.nodesNeedingDirectTriangulation} | ${row.readyCandidateRows} | ${row.attentionCandidateRows} | ${row.totalCandidates} | ${row.wikipediaCandidates} | ${row.officialCandidates} |`),
  "",
  "## Boundary",
  "",
  pack.boundary,
  "",
].join("\n"), "utf8");

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
  outputJson,
  outputMd,
}, null, 2));
