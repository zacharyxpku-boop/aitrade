import { spawn } from "node:child_process";
import fs from "node:fs";

const port = process.env.SMOKE_PORT || "4274";
const dbPath = process.env.TRADEGYM_SQLITE_PATH || "./data/smoke-customer-trial-room.sqlite";
const base = `http://127.0.0.1:${port}`;
const tempFiles = [dbPath, `${dbPath}-shm`, `${dbPath}-wal`];
let cookie = "";

for (const file of tempFiles) {
  fs.rmSync(file, { force: true });
}

const server = spawn(process.execPath, ["server.js"], {
  cwd: new URL("../", import.meta.url),
  env: { ...process.env, PORT: port, TRADEGYM_SQLITE_PATH: dbPath },
  stdio: ["ignore", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";
server.stdout.on("data", (chunk) => { stdout += String(chunk); });
server.stderr.on("data", (chunk) => { stderr += String(chunk); });

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopServer() {
  if (server.exitCode != null || server.signalCode != null) return;
  server.kill("SIGKILL");
  await Promise.race([
    new Promise((resolve) => server.once("close", resolve)),
    delay(2000),
  ]);
}

async function cleanupTempFiles() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    let cleaned = true;
    for (const file of tempFiles) {
      try {
        fs.rmSync(file, { force: true });
      } catch {
        cleaned = false;
      }
    }
    if (cleaned) return;
    await delay(250);
  }
  for (const file of tempFiles) {
    fs.rmSync(file, { force: true });
  }
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { "content-type": "application/json" } : {}),
    ...(cookie ? { cookie } : {}),
  };
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const text = await response.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch {
    // Keep text for HTML, CSV, and Markdown.
  }
  return { status: response.status, data, text, headers: response.headers };
}

async function waitForServer() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await request("/api/bootstrap");
      if (response.status === 200) return;
    } catch {
      // Retry below.
    }
    if (server.exitCode != null) {
      throw new Error(`server exited: ${server.exitCode}\nstdout:\n${stdout}\nstderr:\n${stderr}`);
    }
    await delay(150);
  }
  throw new Error(`server did not start\nstdout:\n${stdout}\nstderr:\n${stderr}`);
}

try {
  await waitForServer();

  const home = await request("/");
  for (const id of [
    "exportPrototypeScorecardJson",
    "exportTrialKickoffJson",
    "createTrialKickoffActions",
    "exportTrialRoomJson",
    "exportTrialRoomCsv",
    "exportTrialRoomMd",
    "sendTrialRoom",
  ]) {
    if (!home.text.includes(`id="${id}"`)) {
      throw new Error(`missing trial room button: ${id}`);
    }
  }

  const login = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (login.status !== 200 || login.data.session?.role !== "admin") {
    throw new Error(`admin login failed: ${login.status} ${JSON.stringify(login.data).slice(0, 600)}`);
  }

  const system = await request("/api/system/readiness");
  if (system.status !== 200 || system.data.productionReady !== false) {
    throw new Error(`system readiness boundary failed: ${system.status} ${JSON.stringify(system.data).slice(0, 800)}`);
  }

  const scorecard = await request("/api/admin/commercial-prototype-scorecard");
  if (
    scorecard.status !== 200 ||
    scorecard.data.schemaVersion !== "commercial-prototype-scorecard-v1" ||
    scorecard.data.productionReady !== false ||
    typeof scorecard.data.customerTrialReadinessScore !== "number"
  ) {
    throw new Error(`scorecard failed: ${scorecard.status} ${JSON.stringify(scorecard.data).slice(0, 1000)}`);
  }

  const kickoff = await request("/api/admin/customer-trial-kickoff-plan");
  if (
    kickoff.status !== 200 ||
    kickoff.data.schemaVersion !== "customer-trial-kickoff-plan-v1" ||
    kickoff.data.productionReady !== false ||
    !kickoff.data.steps?.length
  ) {
    throw new Error(`kickoff failed: ${kickoff.status} ${JSON.stringify(kickoff.data).slice(0, 1000)}`);
  }

  const kickoffActions = await request("/api/admin/customer-trial-kickoff-plan/create-actions", {
    method: "POST",
    body: { ownerEmail: "success@tradegym.local", maxCreate: 4 },
  });
  if (
    ![200, 201].includes(kickoffActions.status) ||
    kickoffActions.data.productionReady !== false ||
    kickoffActions.data.created < 1 ||
    !kickoffActions.data.actions?.some((item) => String(item.sourceKey || "").startsWith("customer_trial_kickoff:"))
  ) {
    throw new Error(`kickoff actions failed: ${kickoffActions.status} ${JSON.stringify(kickoffActions.data).slice(0, 1000)}`);
  }

  const room = await request("/api/admin/customer-trial-room");
  if (
    room.status !== 200 ||
    room.data.schemaVersion !== "customer-trial-room-v1" ||
    room.data.productionReady !== false ||
    room.data.summary?.sections !== 6 ||
    !room.data.reviewArtifacts?.some((item) => item.key === "scorecard")
  ) {
    throw new Error(`trial room failed: ${room.status} ${JSON.stringify(room.data).slice(0, 1000)}`);
  }

  const roomJson = await request("/api/admin/customer-trial-room/export?format=json");
  const roomCsv = await request("/api/admin/customer-trial-room/export?format=csv");
  const roomMd = await request("/api/admin/customer-trial-room/export?format=md");
  if (
    roomJson.status !== 200 ||
    roomJson.data.room?.schemaVersion !== "customer-trial-room-v1" ||
    roomCsv.status !== 200 ||
    !String(roomCsv.data).includes("room_section,trial_packet") ||
    roomMd.status !== 200 ||
    !String(roomMd.data).includes("# TradeGym Customer Trial Room") ||
    !String(roomMd.data).includes("Production ready: false")
  ) {
    throw new Error("trial room exports failed");
  }

  const share = await request("/api/admin/customer-trial-room-shares", {
    method: "POST",
    body: {
      recipientEmail: "buyer@institution.local",
      ownerEmail: "success@tradegym.local",
      subject: "TradeGym education trial room",
    },
  });
  if (
    share.status !== 201 ||
    share.data.share?.productionReady !== false ||
    share.data.share?.providerMode !== "local-simulated" ||
    share.data.share?.feedbackStatus !== "pending_feedback"
  ) {
    throw new Error(`trial room share failed: ${share.status} ${JSON.stringify(share.data).slice(0, 1000)}`);
  }

  const shares = await request("/api/admin/customer-trial-room-shares");
  if (
    shares.status !== 200 ||
    shares.data.productionReady !== false ||
    shares.data.summary?.total < 1 ||
    !shares.data.shares?.some((item) => item.id === share.data.share.id)
  ) {
    throw new Error(`trial room shares failed: ${shares.status} ${JSON.stringify(shares.data).slice(0, 1000)}`);
  }

  const feedback = await request("/api/admin/customer-trial-room-shares/feedback", {
    method: "POST",
    body: {
      shareId: share.data.share.id,
      feedbackStatus: "needs_more_evidence",
      feedbackNote: "Buyer requested additional education trial room evidence before review.",
      nextCustomerSuccessAction: "Prepare additional education trial room evidence without production-readiness claims.",
    },
  });
  if (
    feedback.status !== 200 ||
    feedback.data.share?.feedbackStatus !== "needs_more_evidence" ||
    feedback.data.share?.productionReady !== false
  ) {
    throw new Error(`trial room feedback failed: ${feedback.status} ${JSON.stringify(feedback.data).slice(0, 1000)}`);
  }

  const buyerReview = await request(`/api/admin/customer-trial-room-buyer-review?shareId=${encodeURIComponent(share.data.share.id)}`);
  if (
    buyerReview.status !== 200 ||
    buyerReview.data.package?.schemaVersion !== "customer-trial-room-buyer-review-package-v1" ||
    buyerReview.data.package?.productionReady !== false ||
    buyerReview.data.package?.checklist?.length < 5
  ) {
    throw new Error(`trial room buyer review package failed: ${buyerReview.status} ${JSON.stringify(buyerReview.data).slice(0, 1000)}`);
  }

  const buyerObjection = await request("/api/admin/customer-trial-room-buyer-review/objection", {
    method: "POST",
    body: {
      shareId: share.data.share.id,
      reviewStatus: "needs_more_evidence",
      reviewerEmail: "buyer@institution.local",
      objectionType: "trial_room_evidence_gap",
      reviewNote: "Buyer needs clearer education SaaS evidence and boundary wording before accepting the trial room for review.",
      requestedEvidence: "Prepare a concise education trial evidence note covering learner workflow, coach follow-up, audit evidence, and explicit non-trading boundaries.",
    },
  });
  if (
    buyerObjection.status !== 200 ||
    buyerObjection.data.review?.productionReady !== false ||
    buyerObjection.data.package?.buyerReviewStatus !== "needs_more_evidence" ||
    buyerObjection.data.share?.feedbackStatus !== "needs_more_evidence"
  ) {
    throw new Error(`trial room buyer objection failed: ${buyerObjection.status} ${JSON.stringify(buyerObjection.data).slice(0, 1000)}`);
  }

  const scorecardAfterBuyerReview = await request("/api/admin/commercial-prototype-scorecard");
  const roomAfterBuyerReview = await request("/api/admin/customer-trial-room");
  if (
    scorecardAfterBuyerReview.status !== 200 ||
    scorecardAfterBuyerReview.data.summary?.buyerReviewNeedsMoreEvidence < 1 ||
    !scorecardAfterBuyerReview.data.blockers?.some((item) => item.key === "buyer_review_evidence_requested" && item.priority === "high") ||
    roomAfterBuyerReview.status !== 200 ||
    roomAfterBuyerReview.data.summary?.buyerReviewNeedsMoreEvidence < 1 ||
    !roomAfterBuyerReview.data.sections?.some((item) => item.key === "buyer_review_follow_through")
  ) {
    throw new Error(`trial room buyer review rollup failed: ${scorecardAfterBuyerReview.status}/${roomAfterBuyerReview.status} ${JSON.stringify({ scorecard: scorecardAfterBuyerReview.data, room: roomAfterBuyerReview.data }).slice(0, 1600)}`);
  }

  const action = await request("/api/admin/customer-trial-room-shares/create-action", {
    method: "POST",
    body: { shareId: share.data.share.id, ownerEmail: "success@tradegym.local" },
  });
  if (
    action.status !== 201 ||
    action.data.action?.criterionKey !== "customer_trial_room_feedback_needs_more_evidence" ||
    action.data.action?.productionReady !== false ||
    action.data.action?.buyerReviewId !== buyerObjection.data.review.id ||
    action.data.share?.nextActionId !== action.data.action.id
  ) {
    throw new Error(`trial room feedback action failed: ${action.status} ${JSON.stringify(action.data).slice(0, 1000)}`);
  }

  const actionReuse = await request("/api/admin/customer-trial-room-shares/create-action", {
    method: "POST",
    body: { shareId: share.data.share.id, ownerEmail: "success@tradegym.local" },
  });
  if (actionReuse.status !== 200 || actionReuse.data.reused !== true || actionReuse.data.action?.id !== action.data.action.id) {
    throw new Error(`trial room feedback action reuse failed: ${actionReuse.status} ${JSON.stringify(actionReuse.data).slice(0, 1000)}`);
  }

  const actionDone = await request("/api/admin/pilot-success-actions/update", {
    method: "POST",
    body: {
      actionId: action.data.action.id,
      status: "done",
      ownerEmail: "success@tradegym.local",
      resolutionNote: "Completed the buyer-requested education trial room evidence follow-up without trading-performance or production-readiness claims.",
    },
  });
  if (
    actionDone.status !== 200 ||
    actionDone.data.action?.status !== "done" ||
    actionDone.data.linkedCustomerTrialRoomShare?.nextActionStatus !== "done" ||
    actionDone.data.linkedCustomerTrialRoomShare?.productionReady !== false
  ) {
    throw new Error(`trial room feedback action completion failed: ${actionDone.status} ${JSON.stringify(actionDone.data).slice(0, 1200)}`);
  }

  const sharesAfterActionDone = await request("/api/admin/customer-trial-room-shares");
  const scorecardAfterActionDone = await request("/api/admin/commercial-prototype-scorecard");
  const roomAfterActionDone = await request("/api/admin/customer-trial-room");
  if (
    sharesAfterActionDone.status !== 200 ||
    sharesAfterActionDone.data.summary?.feedbackActionsDone < 1 ||
    !sharesAfterActionDone.data.shares?.some((item) => item.id === share.data.share.id && item.nextActionStatus === "done") ||
    scorecardAfterActionDone.status !== 200 ||
    scorecardAfterActionDone.data.summary?.trialRoomFeedbackActionsDone < 1 ||
    roomAfterActionDone.status !== 200 ||
    roomAfterActionDone.data.summary?.roomFeedbackActionsDone < 1
  ) {
    throw new Error(`trial room feedback action closure rollup failed: ${JSON.stringify({ shares: sharesAfterActionDone.data, scorecard: scorecardAfterActionDone.data, room: roomAfterActionDone.data }).slice(0, 1600)}`);
  }

  const shareProgressJson = await request("/api/admin/customer-trial-room-shares/export?format=json");
  const shareProgressCsv = await request("/api/admin/customer-trial-room-shares/export?format=csv");
  const shareProgressMd = await request("/api/admin/customer-trial-room-shares/export?format=md");
  if (
    shareProgressJson.status !== 200 ||
    shareProgressJson.data.report?.summary?.feedbackActionsDone < 1 ||
    shareProgressCsv.status !== 200 ||
    !String(shareProgressCsv.data).startsWith("recipientEmail,feedbackStatus,buyerReviewStatus,nextActionStatus") ||
    shareProgressMd.status !== 200 ||
    !String(shareProgressMd.data).includes("# TradeGym Customer Trial Room Share Progress") ||
    !String(shareProgressMd.data).includes("Actions open:")
  ) {
    throw new Error(`trial room share progress exports failed: ${shareProgressJson.status}/${shareProgressCsv.status}/${shareProgressMd.status}`);
  }

  const shareAudit = await request("/api/admin/audit-logs?type=customer_trial_room_shared&limit=20");
  const feedbackAudit = await request("/api/admin/audit-logs?type=customer_trial_room_feedback_recorded&limit=20");
  const buyerReviewAudit = await request("/api/admin/audit-logs?type=customer_trial_room_buyer_review_recorded&limit=20");
  const shareProgressExportAudit = await request("/api/admin/audit-logs?type=customer_trial_room_shares_exported&limit=20");
  const actionAudit = await request("/api/admin/audit-logs?type=customer_trial_room_feedback_action_created&limit=20");
  const actionDoneAudit = await request("/api/admin/audit-logs?type=pilot_success_action_updated&limit=20");
  if (
    shareAudit.status !== 200 ||
    !shareAudit.data.items?.some((item) => item.shareId === share.data.share.id && item.productionReady === false) ||
    feedbackAudit.status !== 200 ||
    !feedbackAudit.data.items?.some((item) => item.shareId === share.data.share.id && item.feedbackStatus === "needs_more_evidence" && item.educationOnly === true) ||
    buyerReviewAudit.status !== 200 ||
    !buyerReviewAudit.data.items?.some((item) => item.reviewId === buyerObjection.data.review.id && item.educationOnly === true) ||
    shareProgressExportAudit.status !== 200 ||
    !shareProgressExportAudit.data.items?.some((item) => item.type === "customer_trial_room_shares_exported" && item.feedbackActionsDone >= 1 && item.productionReady === false) ||
    actionAudit.status !== 200 ||
    !actionAudit.data.items?.some((item) => item.actionId === action.data.action.id && item.educationOnly === true) ||
    actionDoneAudit.status !== 200 ||
    !actionDoneAudit.data.items?.some((item) => item.actionId === action.data.action.id && item.status === "done" && item.educationOnly === true)
  ) {
    throw new Error("trial room audit evidence missing");
  }

  console.log(JSON.stringify({
    productionReady: system.data.productionReady,
    score: scorecard.data.customerTrialReadinessScore,
    kickoffActionsCreated: kickoffActions.data.created,
    roomSections: room.data.summary.sections,
    roomCsv: roomCsv.status,
    roomMd: roomMd.status,
    shares: shares.data.summary.total,
    feedback: feedback.data.share.feedbackStatus,
    buyerReview: buyerObjection.data.package.buyerReviewStatus,
    buyerReviewRollup: scorecardAfterBuyerReview.data.summary.buyerReviewNeedsMoreEvidence,
    action: action.status,
    actionDone: actionDone.data.linkedCustomerTrialRoomShare.nextActionStatus,
    shareProgressMd: shareProgressMd.status,
    reused: actionReuse.data.reused,
  }));
} catch (error) {
  console.error(error.message);
  if (stdout) console.error(`stdout:\n${stdout}`);
  if (stderr) console.error(`stderr:\n${stderr}`);
  process.exitCode = 1;
} finally {
  await stopServer();
  await cleanupTempFiles();
}
