import fs from "node:fs";

const localLedgerPath = "docs/LOCAL_COURSE_FOLDER_ABSORPTION_LEDGER.json";
const publicLedgerPath = "docs/PUBLIC_SOURCE_COVERAGE_LEDGER.json";
const highRiskCockpitPath = "docs/LOCAL_COURSE_HIGH_RISK_REVIEW_COCKPIT.json";
const rowBrowserPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_ROW_BROWSER.json";
const launchDashboardPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REAL_REVIEWER_LAUNCH_DASHBOARD.json";
const outputJsonPath = "docs/KNOWLEDGE_BASE_READINESS_GATE.json";
const outputMdPath = "docs/KNOWLEDGE_BASE_READINESS_GATE.md";

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

const localLedger = readJson(localLedgerPath);
const publicLedger = readJson(publicLedgerPath);
const highRiskCockpit = readJson(highRiskCockpitPath);
const rowBrowser = readJson(rowBrowserPath);
const launchDashboard = readJson(launchDashboardPath);

for (const [name, artifact] of Object.entries({
  localLedger,
  publicLedger,
  highRiskCockpit,
  rowBrowser,
  launchDashboard,
})) {
  assertBoundary(name, artifact);
}

const gateRows = [
  {
    id: "local_folder_absorption",
    label: "Local investment course folder absorption",
    status: localLedger.ledgerStatus,
    passedForInternalReview: localLedger.physicalFiles === 302 &&
      localLedger.physicalPdfFiles === 302 &&
      localLedger.nonPdfFiles === 0 &&
      localLedger.mappedUniquePdfFiles === 298 &&
      localLedger.unmappedUniquePdfFiles === 0,
    learnerFacingBlocked: true,
    evidence: `${localLedger.mappedUniquePdfFiles}/${localLedger.uniquePdfHashes} unique PDFs mapped; ${localLedger.totalDocumentNodeMatches} document-node links.`,
    nextGate: "manual_transcription_source_replacement_and_reviewer_distillation_before_learner_use",
  },
  {
    id: "public_source_absorption",
    label: "Public/Wikipedia/official source absorption",
    status: publicLedger.ledgerStatus,
    passedForInternalReview: publicLedger.mappedPublicDocuments === publicLedger.publicCorpusDocuments &&
      publicLedger.unmappedPublicDocuments === 0 &&
      publicLedger.wikipediaDocuments === 96 &&
      publicLedger.officialLikeDocuments === 202 &&
      publicLedger.moduleGroundedNodes === publicLedger.nodes,
    learnerFacingBlocked: true,
    evidence: `${publicLedger.mappedPublicDocuments}/${publicLedger.publicCorpusDocuments} public docs mapped; ${publicLedger.wikipediaDocuments} Wikipedia; ${publicLedger.officialLikeDocuments} official-like; ${publicLedger.totalPublicDocumentNodeMatches} public node links.`,
    nextGate: "source_fit_real_reviewer_decisions_before_learner_citation",
  },
  {
    id: "node_source_fit_review",
    label: "Node/source-fit real reviewer gate",
    status: rowBrowser.rowBrowserStatus,
    passedForInternalReview: rowBrowser.totalReviewRows === 1638 &&
      rowBrowser.rowsWithUrl === 1638 &&
      launchDashboard.packetHandoffsReady === 35,
    learnerFacingBlocked: rowBrowser.readyRows !== rowBrowser.totalReviewRows,
    evidence: `${rowBrowser.readyRows}/${rowBrowser.totalReviewRows} source-fit rows ready; ${rowBrowser.realHumanInputEntries} real human entries; ${launchDashboard.packetHandoffCoverage} packet handoffs.`,
    nextGate: "fill_1638_real_reviewer_source_fit_rows_validate_merge_preview_then_manual_write_authorization",
  },
  {
    id: "high_risk_lesson_review",
    label: "High-risk lesson human review",
    status: highRiskCockpit.cockpitStatus,
    passedForInternalReview: highRiskCockpit.lessonCount === 12 &&
      highRiskCockpit.codexSelfReviewNotes === 72 &&
      highRiskCockpit.lessonsWithPublicGrounding === 12,
    learnerFacingBlocked: highRiskCockpit.readyReviewerNotes !== highRiskCockpit.expectedReviewerNotes ||
      highRiskCockpit.readyDirectSourceDecisions !== highRiskCockpit.directSourceDecisionCount,
    evidence: `${highRiskCockpit.readyReviewerNotes}/${highRiskCockpit.expectedReviewerNotes} real reviewer notes ready; ${highRiskCockpit.readyDirectSourceDecisions}/${highRiskCockpit.directSourceDecisionCount} direct-source decisions ready.`,
    nextGate: "fill_72_real_reviewer_notes_and_5_direct_source_decisions_then_revalidate",
  },
  {
    id: "release_authorization",
    label: "Learner-facing release and write authorization",
    status: "release_blocked_manual_authorization_required",
    passedForInternalReview: true,
    learnerFacingBlocked: true,
    evidence: "All source artifacts remain approvalStatus:not_approved, learnerFacingRelease:false, productionReady:false, writeAllowedNow:false.",
    nextGate: "separate_exact_path_manual_authorization_after_all_real_review_gates_pass",
  },
];

const internalReadyGates = gateRows.filter((row) => row.passedForInternalReview).length;
const learnerFacingBlockedGates = gateRows.filter((row) => row.learnerFacingBlocked).length;
const allInternalGatesReady = internalReadyGates === gateRows.length;
const learnerFacingReleaseReady = learnerFacingBlockedGates === 0;

const gate = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  readinessStatus: allInternalGatesReady && !learnerFacingReleaseReady
    ? "knowledge_base_internal_review_ready_release_blocked"
    : "knowledge_base_readiness_attention_required",
  knowledgeBaseUsefulnessStatus: "usable_as_internal_reviewer_knowledge_base_not_learner_course",
  gateMode: "local_folder_public_source_source_fit_high_risk_release_gate",
  localSourceRoot: localLedger.sourceRoot,
  localPhysicalFiles: localLedger.physicalFiles,
  localUniquePdfHashes: localLedger.uniquePdfHashes,
  localMappedUniquePdfFiles: localLedger.mappedUniquePdfFiles,
  localUnmappedUniquePdfFiles: localLedger.unmappedUniquePdfFiles,
  localDocumentNodeMatches: localLedger.totalDocumentNodeMatches,
  publicCorpusDocuments: publicLedger.publicCorpusDocuments,
  wikipediaDocuments: publicLedger.wikipediaDocuments,
  officialLikeDocuments: publicLedger.officialLikeDocuments,
  publicMappedDocuments: publicLedger.mappedPublicDocuments,
  publicDocumentNodeMatches: publicLedger.totalPublicDocumentNodeMatches,
  knowledgeNodes: publicLedger.nodes,
  moduleGroundedNodes: publicLedger.moduleGroundedNodes,
  directTriangulatedNodes: publicLedger.directTriangulatedNodes,
  sourceFitReviewRows: rowBrowser.totalReviewRows,
  readySourceFitReviewRows: rowBrowser.readyRows,
  blockedSourceFitReviewRows: rowBrowser.blockedRows,
  realHumanInputEntries: rowBrowser.realHumanInputEntries + highRiskCockpit.realHumanInputEntries,
  highRiskLessons: highRiskCockpit.lessonCount,
  highRiskReadyReviewerNotes: highRiskCockpit.readyReviewerNotes,
  highRiskBlockedReviewerNotes: highRiskCockpit.blockedReviewerNotes,
  highRiskReadyDirectSourceDecisions: highRiskCockpit.readyDirectSourceDecisions,
  highRiskBlockedDirectSourceDecisions: highRiskCockpit.blockedDirectSourceDecisions,
  packetHandoffCoverage: launchDashboard.packetHandoffCoverage,
  reviewerCanStartNow: launchDashboard.reviewerCanStartNow,
  internalReadyGates,
  learnerFacingBlockedGates,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  gateRows,
  nextActionQueue: gateRows
    .filter((row) => row.learnerFacingBlocked)
    .map((row, index) => ({
      order: index + 1,
      gateId: row.id,
      nextGate: row.nextGate,
      evidence: row.evidence,
    })),
  commands: [
    "npm.cmd run build:knowledge-base-readiness-gate",
    "npm.cmd run check:knowledge-base-readiness-gate",
    "npm.cmd run verify",
  ],
  completionRule: "The knowledge base is internally useful when local folder absorption, public source coverage, source-fit packet handoffs, and high-risk review scaffolds are all visible and internally consistent. It becomes learner-facing only after all real human source-fit rows, high-risk reviewer notes, direct-source decisions, merge previews, and exact-path write authorization pass.",
  boundary: "Knowledge base readiness gate is reviewer-facing education-only governance. It summarizes local private course absorption, public/Wikipedia/official source coverage, source-fit review state, and high-risk lesson review state; it does not generate real reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(gate, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge Base Readiness Gate",
  "",
  `- Readiness status: ${gate.readinessStatus}`,
  `- Usefulness status: ${gate.knowledgeBaseUsefulnessStatus}`,
  `- Local mapped PDFs: ${gate.localMappedUniquePdfFiles}/${gate.localUniquePdfHashes}`,
  `- Public mapped docs: ${gate.publicMappedDocuments}/${gate.publicCorpusDocuments}`,
  `- Module-grounded nodes: ${gate.moduleGroundedNodes}/${gate.knowledgeNodes}`,
  `- Source-fit rows ready: ${gate.readySourceFitReviewRows}/${gate.sourceFitReviewRows}`,
  `- High-risk notes ready: ${gate.highRiskReadyReviewerNotes}/${gate.highRiskReadyReviewerNotes + gate.highRiskBlockedReviewerNotes}`,
  `- Real human input entries: ${gate.realHumanInputEntries}`,
  `- Write allowed now: ${gate.writeAllowedNow}`,
  "",
  "## Gate Rows",
  "",
  "| Gate | Internal ready | Learner-facing blocked | Evidence | Next gate |",
  "| --- | --- | --- | --- | --- |",
  ...gateRows.map((row) => `| ${row.label} | ${row.passedForInternalReview} | ${row.learnerFacingBlocked} | ${row.evidence} | ${row.nextGate} |`),
  "",
  "## Boundary",
  "",
  gate.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  readinessStatus: gate.readinessStatus,
  knowledgeBaseUsefulnessStatus: gate.knowledgeBaseUsefulnessStatus,
  localMappedUniquePdfFiles: gate.localMappedUniquePdfFiles,
  publicMappedDocuments: gate.publicMappedDocuments,
  moduleGroundedNodes: gate.moduleGroundedNodes,
  sourceFitReviewRows: gate.sourceFitReviewRows,
  readySourceFitReviewRows: gate.readySourceFitReviewRows,
  highRiskReadyReviewerNotes: gate.highRiskReadyReviewerNotes,
  realHumanInputEntries: gate.realHumanInputEntries,
  writeAllowedNow: gate.writeAllowedNow,
}, null, 2));
