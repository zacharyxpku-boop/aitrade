import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { knowledgeBrowserIndex } = require("../education-knowledge-browser-index.js");

const outputJson = "docs/KNOWLEDGE_NODE_SOURCE_TRIANGULATION_AUDIT.json";
const outputMd = "docs/KNOWLEDGE_NODE_SOURCE_TRIANGULATION_AUDIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function byModule(rows = []) {
  return new Map(rows.map((row) => [row.module, row]));
}

function samplePublicRows(rows, limit = 6) {
  return (rows || []).slice(0, limit).map((row) => ({
    documentId: row.documentId,
    sourceId: row.sourceId,
    name: row.name,
    url: row.url,
    tier: row.tier,
    family: row.family,
    excerptPolicy: row.excerptPolicy,
  }));
}

const localCoverage = readJson("docs/LOCAL_COURSE_KNOWLEDGE_COVERAGE.json");
const publicGap = readJson("docs/PUBLIC_SOURCE_GAP_AUDIT.json");
const publicAbsorption = readJson("docs/PUBLIC_SOURCE_ABSORPTION_MAP.json");
const wikipediaGrounding = readJson("docs/WIKIPEDIA_GROUNDING_AUDIT.json");
const documentAbsorption = readJson("docs/LOCAL_COURSE_DOCUMENT_ABSORPTION_MAP.json");

for (const [name, data] of Object.entries({
  localCoverage,
  publicGap,
  publicAbsorption,
  wikipediaGrounding,
  documentAbsorption,
})) {
  if (data.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${name} must keep productionReady:false`);
}

const localByNode = new Map((localCoverage.nodeMatches || []).map((row) => [row.nodeId, row]));
const publicDocsByNode = new Map();
for (const doc of publicAbsorption.documentRows || []) {
  for (const match of doc.topNodeMatches || []) {
    if (!publicDocsByNode.has(match.nodeId)) publicDocsByNode.set(match.nodeId, []);
    publicDocsByNode.get(match.nodeId).push({
      documentId: doc.documentId,
      sourceId: doc.sourceId,
      name: doc.name,
      url: doc.url,
      tier: doc.tier,
      family: doc.family,
      isWikipedia: doc.isWikipedia,
      isOfficialLike: doc.isOfficialLike,
      excerptPolicy: doc.excerptPolicy,
      score: match.score,
      matchSource: match.matchSource,
    });
  }
}

const publicGapByModule = byModule(publicGap.moduleRows || []);
const wikiAuditByModule = byModule(wikipediaGrounding.moduleRows || []);
const localDocumentRowsById = new Map((documentAbsorption.documentRows || []).map((row) => [row.documentId, row]));

const nodeRows = (knowledgeBrowserIndex.learnerFacingNodes || []).map((node) => {
  const localRow = localByNode.get(node.id) || {};
  const directPublicDocs = (publicDocsByNode.get(node.id) || [])
    .sort((left, right) => (right.score || 0) - (left.score || 0) || String(left.name).localeCompare(String(right.name)));
  const directWikipediaDocs = directPublicDocs.filter((doc) => doc.isWikipedia);
  const directOfficialDocs = directPublicDocs.filter((doc) => doc.isOfficialLike);
  const modulePublic = publicGapByModule.get(node.module) || {};
  const moduleWiki = wikiAuditByModule.get(node.module) || {};
  const localEvidence = (localRow.topMatches || []).slice(0, 5).map((match) => {
    const docRow = localDocumentRowsById.get(match.documentId);
    return {
      documentId: match.documentId,
      name: match.name,
      sourceRelativePath: match.sourceRelativePath,
      sourceModule: match.sourceModule,
      charCount: match.charCount,
      score: match.score,
      extractionBucket: docRow?.extractionBucket,
      useBoundary: match.useBoundary,
    };
  });
  const hasLocal = localEvidence.length >= 2;
  const hasDirectPublic = directPublicDocs.length >= 1;
  const hasDirectWikipedia = directWikipediaDocs.length >= 1;
  const hasDirectOfficial = directOfficialDocs.length >= 1;
  const hasModulePublic = (modulePublic.topPublicEvidenceDocs || 0) >= 12;
  const hasModuleWikipedia = (modulePublic.wikipediaEvidenceDocs || 0) >= 1 || (moduleWiki.wikipediaGroundingDocs || 0) >= 1;
  const hasModuleOfficial = (modulePublic.officialLikeEvidenceDocs || 0) >= 1;
  const triangulationStatus = hasLocal && hasDirectPublic && (hasDirectWikipedia || hasDirectOfficial)
    ? "node_direct_triangulated_not_release_approved"
    : hasLocal && hasModulePublic && hasModuleWikipedia
      ? "module_grounded_pending_node_specific_public_review"
      : "triangulation_attention_required";
  return {
    nodeId: node.id,
    title: node.title,
    module: node.module,
    topic: node.topic,
    reviewStatus: node.reviewStatus,
    localEvidenceCount: localEvidence.length,
    directPublicEvidenceCount: directPublicDocs.length,
    directWikipediaEvidenceCount: directWikipediaDocs.length,
    directOfficialEvidenceCount: directOfficialDocs.length,
    modulePublicEvidenceDocs: modulePublic.topPublicEvidenceDocs || 0,
    moduleWikipediaEvidenceDocs: modulePublic.wikipediaEvidenceDocs || moduleWiki.wikipediaGroundingDocs || 0,
    moduleOfficialLikeEvidenceDocs: modulePublic.officialLikeEvidenceDocs || 0,
    moduleUniqueHosts: modulePublic.uniqueHosts || 0,
    triangulationStatus,
    learnerCitationApproved: false,
    writeAllowedNow: false,
    localEvidence,
    directPublicEvidence: samplePublicRows(directPublicDocs, 5),
    directWikipediaEvidence: samplePublicRows(directWikipediaDocs, 5),
    directOfficialEvidence: samplePublicRows(directOfficialDocs, 5),
    modulePublicEvidenceSamples: (modulePublic.evidenceSamples || []).slice(0, 5),
    moduleWikipediaEvidenceSamples: (modulePublic.wikipediaEvidenceSamples || moduleWiki.wikipediaSamples || []).slice(0, 5),
    nextGate: triangulationStatus === "node_direct_triangulated_not_release_approved"
      ? "reviewer_source_role_selection_originality_review_then_separate_approval"
      : triangulationStatus === "module_grounded_pending_node_specific_public_review"
        ? "promote_module_public_sources_to_node_specific_source_fit_candidates"
        : "add_or_retune_public_sources_then_rerun_triangulation",
  };
});

const modules = knowledgeBrowserIndex.modules.map((module) => {
  const rows = nodeRows.filter((row) => row.module === module.title);
  return {
    moduleId: module.id,
    module: module.title,
    nodes: rows.length,
    localReadyNodes: rows.filter((row) => row.localEvidenceCount >= 2).length,
    directPublicReadyNodes: rows.filter((row) => row.directPublicEvidenceCount >= 1).length,
    directWikipediaReadyNodes: rows.filter((row) => row.directWikipediaEvidenceCount >= 1).length,
    directOfficialReadyNodes: rows.filter((row) => row.directOfficialEvidenceCount >= 1).length,
    directTriangulatedNodes: rows.filter((row) => row.triangulationStatus === "node_direct_triangulated_not_release_approved").length,
    moduleGroundedNodes: rows.filter((row) => row.triangulationStatus !== "triangulation_attention_required").length,
    attentionNodes: rows.filter((row) => row.triangulationStatus === "triangulation_attention_required").length,
  };
});

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  auditStatus: "node_source_triangulation_ready_for_reviewer_release_blocked",
  auditMode: "local_private_plus_public_wikipedia_node_triangulation",
  nodes: nodeRows.length,
  modules: modules.length,
  localReadyNodes: nodeRows.filter((row) => row.localEvidenceCount >= 2).length,
  directPublicReadyNodes: nodeRows.filter((row) => row.directPublicEvidenceCount >= 1).length,
  directWikipediaReadyNodes: nodeRows.filter((row) => row.directWikipediaEvidenceCount >= 1).length,
  directOfficialReadyNodes: nodeRows.filter((row) => row.directOfficialEvidenceCount >= 1).length,
  directTriangulatedNodes: nodeRows.filter((row) => row.triangulationStatus === "node_direct_triangulated_not_release_approved").length,
  moduleGroundedNodes: nodeRows.filter((row) => row.triangulationStatus !== "triangulation_attention_required").length,
  attentionNodes: nodeRows.filter((row) => row.triangulationStatus === "triangulation_attention_required").length,
  learnerCitationApprovedNodes: nodeRows.filter((row) => row.learnerCitationApproved === true).length,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  moduleRows: modules,
  nodeRows,
  directTriangulatedSamples: nodeRows
    .filter((row) => row.triangulationStatus === "node_direct_triangulated_not_release_approved")
    .slice(0, 12),
  nodeSpecificPublicGapSamples: nodeRows
    .filter((row) => row.triangulationStatus === "module_grounded_pending_node_specific_public_review")
    .slice(0, 20),
  commands: [
    "npm.cmd run check:knowledge-node-source-triangulation-audit",
    "npm.cmd run check:local-course-document-absorption-map",
    "npm.cmd run check:public-source-absorption-map",
    "npm.cmd run verify",
  ],
  completionRule: "A node is direct-triangulated only when it has local private course evidence plus node-specific public evidence and node-specific Wikipedia or official evidence. Module-level grounding is useful for reviewer navigation but still requires source-fit review before learner-facing citation or lesson writes.",
  boundary: "Knowledge node source triangulation is reviewer-facing education-only governance. Local private PDFs, Wikipedia, official/public-domain pages, open-access material, and permissive sources support source-fit review and original lesson rewriting only; this does not approve copied text, learner-facing citations, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Knowledge Node Source Triangulation Audit",
  "",
  "Node-level audit separating direct node evidence from module-level public grounding.",
  "",
  `- Audit status: ${audit.auditStatus}`,
  `- Nodes: ${audit.nodes}`,
  `- Local-ready nodes: ${audit.localReadyNodes}/${audit.nodes}`,
  `- Direct public-ready nodes: ${audit.directPublicReadyNodes}/${audit.nodes}`,
  `- Direct Wikipedia-ready nodes: ${audit.directWikipediaReadyNodes}/${audit.nodes}`,
  `- Direct official-ready nodes: ${audit.directOfficialReadyNodes}/${audit.nodes}`,
  `- Direct triangulated nodes: ${audit.directTriangulatedNodes}/${audit.nodes}`,
  `- Module-grounded nodes: ${audit.moduleGroundedNodes}/${audit.nodes}`,
  `- Attention nodes: ${audit.attentionNodes}`,
  `- Learner citation approved nodes: ${audit.learnerCitationApprovedNodes}`,
  `- Write allowed now: ${audit.writeAllowedNow}`,
  "",
  "## Module Rows",
  "",
  "| Module | Nodes | Local | Direct public | Direct wiki | Direct official | Direct triangulated | Module grounded | Attention |",
  "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
  ...modules.map((row) => `| ${row.module} | ${row.nodes} | ${row.localReadyNodes} | ${row.directPublicReadyNodes} | ${row.directWikipediaReadyNodes} | ${row.directOfficialReadyNodes} | ${row.directTriangulatedNodes} | ${row.moduleGroundedNodes} | ${row.attentionNodes} |`),
  "",
  "## Boundary",
  "",
  audit.boundary,
  "",
].join("\n"), "utf8");

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
  outputJson,
  outputMd,
}, null, 2));
