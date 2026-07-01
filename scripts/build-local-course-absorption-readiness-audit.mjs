import fs from "node:fs";

const outputJsonPath = "docs/LOCAL_COURSE_ABSORPTION_READINESS_AUDIT.json";
const outputMdPath = "docs/LOCAL_COURSE_ABSORPTION_READINESS_AUDIT.md";

const sources = {
  harvest: "docs/LOCAL_INVESTMENT_COURSE_HARVEST_REPORT.json",
  coverage: "docs/LOCAL_COURSE_KNOWLEDGE_COVERAGE.json",
  sourceQuality: "docs/LOCAL_COURSE_SOURCE_QUALITY_AUDIT.json",
  publicSourceGap: "docs/PUBLIC_SOURCE_GAP_AUDIT.json",
  rewriteBatchIndex: "docs/LOCAL_COURSE_REWRITE_BATCH_INDEX.json",
  rewriteReview: "docs/LOCAL_COURSE_REWRITE_REVIEW_REPORT.json",
  refinementPacket: "docs/LOCAL_COURSE_REFINEMENT_PACKET.json",
  transcriptIntake: "docs/LOCAL_COURSE_LOW_EXTRACTION_TRANSCRIPT_INTAKE.json",
  manualTranscriptionPack: "docs/LOCAL_COURSE_LOW_EXTRACTION_MANUAL_TRANSCRIPTION_PACK.json",
  sourceReplacementPack: "docs/LOCAL_COURSE_LOW_EXTRACTION_SOURCE_REPLACEMENT_PACK.json",
};

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function requireBoundary(name, data) {
  if (data.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${name} must keep productionReady:false`);
}

const harvest = readJson(sources.harvest);
const coverage = readJson(sources.coverage);
const sourceQuality = readJson(sources.sourceQuality);
const publicSourceGap = readJson(sources.publicSourceGap);
const rewriteBatchIndex = readJson(sources.rewriteBatchIndex);
const rewriteReview = readJson(sources.rewriteReview);
const refinementPacket = readJson(sources.refinementPacket);
const transcriptIntake = readJson(sources.transcriptIntake);
const manualTranscriptionPack = readJson(sources.manualTranscriptionPack);
const sourceReplacementPack = readJson(sources.sourceReplacementPack);

for (const [name, data] of Object.entries({
  harvest,
  coverage,
  sourceQuality,
  publicSourceGap,
  rewriteBatchIndex,
  rewriteReview,
  refinementPacket,
  transcriptIntake,
  manualTranscriptionPack,
  sourceReplacementPack,
})) {
  requireBoundary(name, data);
}

const blockers = [
  {
    id: "manual_transcription_pages",
    label: "Visible low-extraction pages still need human transcription",
    count: manualTranscriptionPack.manualTranscriptionPages || 0,
    status: (manualTranscriptionPack.acceptedTranscriptPages || 0) === (manualTranscriptionPack.manualTranscriptionPages || 0)
      ? "cleared"
      : "blocked",
    nextAction: "Fill human transcription and summaries, then rerun source-fit, public-grounding, and originality review.",
  },
  {
    id: "blank_source_replacement_pages",
    label: "Blank-preview source pages need source replacement or re-export",
    count: sourceReplacementPack.replacementCandidates || 0,
    status: (sourceReplacementPack.replacementCandidates || 0) === 0 ? "cleared" : "blocked",
    nextAction: "Locate original PDFs or cleaner exports, replace/re-export, and regenerate harvest, quality, visual review, and intake reports.",
  },
  {
    id: "risky_language_docs",
    label: "Risky-language local PDFs require reviewer handling",
    count: sourceQuality.forbiddenLanguageDocs || 0,
    status: (sourceQuality.forbiddenLanguageDocs || 0) === 0 ? "cleared" : "review_required",
    nextAction: "Ensure risky phrasing is paraphrased into education-only wording with no advice, signals, or performance claims.",
  },
  {
    id: "reviewer_refinement_candidates",
    label: "Local-course assisted drafts still need reviewer refinement and approval",
    count: refinementPacket.candidateCards || 0,
    status: refinementPacket.approvalStatus === "approved" ? "cleared" : "blocked",
    nextAction: "Complete reviewer refinement notes, separate approval, source-fit decisions, and release gate before learner-facing use.",
  },
];

const phaseRows = [
  {
    id: "local_pdf_harvest",
    label: "Local PDF harvest",
    status: harvest.pendingAfterRun === 0 && harvest.failed === 0 && harvest.uniquePdfFiles === sourceQuality.importedUniquePdfFiles
      ? "complete_for_research_layer"
      : "gap",
    evidence: `${sourceQuality.importedUniquePdfFiles || 0}/${sourceQuality.uniquePdfFiles || 0} unique PDFs imported; ${harvest.pendingAfterRun || 0} pending; ${harvest.failed || 0} failed.`,
    nextGate: "quality_review_and_rewrite",
  },
  {
    id: "knowledge_module_mapping",
    label: "Knowledge module mapping",
    status: coverage.readyForRewriteReviewNodes === coverage.matchedNodes && coverage.matchedNodes >= 360
      ? "complete_for_rewrite_intake"
      : "gap",
    evidence: `${coverage.readyForRewriteReviewNodes || 0}/${coverage.matchedNodes || 0} matched nodes rewrite-ready across local course evidence.`,
    nextGate: "reviewer_refinement",
  },
  {
    id: "public_grounding",
    label: "Public source grounding",
    status: publicSourceGap.publicReferenceReadyModules === publicSourceGap.modules
      ? "public_reference_ready_for_all_modules"
      : "gap",
    evidence: `${publicSourceGap.publicReferenceReadyModules || 0}/${publicSourceGap.modules || 0} modules public-reference-ready; ${publicSourceGap.wikipediaDocuments || 0} Wikipedia docs; ${publicSourceGap.officialLikeDocuments || 0} official-like docs.`,
    nextGate: "source_fit_review",
  },
  {
    id: "local_rewrite_batches",
    label: "Local-course rewrite batches",
    status: rewriteReview.readyForSeparateReviewCandidates === rewriteBatchIndex.totalDrafts && rewriteReview.copyRiskIssues === 0 && rewriteReview.safetyIssues === 0
      ? "screened_for_separate_review"
      : "gap",
    evidence: `${rewriteBatchIndex.totalDrafts || 0} drafts; ${rewriteReview.readyForSeparateReviewCandidates || 0} ready candidates; copy risks ${rewriteReview.copyRiskIssues || 0}; safety issues ${rewriteReview.safetyIssues || 0}.`,
    nextGate: "human_reviewer_approval",
  },
  {
    id: "low_extraction_recovery",
    label: "Low-extraction recovery",
    status: transcriptIntake.acceptedTranscriptPages === transcriptIntake.totalPages && sourceReplacementPack.replacementCandidates === 0
      ? "cleared"
      : "blocked",
    evidence: `${transcriptIntake.acceptedTranscriptPages || 0}/${transcriptIntake.totalPages || 0} pages accepted; ${manualTranscriptionPack.manualTranscriptionPages || 0} manual pages; ${sourceReplacementPack.replacementCandidates || 0} replacement pages.`,
    nextGate: "human_transcription_and_source_replacement",
  },
  {
    id: "learner_facing_release",
    label: "Learner-facing release",
    status: "not_approved",
    evidence: `Refinement approval=${refinementPacket.approvalStatus}; source quality approval=${sourceQuality.approvalStatus}; public source approval=${publicSourceGap.approvalStatus}.`,
    nextGate: "separate_human_approval_required",
  },
];

const openBlockers = blockers.filter((item) => item.status !== "cleared");
const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  readinessStatus: openBlockers.length ? "blocked_for_learner_facing_absorption" : "ready_for_final_human_release_review",
  sourceRoot: coverage.sourceRoot || harvest.root,
  importedUniquePdfFiles: sourceQuality.importedUniquePdfFiles,
  uniquePdfFiles: sourceQuality.uniquePdfFiles,
  localCourseDocuments: coverage.documents,
  localCourseChunks: coverage.chunks,
  matchedKnowledgeNodes: coverage.matchedNodes,
  readyForRewriteReviewNodes: coverage.readyForRewriteReviewNodes,
  publicCorpusDocuments: publicSourceGap.publicCorpusDocuments,
  wikipediaDocuments: publicSourceGap.wikipediaDocuments,
  officialLikeDocuments: publicSourceGap.officialLikeDocuments,
  publicReferenceReadyModules: publicSourceGap.publicReferenceReadyModules,
  modules: publicSourceGap.modules,
  rewriteDrafts: rewriteBatchIndex.totalDrafts,
  reviewerCandidates: refinementPacket.candidateCards,
  lowExtractionDocs: sourceQuality.lowExtractionDocs,
  manualTranscriptionPages: manualTranscriptionPack.manualTranscriptionPages,
  sourceReplacementCandidates: sourceReplacementPack.replacementCandidates,
  riskyLanguageDocs: sourceQuality.forbiddenLanguageDocs,
  acceptedTranscriptPages: transcriptIntake.acceptedTranscriptPages,
  openBlockers: openBlockers.length,
  phaseRows,
  blockers,
  sourceReports: sources,
  completionRule: "All local PDFs and public materials can be considered absorbed into learner-facing course knowledge only after low-extraction pages are transcribed or replaced, reviewer refinement is approved, risky-language handling is cleared, public grounding/source-fit review passes, and learnerFacingRelease remains explicitly gated until approval.",
  boundary: "Local course absorption readiness audit is an internal education-only self-audit. It separates research-layer ingestion from learner-facing course release and does not approve trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Absorption Readiness Audit",
  "",
  "Self-audit for absorbing local private course PDFs and public reference material into the knowledge workflow.",
  "",
  `- Readiness status: ${audit.readinessStatus}`,
  `- Local unique PDFs imported: ${audit.importedUniquePdfFiles}/${audit.uniquePdfFiles}`,
  `- Knowledge nodes matched: ${audit.readyForRewriteReviewNodes}/${audit.matchedKnowledgeNodes}`,
  `- Public-reference-ready modules: ${audit.publicReferenceReadyModules}/${audit.modules}`,
  `- Rewrite drafts: ${audit.rewriteDrafts}`,
  `- Reviewer candidates: ${audit.reviewerCandidates}`,
  `- Manual transcription pages: ${audit.manualTranscriptionPages}`,
  `- Source replacement candidates: ${audit.sourceReplacementCandidates}`,
  `- Open blockers: ${audit.openBlockers}`,
  "",
  "## Phase Gates",
  "",
  "| Phase | Status | Evidence | Next gate |",
  "| --- | --- | --- | --- |",
  ...phaseRows.map((row) => `| ${row.label} | ${row.status} | ${row.evidence} | ${row.nextGate} |`),
  "",
  "## Blockers",
  "",
  "| Blocker | Status | Count | Next action |",
  "| --- | --- | ---: | --- |",
  ...blockers.map((row) => `| ${row.label} | ${row.status} | ${row.count} | ${row.nextAction} |`),
  "",
  "## Completion Rule",
  "",
  audit.completionRule,
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
  readinessStatus: audit.readinessStatus,
  importedUniquePdfFiles: audit.importedUniquePdfFiles,
  uniquePdfFiles: audit.uniquePdfFiles,
  publicReferenceReadyModules: audit.publicReferenceReadyModules,
  modules: audit.modules,
  manualTranscriptionPages: audit.manualTranscriptionPages,
  sourceReplacementCandidates: audit.sourceReplacementCandidates,
  openBlockers: audit.openBlockers,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
