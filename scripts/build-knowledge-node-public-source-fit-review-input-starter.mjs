import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_STARTER.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_STARTER.md";
const draftJson = "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT.json";
const draftMd = "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const pack = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_CANDIDATE_PACK.json");
if (pack.educationOnly !== true) fail("candidate pack must keep educationOnly:true");
if (pack.productionReady !== false) fail("candidate pack must keep productionReady:false");
if (pack.writeAllowedNow !== false) fail("candidate pack must not allow writes");

const reviewRows = [];
for (const row of pack.candidateRows || []) {
  for (const candidate of row.candidates || []) {
    reviewRows.push({
      reviewId: `${row.nodeId}::${candidate.documentId}`,
      nodeId: row.nodeId,
      title: row.title,
      module: row.module,
      topic: row.topic,
      documentId: candidate.documentId,
      sourceId: candidate.sourceId,
      name: candidate.name,
      url: candidate.url,
      tier: candidate.tier,
      family: candidate.family,
      sourceRole: candidate.sourceRole,
      excerptPolicy: candidate.excerptPolicy,
      fitScore: candidate.fitScore,
      reviewerDecision: "",
      sourceFitNotes: "",
      citationUse: "",
      reviewerName: "",
      reviewedAt: "",
      learnerCitationApproved: false,
      copiedTextApproved: false,
      realHumanInput: false,
      requiredDecisionValues: ["accept_for_node_source_fit", "reject_for_node_source_fit", "background_only"],
      boundary: "Reviewer must decide source role and fit. Do not approve copied text, trading advice, signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
    });
  }
}

const draft = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  inputStatus: "blank_node_public_source_fit_review_input_ready_for_human",
  inputMode: "human_reviewer_source_fit_decisions_required",
  sourcePackPath: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_CANDIDATE_PACK.json",
  candidateTargetNodes: pack.candidateTargetNodes,
  reviewRows: reviewRows.length,
  readyReviewRows: 0,
  blockedReviewRows: reviewRows.length,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  copiedTextApprovedRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  rows: reviewRows,
  allowedDecisionValues: ["accept_for_node_source_fit", "reject_for_node_source_fit", "background_only"],
  completionRule: "Every row requires a real human reviewer decision, source-fit note, citation use, reviewer name, and reviewedAt timestamp before it can affect triangulation or learner-facing citations.",
  boundary: "Node public source-fit review input is reviewer-facing education-only governance. It does not approve copied text, learner-facing citations, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

const starter = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  starterStatus: "node_public_source_fit_review_input_starter_ready_blank",
  candidateTargetNodes: pack.candidateTargetNodes,
  reviewRows: reviewRows.length,
  readyReviewRows: 0,
  blockedReviewRows: reviewRows.length,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  copiedTextApprovedRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  draftInputPath: draftJson,
  draftInputMarkdownPath: draftMd,
  commands: [
    "npm.cmd run validate:knowledge-node-public-source-fit-review-input",
    "npm.cmd run check:knowledge-node-public-source-fit-review-input-validation",
    "npm.cmd run check:knowledge-node-public-source-fit-candidate-pack",
  ],
  completionRule: draft.completionRule,
  boundary: draft.boundary,
};

fs.mkdirSync("docs/reviewer-inputs", { recursive: true });
fs.writeFileSync(draftJson, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
fs.writeFileSync(draftMd, [
  "# Knowledge Node Public Source-Fit Review Input Draft",
  "",
  `- Input status: ${draft.inputStatus}`,
  `- Candidate target nodes: ${draft.candidateTargetNodes}`,
  `- Review rows: ${draft.reviewRows}`,
  `- Ready rows: ${draft.readyReviewRows}`,
  `- Blocked rows: ${draft.blockedReviewRows}`,
  `- Real human input entries: ${draft.realHumanInputEntries}`,
  `- Write allowed now: ${draft.writeAllowedNow}`,
  "",
  "## Reviewer Instructions",
  "",
  "- Fill `reviewerDecision` with one of: `accept_for_node_source_fit`, `reject_for_node_source_fit`, `background_only`.",
  "- Fill `sourceFitNotes`, `citationUse`, `reviewerName`, and `reviewedAt` for every row.",
  "- Keep `learnerCitationApproved:false` unless a separate release approval gate explicitly allows it.",
  "- Keep `copiedTextApproved:false`; accepted sources support original rewriting, not copied text.",
  "",
  "## Sample Rows",
  "",
  ...draft.rows.slice(0, 20).map((row) => `- ${row.reviewId}: ${row.module} / ${row.topic} -> ${row.name}`),
  "",
  "## Boundary",
  "",
  draft.boundary,
  "",
].join("\n"), "utf8");

fs.writeFileSync(outputJson, `${JSON.stringify(starter, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Knowledge Node Public Source-Fit Review Input Starter",
  "",
  `- Starter status: ${starter.starterStatus}`,
  `- Candidate target nodes: ${starter.candidateTargetNodes}`,
  `- Review rows: ${starter.reviewRows}`,
  `- Blocked rows: ${starter.blockedReviewRows}`,
  `- Draft input: ${starter.draftInputPath}`,
  `- Write allowed now: ${starter.writeAllowedNow}`,
  "",
  "## Boundary",
  "",
  starter.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: starter.educationOnly,
  productionReady: starter.productionReady,
  learnerFacingRelease: starter.learnerFacingRelease,
  approvalStatus: starter.approvalStatus,
  starterStatus: starter.starterStatus,
  candidateTargetNodes: starter.candidateTargetNodes,
  reviewRows: starter.reviewRows,
  readyReviewRows: starter.readyReviewRows,
  blockedReviewRows: starter.blockedReviewRows,
  realHumanInputEntries: starter.realHumanInputEntries,
  writeAllowedNow: starter.writeAllowedNow,
  outputJson,
  outputMd,
  draftJson,
  draftMd,
}, null, 2));
