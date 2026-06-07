import { spawn } from "node:child_process";
import fs from "node:fs";

const port = process.env.SMOKE_PORT || "4274";
const dbPath = process.env.TRADEGYM_SQLITE_PATH || "./data/smoke-procurement-owner.sqlite";
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
    // Keep text for HTML and CSV/Markdown exports.
  }
  return { status: response.status, data, text };
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
  for (const id of ["viewProcurementProgress", "exportProcurementProgressCsv", "exportProcurementProgressMd", "exportProcurementProgressMeetingBrief", "createProcurementMeetingActions", "createServiceSlaActions"]) {
    if (!home.text.includes(`id="${id}"`)) {
      throw new Error(`missing global procurement progress button: ${id}`);
    }
  }

  const login = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (login.status !== 200 || login.data.session?.role !== "admin") {
    throw new Error(`admin login failed: ${login.status} ${JSON.stringify(login.data).slice(0, 600)}`);
  }

  const supportTicket = await request("/api/support/tickets", {
    method: "POST",
    body: {
      category: "coach_service",
      priority: "high",
      subject: "Smoke service SLA follow-up",
      message: "Please help route this education service request to the right customer-success owner before institution review.",
    },
  });
  if (supportTicket.status !== 201 || supportTicket.data.ticket?.educationOnly !== true) {
    throw new Error(`support ticket create failed: ${supportTicket.status} ${JSON.stringify(supportTicket.data).slice(0, 800)}`);
  }

  const serviceSlaActions = await request("/api/admin/service-sla-actions/create", {
    method: "POST",
    body: {
      ownerEmail: "success@tradegym.local",
      limit: 10,
      openLimit: 1,
    },
  });
  if (
    ![200, 201].includes(serviceSlaActions.status) ||
    serviceSlaActions.data.productionReady !== false ||
    serviceSlaActions.data.created < 1 ||
    !serviceSlaActions.data.actions?.some((item) => String(item.sourceKey || "").startsWith("service_sla:support_ticket:"))
  ) {
    throw new Error(`service SLA actions smoke failed: ${serviceSlaActions.status} ${JSON.stringify(serviceSlaActions.data).slice(0, 1000)}`);
  }

  const cohort = await request("/api/admin/cohorts", {
    method: "POST",
    body: { name: "Smoke Procurement Owner Cohort", members: "admin@tradegym.local" },
  });
  if (cohort.status !== 201) {
    throw new Error(`cohort create failed: ${cohort.status} ${JSON.stringify(cohort.data).slice(0, 800)}`);
  }

  const delivery = await request("/api/admin/cohort-procurement-deliveries", {
    method: "POST",
    body: {
      cohortId: cohort.data.cohort.id,
      recipientEmail: "success@tradegym.local",
      ownerEmail: "success@tradegym.local",
    },
  });
  if (delivery.status !== 201) {
    throw new Error(`delivery create failed: ${delivery.status} ${JSON.stringify(delivery.data).slice(0, 800)}`);
  }

  const feedback = await request("/api/admin/cohort-procurement-deliveries/feedback", {
    method: "POST",
    body: {
      deliveryId: delivery.data.delivery.id,
      feedbackStatus: "needs_more_evidence",
      feedbackNote: "Institution requested education adoption evidence only.",
      nextCustomerSuccessAction: "Collect additional education adoption evidence.",
      institutionOwnerEmail: "buyer@institution.local",
      targetReviewAt: "2026-06-20T09:00:00.000Z",
      decisionNote: "Education procurement review note only.",
    },
  });
  if (feedback.status !== 200) {
    throw new Error(`feedback failed: ${feedback.status} ${JSON.stringify(feedback.data).slice(0, 800)}`);
  }

  const buyerReview = await request(`/api/admin/cohort-procurement-buyer-review?deliveryId=${encodeURIComponent(delivery.data.delivery.id)}`);
  if (
    buyerReview.status !== 200 ||
    buyerReview.data.package?.schemaVersion !== "cohort-procurement-buyer-review-package-v1" ||
    buyerReview.data.package?.productionReady !== false ||
    !buyerReview.data.package?.checklist?.length
  ) {
    throw new Error(`buyer review package failed: ${buyerReview.status} ${JSON.stringify(buyerReview.data).slice(0, 800)}`);
  }

  const buyerObjection = await request("/api/admin/cohort-procurement-buyer-review/objection", {
    method: "POST",
    body: {
      deliveryId: delivery.data.delivery.id,
      reviewStatus: "needs_more_evidence",
      objectionType: "evidence_gap",
      reviewerEmail: "buyer@institution.local",
      requestedEvidence: "Buyer requested additional education adoption and compliance evidence.",
      reviewNote: "Buyer needs clearer education procurement evidence before sign-off.",
      targetReviewAt: "2026-06-25",
    },
  });
  if (
    buyerObjection.status !== 201 ||
    buyerObjection.data.productionReady !== false ||
    buyerObjection.data.review?.reviewStatus !== "needs_more_evidence" ||
    buyerObjection.data.package?.buyerReviewStatus !== "needs_more_evidence"
  ) {
    throw new Error(`buyer objection failed: ${buyerObjection.status} ${JSON.stringify(buyerObjection.data).slice(0, 800)}`);
  }

  const action = await request("/api/admin/cohort-procurement-deliveries/create-action", {
    method: "POST",
    body: {
      deliveryId: delivery.data.delivery.id,
      ownerEmail: "success@tradegym.local",
    },
  });
  if (![200, 201].includes(action.status)) {
    throw new Error(`feedback action failed: ${action.status} ${JSON.stringify(action.data).slice(0, 800)}`);
  }
  if (
    action.data.action?.buyerReviewId !== buyerObjection.data.review.id ||
    !action.data.action?.evidence?.some((item) => item.includes("Requested evidence")) ||
    !action.data.action?.next?.includes("Buyer requested additional education adoption")
  ) {
    throw new Error(`feedback action missing buyer evidence: ${JSON.stringify(action.data.action).slice(0, 800)}`);
  }

  const actionDone = await request("/api/admin/pilot-success-actions/update", {
    method: "POST",
    body: {
      actionId: action.data.action.id,
      status: "done",
      ownerEmail: "success@tradegym.local",
      resolutionNote: "Smoke completed this education customer-success action.",
    },
  });
  if (actionDone.status !== 200 || actionDone.data.action?.status !== "done") {
    throw new Error(`feedback action update failed: ${actionDone.status} ${JSON.stringify(actionDone.data).slice(0, 800)}`);
  }

  const renewal = await request(`/api/admin/cohort-renewal-review?cohortId=${encodeURIComponent(cohort.data.cohort.id)}`);
  const renewalCsv = await request(`/api/admin/cohort-renewal-review/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=csv`);
  const renewalMd = await request(`/api/admin/cohort-renewal-review/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=md`);
  if (
    renewal.status !== 200 ||
    renewal.data.packet?.schemaVersion !== "cohort-renewal-review-v1" ||
    renewal.data.packet?.productionReady !== false ||
    renewal.data.packet?.summary?.buyerEvidenceRequests < 1 ||
    renewal.data.packet?.summary?.serviceSlaActionsOpen < 1 ||
    !renewal.data.packet?.renewalBlockers?.some((item) => item.category === "support_sla") ||
    !renewal.data.packet?.sections?.buyerHistory?.some((item) => item.requestedEvidence?.includes("Buyer requested additional education adoption")) ||
    renewalCsv.status !== 200 ||
    typeof renewalCsv.data !== "string" ||
    !renewalCsv.data.includes("buyer_evidence_request") ||
    renewalMd.status !== 200 ||
    typeof renewalMd.data !== "string" ||
    !renewalMd.data.includes("# TradeGym Cohort Renewal Review") ||
    !renewalMd.data.includes("Service SLA actions: open")
  ) {
    throw new Error(`renewal review smoke failed: ${JSON.stringify({
      renewal: renewal.status,
      renewalCsv: renewalCsv.status,
      renewalMd: renewalMd.status,
      body: renewal.data,
    }).slice(0, 1000)}`);
  }
  const renewalActions = await request("/api/admin/cohort-renewal-review/create-actions", {
    method: "POST",
    body: {
      cohortId: cohort.data.cohort.id,
      ownerEmail: "success@tradegym.local",
      maxCreate: 4,
    },
  });
  if (
    ![200, 201].includes(renewalActions.status) ||
    renewalActions.data.productionReady !== false ||
    renewalActions.data.created < 1 ||
    !renewalActions.data.actions?.some((item) => String(item.sourceKey || "").startsWith(`cohort_renewal_review:${cohort.data.cohort.id}:`))
  ) {
    throw new Error(`renewal action smoke failed: ${renewalActions.status} ${JSON.stringify(renewalActions.data).slice(0, 1000)}`);
  }

  const progress = await request(`/api/admin/cohort-procurement-progress?cohortId=${encodeURIComponent(cohort.data.cohort.id)}`);
  const csv = await request("/api/admin/cohort-procurement-progress/export?format=csv");
  const md = await request("/api/admin/cohort-procurement-progress/export?format=md");
  const meetingBrief = await request("/api/admin/cohort-procurement-progress/export?format=meeting_brief");
  const meetingActions = await request("/api/admin/cohort-procurement-progress/create-meeting-actions", {
    method: "POST",
    body: {
      cohortId: cohort.data.cohort.id,
      ownerEmail: "success@tradegym.local",
    },
  });
  const deliveryInProgress = progress.data.report?.deliveries?.find((item) => item.id === delivery.data.delivery.id);
  const rollup = progress.data.report?.summary?.institutionCsActionRollup || {};
  const serviceRollup = progress.data.report?.summary?.serviceSlaActionRollup || {};
  if (
    progress.status !== 200 ||
    progress.data.productionReady !== false ||
    deliveryInProgress?.institutionOwnerEmail !== "buyer@institution.local" ||
    deliveryInProgress?.targetReviewAt !== "2026-06-25" ||
    !deliveryInProgress?.blockerCategories?.some((item) => item.category === "provider_readiness") ||
    !deliveryInProgress?.blockerCategories?.some((item) => item.category === "support_sla" && item.count >= 1) ||
    !deliveryInProgress?.dominantBlockerCategory ||
    serviceRollup.open < 1 ||
    serviceRollup.productionReady !== false ||
    rollup.productionReady !== false ||
    rollup.done < 1 ||
    !rollup.byOwner?.some((item) => item.ownerEmail === "success@tradegym.local" && item.done >= 1) ||
    !csv.text.includes("buyer@institution.local") ||
    !csv.text.includes("provider_readiness") ||
    !md.text.includes("buyer@institution.local") ||
    !md.text.includes("Institution CS Action Rollup") ||
    meetingBrief.status !== 200 ||
    !meetingBrief.text.includes("# TradeGym Procurement Meeting Brief") ||
    !meetingBrief.text.includes("## Decision") ||
    !meetingBrief.text.includes("## Key Asks") ||
    !meetingBrief.text.includes("buyer@institution.local") ||
    !meetingBrief.text.includes("success@tradegym.local") ||
    !meetingBrief.text.includes("not investment advice") ||
    !meetingBrief.text.includes("not auto-trading approval") ||
    !meetingBrief.text.includes("Production ready: false") ||
    ![200, 201].includes(meetingActions.status) ||
    meetingActions.data.productionReady !== false ||
    meetingActions.data.created < 1 ||
    !meetingActions.data.actions?.some((item) => item.ownerEmail === "success@tradegym.local" && item.constraints?.some((constraint) => constraint.includes("not investment advice")))
  ) {
    throw new Error(`procurement owner smoke failed: ${JSON.stringify({
      progressStatus: progress.status,
      productionReady: progress.data.productionReady,
      serviceRollup,
      deliveryInProgress,
      rollup,
      csvHasOwner: csv.text.includes("buyer@institution.local"),
      csvHasProviderReadiness: csv.text.includes("provider_readiness"),
      mdHasOwner: md.text.includes("buyer@institution.local"),
      meetingBriefStatus: meetingBrief.status,
      meetingBriefHasBoundary: meetingBrief.text.includes("not investment advice"),
      meetingActionsStatus: meetingActions.status,
    meetingActionsCreated: meetingActions.data.created,
      buyerReview: buyerReview.status,
      buyerObjection: buyerObjection.status,
    }).slice(0, 1200)}`);
  }

  console.log(JSON.stringify({
    buttons: 6,
    productionReady: progress.data.productionReady,
    serviceSlaActions: serviceSlaActions.status,
    serviceSlaActionsCreated: serviceSlaActions.data.created,
    serviceSlaActionsOpen: serviceRollup.open,
    deliveries: progress.data.report.summary.total,
    owner: deliveryInProgress.institutionOwnerEmail,
    blocker: deliveryInProgress.dominantBlockerCategory,
    actions: rollup.totalActions,
    done: rollup.done,
    csv: csv.status,
    md: md.status,
    meetingBrief: meetingBrief.status,
    meetingActions: meetingActions.status,
    meetingActionsCreated: meetingActions.data.created,
    buyerReview: buyerReview.status,
    buyerObjection: buyerObjection.status,
    renewal: renewal.status,
    renewalActions: renewalActions.status,
  }));
} finally {
  await stopServer();
  await cleanupTempFiles();
}
