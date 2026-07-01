import fs from "node:fs";

const taskBoardPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_TASK_BOARD.json";
const publicGapPath = "docs/PUBLIC_SOURCE_GAP_AUDIT.json";
const highRiskMatrixPath = "docs/LOCAL_COURSE_HIGH_RISK_PUBLIC_GROUNDING_MATRIX.json";
const outputJson = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_EVIDENCE_PACKET.json";
const outputMd = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_EVIDENCE_PACKET.md";

const REQUIRED_BOUNDARY =
  "Public sources can ground vocabulary and conceptual boundaries. They do not prove a setup, signal, future outcome, strategy edge, or real-money action.";

const FALLBACK_TERMS = [
  "technical analysis",
  "chart",
  "candlestick",
  "support",
  "resistance",
  "price action",
  "market trend",
  "risk management",
];

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(artifact, label) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function taskText(row) {
  return [
    row.id,
    row.taskId,
    row.category,
    row.sourceRelativePath,
    row.sourceModule,
    row.documentId,
    row.candidateId,
    row.candidateSummary,
    ...(row.riskTermFlags || []),
    ...(row.qualityLintRules || []),
    ...(row.uncertainRegions || []),
    ...(row.acceptanceCriteria || []),
  ].join(" ");
}

function refKey(ref) {
  return ref.documentId || ref.sourceId || ref.url || ref.name;
}

function normalizeRef(ref, moduleRow, groundingRole) {
  return {
    documentId: ref.documentId,
    sourceId: ref.sourceId,
    name: ref.name,
    url: ref.url,
    tier: ref.tier,
    family: ref.family || (ref.sourceId || "").split(":")[0] || "",
    score: ref.score || 0,
    matchedTerms: ref.matchedTerms || [],
    excerptPolicy: ref.excerptPolicy,
    sourceModuleId: moduleRow.moduleId,
    sourceModule: moduleRow.module,
    groundingRole,
    reviewerUseOnly: true,
    learnerCitationApproved: false,
  };
}

function uniqueByKey(refs) {
  const seen = new Set();
  return refs.filter((ref) => {
    const key = refKey(ref);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreRefForTask(ref, text) {
  const haystack = normalize(text);
  const terms = [...(ref.matchedTerms || []), ref.name, ref.family, ref.sourceModule].filter(Boolean);
  let score = ref.score || 0;
  for (const term of terms) {
    const lowered = normalize(term);
    if (!lowered) continue;
    if (haystack.includes(lowered)) score += 12;
    for (const part of lowered.split(/[^a-z0-9]+/).filter((item) => item.length >= 4)) {
      if (haystack.includes(part)) score += 2;
    }
  }
  if (/candlestick|kline|ohlc|shadow|body|bullish|bearish|k-line/.test(haystack) &&
    /candlestick|ohlc|technical analysis|chart/.test(normalize(terms.join(" ")))) score += 18;
  if (/support|resistance|retracement|level|target|stop|entry|pending/.test(haystack) &&
    /support|resistance|technical analysis|price action|risk management/.test(normalize(terms.join(" ")))) score += 14;
  if (/cycle|trend|structure|confirmation|signal|case study/.test(haystack) &&
    /market trend|technical analysis|chart pattern|price action|support|resistance/.test(normalize(terms.join(" ")))) score += 10;
  if (/source_replacement|replacement|blank/.test(haystack) &&
    /technical analysis|candlestick|support|resistance|chart/.test(normalize(terms.join(" ")))) score += 8;
  return score;
}

function selectRefsForTask(row, wikipediaRefs, publicContextRefs) {
  const text = taskText(row);
  const scoredWiki = wikipediaRefs
    .map((ref) => ({ ref, taskScore: scoreRefForTask(ref, text) }))
    .sort((a, b) => b.taskScore - a.taskScore || (b.ref.score || 0) - (a.ref.score || 0))
    .map((item) => item.ref);
  const scoredPublic = publicContextRefs
    .map((ref) => ({ ref, taskScore: scoreRefForTask(ref, text) }))
    .sort((a, b) => b.taskScore - a.taskScore || (b.ref.score || 0) - (a.ref.score || 0))
    .map((item) => item.ref);

  const selected = [];
  selected.push(...scoredWiki.slice(0, 3));
  selected.push(...scoredPublic.slice(0, 2));
  selected.push(...scoredWiki.slice(3, 4));

  const uniqueSelected = uniqueByKey(selected).slice(0, 6);
  const wikiCount = uniqueSelected.filter((ref) => ref.tier === "share_alike" || ref.family === "Wikipedia").length;
  const publicCount = uniqueSelected.filter((ref) => ref.tier !== "share_alike" && ref.family !== "Wikipedia").length;

  if (wikiCount < 1) uniqueSelected.unshift(scoredWiki[0]);
  if (publicCount < 1) uniqueSelected.push(scoredPublic[0]);

  return uniqueByKey(uniqueSelected.filter(Boolean)).slice(0, 6);
}

const taskBoard = readJson(taskBoardPath);
const publicGap = readJson(publicGapPath);
const highRiskMatrix = readJson(highRiskMatrixPath);

assertBoundary(taskBoard, "task board");
assertBoundary(publicGap, "public gap audit");
assertBoundary(highRiskMatrix, "high-risk public grounding matrix");

const wikipediaRefs = uniqueByKey((publicGap.moduleRows || []).flatMap((moduleRow) =>
  (moduleRow.wikipediaEvidenceSamples || [])
    .map((ref) => normalizeRef(ref, moduleRow, "terminology_taxonomy_and_boundary_reference"))));
const publicContextRefs = uniqueByKey((publicGap.moduleRows || []).flatMap((moduleRow) =>
  (moduleRow.evidenceSamples || [])
    .filter((ref) => ref.tier !== "share_alike" && ref.family !== "Wikipedia")
    .map((ref) => normalizeRef(ref, moduleRow, "open_research_or_public_context_reference"))));

const genericWiki = wikipediaRefs.filter((ref) =>
  FALLBACK_TERMS.some((term) => normalize([ref.name, ...(ref.matchedTerms || [])].join(" ")).includes(term)));
const genericPublic = publicContextRefs.filter((ref) =>
  FALLBACK_TERMS.some((term) => normalize([ref.name, ...(ref.matchedTerms || [])].join(" ")).includes(term)));

const taskRows = (taskBoard.taskRows || []).map((row) => {
  const suggested = selectRefsForTask(
    row,
    wikipediaRefs.length ? wikipediaRefs : genericWiki,
    publicContextRefs.length ? publicContextRefs : genericPublic,
  );
  const filledSuggestions = suggested.length >= 3
    ? suggested
    : uniqueByKey([...suggested, ...genericWiki, ...genericPublic]).slice(0, 6);
  const wikipediaRefCount = filledSuggestions.filter((ref) => ref.tier === "share_alike" || ref.family === "Wikipedia").length;
  const publicContextRefCount = filledSuggestions.filter((ref) => ref.tier !== "share_alike" && ref.family !== "Wikipedia").length;
  return {
    order: row.order,
    id: row.id,
    taskId: row.taskId,
    category: row.category,
    sourceRelativePath: row.sourceRelativePath,
    sourceModule: row.sourceModule,
    documentId: row.documentId,
    pageNumber: row.pageNumber,
    candidateId: row.candidateId,
    candidateSummary: row.candidateSummary,
    riskTermFlags: row.riskTermFlags || [],
    suggestedPublicRefs: filledSuggestions,
    suggestedRefCount: filledSuggestions.length,
    wikipediaRefCount,
    publicContextRefCount,
    sourceFitPrompt: "Reviewer: compare the private-course page against these public refs only for terminology, taxonomy, historical/source claims, and safety boundaries. Do not treat a public ref as approval to copy private or public wording.",
    publicReferenceNotesPrompt: "Fill publicReferenceNotes with the refs that actually support neutral vocabulary or source-boundary claims. Mark weak, irrelevant, or license-sensitive refs as reviewer-only.",
    claimBoundary: REQUIRED_BOUNDARY,
    learnerCitationApproved: false,
    approvalStatus: "not_approved",
    learnerFacingRelease: false,
    nextGate: "real_reviewer_source_fit_note_then_validation",
  };
});

const packet = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packetStatus: "p0_real_reviewer_evidence_packet_ready_not_reviewed",
  packetMode: "public_grounding_suggestions_for_p0_reviewer_tasks",
  sourceTaskBoard: taskBoardPath,
  sourcePublicGapAudit: publicGapPath,
  sourceHighRiskPublicGroundingMatrix: highRiskMatrixPath,
  totalTasks: taskRows.length,
  tasksWithSuggestedRefs: taskRows.filter((row) => row.suggestedRefCount >= 3).length,
  totalSuggestedRefs: taskRows.reduce((sum, row) => sum + row.suggestedRefCount, 0),
  tasksWithWikipediaRefs: taskRows.filter((row) => row.wikipediaRefCount >= 1).length,
  tasksWithPublicContextRefs: taskRows.filter((row) => row.publicContextRefCount >= 1).length,
  learnerCitationApprovedTasks: 0,
  realHumanInputEntries: taskBoard.realHumanInputEntries || 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  taskRows,
  commands: [
    "npm.cmd run build:local-course-p0-real-reviewer-evidence-packet",
    "npm.cmd run check:local-course-p0-real-reviewer-evidence-packet",
    "npm.cmd run check:local-course-p0-real-reviewer-task-board",
    "npm.cmd run check:local-course-p0-real-reviewer-input-starter",
  ],
  completionRule: "This packet gives reviewers public grounding suggestions for all 22 P0 tasks. It does not fill sourceFitNote or publicReferenceNotes, does not create real reviewer judgment, does not approve learner-facing citations, and does not authorize overlay writes.",
  boundary: "P0 real reviewer evidence packet is reviewer-facing education-only operations material. Public and Wikipedia refs support terminology, taxonomy, historical/source-claim review, and originality-safe rewrite boundaries; they do not prove a setup, signal, future outcome, strategy edge, real-money action, stock recommendation, live signal, return promise, broker workflow, or automation.",
};

fs.writeFileSync(outputJson, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course P0 Real Reviewer Evidence Packet",
  "",
  `- Status: ${packet.packetStatus}`,
  `- Tasks: ${packet.totalTasks}`,
  `- Tasks with suggested refs: ${packet.tasksWithSuggestedRefs}`,
  `- Tasks with Wikipedia refs: ${packet.tasksWithWikipediaRefs}`,
  `- Tasks with public context refs: ${packet.tasksWithPublicContextRefs}`,
  `- Total suggested refs: ${packet.totalSuggestedRefs}`,
  `- Learner citation approved tasks: ${packet.learnerCitationApprovedTasks}`,
  `- Write allowed now: ${packet.writeAllowedNow}`,
  "",
  "## Task Rows",
  "",
  "| # | Task | Category | Wiki | Public | Suggested refs | Next gate |",
  "|---:|---|---|---:|---:|---:|---|",
  ...taskRows.map((row) => `| ${row.order} | ${row.id} | ${row.category} | ${row.wikipediaRefCount} | ${row.publicContextRefCount} | ${row.suggestedRefCount} | ${row.nextGate} |`),
  "",
  "## Boundary",
  "",
  packet.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: packet.educationOnly,
  productionReady: packet.productionReady,
  learnerFacingRelease: packet.learnerFacingRelease,
  approvalStatus: packet.approvalStatus,
  packetStatus: packet.packetStatus,
  totalTasks: packet.totalTasks,
  tasksWithSuggestedRefs: packet.tasksWithSuggestedRefs,
  tasksWithWikipediaRefs: packet.tasksWithWikipediaRefs,
  tasksWithPublicContextRefs: packet.tasksWithPublicContextRefs,
  totalSuggestedRefs: packet.totalSuggestedRefs,
  learnerCitationApprovedTasks: packet.learnerCitationApprovedTasks,
  realHumanInputEntries: packet.realHumanInputEntries,
  writeAllowedNow: packet.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
