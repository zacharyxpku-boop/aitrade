import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_EXECUTION_QUEUE.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_EXECUTION_QUEUE.md";
const batchSize = 60;

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
  if (artifact.writeAllowedNow !== false) fail(`${name} must not allow writes`);
}

const pack = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_CANDIDATE_PACK.json");
const starter = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_STARTER.json");
const validation = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_VALIDATION.json");
const reviewGateDashboard = readJson("docs/LOCAL_COURSE_REVIEW_GATE_DASHBOARD.json");

for (const [name, artifact] of Object.entries({ pack, starter, validation, reviewGateDashboard })) {
  assertBoundary(name, artifact);
}

const reviewRowsByModule = new Map();
for (const node of pack.candidateRows || []) {
  for (const candidate of node.candidates || []) {
    const row = {
      reviewId: `${node.nodeId}::${candidate.documentId}`,
      nodeId: node.nodeId,
      title: node.title,
      module: node.module,
      topic: node.topic,
      documentId: candidate.documentId,
      name: candidate.name,
      url: candidate.url,
      family: candidate.family,
      sourceRole: candidate.sourceRole,
      fitScore: candidate.fitScore,
      status: "blocked_missing_real_reviewer_input",
      reviewerDecision: "pending",
      learnerCitationApproved: false,
    };
    if (!reviewRowsByModule.has(node.module)) reviewRowsByModule.set(node.module, []);
    reviewRowsByModule.get(node.module).push(row);
  }
}

const moduleRows = (pack.moduleRows || []).map((moduleRow, index) => {
  const rows = reviewRowsByModule.get(moduleRow.module) || [];
  return {
    order: index + 1,
    module: moduleRow.module,
    targetNodes: moduleRow.nodesNeedingDirectTriangulation,
    reviewRows: rows.length,
    readyRows: 0,
    blockedRows: rows.length,
    wikipediaCandidates: moduleRow.wikipediaCandidates,
    officialCandidates: moduleRow.officialCandidates,
    attentionRows: moduleRow.attentionCandidateRows,
    batchCount: Math.ceil(rows.length / batchSize),
    nextBatchId: "",
    reviewStatus: "blocked_missing_real_reviewer_input",
    nextGate: "fill_real_reviewer_source_fit_decisions_for_module_batches",
  };
});

const batchRows = [];
for (const moduleRow of moduleRows) {
  const rows = reviewRowsByModule.get(moduleRow.module) || [];
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batchNumber = batchRows.length + 1;
    const batch = rows.slice(offset, offset + batchSize);
    const nodeIds = new Set(batch.map((row) => row.nodeId));
    const batchId = `node-public-source-fit-batch-${String(batchNumber).padStart(3, "0")}`;
    batchRows.push({
      order: batchNumber,
      batchId,
      module: moduleRow.module,
      status: "blocked_missing_real_reviewer_input",
      owner: "real_reviewer",
      targetNodes: nodeIds.size,
      reviewRows: batch.length,
      readyRows: 0,
      blockedRows: batch.length,
      wikipediaRows: batch.filter((row) => /wikipedia/i.test(`${row.family} ${row.name} ${row.url}`)).length,
      officialRows: batch.filter((row) => /official|public domain/i.test(row.family || "")).length,
      estimatedMinutes: Math.ceil(batch.length * 2.5),
      command: "npm.cmd run validate:knowledge-node-public-source-fit-review-input && npm.cmd run check:knowledge-node-public-source-fit-review-input-validation",
      inputPath: starter.draftInputPath,
      sampleRows: batch.slice(0, 4).map((row) => ({
        reviewId: row.reviewId,
        nodeId: row.nodeId,
        title: row.title,
        topic: row.topic,
        documentId: row.documentId,
        name: row.name,
        family: row.family,
        fitScore: row.fitScore,
      })),
      nextGate: "real reviewer completes decisions, notes, citationUse, reviewerName, reviewedAt",
    });
  }
}

for (const moduleRow of moduleRows) {
  moduleRow.nextBatchId = (batchRows.find((batch) => batch.module === moduleRow.module) || {}).batchId || "";
}

const queue = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  queueStatus: "node_public_source_fit_review_execution_queue_ready_release_blocked",
  queueMode: "module_batch_review_for_public_source_fit_candidates",
  batchSize,
  modules: moduleRows.length,
  candidateTargetNodes: pack.candidateTargetNodes,
  reviewRows: starter.reviewRows,
  validationStatus: validation.validationStatus,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  missingFieldRows: validation.missingFieldRows,
  forbiddenHitRows: validation.forbiddenHitRows,
  realHumanInputEntries: validation.realHumanInputEntries,
  learnerCitationApprovedRows: validation.learnerCitationApprovedRows,
  copiedTextApprovedRows: validation.copiedTextApprovedRows,
  totalBatches: batchRows.length,
  blockedBatches: batchRows.length,
  readyBatches: 0,
  firstPriorityBatches: batchRows.slice(0, 6),
  moduleRows,
  batchRows,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  upstreamReviewGateStatus: reviewGateDashboard.dashboardStatus,
  reviewerChecklist: [
    "Open the draft input copy and work one batch at a time.",
    "For every row, choose accept_for_node_source_fit, reject_for_node_source_fit, or background_only.",
    "Write sourceFitNotes and citationUse in original words; do not copy source text.",
    "Keep learnerCitationApproved:false unless a separate release approval gate explicitly allows it.",
    "Rerun validation and this queue check after each filled batch.",
  ],
  commands: [
    "npm.cmd run build:knowledge-node-public-source-fit-review-execution-queue",
    "npm.cmd run check:knowledge-node-public-source-fit-review-execution-queue",
    "npm.cmd run validate:knowledge-node-public-source-fit-review-input",
    "npm.cmd run check:knowledge-node-public-source-fit-review-input-validation",
  ],
  completionRule: "The queue is execution planning only. It proves that all 1638 node public source-fit rows are assigned to module batches, but no row can affect triangulation, learner citations, lesson rewriting, or write authorization until real reviewer input passes validation and separate approval gates.",
  boundary: "Node public source-fit review execution queue is reviewer-facing education-only governance. It does not approve sources, copied text, learner-facing citations, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Knowledge Node Public Source-Fit Review Execution Queue",
  "",
  `- Queue status: ${queue.queueStatus}`,
  `- Candidate target nodes: ${queue.candidateTargetNodes}`,
  `- Review rows ready/blocked: ${queue.readyRows}/${queue.blockedRows}`,
  `- Batches ready/blocked: ${queue.readyBatches}/${queue.blockedBatches}`,
  `- Real human input entries: ${queue.realHumanInputEntries}`,
  `- Write allowed now: ${queue.writeAllowedNow}`,
  "",
  "## First Priority Batches",
  "",
  "| Batch | Module | Rows | Nodes | Wiki | Official | Status |",
  "| --- | --- | ---: | ---: | ---: | ---: | --- |",
  ...queue.firstPriorityBatches.map((batch) => `| ${batch.batchId} | ${batch.module} | ${batch.reviewRows} | ${batch.targetNodes} | ${batch.wikipediaRows} | ${batch.officialRows} | ${batch.status} |`),
  "",
  "## Module Queue",
  "",
  "| Module | Nodes | Rows | Batches | Next batch | Status |",
  "| --- | ---: | ---: | ---: | --- | --- |",
  ...queue.moduleRows.map((row) => `| ${row.module} | ${row.targetNodes} | ${row.reviewRows} | ${row.batchCount} | ${row.nextBatchId} | ${row.reviewStatus} |`),
  "",
  "## Reviewer Checklist",
  "",
  ...queue.reviewerChecklist.map((item) => `- ${item}`),
  "",
  "## Completion Rule",
  "",
  queue.completionRule,
  "",
  "## Boundary",
  "",
  queue.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: queue.educationOnly,
  productionReady: queue.productionReady,
  learnerFacingRelease: queue.learnerFacingRelease,
  approvalStatus: queue.approvalStatus,
  queueStatus: queue.queueStatus,
  modules: queue.modules,
  candidateTargetNodes: queue.candidateTargetNodes,
  reviewRows: queue.reviewRows,
  totalBatches: queue.totalBatches,
  blockedBatches: queue.blockedBatches,
  readyRows: queue.readyRows,
  blockedRows: queue.blockedRows,
  realHumanInputEntries: queue.realHumanInputEntries,
  writeAllowedNow: queue.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
