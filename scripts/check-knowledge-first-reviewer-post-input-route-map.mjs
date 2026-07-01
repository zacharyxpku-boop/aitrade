import fs from "node:fs";

const routeMapPath = "docs/KNOWLEDGE_FIRST_REVIEWER_POST_INPUT_ROUTE_MAP.json";
const routeMapMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_POST_INPUT_ROUTE_MAP.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const routeMap = readJson(routeMapPath);
if (!fs.existsSync(routeMapMdPath)) fail(`missing ${routeMapMdPath}`);

if (routeMap.educationOnly !== true) fail("route map must keep educationOnly:true");
if (routeMap.productionReady !== false) fail("route map must keep productionReady:false");
if (routeMap.learnerFacingRelease !== false) fail("route map must keep learnerFacingRelease:false");
if (routeMap.approvalStatus !== "not_approved") fail("route map must remain not_approved");
if (routeMap.routeMapStatus !== "first_reviewer_post_input_route_map_ready_blocked_on_real_input") fail("unexpected routeMapStatus");
if (routeMap.routeMapMode !== "post_reviewer_input_validation_then_locked_merge_and_approval_routes") fail("unexpected routeMapMode");
if (routeMap.cardMatrixStatus !== "first_reviewer_card_status_matrix_ready_all_cards_blocked_on_real_input") fail("card matrix status drift");
if (routeMap.workbenchStatus !== "first_reviewer_workbench_ready_blocked_on_real_input") fail("workbench status drift");
if (routeMap.completionGateStatus !== "first_reviewer_completion_gate_blocked_missing_real_input") fail("completion gate status drift");
if (routeMap.routeRows !== 4 || routeMap.validationRoutes !== 4) fail("expected four post-input validation routes");
if (routeMap.sourceFitMergeRoutes !== 2 || routeMap.highRiskApprovalRoutes !== 1) fail("route type totals drift");
if (routeMap.requiredWorkItems !== 257 || routeMap.readyWorkItems !== 0 || routeMap.blockedWorkItems !== 257) fail("work item totals drift");
if (routeMap.highRiskReviewerNoteFields !== 72 || routeMap.directSourceDecisionFields !== 5 || routeMap.sourceFitReviewRows !== 180) {
  fail("first reviewer field totals drift");
}
if (routeMap.readySourceFitReviewRows !== 0 || routeMap.blockedSourceFitReviewRows !== 180) fail("source-fit readiness totals drift");
if (
  routeMap.realHumanInputEntries !== 0 ||
  routeMap.learnerCitationApprovedRows !== 0 ||
  routeMap.learnerReleaseReadyModules !== 0 ||
  routeMap.readyForSeparateApproval !== false ||
  routeMap.mergeAllowedNow !== false ||
  routeMap.writeAllowedNow !== false
) {
  fail("route map must keep real input/release/merge/write gates locked");
}
if (routeMap.manualAuthorizationRequired !== true) fail("manual authorization gate drift");

if (!Array.isArray(routeMap.routeRowsData) || routeMap.routeRowsData.length !== 4) fail("routeRowsData array missing");
if (!routeMap.routeRowsData.every((row, index) =>
  row.routeRank === index + 1 &&
  row.routeId &&
  row.routeType &&
  row.inputPath &&
  row.validationPath &&
  fs.existsSync(row.inputPath) &&
  fs.existsSync(row.validationPath) &&
  row.requiredItems === row.readyItems + row.blockedItems &&
  row.readyItems === 0 &&
  row.blockedItems > 0 &&
  row.validationCommand &&
  row.postValidationCommand &&
  row.nextGate &&
  row.routeStatus === "route_blocked_missing_real_reviewer_input" &&
  row.mergeAllowedNow === false &&
  row.writeAllowedNow === false
)) {
  fail("route row drift");
}

const [overlayRoute, packet001Route, packet002Route, packet003Route] = routeMap.routeRowsData;
if (overlayRoute.routeId !== "high_risk_overlay_notes_and_direct_sources" || overlayRoute.requiredItems !== 77 || overlayRoute.applyOrMergeCommand !== "") {
  fail("overlay route drift");
}
if (!/validate:local-course-high-risk-real-reviewer-overlay-input/.test(overlayRoute.validationCommand)) fail("overlay validation command drift");
if (packet001Route.routeId !== "source_fit_packet_001" || packet001Route.requiredItems !== 60 || !/apply:knowledge-node-public-source-fit-review-packet-merge/.test(packet001Route.applyOrMergeCommand)) {
  fail("packet 001 route drift");
}
if (packet002Route.routeId !== "source_fit_packet_002" || packet002Route.requiredItems !== 60 || !/apply:knowledge-node-public-source-fit-review-packet-002-merge/.test(packet002Route.applyOrMergeCommand)) {
  fail("packet 002 route drift");
}
if (packet003Route.routeId !== "source_fit_packet_003" || packet003Route.requiredItems !== 60 || packet003Route.applyOrMergeCommand !== "") {
  fail("packet 003 route drift");
}

const requiredTotal = routeMap.routeRowsData.reduce((sum, row) => sum + (row.requiredItems || 0), 0);
const blockedTotal = routeMap.routeRowsData.reduce((sum, row) => sum + (row.blockedItems || 0), 0);
if (requiredTotal !== 257 || blockedTotal !== 257) fail("route row totals drift");

if (!Array.isArray(routeMap.lockedGates) || routeMap.lockedGates.length < 4) fail("locked gates too thin");
if (!Array.isArray(routeMap.commands) || !routeMap.commands.some((command) => /check:knowledge-first-reviewer-post-input-route-map/.test(command))) {
  fail("commands must include post-input route map check");
}

const boundaryText = `${routeMap.boundary || ""} ${routeMap.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "absorbed local course material",
  "public/wikipedia/official source-fit review rows",
  "72 high-risk reviewer notes",
  "5 direct-source decisions",
  "180 source-fit packet rows",
  "does not generate reviewer notes",
  "approve copied text",
  "approve learner-facing citations",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "write authorization",
  "learner release",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  routeMapStatus: routeMap.routeMapStatus,
  routeRows: routeMap.routeRows,
  requiredWorkItems: routeMap.requiredWorkItems,
  readyWorkItems: routeMap.readyWorkItems,
  blockedWorkItems: routeMap.blockedWorkItems,
  sourceFitMergeRoutes: routeMap.sourceFitMergeRoutes,
  realHumanInputEntries: routeMap.realHumanInputEntries,
  mergeAllowedNow: routeMap.mergeAllowedNow,
  writeAllowedNow: routeMap.writeAllowedNow,
}, null, 2));
