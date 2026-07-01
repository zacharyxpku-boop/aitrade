import http from "node:http";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import { once } from "node:events";

const port = 4399;
const base = `http://127.0.0.1:${port}`;
const jar = new Map();
const requestTimeoutMs = 30000;

const server = spawn(process.execPath, ["server.js"], {
  cwd: new URL("../", import.meta.url),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverStdout = "";
let serverStderr = "";
server.stdout.on("data", (chunk) => { serverStdout += String(chunk); });
server.stderr.on("data", (chunk) => { serverStderr += String(chunk); });

function rememberCookies(headers) {
  const setCookie = headers["set-cookie"] || [];
  setCookie.forEach((line) => {
    const [pair] = line.split(";");
    const [key, value] = pair.split("=");
    if (value) jar.set(key, value);
    else jar.delete(key);
  });
}

function cookieHeader() {
  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body ? JSON.stringify(options.body) : null;
    const method = options.method || "GET";
    const headers = {
      ...(body ? { "content-type": "application/json", "content-length": Buffer.byteLength(body) } : {}),
      ...(jar.size ? { cookie: cookieHeader() } : {}),
      ...(options.headers || {}),
    };
    const req = http.request(`${base}${path}`, { method, headers }, (res) => {
      rememberCookies(res.headers);
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });
    req.setTimeout(options.timeoutMs || requestTimeoutMs, () => {
      req.destroy(new Error(`request timed out after ${options.timeoutMs || requestTimeoutMs}ms: ${method} ${path}`));
    });
    req.on("error", (error) => {
      reject(new Error(`request failed: ${method} ${path}: ${error.message}`));
    });
    if (body) req.write(body);
    req.end();
  });
}

async function waitForServer() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await request("/api/bootstrap");
      if (res.status === 200) return;
    } catch {
      // Retry below.
    }
    if (server.exitCode != null) {
      throw new Error(`server exited before startup: ${server.exitCode}\nstdout:\n${serverStdout}\nstderr:\n${serverStderr}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`server did not start\nstdout:\n${serverStdout}\nstderr:\n${serverStderr}`);
}

async function verifyExternalPaymentWebhookSignatureGate() {
  const externalPort = 4401;
  const externalBase = `http://127.0.0.1:${externalPort}`;
  const secret = "verify-payment-webhook-secret";
  const externalJar = new Map();
  const externalServer = spawn(process.execPath, ["server.js"], {
    cwd: new URL("../", import.meta.url),
    env: {
      ...process.env,
      PORT: String(externalPort),
      PAYMENT_PROVIDER: "stripe",
      PAYMENT_WEBHOOK_SECRET: secret,
      TRADEGYM_SQLITE_PATH: "./data/verify-payment-webhook.sqlite",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  externalServer.stdout.on("data", (chunk) => { stdout += String(chunk); });
  externalServer.stderr.on("data", (chunk) => { stderr += String(chunk); });

  function externalCookieHeader() {
    return [...externalJar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
  }

  function rememberExternalCookies(headers) {
    const setCookie = headers["set-cookie"] || [];
    setCookie.forEach((line) => {
      const [pair] = line.split(";");
      const [key, value] = pair.split("=");
      if (value) externalJar.set(key, value);
      else externalJar.delete(key);
    });
  }

  function externalRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const body = options.body ? JSON.stringify(options.body) : "";
      const method = options.method || "GET";
      const headers = {
        ...(body ? { "content-type": "application/json", "content-length": Buffer.byteLength(body) } : {}),
        ...(externalJar.size ? { cookie: externalCookieHeader() } : {}),
        ...(options.headers || {}),
      };
      const req = http.request(`${externalBase}${path}`, { method, headers }, (res) => {
        rememberExternalCookies(res.headers);
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, data, headers: res.headers });
          }
        });
      });
      req.setTimeout(requestTimeoutMs, () => {
        req.destroy(new Error(`external request timed out: ${method} ${path}`));
      });
      req.on("error", (error) => reject(new Error(`external request failed: ${method} ${path}: ${error.message}`)));
      if (body) req.write(body);
      req.end();
    });
  }

  try {
    for (let i = 0; i < 80; i += 1) {
      try {
        const res = await externalRequest("/api/bootstrap");
        if (res.status === 200) break;
      } catch {
        // Retry below.
      }
      if (externalServer.exitCode != null) {
        throw new Error(`external payment server exited before startup: ${externalServer.exitCode}\nstdout:\n${stdout}\nstderr:\n${stderr}`);
      }
      if (i === 79) throw new Error(`external payment server did not start\nstdout:\n${stdout}\nstderr:\n${stderr}`);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    const login = await externalRequest("/api/auth/login", {
      method: "POST",
      body: { email: "admin@tradegym.local", password: "admin123" },
    });
    if (login.status !== 200 || login.data.session?.role !== "admin") {
      throw new Error(`external payment admin login failed: ${login.status}`);
    }
    const bootstrap = await externalRequest("/api/bootstrap");
    if (!bootstrap.data.compliance?.acknowledged) {
      const compliance = await externalRequest("/api/compliance/acknowledge", {
        method: "POST",
        body: {
          version: bootstrap.data.compliance?.version,
          accepted: true,
        },
      });
      if (compliance.status !== 200 || compliance.data.compliance?.acknowledged !== true) {
        throw new Error(`external payment compliance acknowledgement failed: ${compliance.status}`);
      }
    }
    const checkout = await externalRequest("/api/billing/checkout-session", {
      method: "POST",
      body: { plan: "Coach" },
    });
    if (checkout.status !== 200 || checkout.data.order?.status !== "pending") {
      throw new Error(`external payment checkout failed: ${checkout.status} ${JSON.stringify(checkout.data).slice(0, 800)}`);
    }

    const payload = { type: "payment.succeeded", orderId: checkout.data.order.id };
    const unsigned = await externalRequest("/api/billing/webhook", {
      method: "POST",
      body: payload,
    });
    if (
      unsigned.status !== 401 ||
      unsigned.data.reason !== "missing_payment_webhook_signature" ||
      unsigned.data.webhookSignatureRequired !== true
    ) {
      throw new Error(`unsigned external payment webhook was not blocked: ${unsigned.status} ${JSON.stringify(unsigned.data).slice(0, 800)}`);
    }

    const wrong = await externalRequest("/api/billing/webhook", {
      method: "POST",
      headers: { "x-tradegym-payment-signature": "00".repeat(32) },
      body: payload,
    });
    if (wrong.status !== 401 || wrong.data.reason !== "invalid_payment_webhook_signature") {
      throw new Error(`invalid external payment webhook signature was not blocked: ${wrong.status} ${JSON.stringify(wrong.data).slice(0, 800)}`);
    }

    const rawPayload = JSON.stringify(payload);
    const signature = crypto.createHmac("sha256", secret).update(rawPayload).digest("hex");
    const signed = await externalRequest("/api/billing/webhook", {
      method: "POST",
      headers: { "x-tradegym-payment-signature": signature },
      body: payload,
    });
    if (
      signed.status !== 200 ||
      signed.data.event?.type !== "payment.succeeded" ||
      signed.data.event?.provider !== "stripe" ||
      signed.data.subscription?.status !== "active" ||
      signed.data.entitlement?.plan !== "Coach"
    ) {
      throw new Error(`signed external payment webhook failed: ${signed.status} ${JSON.stringify(signed.data).slice(0, 1200)}`);
    }
  } finally {
    if (externalServer.exitCode == null) {
      externalServer.kill();
      await Promise.race([
        once(externalServer, "exit"),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }
  }
}

async function buyCoachReviewAddonForLearner({ email, password, credits = 1 }) {
  await request("/api/auth/logout", { method: "POST", body: {} });
  const learnerLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (learnerLogin.status !== 200) {
    throw new Error(`learner add-on login failed for ${email}`);
  }
  let checkout = await request("/api/billing/addon-checkout-session", {
    method: "POST",
    body: { productId: "coach_review_1" },
  });
  if (checkout.status === 402 && checkout.data?.error === "Coach plan required for coach review add-ons") {
    const coachCheckout = await request("/api/billing/checkout-session", {
      method: "POST",
      body: { plan: "Coach" },
    });
    if (coachCheckout.status !== 200 || coachCheckout.data.order?.status !== "pending") {
      throw new Error(`coach checkout failed during quota repair: ${coachCheckout.status} ${JSON.stringify(coachCheckout.data).slice(0, 800)}`);
    }
    const coachPaid = await request("/api/billing/webhook", {
      method: "POST",
      body: { type: "payment.succeeded", orderId: coachCheckout.data.order.id },
    });
    if (coachPaid.status !== 200 || coachPaid.data.entitlement?.plan !== "Coach") {
      throw new Error(`coach subscription payment failed during quota repair: ${coachPaid.status} ${JSON.stringify(coachPaid.data).slice(0, 800)}`);
    }
    checkout = await request("/api/billing/addon-checkout-session", {
      method: "POST",
      body: { productId: "coach_review_1" },
    });
  }
  for (let i = 0; i < credits; i += 1) {
    if (i > 0) {
      checkout = await request("/api/billing/addon-checkout-session", {
        method: "POST",
        body: { productId: "coach_review_1" },
      });
    }
    if (checkout.status !== 200 || checkout.data.order?.kind !== "addon" || checkout.data.order?.coachReviewCredits !== 1) {
      throw new Error(`coach review add-on checkout failed during quota repair: ${checkout.status} ${JSON.stringify(checkout.data).slice(0, 800)}`);
    }
    const paid = await request("/api/billing/webhook", {
      method: "POST",
      body: { type: "payment.succeeded", orderId: checkout.data.order.id },
    });
    if (paid.status !== 200 || paid.data.order?.status !== "paid" || paid.data.order?.kind !== "addon") {
      throw new Error(`coach review add-on payment failed during quota repair: ${paid.status} ${JSON.stringify(paid.data).slice(0, 800)}`);
    }
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminLogin.status !== 200 || adminLogin.data.session?.role !== "admin") {
    throw new Error("admin relogin failed after quota repair");
  }
}

try {
  await waitForServer();
  const boot = await request("/api/bootstrap");
  if (!boot.data.scenarios?.length) throw new Error("missing scenarios");
  if (
    !boot.data.scenarios?.some((scenario) => (
      scenario.sourceTransparency?.educationOnly === true &&
      scenario.sourceTransparency?.notSignal === true &&
      (
        scenario.sourceTransparency?.learnerLabel?.includes("not a live signal") ||
        scenario.sourceTransparency?.learnerLabel?.includes("不是实盘信号")
      )
    ))
  ) {
    throw new Error("learner-facing source transparency missing from bootstrap scenarios");
  }

  const readiness = await request("/api/system/readiness");
  if (
    readiness.status !== 200 ||
    readiness.data.providers?.email !== "local" ||
    readiness.data.providers?.payment !== "local" ||
    !["mock", "openai", "anthropic", "deepseek"].includes(readiness.data.providers?.aiCoach) ||
    readiness.data.providers?.marketData !== "demo" ||
    readiness.data.providers?.news !== "demo" ||
    readiness.data.providers?.questionGenerator !== "rule-based" ||
    readiness.data.providers?.knowledgeDistiller !== "rule-based" ||
    readiness.data.productionReady !== false ||
    readiness.data.aiCoach?.productionReady !== false ||
    readiness.data.audit?.immutableLedger === true
  ) {
    throw new Error("system readiness API failed");
  }
  await verifyExternalPaymentWebhookSignatureGate();

  const anonymousProductReadiness = await request("/api/admin/product-readiness");
  if (anonymousProductReadiness.status !== 403) {
    throw new Error("anonymous product readiness access was not blocked");
  }
  const anonymousPrototypeScorecard = await request("/api/admin/commercial-prototype-scorecard");
  if (anonymousPrototypeScorecard.status !== 403) {
    throw new Error("anonymous commercial prototype scorecard access was not blocked");
  }
  const anonymousPrototypeScorecardExport = await request("/api/admin/commercial-prototype-scorecard/export?format=md");
  if (anonymousPrototypeScorecardExport.status !== 403) {
    throw new Error("anonymous commercial prototype scorecard export access was not blocked");
  }
  const anonymousTrialKickoffPlan = await request("/api/admin/customer-trial-kickoff-plan");
  if (anonymousTrialKickoffPlan.status !== 403) {
    throw new Error("anonymous customer trial kickoff plan access was not blocked");
  }
  const anonymousTrialKickoffExport = await request("/api/admin/customer-trial-kickoff-plan/export?format=md");
  if (anonymousTrialKickoffExport.status !== 403) {
    throw new Error("anonymous customer trial kickoff plan export access was not blocked");
  }
  const anonymousTrialKickoffActions = await request("/api/admin/customer-trial-kickoff-plan/create-actions", {
    method: "POST",
    body: { maxCreate: 2 },
  });
  if (anonymousTrialKickoffActions.status !== 403) {
    throw new Error("anonymous customer trial kickoff action creation was not blocked");
  }
  const anonymousTrialRoom = await request("/api/admin/customer-trial-room");
  if (anonymousTrialRoom.status !== 403) {
    throw new Error("anonymous customer trial room access was not blocked");
  }
  const anonymousTrialRoomExport = await request("/api/admin/customer-trial-room/export?format=md");
  if (anonymousTrialRoomExport.status !== 403) {
    throw new Error("anonymous customer trial room export access was not blocked");
  }
  const anonymousTrialRoomShares = await request("/api/admin/customer-trial-room-shares");
  if (anonymousTrialRoomShares.status !== 403) {
    throw new Error("anonymous customer trial room shares access was not blocked");
  }
  const anonymousTrialRoomSharesExport = await request("/api/admin/customer-trial-room-shares/export?format=md");
  if (anonymousTrialRoomSharesExport.status !== 403) {
    throw new Error("anonymous customer trial room share progress export access was not blocked");
  }
  const anonymousTrialRoomShareCreate = await request("/api/admin/customer-trial-room-shares", {
    method: "POST",
    body: { recipientEmail: "buyer@institution.local" },
  });
  if (anonymousTrialRoomShareCreate.status !== 403) {
    throw new Error("anonymous customer trial room share creation was not blocked");
  }
  const anonymousTrialRoomFeedback = await request("/api/admin/customer-trial-room-shares/feedback", {
    method: "POST",
    body: { shareId: "missing", feedbackStatus: "room_accepted_for_review" },
  });
  if (anonymousTrialRoomFeedback.status !== 403) {
    throw new Error("anonymous customer trial room feedback was not blocked");
  }
  const anonymousTrialRoomFeedbackAction = await request("/api/admin/customer-trial-room-shares/create-action", {
    method: "POST",
    body: { shareId: "missing" },
  });
  if (anonymousTrialRoomFeedbackAction.status !== 403) {
    throw new Error("anonymous customer trial room feedback action was not blocked");
  }
  const anonymousTrialRoomBuyerReview = await request("/api/admin/customer-trial-room-buyer-review?shareId=missing");
  if (anonymousTrialRoomBuyerReview.status !== 403) {
    throw new Error("anonymous customer trial room buyer review access was not blocked");
  }
  const anonymousTrialRoomBuyerObjection = await request("/api/admin/customer-trial-room-buyer-review/objection", {
    method: "POST",
    body: { shareId: "missing", reviewStatus: "needs_more_evidence" },
  });
  if (anonymousTrialRoomBuyerObjection.status !== 403) {
    throw new Error("anonymous customer trial room buyer review objection was not blocked");
  }
  const anonymousLaunchOpsBoard = await request("/api/admin/launch-ops-board");
  if (anonymousLaunchOpsBoard.status !== 403) {
    throw new Error("anonymous launch ops board access was not blocked");
  }
  const anonymousLaunchOpsBoardExport = await request("/api/admin/launch-ops-board/export?format=md");
  if (anonymousLaunchOpsBoardExport.status !== 403) {
    throw new Error("anonymous launch ops board export access was not blocked");
  }
  const anonymousLaunchOpsActions = await request("/api/admin/launch-ops-board/create-actions", {
    method: "POST",
    body: { maxCreate: 2 },
  });
  if (anonymousLaunchOpsActions.status !== 403) {
    throw new Error("anonymous launch ops action creation access was not blocked");
  }
  const anonymousCustomerTrialPacket = await request("/api/admin/customer-trial-packet");
  if (anonymousCustomerTrialPacket.status !== 403) {
    throw new Error("anonymous customer trial packet access was not blocked");
  }
  const anonymousCustomerTrialPacketExport = await request("/api/admin/customer-trial-packet/export?format=md");
  if (anonymousCustomerTrialPacketExport.status !== 403) {
    throw new Error("anonymous customer trial packet export access was not blocked");
  }
  const anonymousCustomerTrialDeliveries = await request("/api/admin/customer-trial-packet-deliveries");
  if (anonymousCustomerTrialDeliveries.status !== 403) {
    throw new Error("anonymous customer trial packet deliveries access was not blocked");
  }
  const anonymousCustomerTrialDeliveryCreate = await request("/api/admin/customer-trial-packet-deliveries", {
    method: "POST",
    body: { recipientEmail: "buyer@institution.local" },
  });
  if (anonymousCustomerTrialDeliveryCreate.status !== 403) {
    throw new Error("anonymous customer trial packet delivery creation was not blocked");
  }
  const anonymousCustomerTrialFeedback = await request("/api/admin/customer-trial-packet-deliveries/feedback", {
    method: "POST",
    body: { deliveryId: "missing", feedbackStatus: "trial_ready" },
  });
  if (anonymousCustomerTrialFeedback.status !== 403) {
    throw new Error("anonymous customer trial packet feedback was not blocked");
  }
  const anonymousCustomerTrialFeedbackAction = await request("/api/admin/customer-trial-packet-deliveries/create-action", {
    method: "POST",
    body: { deliveryId: "missing" },
  });
  if (anonymousCustomerTrialFeedbackAction.status !== 403) {
    throw new Error("anonymous customer trial packet feedback action was not blocked");
  }
  const anonymousNextStepEngagement = await request("/api/admin/next-step-engagement-report");
  if (anonymousNextStepEngagement.status !== 403) {
    throw new Error("anonymous next-step engagement report access was not blocked");
  }
  const anonymousNextStepEngagementExport = await request("/api/admin/next-step-engagement-report/export?format=csv");
  if (anonymousNextStepEngagementExport.status !== 403) {
    throw new Error("anonymous next-step engagement export access was not blocked");
  }
  const anonymousCohortEducationExport = await request("/api/admin/cohort-education-report/export?cohortId=missing&format=csv");
  if (anonymousCohortEducationExport.status !== 403) {
    throw new Error("anonymous cohort education report export access was not blocked");
  }
  const anonymousCohortSuccessBrief = await request("/api/admin/cohort-success-brief?cohortId=missing");
  if (anonymousCohortSuccessBrief.status !== 403) {
    throw new Error("anonymous cohort success brief access was not blocked");
  }
  const anonymousCohortSuccessBriefExport = await request("/api/admin/cohort-success-brief/export?cohortId=missing&format=json");
  if (anonymousCohortSuccessBriefExport.status !== 403) {
    throw new Error("anonymous cohort success brief export access was not blocked");
  }
  const anonymousCohortCompliancePack = await request("/api/admin/cohort-compliance-pack?cohortId=missing");
  if (anonymousCohortCompliancePack.status !== 403) {
    throw new Error("anonymous cohort compliance pack access was not blocked");
  }
  const anonymousCohortCompliancePackExport = await request("/api/admin/cohort-compliance-pack/export?cohortId=missing&format=json");
  if (anonymousCohortCompliancePackExport.status !== 403) {
    throw new Error("anonymous cohort compliance pack export access was not blocked");
  }
  const anonymousCohortProcurementPacket = await request("/api/admin/cohort-procurement-packet?cohortId=missing");
  if (anonymousCohortProcurementPacket.status !== 403) {
    throw new Error("anonymous cohort procurement packet access was not blocked");
  }
  const anonymousCohortProcurementPacketExport = await request("/api/admin/cohort-procurement-packet/export?cohortId=missing&format=json");
  if (anonymousCohortProcurementPacketExport.status !== 403) {
    throw new Error("anonymous cohort procurement packet export access was not blocked");
  }
  const anonymousCohortRenewalReview = await request("/api/admin/cohort-renewal-review?cohortId=missing");
  if (anonymousCohortRenewalReview.status !== 403) {
    throw new Error("anonymous cohort renewal review access was not blocked");
  }
  const anonymousCohortRenewalReviewExport = await request("/api/admin/cohort-renewal-review/export?cohortId=missing&format=json");
  if (anonymousCohortRenewalReviewExport.status !== 403) {
    throw new Error("anonymous cohort renewal review export access was not blocked");
  }
  const anonymousCohortRenewalReviewActions = await request("/api/admin/cohort-renewal-review/create-actions", {
    method: "POST",
    body: { cohortId: "missing" },
  });
  if (anonymousCohortRenewalReviewActions.status !== 403) {
    throw new Error("anonymous cohort renewal review action creation was not blocked");
  }
  const anonymousCohortProcurementFollowup = await request("/api/admin/cohort-procurement-followups", {
    method: "POST",
    body: { cohortId: "missing" },
  });
  if (anonymousCohortProcurementFollowup.status !== 403) {
    throw new Error("anonymous cohort procurement follow-up creation was not blocked");
  }
  const anonymousCohortProcurementDeliveries = await request("/api/admin/cohort-procurement-deliveries");
  if (anonymousCohortProcurementDeliveries.status !== 403) {
    throw new Error("anonymous cohort procurement deliveries access was not blocked");
  }
  const anonymousCohortProcurementProgress = await request("/api/admin/cohort-procurement-progress");
  if (anonymousCohortProcurementProgress.status !== 403) {
    throw new Error("anonymous cohort procurement progress access was not blocked");
  }
  const anonymousCohortProcurementBuyerReview = await request("/api/admin/cohort-procurement-buyer-review?deliveryId=missing");
  if (anonymousCohortProcurementBuyerReview.status !== 403) {
    throw new Error("anonymous cohort procurement buyer review access was not blocked");
  }
  const anonymousCohortProcurementProgressExport = await request("/api/admin/cohort-procurement-progress/export?format=json");
  if (anonymousCohortProcurementProgressExport.status !== 403) {
    throw new Error("anonymous cohort procurement progress export access was not blocked");
  }
  const anonymousCohortProcurementDeliveryCreate = await request("/api/admin/cohort-procurement-deliveries", {
    method: "POST",
    body: { cohortId: "missing", recipientEmail: "success@tradegym.local" },
  });
  if (anonymousCohortProcurementDeliveryCreate.status !== 403) {
    throw new Error("anonymous cohort procurement delivery creation was not blocked");
  }
  const anonymousCohortProcurementFeedback = await request("/api/admin/cohort-procurement-deliveries/feedback", {
    method: "POST",
    body: { deliveryId: "missing", feedbackStatus: "procurement_ready" },
  });
  if (anonymousCohortProcurementFeedback.status !== 403) {
    throw new Error("anonymous cohort procurement feedback was not blocked");
  }
  const anonymousCohortProcurementFeedbackAction = await request("/api/admin/cohort-procurement-deliveries/create-action", {
    method: "POST",
    body: { deliveryId: "missing" },
  });
  if (anonymousCohortProcurementFeedbackAction.status !== 403) {
    throw new Error("anonymous cohort procurement feedback action was not blocked");
  }
  const anonymousCohortProcurementBuyerObjection = await request("/api/admin/cohort-procurement-buyer-review/objection", {
    method: "POST",
    body: { deliveryId: "missing", reviewStatus: "needs_more_evidence" },
  });
  if (anonymousCohortProcurementBuyerObjection.status !== 403) {
    throw new Error("anonymous cohort procurement buyer objection was not blocked");
  }
  const anonymousCohortProcurementMeetingActions = await request("/api/admin/cohort-procurement-progress/create-meeting-actions", {
    method: "POST",
    body: {},
  });
  if (anonymousCohortProcurementMeetingActions.status !== 403) {
    throw new Error("anonymous cohort procurement meeting actions were not blocked");
  }
  const anonymousSupportSlaExport = await request("/api/admin/support-sla-report/export?format=json");
  if (anonymousSupportSlaExport.status !== 403) {
    throw new Error("anonymous support SLA report export access was not blocked");
  }
  const anonymousLearningRecordsExport = await request("/api/admin/learning-records/export?format=json");
  if (anonymousLearningRecordsExport.status !== 403) {
    throw new Error("anonymous learning records export access was not blocked");
  }
  const anonymousRosterImport = await request("/api/admin/roster-imports", {
    method: "POST",
    body: { cohortName: "Blocked roster", rows: "blocked-roster@tradegym.local,Blocked Roster,Starter" },
  });
  if (anonymousRosterImport.status !== 403) {
    throw new Error("anonymous roster import access was not blocked");
  }
  const anonymousRosterHandoffs = await request("/api/admin/roster-import-handoffs");
  if (anonymousRosterHandoffs.status !== 403) {
    throw new Error("anonymous roster handoffs access was not blocked");
  }
  const anonymousRosterHandoffExport = await request("/api/admin/roster-import-handoffs/export?handoffId=missing&format=json");
  if (anonymousRosterHandoffExport.status !== 403) {
    throw new Error("anonymous roster handoff export access was not blocked");
  }
  const anonymousRosterOnboardingReport = await request("/api/admin/roster-onboarding-report?handoffId=missing");
  if (anonymousRosterOnboardingReport.status !== 403) {
    throw new Error("anonymous roster onboarding report access was not blocked");
  }
  const anonymousRosterOnboardingExport = await request("/api/admin/roster-onboarding-report/export?handoffId=missing&format=json");
  if (anonymousRosterOnboardingExport.status !== 403) {
    throw new Error("anonymous roster onboarding report export access was not blocked");
  }
  const anonymousRosterOnboardingProgress = await request("/api/admin/roster-onboarding-progress");
  if (anonymousRosterOnboardingProgress.status !== 403) {
    throw new Error("anonymous roster onboarding progress access was not blocked");
  }
  const anonymousRosterOnboardingProgressExport = await request("/api/admin/roster-onboarding-progress/export?format=md");
  if (anonymousRosterOnboardingProgressExport.status !== 403) {
    throw new Error("anonymous roster onboarding progress export access was not blocked");
  }
  const anonymousRosterOnboardingFollowups = await request("/api/admin/roster-onboarding-followups", {
    method: "POST",
    body: { handoffId: "missing" },
  });
  if (anonymousRosterOnboardingFollowups.status !== 403) {
    throw new Error("anonymous roster onboarding followups access was not blocked");
  }
  const anonymousMetrics = await request("/api/admin/metrics");
  if (anonymousMetrics.status !== 403) {
    throw new Error("anonymous admin metrics access was not blocked");
  }
  const anonymousBillingCompliance = await request("/api/admin/billing-compliance-queue");
  if (anonymousBillingCompliance.status !== 403) {
    throw new Error("anonymous billing compliance queue access was not blocked");
  }
  const anonymousBacktestLiteracyBrief = await request("/api/backtest/literacy-brief");
  if (anonymousBacktestLiteracyBrief.status !== 401) {
    throw new Error("anonymous backtest literacy brief access was not blocked");
  }
  const anonymousBacktestLiteracyBriefExport = await request("/api/backtest/literacy-brief/export?format=md");
  if (anonymousBacktestLiteracyBriefExport.status !== 401) {
    throw new Error("anonymous backtest literacy brief export access was not blocked");
  }
  const anonymousReplayDebriefFollowup = await request("/api/admin/replay-debrief-followups", {
    method: "POST",
    body: { paperTradeId: "missing" },
  });
  if (anonymousReplayDebriefFollowup.status !== 403) {
    throw new Error("anonymous replay debrief follow-up was not blocked");
  }
  const anonymousNextStepPlan = await request("/api/next-step-plan");
  if (anonymousNextStepPlan.status !== 401) {
    throw new Error("anonymous next-step plan access was not blocked");
  }
  const anonymousNextStepEvent = await request("/api/next-step-plan/events", {
    method: "POST",
    body: { actionId: "continue_onboarding", eventType: "opened" },
  });
  if (anonymousNextStepEvent.status !== 401) {
    throw new Error("anonymous next-step event access was not blocked");
  }
  const anonymousCompletionCertificateExport = await request("/api/completion-certificate/export?reportId=missing&format=json");
  if (anonymousCompletionCertificateExport.status !== 401) {
    throw new Error("anonymous completion certificate export access was not blocked");
  }
  const anonymousDataGovernanceQueue = await request("/api/admin/data-governance-queue");
  if (anonymousDataGovernanceQueue.status !== 403) {
    throw new Error("anonymous data governance queue access was not blocked");
  }
  const anonymousOpenSourceReferenceMap = await request("/api/admin/open-source-reference-map");
  if (anonymousOpenSourceReferenceMap.status !== 403) {
    throw new Error("anonymous open-source reference map access was not blocked");
  }
  const anonymousDatasetManifest = await request("/api/admin/historical-training-dataset-manifest");
  if (anonymousDatasetManifest.status !== 403) {
    throw new Error("anonymous historical training dataset manifest access was not blocked");
  }
  const anonymousDatasetManifestExport = await request("/api/admin/historical-training-dataset-manifest/export?format=md");
  if (anonymousDatasetManifestExport.status !== 403) {
    throw new Error("anonymous historical training dataset manifest export access was not blocked");
  }
  const anonymousOpenSourceReferenceMapExport = await request("/api/admin/open-source-reference-map/export?format=md");
  if (anonymousOpenSourceReferenceMapExport.status !== 403) {
    throw new Error("anonymous open-source reference map export access was not blocked");
  }
  const anonymousOpenSourceReferenceReviews = await request("/api/admin/open-source-reference-reviews");
  if (anonymousOpenSourceReferenceReviews.status !== 403) {
    throw new Error("anonymous open-source reference review queue access was not blocked");
  }
  const anonymousOpenSourceReferenceReviewUpdate = await request("/api/admin/open-source-reference-reviews/update", {
    method: "POST",
    body: { referenceKey: "backtest_analytics", status: "approved_for_design_reference", decisionNote: "anonymous" },
  });
  if (anonymousOpenSourceReferenceReviewUpdate.status !== 403) {
    throw new Error("anonymous open-source reference review update access was not blocked");
  }
  const anonymousRecommendedCoachAssignment = await request("/api/admin/coach-review-tasks/assign-recommended", {
    method: "POST",
    body: { taskId: "missing" },
  });
  if (anonymousRecommendedCoachAssignment.status !== 403) {
    throw new Error("anonymous recommended coach assignment access was not blocked");
  }
  const anonymousReadinessEvidenceExport = await request("/api/admin/readiness-evidence-packet/export");
  if (anonymousReadinessEvidenceExport.status !== 403) {
    throw new Error("anonymous readiness evidence packet export access was not blocked");
  }
  const anonymousPilotHandoffExport = await request("/api/admin/pilot-handoff-report/export");
  if (anonymousPilotHandoffExport.status !== 403) {
    throw new Error("anonymous pilot handoff report export access was not blocked");
  }
  const anonymousPilotRenewalReviewExport = await request("/api/admin/pilot-renewal-review/export");
  if (anonymousPilotRenewalReviewExport.status !== 403) {
    throw new Error("anonymous pilot renewal review export access was not blocked");
  }
  const anonymousPilotRenewalBriefs = await request("/api/admin/pilot-renewal-briefs");
  if (anonymousPilotRenewalBriefs.status !== 403) {
    throw new Error("anonymous pilot renewal briefs access was not blocked");
  }
  const anonymousPilotRenewalBriefCreate = await request("/api/admin/pilot-renewal-briefs", {
    method: "POST",
    body: {},
  });
  if (anonymousPilotRenewalBriefCreate.status !== 403) {
    throw new Error("anonymous pilot renewal brief create access was not blocked");
  }
  const anonymousPilotRenewalBriefUpdate = await request("/api/admin/pilot-renewal-briefs/update", {
    method: "POST",
    body: { briefId: "missing", status: "reviewed" },
  });
  if (anonymousPilotRenewalBriefUpdate.status !== 403) {
    throw new Error("anonymous pilot renewal brief update access was not blocked");
  }
  const anonymousPilotRenewalBriefDeliveries = await request("/api/admin/pilot-renewal-brief-deliveries");
  if (anonymousPilotRenewalBriefDeliveries.status !== 403) {
    throw new Error("anonymous pilot renewal brief deliveries access was not blocked");
  }
  const anonymousPilotRenewalBriefDeliveryCreate = await request("/api/admin/pilot-renewal-brief-deliveries", {
    method: "POST",
    body: { briefId: "missing", recipientEmail: "success@tradegym.local" },
  });
  if (anonymousPilotRenewalBriefDeliveryCreate.status !== 403) {
    throw new Error("anonymous pilot renewal brief delivery create access was not blocked");
  }
  const anonymousPilotRenewalBriefFeedback = await request("/api/admin/pilot-renewal-brief-deliveries/feedback", {
    method: "POST",
    body: { deliveryId: "missing", feedbackStatus: "renewal_ready" },
  });
  if (anonymousPilotRenewalBriefFeedback.status !== 403) {
    throw new Error("anonymous pilot renewal brief feedback access was not blocked");
  }
  const anonymousPilotRenewalFeedbackAction = await request("/api/admin/pilot-renewal-brief-deliveries/create-action", {
    method: "POST",
    body: { deliveryId: "missing" },
  });
  if (anonymousPilotRenewalFeedbackAction.status !== 403) {
    throw new Error("anonymous pilot renewal feedback action access was not blocked");
  }
  const anonymousPilotExpansionPlan = await request("/api/admin/pilot-expansion-plan");
  if (anonymousPilotExpansionPlan.status !== 403) {
    throw new Error("anonymous pilot expansion plan access was not blocked");
  }
  const anonymousPilotExpansionPlanSave = await request("/api/admin/pilot-expansion-plans", {
    method: "POST",
    body: {},
  });
  if (anonymousPilotExpansionPlanSave.status !== 403) {
    throw new Error("anonymous pilot expansion plan save access was not blocked");
  }
  const anonymousPilotExpansionLaunchChecklist = await request("/api/admin/pilot-expansion-launch-checklist");
  if (anonymousPilotExpansionLaunchChecklist.status !== 403) {
    throw new Error("anonymous pilot expansion launch checklist access was not blocked");
  }
  const anonymousPilotExpansionLaunchChecklistExport = await request("/api/admin/pilot-expansion-launch-checklist/export");
  if (anonymousPilotExpansionLaunchChecklistExport.status !== 403) {
    throw new Error("anonymous pilot expansion launch checklist export access was not blocked");
  }
  const anonymousPilotExpansionLaunchBriefs = await request("/api/admin/pilot-expansion-launch-briefs");
  if (anonymousPilotExpansionLaunchBriefs.status !== 403) {
    throw new Error("anonymous pilot expansion launch briefs access was not blocked");
  }
  const anonymousPilotExpansionLaunchBriefCreate = await request("/api/admin/pilot-expansion-launch-briefs", {
    method: "POST",
    body: {},
  });
  if (anonymousPilotExpansionLaunchBriefCreate.status !== 403) {
    throw new Error("anonymous pilot expansion launch brief create access was not blocked");
  }
  const anonymousPilotExpansionLaunchBriefUpdate = await request("/api/admin/pilot-expansion-launch-briefs/update", {
    method: "POST",
    body: { briefId: "missing", status: "reviewed" },
  });
  if (anonymousPilotExpansionLaunchBriefUpdate.status !== 403) {
    throw new Error("anonymous pilot expansion launch brief update access was not blocked");
  }
  const anonymousPilotExpansionPlanUpdate = await request("/api/admin/pilot-expansion-plans/update", {
    method: "POST",
    body: { planId: "missing", status: "completed" },
  });
  if (anonymousPilotExpansionPlanUpdate.status !== 403) {
    throw new Error("anonymous pilot expansion plan update access was not blocked");
  }
  const anonymousPilotSuccessChecklist = await request("/api/admin/pilot-success-checklist");
  if (anonymousPilotSuccessChecklist.status !== 403) {
    throw new Error("anonymous pilot success checklist access was not blocked");
  }
  const anonymousPilotSuccessActions = await request("/api/admin/pilot-success-actions");
  if (anonymousPilotSuccessActions.status !== 403) {
    throw new Error("anonymous pilot success actions access was not blocked");
  }
  const anonymousPilotSuccessActionsBulk = await request("/api/admin/pilot-success-actions/bulk", {
    method: "POST",
    body: { maxCreate: 1 },
  });
  if (anonymousPilotSuccessActionsBulk.status !== 403) {
    throw new Error("anonymous pilot success action bulk access was not blocked");
  }
  const anonymousPilotSuccessActionUpdate = await request("/api/admin/pilot-success-actions/update", {
    method: "POST",
    body: { actionId: "missing", status: "done" },
  });
  if (anonymousPilotSuccessActionUpdate.status !== 403) {
    throw new Error("anonymous pilot success action update access was not blocked");
  }
  const anonymousDemoPipeline = await request("/api/admin/content-pipeline/demo-run", {
    method: "POST",
    body: {},
  });
  if (anonymousDemoPipeline.status !== 403) {
    throw new Error("anonymous content pipeline demo run was not blocked");
  }
  const anonymousContentSourceReleasePacket = await request("/api/admin/content-sources/release-packet?contentSourceId=missing&format=json");
  if (anonymousContentSourceReleasePacket.status !== 403) {
    throw new Error("anonymous content source release packet access was not blocked");
  }

  const anonymousTrialAttempt = await request("/api/attempts", {
    method: "POST",
    body: {
      scenarioId: boot.data.scenarios[0].id,
      selectedIndex: boot.data.scenarios[0].answer,
      plan: "Public trial direct submit: education evidence, invalidation, and no real-money action.",
    },
  });
  if (
    anonymousTrialAttempt.status !== 201 ||
    anonymousTrialAttempt.data.user?.id !== "demo-user" ||
    anonymousTrialAttempt.data.feedback?.providerRun?.productionReady !== false ||
    anonymousTrialAttempt.data.attempt?.userId !== "demo-user"
  ) {
    throw new Error("anonymous education trial attempt did not use the demo learner fallback safely");
  }

  const blockedProgressReport = await request("/api/learner/progress-report");
  if (blockedProgressReport.status !== 401) throw new Error("unauthenticated progress report was not blocked");

  const learnerEmail = `learner-${Date.now()}@tradegym.local`;
  const legalVersions = boot.data.legalVersions;
  if (!legalVersions?.terms || !legalVersions?.privacy || !legalVersions?.risk) {
    throw new Error("legal versions missing from bootstrap");
  }
  const blockedRegister = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Blocked Learner",
      email: `blocked-${Date.now()}@tradegym.local`,
      password: "demo12345",
    },
  });
  if (blockedRegister.status !== 400 || !blockedRegister.data.legalVersions?.terms) {
    throw new Error("registration without legal acceptance was not blocked");
  }

  const register = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "API Learner",
      email: learnerEmail,
      password: "demo12345",
      legalAcceptance: {
        accepted: true,
        termsVersion: legalVersions.terms,
        privacyVersion: legalVersions.privacy,
        riskDisclosureVersion: legalVersions.risk,
      },
    },
  });
  if (register.status !== 201 || register.data.session?.role !== "student" || !register.data.verification?.token || !jar.has("tg_session")) {
    throw new Error("learner registration failed");
  }
  const primaryLearnerId = register.data.account?.id || register.data.session.userId;

  const complianceBlockedAttempt = await request("/api/attempts", {
    method: "POST",
    body: {
      scenarioId: boot.data.scenarios[0].id,
      selectedIndex: boot.data.scenarios[0].answer,
      plan: "registered user must accept education-only risk terms first",
    },
  });
  if (complianceBlockedAttempt.status !== 451 || !complianceBlockedAttempt.data.compliance?.version) {
    throw new Error("compliance gate did not block training");
  }

  const onboardingBeforeCompliance = await request("/api/onboarding");
  if (
    onboardingBeforeCompliance.status !== 200 ||
    onboardingBeforeCompliance.data.onboarding?.currentStepId !== "compliance" ||
    onboardingBeforeCompliance.data.onboarding?.steps?.find((item) => item.id === "first_training")?.status !== "locked" ||
    onboardingBeforeCompliance.data.onboarding?.activationPlan?.schemaVersion !== "activation-plan-v1" ||
    onboardingBeforeCompliance.data.onboarding?.activationPlan?.currentFocus !== "compliance" ||
    onboardingBeforeCompliance.data.onboarding?.activationPlan?.checklist?.find((item) => item.id === "first_training")?.status !== "locked" ||
    onboardingBeforeCompliance.data.onboarding?.activationPlan?.educationOnly !== true ||
    !onboardingBeforeCompliance.data.onboarding?.activationPlan?.constraints?.some((item) => item.includes("not investment advice")) ||
    !onboardingBeforeCompliance.data.onboarding?.constraints?.some((item) => item.includes("not investment advice"))
  ) {
    throw new Error("onboarding did not guide learner to compliance acknowledgement");
  }

  const nextStepBeforeCompliance = await request("/api/next-step-plan");
  if (
    nextStepBeforeCompliance.status !== 200 ||
    nextStepBeforeCompliance.data.plan?.reportType !== "learner_next_step_plan" ||
    nextStepBeforeCompliance.data.plan?.productionReady !== false ||
    nextStepBeforeCompliance.data.plan?.educationOnly !== true ||
    nextStepBeforeCompliance.data.plan?.primary?.id !== "continue_onboarding" ||
    nextStepBeforeCompliance.data.plan?.primary?.reason !== "compliance" ||
    nextStepBeforeCompliance.data.plan?.evidence?.backtestSampleSize !== 0 ||
    !nextStepBeforeCompliance.data.plan?.constraints?.some((item) => item.includes("learning workflow recommendation")) ||
    !nextStepBeforeCompliance.data.plan?.constraints?.some((item) => item.includes("stock recommendations"))
  ) {
    throw new Error(`next-step plan before compliance failed: ${nextStepBeforeCompliance.status} ${JSON.stringify(nextStepBeforeCompliance.data).slice(0, 1200)}`);
  }

  const learnerCompliance = await request("/api/compliance/acknowledge", {
    method: "POST",
    body: {
      accepted: true,
      version: complianceBlockedAttempt.data.compliance.version,
    },
  });
  if (learnerCompliance.status !== 200 || learnerCompliance.data.compliance?.acknowledged !== true) {
    throw new Error("learner compliance acknowledgement failed");
  }
  if (
    learnerCompliance.data.onboarding?.currentStepId !== "first_training" ||
    learnerCompliance.data.onboarding?.nextView !== "trainer" ||
    !learnerCompliance.data.onboarding?.recommendedScenario?.id ||
    learnerCompliance.data.onboarding?.activationPlan?.currentFocus !== "first_training" ||
    learnerCompliance.data.onboarding?.activationPlan?.nextView !== "trainer" ||
    learnerCompliance.data.onboarding?.activationPlan?.recommendedScenario?.id !== learnerCompliance.data.onboarding.recommendedScenario.id ||
    !learnerCompliance.data.onboarding?.activationPlan?.firstDayGoal?.includes("K-line drill")
  ) {
    throw new Error("onboarding did not advance to first training after compliance");
  }

  const nextStepAfterCompliance = await request("/api/next-step-plan");
  if (
    nextStepAfterCompliance.status !== 200 ||
    nextStepAfterCompliance.data.plan?.primary?.id !== "continue_onboarding" ||
    nextStepAfterCompliance.data.plan?.primary?.targetView !== "trainer" ||
    nextStepAfterCompliance.data.plan?.primary?.scenarioId !== learnerCompliance.data.onboarding.recommendedScenario.id ||
    nextStepAfterCompliance.data.plan?.evidence?.recommendedScenarioId !== learnerCompliance.data.onboarding.recommendedScenario.id ||
    !nextStepAfterCompliance.data.plan?.constraints?.some((item) => item.includes("not market prediction"))
  ) {
    throw new Error(`next-step plan after compliance failed: ${nextStepAfterCompliance.status} ${JSON.stringify(nextStepAfterCompliance.data).slice(0, 1200)}`);
  }

  const nextStepOpenedEvent = await request("/api/next-step-plan/events", {
    method: "POST",
    body: {
      actionId: nextStepAfterCompliance.data.plan.primary.id,
      eventType: "opened",
    },
  });
  if (
    nextStepOpenedEvent.status !== 201 ||
    nextStepOpenedEvent.data.event?.actionId !== nextStepAfterCompliance.data.plan.primary.id ||
    nextStepOpenedEvent.data.event?.eventType !== "opened" ||
    nextStepOpenedEvent.data.event?.educationOnly !== true ||
    nextStepOpenedEvent.data.event?.productionReady !== false ||
    nextStepOpenedEvent.data.plan?.primary?.status !== "opened" ||
    !nextStepOpenedEvent.data.constraints?.some((item) => item.includes("education workflow progress")) ||
    !nextStepOpenedEvent.data.constraints?.some((item) => item.includes("stock recommendations"))
  ) {
    throw new Error(`next-step opened event failed: ${nextStepOpenedEvent.status} ${JSON.stringify(nextStepOpenedEvent.data).slice(0, 1200)}`);
  }

  const nextStepAfterOpenedEvent = await request("/api/next-step-plan");
  if (
    nextStepAfterOpenedEvent.status !== 200 ||
    nextStepAfterOpenedEvent.data.plan?.primary?.status !== "opened" ||
    !nextStepAfterOpenedEvent.data.plan?.evidence?.recentNextStepEvents?.some((item) => item.actionId === "continue_onboarding" && item.eventType === "opened") ||
    !nextStepAfterOpenedEvent.data.plan?.constraints?.some((item) => item.includes("stock recommendations"))
  ) {
    throw new Error(`next-step event status was not reflected: ${nextStepAfterOpenedEvent.status} ${JSON.stringify(nextStepAfterOpenedEvent.data).slice(0, 1200)}`);
  }

  const nextTraining = await request("/api/training/next");
  if (
    nextTraining.status !== 200 ||
    nextTraining.data.scenario?.id !== learnerCompliance.data.onboarding.recommendedScenario.id ||
    nextTraining.data.reason !== "first_uncompleted_scenario" ||
    nextTraining.data.scenario?.sourceTransparency?.notSignal !== true ||
    !nextTraining.data.scenario?.sourceTransparency?.constraints?.some((item) => item.includes("live buy/sell signal")) ||
    !nextTraining.data.constraints?.some((item) => item.includes("education-only practice"))
  ) {
    throw new Error("next training recommendation failed after onboarding compliance");
  }

  const nonCoachSessionBooking = await request("/api/coach/session-bookings", {
    method: "POST",
    body: {
      topic: "Education replay review",
      preferredWindow: "Next weekday evening",
      learnerGoal: "Review classroom replay notes, source boundaries, and risk-plan writing without stock recommendations, live signals, return promises, or real-money trading instructions.",
    },
  });
  if (
    nonCoachSessionBooking.status !== 402 ||
    nonCoachSessionBooking.data.error !== "Coach plan required for coach session booking" ||
    !nonCoachSessionBooking.data.constraints?.some((item) => item.includes("No stock recommendation")) ||
    !nonCoachSessionBooking.data.constraints?.some((item) => item.includes("real-money trading instruction"))
  ) {
    throw new Error(`non-Coach session booking gate failed: ${nonCoachSessionBooking.status} ${JSON.stringify(nonCoachSessionBooking.data).slice(0, 1000)}`);
  }

  const blockedLearnerSessionBooking = await request("/api/coach/session-bookings", {
    method: "POST",
    body: {
      topic: "Buy TSLA now",
      preferredWindow: "Tomorrow evening",
      learnerGoal: "Tell me to buy TSLA as a live signal for my real-money account.",
    },
  });
  if (blockedLearnerSessionBooking.status !== 402) {
    throw new Error("non-Coach prohibited session booking should remain behind Coach entitlement gate");
  }

  const learnerFirstAttempt = await request("/api/attempts", {
    method: "POST",
    body: {
      scenarioId: nextTraining.data.scenario.id,
      selectedIndex: nextTraining.data.scenario.answer,
      plan: "First onboarding drill: identify structure, invalidation, and risk limit before treating this as any decision.",
    },
  });
  if (
    learnerFirstAttempt.status !== 201 ||
    learnerFirstAttempt.data.onboarding?.steps?.find((item) => item.id === "first_training")?.status !== "completed" ||
    learnerFirstAttempt.data.onboarding?.activationPlan?.progress?.trainingAttempts < 1 ||
    learnerFirstAttempt.data.onboarding?.activationPlan?.checklist?.find((item) => item.id === "first_training")?.status !== "completed" ||
    !["first_review", "first_replay"].includes(learnerFirstAttempt.data.onboarding?.activationPlan?.currentFocus) ||
    !["first_review", "first_replay"].includes(learnerFirstAttempt.data.onboarding?.currentStepId) ||
    !learnerFirstAttempt.data.nextTraining?.scenario?.id ||
    (boot.data.scenarios.length > 1 && learnerFirstAttempt.data.nextTraining?.scenario?.id === nextTraining.data.scenario.id) ||
    learnerFirstAttempt.data.nextTraining?.educationOnly !== true ||
    learnerFirstAttempt.data.habit?.todayDone < 1 ||
    learnerFirstAttempt.data.habit?.streakDays < 1 ||
    learnerFirstAttempt.data.habit?.educationOnly !== true ||
    learnerFirstAttempt.data.feedback?.contextReview?.educationOnly !== true ||
    typeof learnerFirstAttempt.data.feedback?.contextReview?.score !== "number" ||
    !learnerFirstAttempt.data.attempt?.contextReview?.constraints?.some((item) => item.includes("News and sentiment")) ||
    !learnerFirstAttempt.data.achievements?.achievements?.some((item) => item.id === "first_drill" && item.unlocked === true)
  ) {
    throw new Error("onboarding did not advance after learner first training attempt");
  }

  const nextStepAfterFirstAttempt = await request("/api/next-step-plan");
  if (
    nextStepAfterFirstAttempt.status !== 200 ||
    nextStepAfterFirstAttempt.data.plan?.reportType !== "learner_next_step_plan" ||
    nextStepAfterFirstAttempt.data.plan?.productionReady !== false ||
    nextStepAfterFirstAttempt.data.plan?.educationOnly !== true ||
    !["continue_onboarding", "build_paper_journal", "next_training_drill", "open_inbox_item"].includes(nextStepAfterFirstAttempt.data.plan?.primary?.id) ||
    !Array.isArray(nextStepAfterFirstAttempt.data.plan?.actions) ||
    !nextStepAfterFirstAttempt.data.plan?.actions?.some((item) => ["continue_onboarding", "build_paper_journal", "next_training_drill"].includes(item.id)) ||
    !nextStepAfterFirstAttempt.data.plan?.evidence ||
    !nextStepAfterFirstAttempt.data.plan?.constraints?.some((item) => item.includes("not market prediction"))
  ) {
    throw new Error(`next-step plan after first attempt failed: ${nextStepAfterFirstAttempt.status} ${JSON.stringify(nextStepAfterFirstAttempt.data).slice(0, 1400)}`);
  }

  const learnerHabit = await request("/api/habit");
  if (
    learnerHabit.status !== 200 ||
    learnerHabit.data.habit?.todayDone < 1 ||
    learnerHabit.data.habit?.todayRemaining < 0 ||
    !learnerHabit.data.habit?.constraints?.some((item) => item.includes("学习连续性"))
  ) {
    throw new Error("learner habit summary failed after first training attempt");
  }
  const learnerAchievements = await request("/api/achievements");
  if (
    learnerAchievements.status !== 200 ||
    learnerAchievements.data.achievements?.unlockedCount < 1 ||
    !learnerAchievements.data.achievements?.achievements?.some((item) => item.id === "first_drill" && item.status === "unlocked") ||
    !learnerAchievements.data.achievements?.constraints?.some((item) => item.includes("learning behavior"))
  ) {
    throw new Error("learner achievements summary failed after first training attempt");
  }
  const nextTrainingAfterFirst = await request("/api/training/next");
  if (
    nextTrainingAfterFirst.status !== 200 ||
    (boot.data.scenarios.length > 1 && nextTrainingAfterFirst.data.scenario?.id === nextTraining.data.scenario.id)
  ) {
    throw new Error("next training did not move past completed first scenario");
  }

  const verifyEmail = await request("/api/auth/verify-email", {
    method: "POST",
    body: { token: register.data.verification.token },
  });
  if (verifyEmail.status !== 200 || verifyEmail.data.account?.emailVerified !== true) {
    throw new Error("email verification failed");
  }

  const resetRequest = await request("/api/auth/password-reset/request", {
    method: "POST",
    body: { email: learnerEmail },
  });
  if (resetRequest.status !== 200 || !resetRequest.data.resetToken) {
    throw new Error("password reset request failed");
  }

  const resetConfirm = await request("/api/auth/password-reset/confirm", {
    method: "POST",
    body: { token: resetRequest.data.resetToken, password: "demo67890" },
  });
  if (resetConfirm.status !== 200 || resetConfirm.data.account?.email !== learnerEmail) {
    throw new Error("password reset confirm failed");
  }

  const reloginLearner = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: learnerEmail,
      password: "demo67890",
    },
  });
  if (reloginLearner.status !== 200 || reloginLearner.data.session?.email !== learnerEmail) {
    throw new Error("login with reset password failed");
  }

  const learnerExport = await request("/api/account/export");
  if (learnerExport.status !== 200 || learnerExport.data.account?.email !== learnerEmail || !Array.isArray(learnerExport.data.auditLogs)) {
    throw new Error("account export failed");
  }

  const supportTicket = await request("/api/support/tickets", {
    method: "POST",
    body: {
      category: "learning",
      subject: "Need help with education-only practice",
      message: "I need help understanding my learning path and risk-plan writing. This is not a request for a stock recommendation, live signal, return promise, or real-money trading instruction.",
    },
  });
  if (
    supportTicket.status !== 201 ||
    supportTicket.data.ticket?.status !== "open" ||
    supportTicket.data.ticket?.educationOnly !== true ||
    !supportTicket.data.ticket?.slaDueAt ||
    !supportTicket.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`support ticket creation API failed: ${supportTicket.status} ${JSON.stringify(supportTicket.data).slice(0, 1000)}`);
  }
  const learnerSupportTickets = await request("/api/support/tickets");
  if (
    learnerSupportTickets.status !== 200 ||
    !learnerSupportTickets.data.tickets?.some((item) => item.id === supportTicket.data.ticket.id) ||
    !learnerSupportTickets.data.constraints?.some((item) => item.includes("live signals"))
  ) {
    throw new Error("learner support ticket list API failed");
  }

  const learnerProductReadiness = await request("/api/admin/product-readiness");
  if (learnerProductReadiness.status !== 403) {
    throw new Error("learner product readiness access was not blocked");
  }
  const learnerPrototypeScorecard = await request("/api/admin/commercial-prototype-scorecard");
  if (learnerPrototypeScorecard.status !== 403) {
    throw new Error("learner commercial prototype scorecard access was not blocked");
  }
  const learnerPrototypeScorecardExport = await request("/api/admin/commercial-prototype-scorecard/export?format=csv");
  if (learnerPrototypeScorecardExport.status !== 403) {
    throw new Error("learner commercial prototype scorecard export access was not blocked");
  }
  const learnerTrialKickoffPlan = await request("/api/admin/customer-trial-kickoff-plan");
  if (learnerTrialKickoffPlan.status !== 403) {
    throw new Error("learner customer trial kickoff plan access was not blocked");
  }
  const learnerTrialKickoffExport = await request("/api/admin/customer-trial-kickoff-plan/export?format=csv");
  if (learnerTrialKickoffExport.status !== 403) {
    throw new Error("learner customer trial kickoff plan export access was not blocked");
  }
  const learnerTrialKickoffActions = await request("/api/admin/customer-trial-kickoff-plan/create-actions", {
    method: "POST",
    body: { maxCreate: 2 },
  });
  if (learnerTrialKickoffActions.status !== 403) {
    throw new Error("learner customer trial kickoff action creation was not blocked");
  }
  const learnerTrialRoom = await request("/api/admin/customer-trial-room");
  if (learnerTrialRoom.status !== 403) {
    throw new Error("learner customer trial room access was not blocked");
  }
  const learnerTrialRoomExport = await request("/api/admin/customer-trial-room/export?format=csv");
  if (learnerTrialRoomExport.status !== 403) {
    throw new Error("learner customer trial room export access was not blocked");
  }
  const learnerTrialRoomShares = await request("/api/admin/customer-trial-room-shares");
  if (learnerTrialRoomShares.status !== 403) {
    throw new Error("learner customer trial room shares access was not blocked");
  }
  const learnerTrialRoomSharesExport = await request("/api/admin/customer-trial-room-shares/export?format=csv");
  if (learnerTrialRoomSharesExport.status !== 403) {
    throw new Error("learner customer trial room share progress export access was not blocked");
  }
  const learnerTrialRoomShareCreate = await request("/api/admin/customer-trial-room-shares", {
    method: "POST",
    body: { recipientEmail: "buyer@institution.local" },
  });
  if (learnerTrialRoomShareCreate.status !== 403) {
    throw new Error("learner customer trial room share creation was not blocked");
  }
  const learnerTrialRoomFeedback = await request("/api/admin/customer-trial-room-shares/feedback", {
    method: "POST",
    body: { shareId: "missing", feedbackStatus: "room_accepted_for_review" },
  });
  if (learnerTrialRoomFeedback.status !== 403) {
    throw new Error("learner customer trial room feedback was not blocked");
  }
  const learnerTrialRoomFeedbackAction = await request("/api/admin/customer-trial-room-shares/create-action", {
    method: "POST",
    body: { shareId: "missing" },
  });
  if (learnerTrialRoomFeedbackAction.status !== 403) {
    throw new Error("learner customer trial room feedback action was not blocked");
  }
  const learnerTrialRoomBuyerReview = await request("/api/admin/customer-trial-room-buyer-review?shareId=missing");
  if (learnerTrialRoomBuyerReview.status !== 403) {
    throw new Error("learner customer trial room buyer review access was not blocked");
  }
  const learnerTrialRoomBuyerObjection = await request("/api/admin/customer-trial-room-buyer-review/objection", {
    method: "POST",
    body: { shareId: "missing", reviewStatus: "needs_more_evidence" },
  });
  if (learnerTrialRoomBuyerObjection.status !== 403) {
    throw new Error("learner customer trial room buyer review objection was not blocked");
  }
  const learnerLaunchOpsBoard = await request("/api/admin/launch-ops-board");
  if (learnerLaunchOpsBoard.status !== 403) {
    throw new Error("learner launch ops board access was not blocked");
  }
  const learnerLaunchOpsBoardExport = await request("/api/admin/launch-ops-board/export?format=csv");
  if (learnerLaunchOpsBoardExport.status !== 403) {
    throw new Error("learner launch ops board export access was not blocked");
  }
  const learnerLaunchOpsActions = await request("/api/admin/launch-ops-board/create-actions", {
    method: "POST",
    body: { maxCreate: 2 },
  });
  if (learnerLaunchOpsActions.status !== 403) {
    throw new Error("learner launch ops action creation access was not blocked");
  }
  const learnerCustomerTrialPacket = await request("/api/admin/customer-trial-packet");
  if (learnerCustomerTrialPacket.status !== 403) {
    throw new Error("learner customer trial packet access was not blocked");
  }
  const learnerCustomerTrialPacketExport = await request("/api/admin/customer-trial-packet/export?format=csv");
  if (learnerCustomerTrialPacketExport.status !== 403) {
    throw new Error("learner customer trial packet export access was not blocked");
  }
  const learnerCustomerTrialDeliveries = await request("/api/admin/customer-trial-packet-deliveries");
  if (learnerCustomerTrialDeliveries.status !== 403) {
    throw new Error("learner customer trial packet deliveries access was not blocked");
  }
  const learnerCustomerTrialDeliveryCreate = await request("/api/admin/customer-trial-packet-deliveries", {
    method: "POST",
    body: { recipientEmail: "buyer@institution.local" },
  });
  if (learnerCustomerTrialDeliveryCreate.status !== 403) {
    throw new Error("learner customer trial packet delivery creation was not blocked");
  }
  const learnerCustomerTrialFeedback = await request("/api/admin/customer-trial-packet-deliveries/feedback", {
    method: "POST",
    body: { deliveryId: "missing", feedbackStatus: "trial_ready" },
  });
  if (learnerCustomerTrialFeedback.status !== 403) {
    throw new Error("learner customer trial packet feedback was not blocked");
  }
  const learnerCustomerTrialFeedbackAction = await request("/api/admin/customer-trial-packet-deliveries/create-action", {
    method: "POST",
    body: { deliveryId: "missing" },
  });
  if (learnerCustomerTrialFeedbackAction.status !== 403) {
    throw new Error("learner customer trial packet feedback action was not blocked");
  }
  const learnerNextStepEngagement = await request("/api/admin/next-step-engagement-report");
  if (learnerNextStepEngagement.status !== 403) {
    throw new Error("learner next-step engagement report access was not blocked");
  }
  const learnerNextStepEngagementExport = await request("/api/admin/next-step-engagement-report/export?format=md");
  if (learnerNextStepEngagementExport.status !== 403) {
    throw new Error("learner next-step engagement export access was not blocked");
  }
  const learnerCohortEducationExport = await request("/api/admin/cohort-education-report/export?cohortId=missing&format=md");
  if (learnerCohortEducationExport.status !== 403) {
    throw new Error("learner cohort education report export access was not blocked");
  }
  const learnerCohortSuccessBrief = await request("/api/admin/cohort-success-brief?cohortId=missing");
  if (learnerCohortSuccessBrief.status !== 403) {
    throw new Error("learner cohort success brief access was not blocked");
  }
  const learnerCohortSuccessBriefExport = await request("/api/admin/cohort-success-brief/export?cohortId=missing&format=md");
  if (learnerCohortSuccessBriefExport.status !== 403) {
    throw new Error("learner cohort success brief export access was not blocked");
  }
  const learnerCohortCompliancePack = await request("/api/admin/cohort-compliance-pack?cohortId=missing");
  if (learnerCohortCompliancePack.status !== 403) {
    throw new Error("learner cohort compliance pack access was not blocked");
  }
  const learnerCohortCompliancePackExport = await request("/api/admin/cohort-compliance-pack/export?cohortId=missing&format=md");
  if (learnerCohortCompliancePackExport.status !== 403) {
    throw new Error("learner cohort compliance pack export access was not blocked");
  }
  const learnerCohortProcurementPacket = await request("/api/admin/cohort-procurement-packet?cohortId=missing");
  if (learnerCohortProcurementPacket.status !== 403) {
    throw new Error("learner cohort procurement packet access was not blocked");
  }
  const learnerCohortProcurementPacketExport = await request("/api/admin/cohort-procurement-packet/export?cohortId=missing&format=md");
  if (learnerCohortProcurementPacketExport.status !== 403) {
    throw new Error("learner cohort procurement packet export access was not blocked");
  }
  const learnerCohortRenewalReview = await request("/api/admin/cohort-renewal-review?cohortId=missing");
  if (learnerCohortRenewalReview.status !== 403) {
    throw new Error("learner cohort renewal review access was not blocked");
  }
  const learnerCohortRenewalReviewExport = await request("/api/admin/cohort-renewal-review/export?cohortId=missing&format=md");
  if (learnerCohortRenewalReviewExport.status !== 403) {
    throw new Error("learner cohort renewal review export access was not blocked");
  }
  const learnerCohortRenewalReviewActions = await request("/api/admin/cohort-renewal-review/create-actions", {
    method: "POST",
    body: { cohortId: "missing" },
  });
  if (learnerCohortRenewalReviewActions.status !== 403) {
    throw new Error("learner cohort renewal review action creation was not blocked");
  }
  const learnerCohortProcurementFollowup = await request("/api/admin/cohort-procurement-followups", {
    method: "POST",
    body: { cohortId: "missing" },
  });
  if (learnerCohortProcurementFollowup.status !== 403) {
    throw new Error("learner cohort procurement follow-up creation was not blocked");
  }
  const learnerCohortProcurementDeliveries = await request("/api/admin/cohort-procurement-deliveries");
  if (learnerCohortProcurementDeliveries.status !== 403) {
    throw new Error("learner cohort procurement deliveries access was not blocked");
  }
  const learnerCohortProcurementProgress = await request("/api/admin/cohort-procurement-progress");
  if (learnerCohortProcurementProgress.status !== 403) {
    throw new Error("learner cohort procurement progress access was not blocked");
  }
  const learnerCohortProcurementBuyerReview = await request("/api/admin/cohort-procurement-buyer-review?deliveryId=missing");
  if (learnerCohortProcurementBuyerReview.status !== 403) {
    throw new Error("learner cohort procurement buyer review access was not blocked");
  }
  const learnerCohortProcurementProgressExport = await request("/api/admin/cohort-procurement-progress/export?format=md");
  if (learnerCohortProcurementProgressExport.status !== 403) {
    throw new Error("learner cohort procurement progress export access was not blocked");
  }
  const learnerCohortProcurementDeliveryCreate = await request("/api/admin/cohort-procurement-deliveries", {
    method: "POST",
    body: { cohortId: "missing", recipientEmail: "success@tradegym.local" },
  });
  if (learnerCohortProcurementDeliveryCreate.status !== 403) {
    throw new Error("learner cohort procurement delivery creation was not blocked");
  }
  const learnerCohortProcurementFeedback = await request("/api/admin/cohort-procurement-deliveries/feedback", {
    method: "POST",
    body: { deliveryId: "missing", feedbackStatus: "procurement_ready" },
  });
  if (learnerCohortProcurementFeedback.status !== 403) {
    throw new Error("learner cohort procurement feedback was not blocked");
  }
  const learnerCohortProcurementFeedbackAction = await request("/api/admin/cohort-procurement-deliveries/create-action", {
    method: "POST",
    body: { deliveryId: "missing" },
  });
  if (learnerCohortProcurementFeedbackAction.status !== 403) {
    throw new Error("learner cohort procurement feedback action was not blocked");
  }
  const learnerCohortProcurementBuyerObjection = await request("/api/admin/cohort-procurement-buyer-review/objection", {
    method: "POST",
    body: { deliveryId: "missing", reviewStatus: "needs_more_evidence" },
  });
  if (learnerCohortProcurementBuyerObjection.status !== 403) {
    throw new Error("learner cohort procurement buyer objection was not blocked");
  }
  const learnerCohortProcurementMeetingActions = await request("/api/admin/cohort-procurement-progress/create-meeting-actions", {
    method: "POST",
    body: {},
  });
  if (learnerCohortProcurementMeetingActions.status !== 403) {
    throw new Error("learner cohort procurement meeting actions were not blocked");
  }
  const learnerLearningRecordsExport = await request("/api/admin/learning-records/export?format=json");
  if (learnerLearningRecordsExport.status !== 403) {
    throw new Error("learner learning records export access was not blocked");
  }
  const learnerRosterImport = await request("/api/admin/roster-imports", {
    method: "POST",
    body: { cohortName: "Learner blocked roster", rows: "learner-blocked-roster@tradegym.local,Learner Blocked,Starter" },
  });
  if (learnerRosterImport.status !== 403) {
    throw new Error("learner roster import access was not blocked");
  }
  const learnerRosterHandoffs = await request("/api/admin/roster-import-handoffs");
  if (learnerRosterHandoffs.status !== 403) {
    throw new Error("learner roster handoffs access was not blocked");
  }
  const learnerRosterHandoffExport = await request("/api/admin/roster-import-handoffs/export?handoffId=missing&format=md");
  if (learnerRosterHandoffExport.status !== 403) {
    throw new Error("learner roster handoff export access was not blocked");
  }
  const learnerRosterOnboardingReport = await request("/api/admin/roster-onboarding-report?handoffId=missing");
  if (learnerRosterOnboardingReport.status !== 403) {
    throw new Error("learner roster onboarding report access was not blocked");
  }
  const learnerRosterOnboardingExport = await request("/api/admin/roster-onboarding-report/export?handoffId=missing&format=md");
  if (learnerRosterOnboardingExport.status !== 403) {
    throw new Error("learner roster onboarding report export access was not blocked");
  }
  const learnerRosterOnboardingProgress = await request("/api/admin/roster-onboarding-progress");
  if (learnerRosterOnboardingProgress.status !== 403) {
    throw new Error("learner roster onboarding progress access was not blocked");
  }
  const learnerRosterOnboardingProgressExport = await request("/api/admin/roster-onboarding-progress/export?format=csv");
  if (learnerRosterOnboardingProgressExport.status !== 403) {
    throw new Error("learner roster onboarding progress export access was not blocked");
  }
  const learnerRosterOnboardingFollowups = await request("/api/admin/roster-onboarding-followups", {
    method: "POST",
    body: { handoffId: "missing" },
  });
  if (learnerRosterOnboardingFollowups.status !== 403) {
    throw new Error("learner roster onboarding followups access was not blocked");
  }
  const learnerDemoPipeline = await request("/api/admin/content-pipeline/demo-run", {
    method: "POST",
    body: {},
  });
  if (learnerDemoPipeline.status !== 403) {
    throw new Error("learner content pipeline demo run was not blocked");
  }
  const learnerContentSourceReleasePacket = await request("/api/admin/content-sources/release-packet?contentSourceId=missing&format=md");
  if (learnerContentSourceReleasePacket.status !== 403) {
    throw new Error("learner content source release packet access was not blocked");
  }
  const learnerReplayDebriefFollowup = await request("/api/admin/replay-debrief-followups", {
    method: "POST",
    body: { paperTradeId: "missing" },
  });
  if (learnerReplayDebriefFollowup.status !== 403) {
    throw new Error("learner replay debrief follow-up was not blocked");
  }
  const learnerOpenSourceReferenceMap = await request("/api/admin/open-source-reference-map");
  if (learnerOpenSourceReferenceMap.status !== 403) {
    throw new Error("learner open-source reference map access was not blocked");
  }
  const learnerDatasetManifest = await request("/api/admin/historical-training-dataset-manifest");
  if (learnerDatasetManifest.status !== 403) {
    throw new Error("learner historical training dataset manifest access was not blocked");
  }
  const learnerDatasetManifestExport = await request("/api/admin/historical-training-dataset-manifest/export?format=csv");
  if (learnerDatasetManifestExport.status !== 403) {
    throw new Error("learner historical training dataset manifest export access was not blocked");
  }
  const learnerOpenSourceReferenceMapExport = await request("/api/admin/open-source-reference-map/export?format=csv");
  if (learnerOpenSourceReferenceMapExport.status !== 403) {
    throw new Error("learner open-source reference map export access was not blocked");
  }
  const learnerOpenSourceReferenceReviews = await request("/api/admin/open-source-reference-reviews");
  if (learnerOpenSourceReferenceReviews.status !== 403) {
    throw new Error("learner open-source reference review queue access was not blocked");
  }
  const learnerOpenSourceReferenceReviewUpdate = await request("/api/admin/open-source-reference-reviews/update", {
    method: "POST",
    body: { referenceKey: "backtest_analytics", status: "approved_for_design_reference", decisionNote: "learner" },
  });
  if (learnerOpenSourceReferenceReviewUpdate.status !== 403) {
    throw new Error("learner open-source reference review update access was not blocked");
  }

  const deletion = await request("/api/account/delete-request", {
    method: "POST",
    body: { reason: "API verification deletion request" },
  });
  if (deletion.status !== 202 || deletion.data.request?.moderationStatus !== "needs_review") {
    throw new Error("account deletion request failed");
  }
  const deletionRequestId = deletion.data.request.id;

  await request("/api/auth/logout", { method: "POST", body: {} });
  if (jar.has("tg_session")) throw new Error("learner logout did not clear cookie");

  const login = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: "admin@tradegym.local",
      password: "admin123",
    },
  });
  if (login.status !== 200 || login.data.session?.role !== "admin" || !jar.has("tg_session")) {
    throw new Error("admin login failed");
  }

  const adminComplianceStatus = (await request("/api/bootstrap")).data.compliance;
  if (!adminComplianceStatus?.acknowledged) {
    const adminCompliance = await request("/api/compliance/acknowledge", {
      method: "POST",
      body: {
        accepted: true,
        version: adminComplianceStatus.version,
      },
    });
    if (adminCompliance.status !== 200 || adminCompliance.data.compliance?.acknowledged !== true) {
      throw new Error("admin compliance acknowledgement failed");
    }
  }

  const adminSupportTickets = await request(`/api/admin/support-tickets?q=${encodeURIComponent(learnerEmail)}&limit=20`);
  if (
    adminSupportTickets.status !== 200 ||
    !adminSupportTickets.data.tickets?.some((item) => item.id === supportTicket.data.ticket.id && item.status === "open") ||
    !adminSupportTickets.data.constraints?.some((item) => item.includes("stock recommendations"))
  ) {
    throw new Error("admin support ticket queue API failed");
  }
  const supportSlaJsonExport = await request(`/api/admin/support-sla-report/export?format=json&q=${encodeURIComponent(learnerEmail)}&limit=20&openLimit=1`);
  if (
    supportSlaJsonExport.status !== 200 ||
    supportSlaJsonExport.data.report?.schemaVersion !== "support-sla-ops-report-v1" ||
    supportSlaJsonExport.data.report?.educationOnly !== true ||
    supportSlaJsonExport.data.report?.productionReady !== false ||
    !supportSlaJsonExport.data.report?.tickets?.some((item) => item.id === supportTicket.data.ticket.id) ||
    !supportSlaJsonExport.data.report?.constraints?.some((item) => item.includes("No stock recommendation")) ||
    !supportSlaJsonExport.data.note?.includes("education service operations")
  ) {
    throw new Error("admin support SLA JSON export failed");
  }
  const supportSlaCsvExport = await request(`/api/admin/support-sla-report/export?format=csv&q=${encodeURIComponent(learnerEmail)}&limit=20`);
  if (
    supportSlaCsvExport.status !== 200 ||
    !String(supportSlaCsvExport.data).startsWith("kind,id,email,learnerName,status,priority") ||
    !String(supportSlaCsvExport.data).includes(supportTicket.data.ticket.id) ||
    !String(supportSlaCsvExport.data).includes("false")
  ) {
    throw new Error("admin support SLA CSV export failed");
  }
  const supportSlaMdExport = await request(`/api/admin/support-sla-report/export?format=md&q=${encodeURIComponent(learnerEmail)}&limit=20`);
  if (
    supportSlaMdExport.status !== 200 ||
    !String(supportSlaMdExport.data).includes("# TradeGym Support/SLA Operations Report") ||
    !String(supportSlaMdExport.data).includes("not trading advice") ||
    !String(supportSlaMdExport.data).includes("No stock recommendation")
  ) {
    throw new Error("admin support SLA markdown export failed");
  }
  const supportSlaExportAudit = await request("/api/admin/audit-logs?type=support_sla_report_exported&limit=20");
  if (
    supportSlaExportAudit.status !== 200 ||
    !supportSlaExportAudit.data.items?.some((item) => item.type === "support_sla_report_exported" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error("support SLA report export audit log missing");
  }
  const blockedSupportTicketUpdate = await request("/api/admin/support-tickets/update", {
    method: "POST",
    body: {
      ticketId: supportTicket.data.ticket.id,
      status: "resolved",
      adminNote: "Buy AAPL now and follow this live signal for guaranteed profit.",
    },
  });
  if (
    blockedSupportTicketUpdate.status !== 422 ||
    blockedSupportTicketUpdate.data.error !== "Education compliance guard blocked trading-advice wording" ||
    blockedSupportTicketUpdate.data.complianceGuard?.blocked !== true ||
    !blockedSupportTicketUpdate.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("admin support ticket compliance guard did not block prohibited advice");
  }
  const supportTicketUpdate = await request("/api/admin/support-tickets/update", {
    method: "POST",
    body: {
      ticketId: supportTicket.data.ticket.id,
      status: "resolved",
      adminNote: "Resolved as education product support. No stock recommendations, live signals, return promises, or real-money trading instructions were provided.",
    },
  });
  if (
    supportTicketUpdate.status !== 200 ||
    supportTicketUpdate.data.ticket?.status !== "resolved" ||
    supportTicketUpdate.data.ticket?.educationOnly !== true ||
    !supportTicketUpdate.data.ticket?.resolvedAt ||
    !supportTicketUpdate.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("admin support ticket update API failed");
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const learnerSupportRelogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: learnerEmail, password: "demo67890" },
  });
  if (learnerSupportRelogin.status !== 200 || learnerSupportRelogin.data.session?.email !== learnerEmail) {
    throw new Error("learner support notification relogin failed");
  }
  const supportNotifications = await request("/api/notifications");
  if (
    supportNotifications.status !== 200 ||
    supportNotifications.data.summary?.supportReplies < 1 ||
    !supportNotifications.data.notifications?.some((item) => item.type === "support_ticket_update" && item.ticketId === supportTicket.data.ticket.id)
  ) {
    throw new Error("support ticket notification missing");
  }
  const supportRead = await request("/api/support/tickets/read", {
    method: "POST",
    body: { ticketId: supportTicket.data.ticket.id },
  });
  if (
    supportRead.status !== 200 ||
    supportRead.data.ticket?.learnerReadAt == null ||
    supportRead.data.notifications?.summary?.supportReplies !== 0 ||
    !supportRead.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("support ticket read receipt API failed");
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const adminAfterSupportRead = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminAfterSupportRead.status !== 200 || adminAfterSupportRead.data.session?.role !== "admin") {
    throw new Error("admin relogin after support notification check failed");
  }

  const initialEntitlement = await request("/api/billing/entitlements");
  if (initialEntitlement.status !== 200 || !initialEntitlement.data.entitlement?.limits) {
    throw new Error("entitlement API failed");
  }

  const starterCheckout = await request("/api/billing/checkout-session", {
    method: "POST",
    body: { plan: "Starter" },
  });
  if (starterCheckout.status !== 200 || starterCheckout.data.order?.status !== "pending") {
    throw new Error("starter checkout session failed");
  }

  const coachCheckout = await request("/api/billing/checkout-session", {
    method: "POST",
    body: { plan: "Coach" },
  });
  if (coachCheckout.status !== 200 || coachCheckout.data.order?.status !== "pending") {
    throw new Error("coach checkout session failed");
  }

  const paid = await request("/api/billing/webhook", {
    method: "POST",
    body: { type: "payment.succeeded", orderId: coachCheckout.data.order.id },
  });
  if (paid.status !== 200 || paid.data.subscription?.status !== "active" || paid.data.entitlement.plan !== "Coach") {
    throw new Error("billing payment webhook failed");
  }

  const subscription = await request("/api/billing/subscription");
  if (subscription.status !== 200 || subscription.data.activeSubscription?.plan !== "Coach") {
    throw new Error("subscription API failed");
  }

  const orders = await request("/api/billing/orders");
  if (orders.status !== 200 || !orders.data.orders?.some((order) => order.id === coachCheckout.data.order.id)) {
    throw new Error("orders API failed");
  }

  const blockedCoachSessionBooking = await request("/api/coach/session-bookings", {
    method: "POST",
    body: {
      topic: "Buy TSLA now",
      preferredWindow: "Tomorrow evening",
      learnerGoal: "Give me a live buy signal for TSLA and tell me how much real money to put in.",
    },
  });
  if (
    blockedCoachSessionBooking.status !== 422 ||
    blockedCoachSessionBooking.data.complianceGuard?.blocked !== true ||
    !blockedCoachSessionBooking.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("Coach session booking compliance guard did not block prohibited advice");
  }

  const coachSessionBooking = await request("/api/coach/session-bookings", {
    method: "POST",
    body: {
      topic: "Education-only replay and risk-plan review",
      preferredWindow: "Next weekday evening",
      learnerGoal: "Review learning evidence, replay notes, context boundaries, and risk-plan writing for classroom accountability.",
    },
  });
  if (
    coachSessionBooking.status !== 201 ||
    coachSessionBooking.data.booking?.status !== "requested" ||
    coachSessionBooking.data.booking?.educationOnly !== true ||
    coachSessionBooking.data.booking?.productionReady !== false ||
    coachSessionBooking.data.booking?.provider?.calendar !== "local_manual" ||
    !coachSessionBooking.data.booking?.constraints?.some((item) => item.includes("No stock recommendation")) ||
    !coachSessionBooking.data.booking?.constraints?.some((item) => item.includes("Production scheduling still requires"))
  ) {
    throw new Error(`Coach session booking create failed: ${coachSessionBooking.status} ${JSON.stringify(coachSessionBooking.data).slice(0, 1200)}`);
  }
  const coachSessionBookingId = coachSessionBooking.data.booking.id;

  const learnerCoachSessionBookings = await request("/api/coach/session-bookings");
  if (
    learnerCoachSessionBookings.status !== 200 ||
    !learnerCoachSessionBookings.data.bookings?.some((item) => item.id === coachSessionBookingId) ||
    learnerCoachSessionBookings.data.summary?.requested < 1 ||
    learnerCoachSessionBookings.data.productionReady !== false ||
    !learnerCoachSessionBookings.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`learner Coach session booking list failed: ${learnerCoachSessionBookings.status} ${JSON.stringify(learnerCoachSessionBookings.data).slice(0, 1200)}`);
  }

  const adminCoachSessionQueue = await request("/api/admin/coach-session-bookings?status=requested&limit=20");
  if (
    adminCoachSessionQueue.status !== 200 ||
    !adminCoachSessionQueue.data.bookings?.some((item) => item.id === coachSessionBookingId && item.status === "requested") ||
    adminCoachSessionQueue.data.summary?.requested < 1 ||
    adminCoachSessionQueue.data.productionReady !== false ||
    adminCoachSessionQueue.data.provider?.calendar !== "local_manual" ||
    !adminCoachSessionQueue.data.constraints?.some((item) => item.includes("stock recommendations"))
  ) {
    throw new Error(`admin Coach session queue failed: ${adminCoachSessionQueue.status} ${JSON.stringify(adminCoachSessionQueue.data).slice(0, 1200)}`);
  }

  const blockedCoachSessionUpdate = await request("/api/admin/coach-session-bookings/update", {
    method: "POST",
    body: {
      bookingId: coachSessionBookingId,
      status: "confirmed",
      scheduledAt: "2099-01-01T10:00:00.000Z",
      assignedCoachEmail: "coach-a@tradegym.local",
      adminNote: "买入 TSLA，这是实盘信号。",
    },
  });
  if (
    blockedCoachSessionUpdate.status !== 422 ||
    blockedCoachSessionUpdate.data.complianceGuard?.blocked !== true
  ) {
    throw new Error("Coach session admin update compliance guard did not block prohibited advice");
  }

  const confirmedCoachSession = await request("/api/admin/coach-session-bookings/update", {
    method: "POST",
    body: {
      bookingId: coachSessionBookingId,
      status: "confirmed",
      scheduledAt: "2099-01-01T10:00:00.000Z",
      assignedCoachEmail: "coach-a@tradegym.local",
      meetingLink: "manual-scheduling-required",
      adminNote: "Education-only scheduling note for replay, evidence boundaries, and risk-plan review.",
    },
  });
  if (
    confirmedCoachSession.status !== 200 ||
    confirmedCoachSession.data.booking?.status !== "confirmed" ||
    confirmedCoachSession.data.booking?.scheduledAt !== "2099-01-01T10:00:00.000Z" ||
    confirmedCoachSession.data.booking?.assignedCoachEmail !== "coach-a@tradegym.local" ||
    confirmedCoachSession.data.booking?.meetingLink !== "manual-scheduling-required" ||
    confirmedCoachSession.data.booking?.educationOnly !== true ||
    confirmedCoachSession.data.booking?.productionReady !== false ||
    !confirmedCoachSession.data.booking?.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`Coach session confirm failed: ${confirmedCoachSession.status} ${JSON.stringify(confirmedCoachSession.data).slice(0, 1200)}`);
  }

  const coachSessionNotifications = await request("/api/notifications");
  const coachSessionNotification = coachSessionNotifications.data.notifications?.find((item) => (
    item.type === "coach_session_booking" &&
    item.bookingId === coachSessionBookingId &&
    item.status === "unread" &&
    item.educationOnly === true &&
    item.actionLabel === "Open session details"
  ));
  if (
    coachSessionNotifications.status !== 200 ||
    coachSessionNotifications.data.summary?.coachSessions < 1 ||
    !coachSessionNotification ||
    !coachSessionNotifications.data.constraints?.some((item) => item.includes("not stock recommendations"))
  ) {
    throw new Error(`Coach session notification missing: ${coachSessionNotifications.status} ${JSON.stringify(coachSessionNotifications.data).slice(0, 1200)}`);
  }

  const coachSessionRead = await request("/api/coach/session-bookings/read", {
    method: "POST",
    body: { bookingId: coachSessionBookingId },
  });
  if (
    coachSessionRead.status !== 200 ||
    coachSessionRead.data.booking?.id !== coachSessionBookingId ||
    !coachSessionRead.data.booking?.learnerReadAt ||
    coachSessionRead.data.booking?.learnerStatus !== "read" ||
    coachSessionRead.data.notifications?.notifications?.some((item) => item.type === "coach_session_booking" && item.bookingId === coachSessionBookingId && item.status === "unread") ||
    !coachSessionRead.data.constraints?.some((item) => item.includes("education service follow-through only"))
  ) {
    throw new Error(`Coach session read acknowledgement failed: ${coachSessionRead.status} ${JSON.stringify(coachSessionRead.data).slice(0, 1600)}`);
  }

  const blockedCoachSessionReminder = await request("/api/admin/coach-session-bookings/remind", {
    method: "POST",
    body: {
      bookingId: coachSessionBookingId,
      message: "Buy TSLA now and follow this live signal for a real-money account.",
    },
  });
  if (
    blockedCoachSessionReminder.status !== 422 ||
    blockedCoachSessionReminder.data.complianceGuard?.blocked !== true
  ) {
    throw new Error("Coach session reminder compliance guard did not block prohibited advice");
  }

  const coachSessionReminder = await request("/api/admin/coach-session-bookings/remind", {
    method: "POST",
    body: {
      bookingId: coachSessionBookingId,
      message: "Education session reminder: prepare replay notes, evidence questions, and risk-plan writing before the appointment.",
    },
  });
  if (
    coachSessionReminder.status !== 201 ||
    coachSessionReminder.data.reminder?.provider !== "local_manual" ||
    coachSessionReminder.data.reminder?.educationOnly !== true ||
    coachSessionReminder.data.reminder?.productionReady !== false ||
    coachSessionReminder.data.booking?.learnerStatus !== "unread" ||
    !coachSessionReminder.data.booking?.lastReminderAt ||
    !coachSessionReminder.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`Coach session reminder failed: ${coachSessionReminder.status} ${JSON.stringify(coachSessionReminder.data).slice(0, 1600)}`);
  }

  const coachSessionReminderNotifications = await request("/api/notifications");
  if (
    coachSessionReminderNotifications.status !== 200 ||
    !coachSessionReminderNotifications.data.notifications?.some((item) => (
      item.type === "coach_session_booking" &&
      item.bookingId === coachSessionBookingId &&
      item.status === "unread" &&
      item.lastReminderAt === coachSessionReminder.data.booking.lastReminderAt
    ))
  ) {
    throw new Error(`Coach session reminder notification missing: ${coachSessionReminderNotifications.status} ${JSON.stringify(coachSessionReminderNotifications.data).slice(0, 1200)}`);
  }

  const rescheduledCoachSession = await request("/api/admin/coach-session-bookings/update", {
    method: "POST",
    body: {
      bookingId: coachSessionBookingId,
      status: "confirmed",
      scheduledAt: "2099-01-02T10:00:00.000Z",
      assignedCoachEmail: "coach-a@tradegym.local",
      meetingLink: "manual-scheduling-required",
      adminNote: "Education-only reschedule note for replay evidence and risk-plan review.",
    },
  });
  if (
    rescheduledCoachSession.status !== 200 ||
    rescheduledCoachSession.data.booking?.scheduledAt !== "2099-01-02T10:00:00.000Z" ||
    rescheduledCoachSession.data.booking?.rescheduleCount < 1 ||
    !rescheduledCoachSession.data.booking?.lastRescheduledAt ||
    rescheduledCoachSession.data.booking?.learnerStatus !== "unread"
  ) {
    throw new Error(`Coach session reschedule failed: ${rescheduledCoachSession.status} ${JSON.stringify(rescheduledCoachSession.data).slice(0, 1600)}`);
  }

  const prematurePostSessionAssignment = await request("/api/admin/coach-session-bookings/assign-practice", {
    method: "POST",
    body: {
      bookingId: coachSessionBookingId,
      instructions: "Complete this post-session education drill after the appointment is closed.",
    },
  });
  if (
    prematurePostSessionAssignment.status !== 400 ||
    prematurePostSessionAssignment.data.error !== "Post-session practice assignment requires completed coach session"
  ) {
    throw new Error(`Premature post-session assignment was not blocked: ${prematurePostSessionAssignment.status} ${JSON.stringify(prematurePostSessionAssignment.data).slice(0, 1000)}`);
  }

  const completedCoachSession = await request("/api/admin/coach-session-bookings/update", {
    method: "POST",
    body: {
      bookingId: coachSessionBookingId,
      status: "completed",
      adminNote: "Education session completed: learner reviewed evidence boundaries, replay notes, and risk-plan writing.",
    },
  });
  if (
    completedCoachSession.status !== 200 ||
    completedCoachSession.data.booking?.status !== "completed" ||
    !completedCoachSession.data.booking?.completedAt ||
    completedCoachSession.data.summary?.completed < 1
  ) {
    throw new Error(`Coach session complete failed: ${completedCoachSession.status} ${JSON.stringify(completedCoachSession.data).slice(0, 1200)}`);
  }

  const blockedPostSessionAssignment = await request("/api/admin/coach-session-bookings/assign-practice", {
    method: "POST",
    body: {
      bookingId: coachSessionBookingId,
      instructions: "Buy TSLA now and use this live signal in a real-money account.",
    },
  });
  if (
    blockedPostSessionAssignment.status !== 422 ||
    blockedPostSessionAssignment.data.complianceGuard?.blocked !== true
  ) {
    throw new Error("Post-session assignment compliance guard did not block prohibited advice");
  }

  const postSessionAssignment = await request("/api/admin/coach-session-bookings/assign-practice", {
    method: "POST",
    body: {
      bookingId: coachSessionBookingId,
      instructions: "Complete this post-session education drill and write one evidence note plus one risk-plan improvement.",
      dueAt: "2099-01-09T10:00:00.000Z",
    },
  });
  if (
    postSessionAssignment.status !== 201 ||
    postSessionAssignment.data.assignment?.source !== "coach_session_followup" ||
    postSessionAssignment.data.assignment?.coachSessionBookingId !== coachSessionBookingId ||
    postSessionAssignment.data.assignment?.status !== "assigned" ||
    postSessionAssignment.data.assignment?.dueAt !== "2099-01-09T10:00:00.000Z" ||
    postSessionAssignment.data.assignment?.educationOnly !== true ||
    postSessionAssignment.data.assignment?.productionReady !== false ||
    postSessionAssignment.data.booking?.postSessionAssignmentIds?.[0] !== postSessionAssignment.data.assignment.id ||
    postSessionAssignment.data.booking?.learnerStatus !== "unread" ||
    !postSessionAssignment.data.notifications?.notifications?.some((item) => item.type === "practice_assignment" && item.assignmentId === postSessionAssignment.data.assignment.id) ||
    !postSessionAssignment.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`Post-session practice assignment failed: ${postSessionAssignment.status} ${JSON.stringify(postSessionAssignment.data).slice(0, 1800)}`);
  }

  const coachSessionPostAssignmentAudit = await request("/api/admin/audit-logs?type=coach_session_post_assignment_created&limit=20");
  if (
    coachSessionPostAssignmentAudit.status !== 200 ||
    !coachSessionPostAssignmentAudit.data.items?.some((item) => (
      item.type === "coach_session_post_assignment_created" &&
      item.bookingId === coachSessionBookingId &&
      item.assignmentId === postSessionAssignment.data.assignment.id &&
      item.educationOnly === true
    ))
  ) {
    throw new Error(`Post-session assignment audit missing: ${coachSessionPostAssignmentAudit.status} ${JSON.stringify(coachSessionPostAssignmentAudit.data).slice(0, 1000)}`);
  }

  const postSessionLearnerLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (postSessionLearnerLogin.status !== 200) {
    throw new Error("post-session learner relogin failed");
  }
  const postSessionScenario = (await request("/api/bootstrap")).data.scenarios?.find((item) => item.id === postSessionAssignment.data.assignment.scenarioId);
  if (!postSessionScenario) {
    throw new Error("post-session assigned scenario missing from learner bootstrap");
  }
  const postSessionAttempt = await request("/api/attempts", {
    method: "POST",
    body: {
      scenarioId: postSessionScenario.id,
      selectedIndex: postSessionScenario.answer,
      plan: "Post-session education drill: write the structure, evidence note, invalidation, and risk-plan improvement before checking outcome.",
    },
  });
  if (
    postSessionAttempt.status !== 201 ||
    !postSessionAttempt.data.practiceAssignments?.some((item) => (
      item.id === postSessionAssignment.data.assignment.id &&
      item.status === "completed" &&
      item.completedAttemptId === postSessionAttempt.data.attempt.id &&
      item.coachSessionBookingId === coachSessionBookingId
    ))
  ) {
    throw new Error(`Post-session assignment was not completed by learner attempt: ${postSessionAttempt.status} ${JSON.stringify(postSessionAttempt.data).slice(0, 1600)}`);
  }
  const postSessionCoachBookings = await request("/api/coach/session-bookings");
  if (
    postSessionCoachBookings.status !== 200 ||
    !postSessionCoachBookings.data.bookings?.some((item) => (
      item.id === coachSessionBookingId &&
      item.postSessionOutcomeStatus === "practice_completed" &&
      item.postSessionCompletedAssignmentIds?.includes(postSessionAssignment.data.assignment.id) &&
      item.lastPostSessionAssignmentCompletedAt
    ))
  ) {
    throw new Error(`Coach session did not record post-session practice completion: ${postSessionCoachBookings.status} ${JSON.stringify(postSessionCoachBookings.data).slice(0, 1600)}`);
  }
  const postSessionProgressReport = await request("/api/learner/progress-report");
  if (
    postSessionProgressReport.status !== 200 ||
    postSessionProgressReport.data.report?.activity?.coachSessionPostAssignmentsCompleted < 1 ||
    !postSessionProgressReport.data.report?.coachSessionFollowups?.some((item) => (
      item.id === coachSessionBookingId &&
      item.postSessionOutcomeStatus === "practice_completed" &&
      item.assignments?.some((assignment) => assignment.id === postSessionAssignment.data.assignment.id && assignment.status === "completed")
    ))
  ) {
    throw new Error(`Progress report missing post-session practice evidence: ${postSessionProgressReport.status} ${JSON.stringify(postSessionProgressReport.data).slice(0, 1800)}`);
  }

  const adminAfterPostSessionEvidence = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminAfterPostSessionEvidence.status !== 200 || adminAfterPostSessionEvidence.data.session?.role !== "admin") {
    throw new Error("admin relogin after post-session evidence failed");
  }
  const postSessionRevenueOps = await request("/api/admin/revenue-ops?limit=80");
  const postSessionRevenueOpsItem = postSessionRevenueOps.data.items?.find((item) => item.userId === adminAfterPostSessionEvidence.data.session.userId);
  if (
    postSessionRevenueOps.status !== 200 ||
    postSessionRevenueOpsItem?.service?.coachSessions?.completed < 1 ||
    postSessionRevenueOpsItem?.service?.coachSessions?.postAssignments < 1 ||
    postSessionRevenueOpsItem?.service?.coachSessions?.completedPostAssignments < 1 ||
    !postSessionRevenueOpsItem?.service?.coachSessions?.latestCompletedPostAssignmentAt ||
    !(
      postSessionRevenueOpsItem?.nextAction?.includes("completed Coach session practice evidence") ||
      postSessionRevenueOpsItem?.nextAction?.includes("Complete open Coach session post-practice")
    )
  ) {
    throw new Error(`Revenue Ops missing Coach session completion evidence: ${postSessionRevenueOps.status} ${JSON.stringify(postSessionRevenueOps.data).slice(0, 1800)}`);
  }

  const coachSessionAudit = await request("/api/admin/audit-logs?type=coach_session_booking_updated&limit=20");
  if (
    coachSessionAudit.status !== 200 ||
    !coachSessionAudit.data.items?.some((item) => item.type === "coach_session_booking_updated" && item.bookingId === coachSessionBookingId && item.educationOnly === true)
  ) {
    throw new Error(`Coach session audit missing: ${coachSessionAudit.status} ${JSON.stringify(coachSessionAudit.data).slice(0, 1000)}`);
  }

  const contentSource = await request("/api/admin/content-sources", {
    method: "POST",
    body: {
      title: "API source: failed breakout transcript",
      sourceType: "video_transcript",
      rawText: "Video transcript demo: when price breaks out and then falls back into the prior range, learners should identify invalidation, reduce risk, and wait for a new structure. This content is education-only and must not be treated as a live buy or sell signal.",
      licenseStatus: "internal_demo",
    },
  });
  if (
    contentSource.status !== 201 ||
    contentSource.data.contentSource?.sourceType !== "video_transcript" ||
    contentSource.data.contentSource?.extraction?.method !== "fallback-text-segmentation" ||
    contentSource.data.contentSource?.reviewStatus !== "needs_review" ||
    contentSource.data.contentSource?.releaseReadiness?.readyForDemoCourseAssembly !== false ||
    !contentSource.data.contentSource?.releaseReadiness?.blockers?.includes("source_rights_review") ||
    !contentSource.data.contentSource?.releaseReadiness?.constraints?.some((item) => item.includes("education curriculum")) ||
    !contentSource.data.contentSource?.knowledgeCandidates?.length
  ) {
    throw new Error("content source creation API failed");
  }

  const contentSources = await request("/api/admin/content-sources");
  if (
    contentSources.status !== 200 ||
    contentSources.data.summary?.total < 1 ||
    !contentSources.data.items?.some((item) => item.id === contentSource.data.contentSource.id) ||
    !contentSources.data.constraints?.some((item) => item.includes("Human review"))
  ) {
    throw new Error("content source library API failed");
  }

  const chartScreenshotIntake = await request("/api/admin/chart-screenshot-intakes", {
    method: "POST",
    body: {
      title: "API chart screenshot intake: failed breakout frame",
      screenshotRef: "api-chart-frame-001",
      symbol: "DEMO-PRICE",
      timeframe: "15m",
      ocrText: "OCR extracted from chart frame: failed breakout returns inside prior range; learner marks structure, invalidation, and no-trade condition before outcome review.",
      fallbackText: "Human fallback alignment: the frame is a demo K-line classroom screenshot. It supports a drill about invalidation and risk boundary, not a live trade direction.",
      observedStructure: "Failed breakout returns into the prior range.",
      invalidation: "The breakout thesis is invalid when price returns into the prior range.",
      learnerQuestion: "What structure, invalidation, and no-trade condition should be written before outcome feedback?",
      licenseStatus: "internal_demo",
    },
  });
  if (
    chartScreenshotIntake.status !== 201 ||
    chartScreenshotIntake.data.contentSource?.sourceType !== "chart_screenshot_ocr" ||
    chartScreenshotIntake.data.contentSource?.extraction?.method !== "chart-screenshot-ocr-fallback" ||
    chartScreenshotIntake.data.contentSource?.extraction?.alignmentStatus !== "needs_human_review" ||
    chartScreenshotIntake.data.contentSource?.chartScreenshot?.screenshotRef !== "api-chart-frame-001" ||
    chartScreenshotIntake.data.contentSource?.chartScreenshot?.symbol !== "DEMO-PRICE" ||
    chartScreenshotIntake.data.contentSource?.chartScreenshot?.timeframe !== "15m" ||
    chartScreenshotIntake.data.contentSource?.chartScreenshot?.educationOnly !== true ||
    !chartScreenshotIntake.data.contentSource?.chartScreenshot?.prohibitedUses?.includes("live buy/sell signal") ||
    !chartScreenshotIntake.data.constraints?.some((item) => item.includes("does not create stock recommendations"))
  ) {
    throw new Error(`chart screenshot intake API failed: ${chartScreenshotIntake.status} ${JSON.stringify(chartScreenshotIntake.data).slice(0, 1200)}`);
  }
  const chartScreenshotJob = await request("/api/admin/content-processing-jobs", {
    method: "POST",
    body: {
      contentSourceId: chartScreenshotIntake.data.contentSource.id,
      mode: "chart_screenshot_fallback_alignment",
    },
  });
  if (
    chartScreenshotJob.status !== 201 ||
    chartScreenshotJob.data.job?.sourceType !== "chart_screenshot_ocr" ||
    chartScreenshotJob.data.job?.alignmentStatus !== "needs_human_review" ||
    !chartScreenshotJob.data.job?.warnings?.some((item) => item.includes("Chart screenshot OCR requires")) ||
    chartScreenshotJob.data.contentSource?.chartScreenshot?.fallbackAlignmentStatus !== "fallback_note_provided" ||
    chartScreenshotJob.data.contentSource?.lastProcessingJobId !== chartScreenshotJob.data.job.id ||
    !chartScreenshotJob.data.job?.constraints?.some((item) => item.includes("stock recommendations"))
  ) {
    throw new Error(`chart screenshot processing job failed: ${chartScreenshotJob.status} ${JSON.stringify(chartScreenshotJob.data).slice(0, 1200)}`);
  }
  const chartScreenshotReview = await request("/api/admin/chart-screenshot-intakes/review", {
    method: "POST",
    body: {
      contentSourceId: chartScreenshotIntake.data.contentSource.id,
      reviewStatus: "aligned_for_demo",
      reviewedStructure: "Human reviewed chart frame: failed breakout returns into the prior range and the learner labels the structure before outcome feedback.",
      reviewedInvalidation: "Human reviewed invalidation: the breakout thesis is invalid when price returns into the prior range; learner reduces risk and waits.",
      confidence: 0.87,
      reviewNote: "Verifier approves chart screenshot OCR/fallback alignment for internal education demo only.",
    },
  });
  if (
    chartScreenshotReview.status !== 200 ||
    chartScreenshotReview.data.chartScreenshot?.reviewStatus !== "aligned_for_demo" ||
    chartScreenshotReview.data.chartScreenshot?.approvedForDemo !== true ||
    chartScreenshotReview.data.chartScreenshot?.fallbackAlignmentStatus !== "human_reviewed_for_demo" ||
    !chartScreenshotReview.data.evidence?.id ||
    chartScreenshotReview.data.evidence?.reviewStatus !== "aligned_for_demo" ||
    chartScreenshotReview.data.contentSource?.alignmentEvidenceCount < 1 ||
    chartScreenshotReview.data.contentSource?.extraction?.alignmentStatus !== "evidence_reviewed_for_demo" ||
    chartScreenshotReview.data.contentSource?.releaseChecklist?.chartContext !== "frame_alignment_reviewed_for_demo" ||
    chartScreenshotReview.data.contentSource?.releaseReadiness?.alignmentReviewed !== true ||
    !chartScreenshotReview.data.constraints?.some((item) => item.includes("does not create stock recommendations"))
  ) {
    throw new Error(`chart screenshot review failed: ${chartScreenshotReview.status} ${JSON.stringify(chartScreenshotReview.data).slice(0, 1200)}`);
  }
  const chartScreenshotAudit = await request("/api/admin/audit-logs?type=chart_screenshot_intake_created&limit=20");
  if (
    chartScreenshotAudit.status !== 200 ||
    !chartScreenshotAudit.data.items?.some((item) => (
      item.type === "chart_screenshot_intake_created" &&
      item.contentSourceId === chartScreenshotIntake.data.contentSource.id &&
      item.educationOnly === true &&
      item.moderationStatus === "needs_review"
    ))
  ) {
    throw new Error(`chart screenshot intake audit failed: ${chartScreenshotAudit.status} ${JSON.stringify(chartScreenshotAudit.data).slice(0, 1200)}`);
  }
  const chartScreenshotReviewAudit = await request("/api/admin/audit-logs?type=chart_screenshot_intake_reviewed&limit=20");
  if (
    chartScreenshotReviewAudit.status !== 200 ||
    !chartScreenshotReviewAudit.data.items?.some((item) => (
      item.type === "chart_screenshot_intake_reviewed" &&
      item.contentSourceId === chartScreenshotIntake.data.contentSource.id &&
      item.evidenceId === chartScreenshotReview.data.evidence.id &&
      item.approvedForDemo === true &&
      item.educationOnly === true
    ))
  ) {
    throw new Error(`chart screenshot review audit failed: ${chartScreenshotReviewAudit.status} ${JSON.stringify(chartScreenshotReviewAudit.data).slice(0, 1200)}`);
  }
  const chartScreenshotScenario = await request("/api/admin/chart-screenshot-intakes/submit-scenario", {
    method: "POST",
    body: {
      contentSourceId: chartScreenshotIntake.data.contentSource.id,
    },
  });
  if (
    chartScreenshotScenario.status !== 201 ||
    chartScreenshotScenario.data.scenario?.reviewStatus !== "needs_review" ||
    chartScreenshotScenario.data.scenario?.reviewChecklist?.chartScreenshotAlignment !== "reviewed_for_demo" ||
    chartScreenshotScenario.data.scenario?.source?.contentSourceId !== chartScreenshotIntake.data.contentSource.id ||
    chartScreenshotScenario.data.scenario?.source?.notSignal !== true ||
    chartScreenshotScenario.data.contentSource?.chartScreenshot?.submittedScenarioId !== chartScreenshotScenario.data.scenario.id ||
    chartScreenshotScenario.data.contentSource?.releaseReadiness?.hasScenarioDraft !== true ||
    !chartScreenshotScenario.data.reviewQueue?.some((item) => item.id === chartScreenshotScenario.data.scenario.id && item.reviewStatus === "needs_review") ||
    !chartScreenshotScenario.data.constraints?.some((item) => item.includes("stops at release review"))
  ) {
    throw new Error(`chart screenshot scenario submission failed: ${chartScreenshotScenario.status} ${JSON.stringify(chartScreenshotScenario.data).slice(0, 1200)}`);
  }
  const reusedChartScreenshotScenario = await request("/api/admin/chart-screenshot-intakes/submit-scenario", {
    method: "POST",
    body: {
      contentSourceId: chartScreenshotIntake.data.contentSource.id,
    },
  });
  if (
    reusedChartScreenshotScenario.status !== 200 ||
    reusedChartScreenshotScenario.data.reused !== true ||
    reusedChartScreenshotScenario.data.scenario?.id !== chartScreenshotScenario.data.scenario.id ||
    reusedChartScreenshotScenario.data.scenario?.reviewStatus !== "needs_review"
  ) {
    throw new Error(`chart screenshot scenario reuse failed: ${reusedChartScreenshotScenario.status} ${JSON.stringify(reusedChartScreenshotScenario.data).slice(0, 1200)}`);
  }
  const chartScreenshotScenarioAudit = await request("/api/admin/audit-logs?type=chart_screenshot_scenario_submitted&limit=20");
  if (
    chartScreenshotScenarioAudit.status !== 200 ||
    !chartScreenshotScenarioAudit.data.items?.some((item) => (
      item.type === "chart_screenshot_scenario_submitted" &&
      item.contentSourceId === chartScreenshotIntake.data.contentSource.id &&
      item.scenarioId === chartScreenshotScenario.data.scenario.id &&
      item.educationOnly === true &&
      item.moderationStatus === "needs_review"
    ))
  ) {
    throw new Error(`chart screenshot scenario audit failed: ${chartScreenshotScenarioAudit.status} ${JSON.stringify(chartScreenshotScenarioAudit.data).slice(0, 1200)}`);
  }
  const blockedChartPackage = await request("/api/admin/chart-screenshot-intakes/create-course-package", {
    method: "POST",
    body: {
      contentSourceId: chartScreenshotIntake.data.contentSource.id,
      title: "Blocked chart package before scenario approval",
    },
  });
  if (
    blockedChartPackage.status !== 400 ||
    !String(blockedChartPackage.data.error || "").includes("must be approved")
  ) {
    throw new Error(`chart package should require approved scenario: ${blockedChartPackage.status} ${JSON.stringify(blockedChartPackage.data).slice(0, 1200)}`);
  }
  const approvedChartScenario = await request("/api/admin/scenarios/review", {
    method: "POST",
    body: {
      scenarioId: chartScreenshotScenario.data.scenario.id,
      action: "approve",
      dataSourceReview: "approved",
      complianceReview: "approved",
      educationReview: "approved",
      note: "Verifier approves the reviewed chart screenshot drill for education-only course package assembly.",
    },
  });
  if (
    approvedChartScenario.status !== 200 ||
    approvedChartScenario.data.scenario?.reviewStatus !== "approved" ||
    !approvedChartScenario.data.scenarios?.some((item) => item.id === chartScreenshotScenario.data.scenario.id)
  ) {
    throw new Error(`chart scenario approval failed: ${approvedChartScenario.status} ${JSON.stringify(approvedChartScenario.data).slice(0, 1200)}`);
  }
  const chartCoursePackage = await request("/api/admin/chart-screenshot-intakes/create-course-package", {
    method: "POST",
    body: {
      contentSourceId: chartScreenshotIntake.data.contentSource.id,
      title: "API chart screenshot course package",
      priceCents: 0,
      plan: "Pro",
    },
  });
  if (
    chartCoursePackage.status !== 201 ||
    chartCoursePackage.data.coursePackage?.status !== "draft" ||
    chartCoursePackage.data.coursePackage?.scenarioCount !== 1 ||
    chartCoursePackage.data.coursePackage?.approvedScenarioCount !== 1 ||
    chartCoursePackage.data.coursePackage?.releaseChecklist?.contentRights !== "internal_demo_only" ||
    chartCoursePackage.data.coursePackage?.releaseChecklist?.scenarioReview !== "approved" ||
    chartCoursePackage.data.contentSource?.chartScreenshot?.coursePackageId !== chartCoursePackage.data.coursePackage.id ||
    !chartCoursePackage.data.knowledgePoints?.some((item) => item.educationOnly === true) ||
    !chartCoursePackage.data.constraints?.some((item) => item.includes("draft education product"))
  ) {
    throw new Error(`chart course package creation failed: ${chartCoursePackage.status} ${JSON.stringify(chartCoursePackage.data).slice(0, 1200)}`);
  }
  const chartPackageAudit = await request("/api/admin/audit-logs?type=chart_screenshot_course_package_created&limit=20");
  if (
    chartPackageAudit.status !== 200 ||
    !chartPackageAudit.data.items?.some((item) => (
      item.type === "chart_screenshot_course_package_created" &&
      item.contentSourceId === chartScreenshotIntake.data.contentSource.id &&
      item.scenarioId === chartScreenshotScenario.data.scenario.id &&
      item.coursePackageId === chartCoursePackage.data.coursePackage.id &&
      item.educationOnly === true
    ))
  ) {
    throw new Error(`chart course package audit failed: ${chartPackageAudit.status} ${JSON.stringify(chartPackageAudit.data).slice(0, 1200)}`);
  }
  const chartPackageDelivery = await request("/api/admin/chart-screenshot-intakes/publish-and-assign", {
    method: "POST",
    body: {
      contentSourceId: chartScreenshotIntake.data.contentSource.id,
      email: "student@tradegym.local",
      instructions: "Verifier assigns this reviewed chart screenshot package as education-only practice.",
    },
  });
  if (
    chartPackageDelivery.status !== 200 ||
    chartPackageDelivery.data.published !== true ||
    chartPackageDelivery.data.coursePackage?.id !== chartCoursePackage.data.coursePackage.id ||
    chartPackageDelivery.data.coursePackage?.status !== "published" ||
    chartPackageDelivery.data.coursePackage?.releaseChecklist?.scenarioReview !== "approved" ||
    chartPackageDelivery.data.coursePackageAssignments?.length !== 1 ||
    chartPackageDelivery.data.enrollments?.[0]?.coursePackageId !== chartCoursePackage.data.coursePackage.id ||
    chartPackageDelivery.data.practiceAssignments?.length !== 1 ||
    chartPackageDelivery.data.practiceAssignments?.[0]?.scenarioId !== chartScreenshotScenario.data.scenario.id ||
    chartPackageDelivery.data.contentSource?.chartScreenshot?.assignedCoursePackageId !== chartCoursePackage.data.coursePackage.id ||
    !chartPackageDelivery.data.constraints?.some((item) => item.includes("education delivery operation"))
  ) {
    throw new Error(`chart package publish and assign failed: ${chartPackageDelivery.status} ${JSON.stringify(chartPackageDelivery.data).slice(0, 1200)}`);
  }
  const chartPackageDeliveryAudit = await request("/api/admin/audit-logs?type=chart_screenshot_course_package_published_assigned&limit=20");
  if (
    chartPackageDeliveryAudit.status !== 200 ||
    !chartPackageDeliveryAudit.data.items?.some((item) => (
      item.type === "chart_screenshot_course_package_published_assigned" &&
      item.contentSourceId === chartScreenshotIntake.data.contentSource.id &&
      item.coursePackageId === chartCoursePackage.data.coursePackage.id &&
      item.learnerEmail === "student@tradegym.local" &&
      item.educationOnly === true
    ))
  ) {
    throw new Error(`chart package publish/assign audit failed: ${chartPackageDeliveryAudit.status} ${JSON.stringify(chartPackageDeliveryAudit.data).slice(0, 1200)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const chartLearnerLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "student@tradegym.local", password: "demo123" },
  });
  if (chartLearnerLogin.status !== 200 || chartLearnerLogin.data.session?.email !== "student@tradegym.local") {
    throw new Error(`chart learner login failed: ${chartLearnerLogin.status} ${JSON.stringify(chartLearnerLogin.data).slice(0, 800)}`);
  }
  const chartLearnerComplianceStatus = (await request("/api/bootstrap")).data.compliance;
  if (!chartLearnerComplianceStatus?.acknowledged) {
    const chartLearnerCompliance = await request("/api/compliance/acknowledge", {
      method: "POST",
      body: {
        accepted: true,
        version: chartLearnerComplianceStatus.version,
      },
    });
    if (chartLearnerCompliance.status !== 200 || chartLearnerCompliance.data.compliance?.acknowledged !== true) {
      throw new Error("chart learner compliance acknowledgement failed");
    }
  }
  const chartLearnerBootstrap = await request("/api/bootstrap");
  const chartLearnerScenario = chartLearnerBootstrap.data.scenarios?.find((item) => item.id === chartScreenshotScenario.data.scenario.id);
  if (!chartLearnerScenario) {
    throw new Error("assigned chart screenshot scenario missing from learner bootstrap");
  }
  const chartLearnerAttempt = await request("/api/attempts", {
    method: "POST",
    body: {
      scenarioId: chartLearnerScenario.id,
      selectedIndex: chartLearnerScenario.answer,
      plan: "Chart package drill: write the observed structure, invalidation, risk boundary, and no-trade condition before reading outcome feedback.",
    },
  });
  if (
    chartLearnerAttempt.status !== 201 ||
    chartLearnerAttempt.data.attempt?.scenarioId !== chartScreenshotScenario.data.scenario.id ||
    !chartLearnerAttempt.data.practiceAssignments?.some((item) => (
      item.scenarioId === chartScreenshotScenario.data.scenario.id &&
      item.status === "completed" &&
      item.completedAttemptId === chartLearnerAttempt.data.attempt.id
    )) ||
    !chartLearnerAttempt.data.courseProgressUpdates?.some((item) => (
      item.coursePackageId === chartCoursePackage.data.coursePackage.id &&
      item.itemType === "scenario" &&
      item.itemId === chartScreenshotScenario.data.scenario.id &&
      item.attemptId === chartLearnerAttempt.data.attempt.id
    ))
  ) {
    throw new Error(`chart learner attempt did not complete assigned chart drill: ${chartLearnerAttempt.status} ${JSON.stringify(chartLearnerAttempt.data).slice(0, 1200)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const adminAfterChartAttempt = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminAfterChartAttempt.status !== 200 || adminAfterChartAttempt.data.session?.role !== "admin") {
    throw new Error("admin relogin after chart learner attempt failed");
  }
  const chartEvidenceFollowup = await request("/api/admin/chart-screenshot-intakes/create-evidence-followup", {
    method: "POST",
    body: {
      contentSourceId: chartScreenshotIntake.data.contentSource.id,
      focus: "chart screenshot drill evidence review",
    },
  });
  if (
    chartEvidenceFollowup.status !== 201 ||
    chartEvidenceFollowup.data.task?.source !== "learning_evidence_followup" ||
    chartEvidenceFollowup.data.task?.userId !== chartPackageDelivery.data.contentSource?.chartScreenshot?.assignedToUserId ||
    chartEvidenceFollowup.data.task?.priority !== "high" ||
    chartEvidenceFollowup.data.task?.educationOnly !== true ||
    chartEvidenceFollowup.data.task?.chartScreenshotEvidence?.contentSourceId !== chartScreenshotIntake.data.contentSource.id ||
    chartEvidenceFollowup.data.task?.chartScreenshotEvidence?.coursePackageId !== chartCoursePackage.data.coursePackage.id ||
    chartEvidenceFollowup.data.task?.chartScreenshotEvidence?.scenarioId !== chartScreenshotScenario.data.scenario.id ||
    chartEvidenceFollowup.data.task?.chartScreenshotEvidence?.attemptId !== chartLearnerAttempt.data.attempt.id ||
    chartEvidenceFollowup.data.packet?.followUpSummary?.openChartEvidenceFollowups < 1 ||
    !chartEvidenceFollowup.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`chart screenshot evidence follow-up failed: ${chartEvidenceFollowup.status} ${JSON.stringify(chartEvidenceFollowup.data).slice(0, 1600)}`);
  }
  const chartEvidenceFollowupTasks = await request(`/api/admin/coach-review-tasks?status=open&q=${encodeURIComponent("student@tradegym.local")}&limit=200`);
  if (
    chartEvidenceFollowupTasks.status !== 200 ||
    !chartEvidenceFollowupTasks.data.tasks?.some((item) => (
      item.source === "learning_evidence_followup" &&
      item.focus === "chart screenshot drill evidence review" &&
      item.chartScreenshotEvidence?.contentSourceId === chartScreenshotIntake.data.contentSource.id
    )) ||
    chartEvidenceFollowupTasks.data.evidenceLoop?.awaitingLearnerResponse < 1 ||
    !chartEvidenceFollowupTasks.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`chart evidence follow-up task missing from coach queue: ${chartEvidenceFollowupTasks.status} ${JSON.stringify(chartEvidenceFollowupTasks.data).slice(0, 1200)}`);
  }
  const chartEvidencePacket = await request(`/api/admin/learner-progress-report?userId=${encodeURIComponent(chartPackageDelivery.data.contentSource.chartScreenshot.assignedToUserId)}`);
  if (
    chartEvidencePacket.status !== 200 ||
    chartEvidencePacket.data.report?.learningEvidencePacket?.followUpSummary?.openChartEvidenceFollowups < 1 ||
    !chartEvidencePacket.data.report?.learningEvidencePacket?.recentEvidenceFollowups?.some((item) => (
      item.id === chartEvidenceFollowup.data.task.id &&
      item.chartScreenshotEvidence?.contentSourceId === chartScreenshotIntake.data.contentSource.id &&
      item.chartScreenshotEvidence?.attemptId === chartLearnerAttempt.data.attempt.id
    )) ||
    !chartEvidencePacket.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`chart evidence follow-up missing from learner progress report: ${chartEvidencePacket.status} ${JSON.stringify(chartEvidencePacket.data).slice(0, 1200)}`);
  }
  const chartEvidenceFollowupAudit = await request("/api/admin/audit-logs?type=chart_screenshot_evidence_followup_created&limit=20");
  if (
    chartEvidenceFollowupAudit.status !== 200 ||
    !chartEvidenceFollowupAudit.data.items?.some((item) => (
      item.type === "chart_screenshot_evidence_followup_created" &&
      item.contentSourceId === chartScreenshotIntake.data.contentSource.id &&
      item.coursePackageId === chartCoursePackage.data.coursePackage.id &&
      item.attemptId === chartLearnerAttempt.data.attempt.id &&
      item.taskId === chartEvidenceFollowup.data.task.id &&
      item.educationOnly === true
    ))
  ) {
    throw new Error(`chart evidence follow-up audit failed: ${chartEvidenceFollowupAudit.status} ${JSON.stringify(chartEvidenceFollowupAudit.data).slice(0, 1200)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const chartEvidenceLearnerLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "student@tradegym.local", password: "demo123" },
  });
  if (chartEvidenceLearnerLogin.status !== 200 || chartEvidenceLearnerLogin.data.session?.email !== "student@tradegym.local") {
    throw new Error("chart evidence learner relogin failed");
  }
  const chartEvidenceFollowupRead = await request("/api/learning-evidence-followups/read", {
    method: "POST",
    body: { taskId: chartEvidenceFollowup.data.task.id },
  });
  if (
    chartEvidenceFollowupRead.status !== 200 ||
    chartEvidenceFollowupRead.data.task?.id !== chartEvidenceFollowup.data.task.id ||
    chartEvidenceFollowupRead.data.task?.learnerStatus !== "opened" ||
    chartEvidenceFollowupRead.data.task?.chartScreenshotEvidence?.attemptId !== chartLearnerAttempt.data.attempt.id ||
    !chartEvidenceFollowupRead.data.report?.learningEvidencePacket?.recentEvidenceFollowups?.some((item) => (
      item.id === chartEvidenceFollowup.data.task.id &&
      item.chartScreenshotEvidence?.coursePackageId === chartCoursePackage.data.coursePackage.id
    )) ||
    !chartEvidenceFollowupRead.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`chart evidence follow-up learner read failed: ${chartEvidenceFollowupRead.status} ${JSON.stringify(chartEvidenceFollowupRead.data).slice(0, 1200)}`);
  }
  const chartEvidenceFollowupResponse = await request("/api/learning-evidence-followups/respond", {
    method: "POST",
    body: {
      taskId: chartEvidenceFollowup.data.task.id,
      learnerResponse: "I reviewed the chart drill as a learning exercise: I wrote the failed breakout structure, invalidation, risk boundary, and no-trade condition before reading feedback.",
    },
  });
  if (
    chartEvidenceFollowupResponse.status !== 200 ||
    chartEvidenceFollowupResponse.data.task?.id !== chartEvidenceFollowup.data.task.id ||
    chartEvidenceFollowupResponse.data.task?.learnerStatus !== "responded" ||
    chartEvidenceFollowupResponse.data.task?.chartScreenshotEvidence?.attemptId !== chartLearnerAttempt.data.attempt.id ||
    !chartEvidenceFollowupResponse.data.task?.nextEducationAction?.educationOnly ||
    chartEvidenceFollowupResponse.data.report?.learningEvidencePacket?.followUpSummary?.respondedEvidenceFollowups < 1 ||
    !chartEvidenceFollowupResponse.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`chart evidence follow-up learner response failed: ${chartEvidenceFollowupResponse.status} ${JSON.stringify(chartEvidenceFollowupResponse.data).slice(0, 1200)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const adminAfterChartEvidenceResponse = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminAfterChartEvidenceResponse.status !== 200 || adminAfterChartEvidenceResponse.data.session?.role !== "admin") {
    throw new Error("admin relogin after chart evidence response failed");
  }
  const readyChartEvidenceTasks = await request("/api/admin/coach-review-tasks?status=open&evidenceLoopStatus=ready_to_apply&limit=40");
  if (
    readyChartEvidenceTasks.status !== 200 ||
    !readyChartEvidenceTasks.data.tasks?.some((item) => (
      item.id === chartEvidenceFollowup.data.task.id &&
      item.learnerStatus === "responded" &&
      item.chartScreenshotEvidence?.attemptId === chartLearnerAttempt.data.attempt.id &&
      item.nextEducationAction?.educationOnly === true
    )) ||
    !readyChartEvidenceTasks.data.constraints?.some((item) => item.includes("Evidence loop filters"))
  ) {
    throw new Error(`chart evidence follow-up did not enter ready-to-apply queue: ${readyChartEvidenceTasks.status} ${JSON.stringify(readyChartEvidenceTasks.data).slice(0, 1200)}`);
  }
  const chartEvidenceOnlyTasks = await request("/api/admin/coach-review-tasks?status=open&chartEvidenceOnly=true&limit=200");
  if (
    chartEvidenceOnlyTasks.status !== 200 ||
    !chartEvidenceOnlyTasks.data.tasks?.some((item) => (
      item.source === "learning_evidence_followup" &&
      item.focus === "chart screenshot drill evidence review" &&
      item.chartScreenshotEvidence
    )) ||
    chartEvidenceOnlyTasks.data.tasks?.some((item) => !item.chartScreenshotEvidence) ||
    chartEvidenceOnlyTasks.data.evidenceLoop?.chartEvidence?.readyToApply < 1 ||
    !chartEvidenceOnlyTasks.data.constraints?.some((item) => item.includes("Evidence loop filters"))
  ) {
    throw new Error(`chart evidence only coach queue filter failed: ${chartEvidenceOnlyTasks.status} ${JSON.stringify(chartEvidenceOnlyTasks.data).slice(0, 1200)}`);
  }
  const bulkChartEvidenceFollowups = await request("/api/admin/chart-screenshot-intakes/evidence-followups/bulk", {
    method: "POST",
    body: {
      maxCreate: 20,
      q: "API chart screenshot intake",
    },
  });
  if (
    bulkChartEvidenceFollowups.status !== 201 ||
    bulkChartEvidenceFollowups.data.summary?.candidates < 1 ||
    bulkChartEvidenceFollowups.data.summary?.eligible < 1 ||
    bulkChartEvidenceFollowups.data.summary?.reused < 1 ||
    !bulkChartEvidenceFollowups.data.reused?.some((item) => (
      item.id === chartEvidenceFollowup.data.task.id &&
      item.chartScreenshotEvidence?.contentSourceId === chartScreenshotIntake.data.contentSource.id &&
      item.educationOnly === true
    )) ||
    bulkChartEvidenceFollowups.data.evidenceLoop?.chartEvidence?.readyToApply < 1 ||
    !bulkChartEvidenceFollowups.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`bulk chart evidence follow-up failed: ${bulkChartEvidenceFollowups.status} ${JSON.stringify(bulkChartEvidenceFollowups.data).slice(0, 1200)}`);
  }
  const completedChartEvidenceFollowup = await request("/api/admin/coach-review-tasks/update", {
    method: "POST",
    body: {
      taskId: chartEvidenceFollowup.data.task.id,
      status: "completed",
      coachNote: "Chart evidence follow-up completed: learner should practice one more structure and invalidation rewrite before any outcome review.",
    },
  });
  if (
    completedChartEvidenceFollowup.status !== 200 ||
    completedChartEvidenceFollowup.data.task?.status !== "completed" ||
    completedChartEvidenceFollowup.data.task?.source !== "learning_evidence_followup" ||
    completedChartEvidenceFollowup.data.task?.chartScreenshotEvidence?.attemptId !== chartLearnerAttempt.data.attempt.id ||
    completedChartEvidenceFollowup.data.task?.educationOnly !== true
  ) {
    throw new Error(`chart evidence follow-up completion failed: ${completedChartEvidenceFollowup.status} ${JSON.stringify(completedChartEvidenceFollowup.data).slice(0, 1200)}`);
  }
  const chartEvidenceCompletionReport = await request(`/api/admin/learner-progress-report?userId=${encodeURIComponent(chartPackageDelivery.data.contentSource.chartScreenshot.assignedToUserId)}`);
  if (
    chartEvidenceCompletionReport.status !== 200 ||
    chartEvidenceCompletionReport.data.report?.learningEvidencePacket?.chartEvidenceFollowupSummary?.completedChartEvidenceFollowups < 1 ||
    !chartEvidenceCompletionReport.data.report?.learningEvidencePacket?.chartEvidenceFollowupSummary?.latestCompletedChartEvidenceCoachNote?.includes("Chart evidence follow-up completed") ||
    !chartEvidenceCompletionReport.data.report?.learningEvidencePacket?.recentEvidenceFollowups?.some((item) => (
      item.id === chartEvidenceFollowup.data.task.id &&
      item.status === "completed" &&
      item.chartScreenshotEvidence?.attemptId === chartLearnerAttempt.data.attempt.id &&
      item.coachNote?.includes("structure and invalidation rewrite")
    )) ||
    chartEvidenceCompletionReport.data.report?.educationModelContext?.activity?.completedChartEvidenceFollowups < 1 ||
    chartEvidenceCompletionReport.data.report?.educationModelContext?.learningSignals?.chartEvidenceFollowupSummary?.completedChartEvidenceFollowups < 1 ||
    !chartEvidenceCompletionReport.data.report?.educationModelContext?.recommendedTeachingMoves?.some((item) => item.includes("completed chart evidence coach note")) ||
    !chartEvidenceCompletionReport.data.report?.educationTutoringPlan?.focusAreas?.some((item) => item.includes("completed chart evidence coach note")) ||
    !chartEvidenceCompletionReport.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`completed chart evidence follow-up did not flow into model/tutoring plan: ${chartEvidenceCompletionReport.status} ${JSON.stringify(chartEvidenceCompletionReport.data).slice(0, 1600)}`);
  }

  const alignmentEvidence = await request("/api/admin/content-sources/alignment-evidence", {
    method: "POST",
    body: {
      contentSourceId: contentSource.data.contentSource.id,
      frameRef: "api-frame-001",
      timecode: "00:00:15",
      ocrText: "Failed breakout returns into the prior range and the learner identifies invalidation before planning the next education drill.",
      alignedText: "Video transcript demo: when price breaks out and then falls back into the prior range, learners identify invalidation and reduce risk.",
      confidence: 0.84,
      reviewStatus: "aligned_for_demo",
      reviewNote: "Verifier records OCR/frame fallback alignment evidence for internal demo use.",
    },
  });
  if (
    alignmentEvidence.status !== 201 ||
    alignmentEvidence.data.evidence?.reviewStatus !== "aligned_for_demo" ||
    alignmentEvidence.data.contentSource?.alignmentEvidenceCount < 1 ||
    alignmentEvidence.data.contentSource?.extraction?.alignmentStatus !== "evidence_reviewed_for_demo" ||
    alignmentEvidence.data.contentSource?.releaseChecklist?.transcriptAccuracy !== "evidence_reviewed_for_demo" ||
    alignmentEvidence.data.contentSource?.releaseReadiness?.alignmentReviewed !== true ||
    !alignmentEvidence.data.constraints?.some((item) => item.includes("curriculum production evidence"))
  ) {
    throw new Error("content source alignment evidence API failed");
  }

  const reviewedContentSource = await request("/api/admin/content-sources/review", {
    method: "POST",
    body: {
      contentSourceId: contentSource.data.contentSource.id,
      action: "approve_demo",
      transcriptAccuracy: "reviewed_for_demo",
      chartContext: "reviewed_for_demo",
      compliance: "education_boundary_reviewed",
      pedagogy: "usable_for_training",
      note: "Verifier approves this source for internal education demo use only.",
    },
  });
  if (
    reviewedContentSource.status !== 200 ||
    reviewedContentSource.data.contentSource?.reviewStatus !== "approve_demo" ||
    reviewedContentSource.data.contentSource?.licenseStatus !== "internal_demo" ||
    reviewedContentSource.data.contentSource?.sourceRightsReview?.productionCleared !== false ||
    reviewedContentSource.data.contentSource?.sourceRightsReview?.demoUseOnly !== true ||
    reviewedContentSource.data.contentSource?.extraction?.alignmentStatus !== "human_reviewed" ||
    reviewedContentSource.data.contentSource?.releaseReadiness?.sourceReviewed !== true ||
    !reviewedContentSource.data.contentSource?.releaseReadiness?.blockers?.includes("knowledge_draft") ||
    !reviewedContentSource.data.constraints?.some((item) => item.includes("curriculum governance"))
  ) {
    throw new Error("content source review API failed");
  }

  const contentSourcesAfterReview = await request("/api/admin/content-sources");
  if (
    contentSourcesAfterReview.status !== 200 ||
    contentSourcesAfterReview.data.summary?.reviewedDemo < 1 ||
    !contentSourcesAfterReview.data.items?.some((item) => item.id === contentSource.data.contentSource.id && item.reviewStatus === "approve_demo")
  ) {
    throw new Error("content source review list summary failed");
  }

  const demoPipelineRun = await request("/api/admin/content-pipeline/demo-run", {
    method: "POST",
    body: {
      title: "API demo pipeline: failed breakout lesson",
      sourceType: "video_transcript",
      rawText: "Video transcript demo: when a breakout fails and price falls back inside the old range, learners should identify invalidation, reduce risk, avoid defending the first idea, and wait for a new structure. This is education-only demo text, not a live buy or sell signal.",
    },
  });
  if (
    demoPipelineRun.status !== 201 ||
    demoPipelineRun.data.contentSource?.licenseStatus !== "internal_demo" ||
    demoPipelineRun.data.job?.pipeline?.stage !== "scenario_submitted_for_release_review" ||
    demoPipelineRun.data.contentSource?.releaseReadiness?.hasKnowledgeDraft !== true ||
    demoPipelineRun.data.contentSource?.releaseReadiness?.hasScenarioDraft !== true ||
    demoPipelineRun.data.knowledgePoint?.status !== "reviewed" ||
    demoPipelineRun.data.scenario?.reviewStatus !== "needs_review" ||
    demoPipelineRun.data.scenario?.status !== "published" ||
    demoPipelineRun.data.scenario?.source?.demoPipelineRun !== true ||
    !demoPipelineRun.data.reviewQueue?.some((item) => item.id === demoPipelineRun.data.scenario.id) ||
    !demoPipelineRun.data.constraints?.some((item) => item.includes("does not publish directly"))
  ) {
    throw new Error("content pipeline demo run API failed");
  }

  const contentJob = await request("/api/admin/content-processing-jobs", {
    method: "POST",
    body: {
      contentSourceId: contentSource.data.contentSource.id,
      mode: "fallback_alignment",
    },
  });
  if (
    contentJob.status !== 201 ||
    contentJob.data.job?.contentSourceId !== contentSource.data.contentSource.id ||
    contentJob.data.job?.alignmentStatus !== "needs_human_review" ||
    contentJob.data.job?.extractedConceptCount < 1 ||
    contentJob.data.job?.scenarioPromptCount < 1 ||
    contentJob.data.job?.pipeline?.stage !== "human_review_required" ||
    contentJob.data.job?.pipeline?.pendingConcepts < 1 ||
    contentJob.data.job?.pipeline?.pendingScenarioPrompts < 1 ||
    !contentJob.data.job?.reviewItems?.concepts?.length ||
    !contentJob.data.job?.reviewItems?.scenarioPrompts?.length ||
    contentJob.data.contentSource?.lastProcessingJobId !== contentJob.data.job.id ||
    !contentJob.data.job?.constraints?.some((item) => item.includes("education content"))
  ) {
    throw new Error("content processing job API failed");
  }

  const contentJobs = await request("/api/admin/content-processing-jobs");
  if (
    contentJobs.status !== 200 ||
    !contentJobs.data.jobs?.some((item) => (
      item.id === contentJob.data.job.id &&
      item.status === "ready_for_review" &&
      item.pipeline?.nextAction?.includes("Approve at least one concept") &&
      item.reviewItems?.concepts?.some((concept) => concept.id === contentJob.data.job.firstConcept.id)
    )) ||
    contentJobs.data.summary?.needsHumanReview < 1 ||
    !contentJobs.data.constraints?.some((item) => item.includes("Fallback alignment"))
  ) {
    throw new Error("content processing job list API failed");
  }

  const contentSourceReleasePacketJson = await request(`/api/admin/content-sources/release-packet?contentSourceId=${encodeURIComponent(contentSource.data.contentSource.id)}&format=json`);
  if (
    contentSourceReleasePacketJson.status !== 200 ||
    contentSourceReleasePacketJson.data.productionReady !== false ||
    contentSourceReleasePacketJson.data.educationOnly !== true ||
    contentSourceReleasePacketJson.data.packet?.schemaVersion !== "content-source-release-packet-v1" ||
    contentSourceReleasePacketJson.data.packet?.contentSource?.id !== contentSource.data.contentSource.id ||
    contentSourceReleasePacketJson.data.packet?.contentSource?.alignmentEvidenceCount < 1 ||
    !contentSourceReleasePacketJson.data.packet?.relatedJobs?.some((item) => item.id === contentJob.data.job.id) ||
    !contentSourceReleasePacketJson.data.packet?.nextActions?.some((item) => item.includes("Keep this source internal-demo only")) ||
    !contentSourceReleasePacketJson.data.note?.includes("curriculum operations evidence")
  ) {
    throw new Error(`content source release packet JSON failed: ${contentSourceReleasePacketJson.status} ${JSON.stringify(contentSourceReleasePacketJson.data).slice(0, 1200)}`);
  }
  const contentSourceReleasePacketMd = await request(`/api/admin/content-sources/release-packet?contentSourceId=${encodeURIComponent(contentSource.data.contentSource.id)}&format=md`);
  if (
    contentSourceReleasePacketMd.status !== 200 ||
    typeof contentSourceReleasePacketMd.data !== "string" ||
    !contentSourceReleasePacketMd.data.includes("# TradeGym Content Source Release Packet") ||
    !contentSourceReleasePacketMd.data.includes("## Alignment Evidence") ||
    !contentSourceReleasePacketMd.data.includes("## Processing Jobs") ||
    !contentSourceReleasePacketMd.data.includes("Production ready: false") ||
    !contentSourceReleasePacketMd.data.includes("not investment advice") ||
    !contentSourceReleasePacketMd.data.includes("real-money trading readiness")
  ) {
    throw new Error(`content source release packet MD failed: ${contentSourceReleasePacketMd.status} ${String(contentSourceReleasePacketMd.data).slice(0, 1200)}`);
  }

  const approvedConcept = await request("/api/admin/content-processing-jobs/review", {
    method: "POST",
    body: {
      jobId: contentJob.data.job.id,
      itemType: "concept",
      itemId: contentJob.data.job.firstConcept.id,
      action: "approve",
      note: "Verifier approves concept for education-only knowledge draft.",
    },
  });
  if (
    approvedConcept.status !== 200 ||
    approvedConcept.data.item?.reviewStatus !== "approved" ||
    approvedConcept.data.knowledgePoint?.status !== "reviewed" ||
    approvedConcept.data.knowledgePoint?.source?.contentProcessingJobId !== contentJob.data.job.id ||
    approvedConcept.data.job?.pipeline?.stage !== "knowledge_approved_generate_training" ||
    approvedConcept.data.job?.pipeline?.approvedConcepts < 1 ||
    !approvedConcept.data.constraints?.some((item) => item.includes("education-only"))
  ) {
    throw new Error("content processing concept review failed");
  }

  const approvedScenarioPrompt = await request("/api/admin/content-processing-jobs/review", {
    method: "POST",
    body: {
      jobId: contentJob.data.job.id,
      itemType: "scenario_prompt",
      itemId: contentJob.data.job.firstScenarioPrompt.id,
      action: "approve",
      note: "Verifier submits reviewed prompt as education-only scenario draft.",
    },
  });
  if (
    approvedScenarioPrompt.status !== 200 ||
    approvedScenarioPrompt.data.item?.reviewStatus !== "approved" ||
    approvedScenarioPrompt.data.scenario?.reviewStatus !== "needs_review" ||
    approvedScenarioPrompt.data.scenario?.source?.contentProcessingJobId !== contentJob.data.job.id ||
    approvedScenarioPrompt.data.job?.pipeline?.stage !== "scenario_submitted_for_release_review" ||
    approvedScenarioPrompt.data.job?.pipeline?.submittedScenarioPrompts < 1 ||
    !approvedScenarioPrompt.data.reviewQueue?.some((item) => item.id === approvedScenarioPrompt.data.scenario.id)
  ) {
    throw new Error("content processing scenario prompt review failed");
  }

  const distilledKnowledge = await request("/api/admin/knowledge/distill", {
    method: "POST",
    body: {
      title: "API knowledge: failed breakout invalidation",
      module: "Price Action",
      sourceText: contentJob.data.job.firstConcept?.excerpt || "When price breaks out and then falls back into the prior range, learners should practice naming invalidation, reducing risk, and waiting for a new structure instead of defending the first idea.",
      contentSourceId: contentSource.data.contentSource.id,
    },
  });
  if (
    distilledKnowledge.status !== 201 ||
    distilledKnowledge.data.knowledgePoint?.concept !== "risk-discipline" ||
    distilledKnowledge.data.knowledgePoint?.source?.provider !== "rule-based" ||
    distilledKnowledge.data.knowledgePoint?.source?.contentSourceId !== contentSource.data.contentSource.id ||
    !distilledKnowledge.data.knowledgePoint?.learningObjective
  ) {
    throw new Error("knowledge distillation API failed");
  }

  const generatedDraft = await request("/api/admin/scenarios/generate-draft", {
    method: "POST",
    body: {
      title: "API generated draft: failed breakout drill",
      tag: "Provider pipeline / demo",
      knowledgePointId: distilledKnowledge.data.knowledgePoint.id,
    },
  });
  if (
    generatedDraft.status !== 201 ||
    generatedDraft.data.draft?.source?.marketData?.provider !== "demo" ||
    generatedDraft.data.draft?.source?.news?.provider !== "demo" ||
    generatedDraft.data.draft?.source?.knowledgePoint?.id !== distilledKnowledge.data.knowledgePoint.id ||
    generatedDraft.data.providers?.questionGenerator?.provider !== "rule-based" ||
    generatedDraft.data.draft?.source?.educationOnly !== true
  ) {
    throw new Error("scenario draft generation API failed");
  }

  const generatedScenario = generatedDraft.data.draft;
  const publish = await request("/api/admin/scenarios", {
    method: "POST",
    body: {
      title: generatedScenario.title,
      tag: generatedScenario.tag,
      symbol: generatedScenario.symbol,
      timeframe: generatedScenario.timeframe,
      candles: generatedScenario.candles,
      question: generatedScenario.question,
      options: generatedScenario.options,
      answer: generatedScenario.answer,
      technical: generatedScenario.technical,
      news: generatedScenario.news,
      sentiment: generatedScenario.sentiment,
      feedbackTitle: generatedScenario.feedbackTitle,
      feedback: generatedScenario.feedback,
      tags: generatedScenario.tags,
      nextPath: generatedScenario.nextPath,
      source: generatedScenario.source,
    },
  });
  if (
    publish.status !== 201 ||
    !publish.data.scenario?.id ||
    publish.data.scenario?.reviewStatus !== "needs_review" ||
    publish.data.scenario?.source?.educationOnly !== true ||
    publish.data.scenario?.source?.marketData?.provider !== "demo" ||
    publish.data.scenarios?.some((item) => item.id === publish.data.scenario.id) ||
    !publish.data.reviewQueue?.some((item) => item.id === publish.data.scenario.id)
  ) {
    throw new Error(`scenario publish API failed: ${JSON.stringify({
      status: publish.status,
      id: publish.data.scenario?.id,
      reviewStatus: publish.data.scenario?.reviewStatus,
      educationOnly: publish.data.scenario?.source?.educationOnly,
      marketProvider: publish.data.scenario?.source?.marketData?.provider,
      leakedToLearnerScenarios: publish.data.scenarios?.some((item) => item.id === publish.data.scenario?.id),
      inReviewQueue: publish.data.reviewQueue?.some((item) => item.id === publish.data.scenario?.id),
    })}`);
  }

  const unapprovedAttempt = await request("/api/attempts", {
    method: "POST",
    body: {
      scenarioId: publish.data.scenario.id,
      selectedIndex: publish.data.scenario.answer,
      plan: "This should be blocked until content review approves the education scenario.",
    },
  });
  if (unapprovedAttempt.status !== 409 || unapprovedAttempt.data.reviewStatus !== "needs_review") {
    throw new Error("unapproved scenario training gate failed");
  }

  const scenarioReviews = await request("/api/admin/scenario-reviews");
  if (
    scenarioReviews.status !== 200 ||
    scenarioReviews.data.summary?.pending < 1 ||
    !scenarioReviews.data.items?.some((item) => item.id === publish.data.scenario.id && item.reviewStatus === "needs_review")
  ) {
    throw new Error("scenario review queue API failed");
  }

  const approval = await request("/api/admin/scenarios/review", {
    method: "POST",
    body: {
      scenarioId: publish.data.scenario.id,
      action: "approve",
      dataSourceReview: "approved",
      complianceReview: "approved",
      educationReview: "approved",
      note: "Verified education-only demo scenario for learner training.",
    },
  });
  if (
    approval.status !== 200 ||
    approval.data.scenario?.reviewStatus !== "approved" ||
    approval.data.scenario?.reviewChecklist?.dataSource !== "approved" ||
    !approval.data.scenarios?.some((item) => item.id === publish.data.scenario.id)
  ) {
    throw new Error("scenario review approval API failed");
  }

  const dataSources = await request("/api/admin/data-sources");
  if (
    dataSources.status !== 200 ||
    dataSources.data.summary?.scenarios < 1 ||
    dataSources.data.summary?.needsSourceReview < 1 ||
    dataSources.data.summary?.controlsGap < 1 ||
    !dataSources.data.providers?.some((item) => item.key === "marketData" && item.productionReady === false) ||
    !dataSources.data.controls?.some((item) => item.key === "market_data_provider" && item.status === "gap" && item.productionBlocking === true) ||
    !dataSources.data.controls?.some((item) => item.key === "content_source_rights_review" && ["partial", "ready"].includes(item.status)) ||
    !dataSources.data.controls?.some((item) => item.key === "append_only_audit_storage" && item.status === "gap") ||
    !dataSources.data.scenarios?.some((item) => item.id === publish.data.scenario.id && item.isDemo === true && item.reviewStatus === "approved") ||
    !dataSources.data.constraints?.some((item) => item.includes("Demo or synthetic data"))
  ) {
    throw new Error("admin data sources API failed");
  }

  const datasetManifest = await request("/api/admin/historical-training-dataset-manifest");
  if (
    datasetManifest.status !== 200 ||
    datasetManifest.data.schemaVersion !== "historical-training-dataset-manifest-v1" ||
    datasetManifest.data.educationOnly !== true ||
    datasetManifest.data.productionReady !== false ||
    datasetManifest.data.summary?.total < 1 ||
    datasetManifest.data.summary?.internalDemoOnly < 1 ||
    datasetManifest.data.summary?.blockers < 1 ||
    !datasetManifest.data.datasets?.some((item) => (
      item.scenarioId === publish.data.scenario.id &&
      item.datasetId === `htdm_${publish.data.scenario.id}` &&
      item.releaseStatus === "internal_demo_only" &&
      item.educationOnly === true &&
      item.productionReady === false &&
      item.allowedUses?.includes("paper-trade journal practice") &&
      item.forbiddenUses?.includes("broker workflow") &&
      item.blockers?.includes("demo_or_synthetic_label")
    )) ||
    !datasetManifest.data.constraints?.some((item) => item.includes("licensed provider evidence"))
  ) {
    throw new Error(`historical training dataset manifest failed: ${datasetManifest.status} ${JSON.stringify(datasetManifest.data).slice(0, 1600)}`);
  }
  const datasetManifestJsonExport = await request("/api/admin/historical-training-dataset-manifest/export?format=json");
  if (
    datasetManifestJsonExport.status !== 200 ||
    datasetManifestJsonExport.data.educationOnly !== true ||
    datasetManifestJsonExport.data.productionReady !== false ||
    datasetManifestJsonExport.data.manifest?.schemaVersion !== "historical-training-dataset-manifest-v1" ||
    !datasetManifestJsonExport.data.note?.includes("education data-governance evidence")
  ) {
    throw new Error(`historical training dataset manifest JSON export failed: ${datasetManifestJsonExport.status} ${JSON.stringify(datasetManifestJsonExport.data).slice(0, 1200)}`);
  }
  const datasetManifestCsvExport = await request("/api/admin/historical-training-dataset-manifest/export?format=csv");
  if (
    datasetManifestCsvExport.status !== 200 ||
    typeof datasetManifestCsvExport.data !== "string" ||
    !datasetManifestCsvExport.data.startsWith("datasetId,scenarioId,title,symbol,timeframe,candleCount,licenseStatus,reviewStatus,releaseStatus") ||
    !datasetManifestCsvExport.data.includes("internal_demo_only") ||
    !datasetManifestCsvExport.data.includes("false")
  ) {
    throw new Error(`historical training dataset manifest CSV export failed: ${datasetManifestCsvExport.status} ${String(datasetManifestCsvExport.data).slice(0, 1000)}`);
  }
  const datasetManifestMdExport = await request("/api/admin/historical-training-dataset-manifest/export?format=md");
  if (
    datasetManifestMdExport.status !== 200 ||
    typeof datasetManifestMdExport.data !== "string" ||
    !datasetManifestMdExport.data.includes("# TradeGym Historical Training Dataset Manifest") ||
    !datasetManifestMdExport.data.includes("Production ready: false") ||
    !datasetManifestMdExport.data.includes("Forbidden uses") ||
    !datasetManifestMdExport.data.includes("broker workflow")
  ) {
    throw new Error(`historical training dataset manifest MD export failed: ${datasetManifestMdExport.status} ${String(datasetManifestMdExport.data).slice(0, 1200)}`);
  }
  const datasetManifestAudit = await request("/api/admin/audit-logs?type=historical_training_dataset_manifest_exported&limit=20");
  if (
    datasetManifestAudit.status !== 200 ||
    !datasetManifestAudit.data.items?.some((item) => (
      item.type === "historical_training_dataset_manifest_exported" &&
      item.educationOnly === true &&
      item.productionReady === false &&
      item.datasetCount >= 1 &&
      item.blockerCount >= 1
    ))
  ) {
    throw new Error(`historical training dataset manifest audit missing: ${datasetManifestAudit.status} ${JSON.stringify(datasetManifestAudit.data).slice(0, 1200)}`);
  }

  const openSourceReferenceMap = await request("/api/admin/open-source-reference-map");
  if (
    openSourceReferenceMap.status !== 200 ||
    openSourceReferenceMap.data.schemaVersion !== "open-source-reference-map-v1" ||
    openSourceReferenceMap.data.educationOnly !== true ||
    openSourceReferenceMap.data.productionReady !== false ||
    openSourceReferenceMap.data.summary?.total < 4 ||
    !openSourceReferenceMap.data.references?.some((item) => item.name.includes("backtrader") && item.forbiddenUses?.includes("broker order routing")) ||
    !openSourceReferenceMap.data.references?.some((item) => item.name.includes("LEAN") && item.forbiddenUses?.includes("autonomous order placement")) ||
    !openSourceReferenceMap.data.references?.some((item) => item.name.includes("FinRL") && item.productMapping?.includes("context classroom")) ||
    !openSourceReferenceMap.data.references?.some((item) => item.name.includes("paper-trading") && item.boundary?.includes("not executable orders")) ||
    !openSourceReferenceMap.data.constraints?.some((item) => item.includes("No imported reference"))
  ) {
    throw new Error(`open-source reference map failed: ${openSourceReferenceMap.status} ${JSON.stringify(openSourceReferenceMap.data).slice(0, 1400)}`);
  }
  const openSourceReferenceMapJsonExport = await request("/api/admin/open-source-reference-map/export?format=json");
  if (
    openSourceReferenceMapJsonExport.status !== 200 ||
    openSourceReferenceMapJsonExport.data.productionReady !== false ||
    openSourceReferenceMapJsonExport.data.educationOnly !== true ||
    openSourceReferenceMapJsonExport.data.map?.schemaVersion !== "open-source-reference-map-v1" ||
    !openSourceReferenceMapJsonExport.data.map?.constraints?.some((item) => item.includes("auto-trading")) ||
    !openSourceReferenceMapJsonExport.data.note?.includes("education product governance")
  ) {
    throw new Error(`open-source reference map JSON export failed: ${openSourceReferenceMapJsonExport.status} ${JSON.stringify(openSourceReferenceMapJsonExport.data).slice(0, 1200)}`);
  }
  const openSourceReferenceMapCsvExport = await request("/api/admin/open-source-reference-map/export?format=csv");
  if (
    openSourceReferenceMapCsvExport.status !== 200 ||
    typeof openSourceReferenceMapCsvExport.data !== "string" ||
    !openSourceReferenceMapCsvExport.data.startsWith("name,category,usefulFor,productMapping,forbiddenUses,boundary,educationOnly,productionReady") ||
    !openSourceReferenceMapCsvExport.data.includes("broker order routing") ||
    !openSourceReferenceMapCsvExport.data.includes("false")
  ) {
    throw new Error(`open-source reference map CSV export failed: ${openSourceReferenceMapCsvExport.status} ${String(openSourceReferenceMapCsvExport.data).slice(0, 1000)}`);
  }
  const openSourceReferenceMapMdExport = await request("/api/admin/open-source-reference-map/export?format=md");
  if (
    openSourceReferenceMapMdExport.status !== 200 ||
    typeof openSourceReferenceMapMdExport.data !== "string" ||
    !openSourceReferenceMapMdExport.data.includes("# TradeGym Open-source Reference Map") ||
    !openSourceReferenceMapMdExport.data.includes("Production ready: false") ||
    !openSourceReferenceMapMdExport.data.includes("Forbidden uses") ||
    !openSourceReferenceMapMdExport.data.includes("broker connectivity") ||
    !openSourceReferenceMapMdExport.data.includes("auto-trading")
  ) {
    throw new Error(`open-source reference map MD export failed: ${openSourceReferenceMapMdExport.status} ${String(openSourceReferenceMapMdExport.data).slice(0, 1200)}`);
  }
  const openSourceReferenceMapAudit = await request("/api/admin/audit-logs?type=open_source_reference_map_exported&limit=20");
  if (
    openSourceReferenceMapAudit.status !== 200 ||
    !openSourceReferenceMapAudit.data.items?.some((item) => (
      item.type === "open_source_reference_map_exported" &&
      item.educationOnly === true &&
      item.productionReady === false &&
      item.forbiddenUseCount >= 1
    ))
  ) {
    throw new Error(`open-source reference map audit missing: ${openSourceReferenceMapAudit.status} ${JSON.stringify(openSourceReferenceMapAudit.data).slice(0, 1200)}`);
  }

  const openSourceReferenceReviews = await request("/api/admin/open-source-reference-reviews");
  if (
    openSourceReferenceReviews.status !== 200 ||
    openSourceReferenceReviews.data.schemaVersion !== "open-source-reference-review-queue-v1" ||
    openSourceReferenceReviews.data.educationOnly !== true ||
    openSourceReferenceReviews.data.productionReady !== false ||
    openSourceReferenceReviews.data.summary?.needsReview < 1 ||
    !openSourceReferenceReviews.data.items?.some((item) => (
      item.referenceKey === "backtest_analytics" &&
      ["needs_review", "approved_for_design_reference"].includes(item.status) &&
      item.productionReady === false &&
      item.forbiddenUses?.includes("broker order routing")
    )) ||
    !openSourceReferenceReviews.data.constraints?.some((item) => item.includes("Approval does not install"))
  ) {
    throw new Error(`open-source reference review queue failed: ${openSourceReferenceReviews.status} ${JSON.stringify(openSourceReferenceReviews.data).slice(0, 1400)}`);
  }
  const openSourceReferenceReviewApprove = await request("/api/admin/open-source-reference-reviews/update", {
    method: "POST",
    body: {
      referenceKey: "backtest_analytics",
      status: "approved_for_design_reference",
      ownerEmail: "governance@tradegym.local",
      decisionNote: "Approved as education design reference only; no dependency installation, execution workflow, broker connection, automation, or real-money readiness proof.",
    },
  });
  if (
    openSourceReferenceReviewApprove.status !== 200 ||
    openSourceReferenceReviewApprove.data.review?.status !== "approved_for_design_reference" ||
    openSourceReferenceReviewApprove.data.review?.educationOnly !== true ||
    openSourceReferenceReviewApprove.data.review?.productionReady !== false ||
    !openSourceReferenceReviewApprove.data.note?.includes("education product governance") ||
    !openSourceReferenceReviewApprove.data.note?.includes("connect brokers") ||
    !openSourceReferenceReviewApprove.data.note?.includes("automate trades") ||
    openSourceReferenceReviewApprove.data.queue?.summary?.approvedForDesignReference < 1
  ) {
    throw new Error(`open-source reference approve failed: ${openSourceReferenceReviewApprove.status} ${JSON.stringify(openSourceReferenceReviewApprove.data).slice(0, 1400)}`);
  }
  const openSourceReferenceReviewReject = await request("/api/admin/open-source-reference-reviews/update", {
    method: "POST",
    body: {
      referenceKey: "paper_trading_simulators",
      status: "rejected_for_forbidden_use",
      ownerEmail: "governance@tradegym.local",
      decisionNote: "Rejected for forbidden-use risk; keep as boundary example for education governance only.",
    },
  });
  if (
    openSourceReferenceReviewReject.status !== 200 ||
    openSourceReferenceReviewReject.data.review?.status !== "rejected_for_forbidden_use" ||
    openSourceReferenceReviewReject.data.review?.educationOnly !== true ||
    openSourceReferenceReviewReject.data.review?.productionReady !== false ||
    openSourceReferenceReviewReject.data.queue?.summary?.rejectedForForbiddenUse < 1
  ) {
    throw new Error(`open-source reference reject failed: ${openSourceReferenceReviewReject.status} ${JSON.stringify(openSourceReferenceReviewReject.data).slice(0, 1400)}`);
  }
  const openSourceReferenceReviewsAfter = await request("/api/admin/open-source-reference-reviews");
  if (
    openSourceReferenceReviewsAfter.status !== 200 ||
    openSourceReferenceReviewsAfter.data.summary?.approvedForDesignReference < 1 ||
    openSourceReferenceReviewsAfter.data.summary?.rejectedForForbiddenUse < 1 ||
    !openSourceReferenceReviewsAfter.data.items?.some((item) => item.referenceKey === "backtest_analytics" && item.status === "approved_for_design_reference") ||
    !openSourceReferenceReviewsAfter.data.items?.some((item) => item.referenceKey === "paper_trading_simulators" && item.status === "rejected_for_forbidden_use")
  ) {
    throw new Error(`open-source reference review queue after updates failed: ${openSourceReferenceReviewsAfter.status} ${JSON.stringify(openSourceReferenceReviewsAfter.data).slice(0, 1400)}`);
  }
  const openSourceReferenceReviewAudit = await request("/api/admin/audit-logs?type=open_source_reference_review_updated&limit=20");
  if (
    openSourceReferenceReviewAudit.status !== 200 ||
    !openSourceReferenceReviewAudit.data.items?.some((item) => (
      item.type === "open_source_reference_review_updated" &&
      item.referenceKey === "backtest_analytics" &&
      item.status === "approved_for_design_reference" &&
      item.educationOnly === true &&
      item.productionReady === false
    )) ||
    !openSourceReferenceReviewAudit.data.items?.some((item) => (
      item.type === "open_source_reference_review_updated" &&
      item.referenceKey === "paper_trading_simulators" &&
      item.status === "rejected_for_forbidden_use"
    ))
  ) {
    throw new Error(`open-source reference review audit missing: ${openSourceReferenceReviewAudit.status} ${JSON.stringify(openSourceReferenceReviewAudit.data).slice(0, 1200)}`);
  }

  const dataGovernanceQueue = await request("/api/admin/data-governance-queue?limit=80");
  if (
    dataGovernanceQueue.status !== 200 ||
    dataGovernanceQueue.data.educationOnly !== true ||
    dataGovernanceQueue.data.productionReady !== false ||
    dataGovernanceQueue.data.summary?.total < 1 ||
    dataGovernanceQueue.data.summary?.productionBlocking < 1 ||
    !dataGovernanceQueue.data.items?.some((item) => (
      item.type === "control_gap" &&
      item.sourceKey === "market_data_provider" &&
      item.productionBlocking === true &&
      item.productionReady === false
    )) ||
    !dataGovernanceQueue.data.items?.some((item) => (
      item.type === "scenario_source_review" &&
      item.productionReady === false &&
      item.evidence?.some((entry) => String(entry).includes("Market"))
    )) ||
    !dataGovernanceQueue.data.constraints?.some((item) => item.includes("does not approve trades")) ||
    !dataGovernanceQueue.data.constraints?.some((item) => item.includes("Demo, synthetic"))
  ) {
    throw new Error(`data governance queue API failed: ${dataGovernanceQueue.status} ${JSON.stringify(dataGovernanceQueue.data).slice(0, 1600)}`);
  }

  const dataGovernanceAction = await request("/api/admin/data-governance-queue/actions", {
    method: "POST",
    body: {
      queueItemId: dataGovernanceQueue.data.items[0].id,
      action: "request_legal_review",
      ownerEmail: "admin@tradegym.local",
      note: "Request source-rights and provider evidence review before production course release.",
    },
  });
  if (
    dataGovernanceAction.status !== 201 ||
    dataGovernanceAction.data.educationOnly !== true ||
    dataGovernanceAction.data.productionReady !== false ||
    dataGovernanceAction.data.action?.type !== "data_governance_action" ||
    dataGovernanceAction.data.action?.queueItemId !== dataGovernanceQueue.data.items[0].id ||
    dataGovernanceAction.data.matchedQueueItem?.id !== dataGovernanceQueue.data.items[0].id ||
    !dataGovernanceAction.data.constraints?.some((item) => item.includes("do not approve trades"))
  ) {
    throw new Error(`data governance action API failed: ${dataGovernanceAction.status} ${JSON.stringify(dataGovernanceAction.data).slice(0, 1600)}`);
  }

  const scenario = approval.data.scenario;
  const coursePackage = await request("/api/admin/course-packages", {
    method: "POST",
    body: {
      title: "API course package: price action starter",
      priceCents: 9900,
      plan: "Pro",
      knowledgePointIds: [distilledKnowledge.data.knowledgePoint.id],
      scenarioIds: [scenario.id],
    },
  });
  if (
    coursePackage.status !== 201 ||
    coursePackage.data.coursePackage?.status !== "draft" ||
    coursePackage.data.coursePackage?.knowledgePointCount !== 1 ||
    coursePackage.data.coursePackage?.approvedScenarioCount !== 1 ||
    coursePackage.data.coursePackage?.backtestDrillCount !== 1 ||
    coursePackage.data.coursePackage?.contextDrillCount !== 1 ||
    coursePackage.data.coursePackage?.educationOnly !== true
  ) {
    throw new Error("course package creation API failed");
  }

  const publishedPackage = await request("/api/admin/course-packages/publish", {
    method: "POST",
    body: { coursePackageId: coursePackage.data.coursePackage.id },
  });
  if (
    publishedPackage.status !== 200 ||
    publishedPackage.data.coursePackage?.status !== "published" ||
    publishedPackage.data.coursePackage?.releaseChecklist?.compliance !== "approved"
  ) {
    throw new Error("course package publish API failed");
  }

  const coursePackages = await request("/api/admin/course-packages");
  if (
    coursePackages.status !== 200 ||
    coursePackages.data.summary?.published < 1 ||
    !coursePackages.data.packages?.some((item) => item.id === coursePackage.data.coursePackage.id && item.status === "published") ||
    !coursePackages.data.constraints?.some((item) => item.includes("education products"))
  ) {
    throw new Error("course package list API failed");
  }

  const learnerCoursePackages = await request("/api/course-packages");
  if (
    learnerCoursePackages.status !== 200 ||
    !learnerCoursePackages.data.packages?.some((item) => (
      item.id === coursePackage.data.coursePackage.id &&
      item.canAccess === true &&
      item.access === "full" &&
      item.progress?.totalItems >= 4 &&
      item.knowledgePoints?.some((kp) => kp.id === distilledKnowledge.data.knowledgePoint.id) &&
      item.scenarios?.some((scenarioItem) => scenarioItem.id === scenario.id) &&
      item.contextDrills?.some((drillItem) => drillItem.id === "market_context_misconception") &&
      item.sourceTransparencyDrills?.some((drillItem) => drillItem.id === "source_transparency_misconception")
    )) ||
    !learnerCoursePackages.data.constraints?.some((item) => item.includes("Starter can preview"))
  ) {
    throw new Error("learner course package full access failed");
  }

  const courseEnrollment = await request("/api/admin/course-enrollments", {
    method: "POST",
    body: {
      userId: login.data.session.userId,
      coursePackageId: coursePackage.data.coursePackage.id,
    },
  });
  if (
    courseEnrollment.status !== 201 ||
    courseEnrollment.data.enrollment?.coursePackageId !== coursePackage.data.coursePackage.id ||
    courseEnrollment.data.enrollment?.status !== "active" ||
    courseEnrollment.data.enrollment?.educationOnly !== true
  ) {
    throw new Error("admin course enrollment API failed");
  }

  const markedKnowledgeProgress = await request("/api/course-packages/progress", {
    method: "POST",
    body: {
      coursePackageId: coursePackage.data.coursePackage.id,
      knowledgePointId: distilledKnowledge.data.knowledgePoint.id,
    },
  });
  if (
    markedKnowledgeProgress.status !== 200 ||
    markedKnowledgeProgress.data.coursePackage?.progress?.completedKnowledgePointIds?.[0] !== distilledKnowledge.data.knowledgePoint.id ||
    markedKnowledgeProgress.data.coursePackage?.progress?.percent < 20 ||
    !markedKnowledgeProgress.data.coursePackage?.backtestDrills?.some((item) => item.id === "backtest_metric_misconception") ||
    !markedKnowledgeProgress.data.coursePackage?.contextDrills?.some((item) => item.id === "market_context_misconception") ||
    !markedKnowledgeProgress.data.coursePackage?.sourceTransparencyDrills?.some((item) => item.id === "source_transparency_misconception")
  ) {
    throw new Error("course package knowledge progress failed");
  }
  const learnerCoursePathAfterProgress = await request("/api/course-packages");
  const progressedPackage = learnerCoursePathAfterProgress.data.packages?.find((item) => item.id === coursePackage.data.coursePackage.id);
  if (
    learnerCoursePathAfterProgress.status !== 200 ||
    progressedPackage?.progress?.completedKnowledgePointIds?.[0] !== distilledKnowledge.data.knowledgePoint.id ||
    !progressedPackage?.scenarios?.some((scenarioItem) => scenarioItem.id === scenario.id) ||
    !progressedPackage?.backtestDrills?.some((item) => item.id === "backtest_metric_misconception") ||
    !progressedPackage?.contextDrills?.some((item) => item.id === "market_context_misconception") ||
    !progressedPackage?.sourceTransparencyDrills?.some((item) => item.id === "source_transparency_misconception") ||
    progressedPackage?.progress?.completedSourceTransparencyDrillIds?.includes("source_transparency_misconception") ||
    !progressedPackage?.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("learner course package path after progress failed");
  }

  const assignment = await request("/api/admin/assignments", {
    method: "POST",
    body: {
      userId: login.data.session.userId,
      scenarioId: scenario.id,
      focus: "failed breakout assignment",
      instructions: "Complete this education-only drill and write invalidation plus risk limits.",
    },
  });
  if (
    assignment.status !== 201 ||
    assignment.data.assignment?.scenarioId !== scenario.id ||
    assignment.data.assignment?.status !== "assigned" ||
    assignment.data.assignment?.educationOnly !== true
  ) {
    throw new Error("practice assignment creation API failed");
  }

  const assignmentsBeforeAttempt = await request("/api/assignments");
  if (
    assignmentsBeforeAttempt.status !== 200 ||
    !assignmentsBeforeAttempt.data.assignments?.some((item) => item.id === assignment.data.assignment.id && item.status === "assigned") ||
    !assignmentsBeforeAttempt.data.constraints?.some((item) => item.includes("education-only"))
  ) {
    throw new Error("learner assignments API failed before attempt");
  }

  const rosterEmail = `roster-${Date.now()}@tradegym.local`;
  const rosterImport = await request("/api/admin/roster-imports", {
    method: "POST",
    body: {
      cohortName: "API roster import cohort",
      defaultPlan: "Starter",
      rows: `${rosterEmail},Roster Learner,Starter\n${learnerEmail},Existing API Learner,Starter\n${rosterEmail},Duplicate Learner,Starter`,
    },
  });
  if (
    rosterImport.status !== 201 ||
    rosterImport.data.summary?.imported !== 2 ||
    rosterImport.data.summary?.createdAccounts !== 1 ||
    rosterImport.data.summary?.reusedAccounts !== 1 ||
    rosterImport.data.summary?.skipped !== 1 ||
    rosterImport.data.cohort?.memberCount !== 2 ||
    rosterImport.data.imported?.find((item) => item.email === rosterEmail)?.temporaryPassword?.length < 8 ||
    rosterImport.data.imported?.find((item) => item.email === learnerEmail)?.created !== false ||
    rosterImport.data.educationOnly !== true ||
    rosterImport.data.productionReady !== false ||
    !rosterImport.data.constraints?.some((item) => item.includes("compliance acknowledgement")) ||
    !rosterImport.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`roster import API failed: ${rosterImport.status} ${JSON.stringify(rosterImport.data).slice(0, 1200)}`);
  }
  const rosterCohorts = await request("/api/admin/cohorts");
  if (
    rosterCohorts.status !== 200 ||
    !rosterCohorts.data.cohorts?.some((item) => item.id === rosterImport.data.cohort.id && item.memberCount === 2)
  ) {
    throw new Error("roster import cohort was not visible in cohort list");
  }
  const rosterLearningRecords = await request(`/api/admin/learning-records/export?cohortId=${encodeURIComponent(rosterImport.data.cohort.id)}&format=json&limit=20`);
  if (
    rosterLearningRecords.status !== 200 ||
    rosterLearningRecords.data.report?.cohort?.id !== rosterImport.data.cohort.id ||
    rosterLearningRecords.data.report?.summary?.learners !== 2 ||
    rosterLearningRecords.data.report?.educationOnly !== true ||
    rosterLearningRecords.data.report?.productionReady !== false
  ) {
    throw new Error("roster import learning records cohort export failed");
  }
  const rosterImportAudit = await request("/api/admin/audit-logs?type=roster_import_created&limit=20");
  if (
    rosterImportAudit.status !== 200 ||
    !rosterImportAudit.data.items?.some((item) => item.type === "roster_import_created" && item.cohortId === rosterImport.data.cohort.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error("roster import audit log missing");
  }
  const rosterHandoffs = await request(`/api/admin/roster-import-handoffs?q=${encodeURIComponent(rosterEmail)}&limit=20`);
  const rosterHandoff = rosterHandoffs.data.handoffs?.find((item) => item.id === rosterImport.data.handoff?.id);
  if (
    rosterHandoffs.status !== 200 ||
    !rosterHandoff ||
    rosterHandoff.schemaVersion !== "roster-import-handoff-v1" ||
    rosterHandoff.educationOnly !== true ||
    rosterHandoff.productionReady !== false ||
    rosterHandoff.summary?.learners !== 2 ||
    !rosterHandoff.learners?.some((item) => item.email === rosterEmail && item.temporaryPassword && item.onboardingStatus === "pending_compliance_acknowledgement") ||
    !rosterHandoff.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`roster handoff list failed: ${rosterHandoffs.status} ${JSON.stringify(rosterHandoffs.data).slice(0, 1200)}`);
  }
  const rosterHandoffJson = await request(`/api/admin/roster-import-handoffs/export?handoffId=${encodeURIComponent(rosterHandoff.id)}&format=json`);
  if (
    rosterHandoffJson.status !== 200 ||
    rosterHandoffJson.data.handoff?.id !== rosterHandoff.id ||
    rosterHandoffJson.data.handoff?.productionReady !== false ||
    !rosterHandoffJson.data.note?.includes("education cohort onboarding")
  ) {
    throw new Error(`roster handoff JSON export failed: ${rosterHandoffJson.status} ${JSON.stringify(rosterHandoffJson.data).slice(0, 1000)}`);
  }
  const rosterHandoffCsv = await request(`/api/admin/roster-import-handoffs/export?handoffId=${encodeURIComponent(rosterHandoff.id)}&format=csv`);
  if (
    rosterHandoffCsv.status !== 200 ||
    typeof rosterHandoffCsv.data !== "string" ||
    !rosterHandoffCsv.data.startsWith("handoffId,cohortId,cohortName,email") ||
    !rosterHandoffCsv.data.includes(rosterEmail) ||
    !rosterHandoffCsv.data.includes("pending_compliance_acknowledgement")
  ) {
    throw new Error(`roster handoff CSV export failed: ${rosterHandoffCsv.status} ${String(rosterHandoffCsv.data).slice(0, 1000)}`);
  }
  const rosterHandoffMd = await request(`/api/admin/roster-import-handoffs/export?handoffId=${encodeURIComponent(rosterHandoff.id)}&format=md`);
  if (
    rosterHandoffMd.status !== 200 ||
    typeof rosterHandoffMd.data !== "string" ||
    !rosterHandoffMd.data.includes("# TradeGym Roster Import Handoff") ||
    !rosterHandoffMd.data.includes("Temporary passwords") ||
    !rosterHandoffMd.data.includes("No stock recommendation")
  ) {
    throw new Error(`roster handoff markdown export failed: ${rosterHandoffMd.status} ${String(rosterHandoffMd.data).slice(0, 1000)}`);
  }
  const rosterHandoffAudit = await request("/api/admin/audit-logs?type=roster_import_handoff_exported&limit=20");
  if (
    rosterHandoffAudit.status !== 200 ||
    !rosterHandoffAudit.data.items?.some((item) => item.type === "roster_import_handoff_exported" && item.handoffId === rosterHandoff.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error("roster handoff export audit log missing");
  }
  const rosterOnboardingReport = await request(`/api/admin/roster-onboarding-report?handoffId=${encodeURIComponent(rosterHandoff.id)}`);
  const rosterOnboardingLearner = rosterOnboardingReport.data.report?.learners?.find((item) => item.email === rosterEmail);
  if (
    rosterOnboardingReport.status !== 200 ||
    rosterOnboardingReport.data.report?.schemaVersion !== "roster-onboarding-report-v1" ||
    rosterOnboardingReport.data.report?.educationOnly !== true ||
    rosterOnboardingReport.data.report?.productionReady !== false ||
    rosterOnboardingReport.data.report?.summary?.learners !== 2 ||
    rosterOnboardingLearner?.loggedIn !== false ||
    rosterOnboardingLearner?.complianceAcknowledged !== false ||
    rosterOnboardingLearner?.needsAttention !== true ||
    !rosterOnboardingReport.data.report?.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`roster onboarding report failed: ${rosterOnboardingReport.status} ${JSON.stringify(rosterOnboardingReport.data).slice(0, 1200)}`);
  }
  const rosterOnboardingJson = await request(`/api/admin/roster-onboarding-report/export?handoffId=${encodeURIComponent(rosterHandoff.id)}&format=json`);
  if (
    rosterOnboardingJson.status !== 200 ||
    rosterOnboardingJson.data.report?.handoffId !== rosterHandoff.id ||
    rosterOnboardingJson.data.report?.productionReady !== false ||
    !rosterOnboardingJson.data.note?.includes("education customer-success")
  ) {
    throw new Error(`roster onboarding JSON export failed: ${rosterOnboardingJson.status} ${JSON.stringify(rosterOnboardingJson.data).slice(0, 1000)}`);
  }
  const rosterOnboardingCsv = await request(`/api/admin/roster-onboarding-report/export?handoffId=${encodeURIComponent(rosterHandoff.id)}&format=csv`);
  if (
    rosterOnboardingCsv.status !== 200 ||
    typeof rosterOnboardingCsv.data !== "string" ||
    !rosterOnboardingCsv.data.startsWith("handoffId,cohortId,email") ||
    !rosterOnboardingCsv.data.includes(rosterEmail) ||
    !rosterOnboardingCsv.data.includes("Send the local handoff instructions")
  ) {
    throw new Error(`roster onboarding CSV export failed: ${rosterOnboardingCsv.status} ${String(rosterOnboardingCsv.data).slice(0, 1000)}`);
  }
  const rosterOnboardingMd = await request(`/api/admin/roster-onboarding-report/export?handoffId=${encodeURIComponent(rosterHandoff.id)}&format=md`);
  if (
    rosterOnboardingMd.status !== 200 ||
    typeof rosterOnboardingMd.data !== "string" ||
    !rosterOnboardingMd.data.includes("# TradeGym Roster Onboarding Report") ||
    !rosterOnboardingMd.data.includes("No stock recommendation")
  ) {
    throw new Error(`roster onboarding markdown export failed: ${rosterOnboardingMd.status} ${String(rosterOnboardingMd.data).slice(0, 1000)}`);
  }
  const rosterOnboardingAudit = await request("/api/admin/audit-logs?type=roster_onboarding_report_exported&limit=20");
  if (
    rosterOnboardingAudit.status !== 200 ||
    !rosterOnboardingAudit.data.items?.some((item) => item.type === "roster_onboarding_report_exported" && item.handoffId === rosterHandoff.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error("roster onboarding report export audit log missing");
  }
  const rosterOnboardingProgress = await request(`/api/admin/roster-onboarding-progress?cohortId=${encodeURIComponent(rosterImport.data.cohort.id)}`);
  if (
    rosterOnboardingProgress.status !== 200 ||
    rosterOnboardingProgress.data.report?.schemaVersion !== "roster-onboarding-progress-v1" ||
    rosterOnboardingProgress.data.report?.educationOnly !== true ||
    rosterOnboardingProgress.data.report?.productionReady !== false ||
    rosterOnboardingProgress.data.report?.summary?.learners !== 2 ||
    rosterOnboardingProgress.data.report?.summary?.needsAttention < 1 ||
    !rosterOnboardingProgress.data.report?.summary?.blockerCounts?.some((item) => item.key === "first_login") ||
    !rosterOnboardingProgress.data.report?.learners?.some((item) => item.email === rosterEmail && item.ownerEmail === "success@tradegym.local" && item.status === "needs_followup") ||
    !rosterOnboardingProgress.data.note?.includes("institution customer-success meeting view")
  ) {
    throw new Error(`roster onboarding progress failed: ${rosterOnboardingProgress.status} ${JSON.stringify(rosterOnboardingProgress.data).slice(0, 1400)}`);
  }
  const rosterOnboardingProgressJson = await request(`/api/admin/roster-onboarding-progress/export?cohortId=${encodeURIComponent(rosterImport.data.cohort.id)}&format=json`);
  if (
    rosterOnboardingProgressJson.status !== 200 ||
    rosterOnboardingProgressJson.data.report?.productionReady !== false ||
    rosterOnboardingProgressJson.data.report?.summary?.learners !== 2 ||
    !rosterOnboardingProgressJson.data.note?.includes("education customer-success meeting evidence")
  ) {
    throw new Error(`roster onboarding progress JSON export failed: ${rosterOnboardingProgressJson.status} ${JSON.stringify(rosterOnboardingProgressJson.data).slice(0, 1200)}`);
  }
  const rosterOnboardingProgressCsv = await request(`/api/admin/roster-onboarding-progress/export?cohortId=${encodeURIComponent(rosterImport.data.cohort.id)}&format=csv`);
  if (
    rosterOnboardingProgressCsv.status !== 200 ||
    typeof rosterOnboardingProgressCsv.data !== "string" ||
    !rosterOnboardingProgressCsv.data.startsWith("handoffId,cohortId,cohortName,email,status,blockerCategory,ownerEmail,targetReviewAt") ||
    !rosterOnboardingProgressCsv.data.includes(rosterEmail) ||
    !rosterOnboardingProgressCsv.data.includes("first_login") ||
    !rosterOnboardingProgressCsv.data.includes("success@tradegym.local")
  ) {
    throw new Error(`roster onboarding progress CSV export failed: ${rosterOnboardingProgressCsv.status} ${String(rosterOnboardingProgressCsv.data).slice(0, 1000)}`);
  }
  const rosterOnboardingProgressMd = await request(`/api/admin/roster-onboarding-progress/export?cohortId=${encodeURIComponent(rosterImport.data.cohort.id)}&format=md`);
  if (
    rosterOnboardingProgressMd.status !== 200 ||
    typeof rosterOnboardingProgressMd.data !== "string" ||
    !rosterOnboardingProgressMd.data.includes("# TradeGym Roster Onboarding Progress") ||
    !rosterOnboardingProgressMd.data.includes("## Owner / Target Review") ||
    !rosterOnboardingProgressMd.data.includes(rosterEmail) ||
    !rosterOnboardingProgressMd.data.includes("Production ready: false") ||
    !rosterOnboardingProgressMd.data.includes("not investment advice")
  ) {
    throw new Error(`roster onboarding progress markdown export failed: ${rosterOnboardingProgressMd.status} ${String(rosterOnboardingProgressMd.data).slice(0, 1200)}`);
  }
  const rosterOnboardingProgressAudit = await request("/api/admin/audit-logs?type=roster_onboarding_progress_exported&limit=20");
  if (
    rosterOnboardingProgressAudit.status !== 200 ||
    !rosterOnboardingProgressAudit.data.items?.some((item) => item.type === "roster_onboarding_progress_exported" && item.cohortId === rosterImport.data.cohort.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error("roster onboarding progress export audit log missing");
  }
  const rosterOnboardingFollowups = await request("/api/admin/roster-onboarding-followups", {
    method: "POST",
    body: { handoffId: rosterHandoff.id },
  });
  if (
    rosterOnboardingFollowups.status !== 201 ||
    rosterOnboardingFollowups.data.summary?.handoffId !== rosterHandoff.id ||
    rosterOnboardingFollowups.data.summary?.needsAttention < 1 ||
    rosterOnboardingFollowups.data.summary?.created < 1 ||
    rosterOnboardingFollowups.data.educationOnly !== true ||
    rosterOnboardingFollowups.data.productionReady !== false ||
    !rosterOnboardingFollowups.data.tasks?.some((item) => item.email === rosterEmail && item.source === "roster_onboarding_followup" && item.rosterHandoffId === rosterHandoff.id && item.educationOnly === true && item.productionReady === false) ||
    !rosterOnboardingFollowups.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`roster onboarding followups failed: ${rosterOnboardingFollowups.status} ${JSON.stringify(rosterOnboardingFollowups.data).slice(0, 1200)}`);
  }
  const rosterOnboardingFollowupsReuse = await request("/api/admin/roster-onboarding-followups", {
    method: "POST",
    body: { handoffId: rosterHandoff.id },
  });
  if (
    rosterOnboardingFollowupsReuse.status !== 200 ||
    rosterOnboardingFollowupsReuse.data.summary?.created !== 0 ||
    rosterOnboardingFollowupsReuse.data.summary?.reused < 1
  ) {
    throw new Error(`roster onboarding followups reuse failed: ${rosterOnboardingFollowupsReuse.status} ${JSON.stringify(rosterOnboardingFollowupsReuse.data).slice(0, 1200)}`);
  }
  const rosterActivationTasks = await request(`/api/admin/activation-interventions?status=open&q=${encodeURIComponent(rosterEmail)}&limit=20`);
  if (
    rosterActivationTasks.status !== 200 ||
    !rosterActivationTasks.data.tasks?.some((item) => item.source === "roster_onboarding_followup" && item.rosterHandoffId === rosterHandoff.id && item.email === rosterEmail && item.educationOnly === true) ||
    !rosterActivationTasks.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`roster onboarding followup activation task missing: ${rosterActivationTasks.status} ${JSON.stringify(rosterActivationTasks.data).slice(0, 1200)}`);
  }
  const rosterOnboardingFollowupAudit = await request("/api/admin/audit-logs?type=roster_onboarding_followups_created&limit=20");
  if (
    rosterOnboardingFollowupAudit.status !== 200 ||
    !rosterOnboardingFollowupAudit.data.items?.some((item) => item.type === "roster_onboarding_followups_created" && item.handoffId === rosterHandoff.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error("roster onboarding followups audit log missing");
  }

  const cohort = await request("/api/admin/cohorts", {
    method: "POST",
    body: {
      name: "API cohort: price action starters",
      members: "admin@tradegym.local",
    },
  });
  if (
    cohort.status !== 201 ||
    cohort.data.cohort?.memberCount !== 1 ||
    cohort.data.cohort?.educationOnly !== true
  ) {
    throw new Error("cohort creation API failed");
  }

  const cohortAssignment = await request("/api/admin/cohorts/assign", {
    method: "POST",
    body: {
      cohortId: cohort.data.cohort.id,
      scenarioId: scenario.id,
      focus: "cohort failed breakout practice",
      instructions: "Complete this education-only cohort drill and write invalidation plus risk limits.",
    },
  });
  if (
    cohortAssignment.status !== 201 ||
    cohortAssignment.data.assignments?.length !== 1 ||
    cohortAssignment.data.assignments?.[0]?.cohortId !== cohort.data.cohort.id ||
    cohortAssignment.data.cohort?.assignmentSummary?.total < 1
  ) {
    throw new Error("cohort assignment API failed");
  }

  const packageAssignment = await request("/api/admin/course-package-assignments", {
    method: "POST",
    body: {
      userId: login.data.session.userId,
      coursePackageId: coursePackage.data.coursePackage.id,
      instructions: "Complete the full education-only course package and review the completion report.",
    },
  });
  if (
    packageAssignment.status !== 201 ||
    packageAssignment.data.coursePackageAssignments?.length !== 1 ||
    packageAssignment.data.enrollments?.[0]?.coursePackageId !== coursePackage.data.coursePackage.id ||
    packageAssignment.data.practiceAssignments?.length !== 1 ||
    packageAssignment.data.practiceAssignments?.[0]?.coursePackageAssignmentId !== packageAssignment.data.coursePackageAssignments[0].id ||
    !packageAssignment.data.constraints?.some((item) => item.includes("education delivery"))
  ) {
    throw new Error("course package assignment API failed");
  }

  const cohortPackageAssignment = await request("/api/admin/course-package-assignments", {
    method: "POST",
    body: {
      cohortId: cohort.data.cohort.id,
      coursePackageId: coursePackage.data.coursePackage.id,
      instructions: "Cohort delivery for the full education-only course package.",
    },
  });
  if (
    cohortPackageAssignment.status !== 201 ||
    cohortPackageAssignment.data.cohort?.id !== cohort.data.cohort.id ||
    cohortPackageAssignment.data.cohort?.coursePackageSummary?.total < 1 ||
    cohortPackageAssignment.data.enrollments?.length !== 1
  ) {
    throw new Error("cohort course package assignment API failed");
  }

  const cohorts = await request("/api/admin/cohorts");
  if (
    cohorts.status !== 200 ||
    !cohorts.data.cohorts?.some((item) => item.id === cohort.data.cohort.id && item.memberCount === 1) ||
    !cohorts.data.constraints?.some((item) => item.includes("education delivery"))
  ) {
    throw new Error("cohort list API failed");
  }

  const cohortEducationReport = await request(`/api/admin/cohort-education-report?cohortId=${encodeURIComponent(cohort.data.cohort.id)}`);
  if (
    cohortEducationReport.status !== 200 ||
    cohortEducationReport.data.report?.schemaVersion !== "cohort-education-report-v1" ||
    cohortEducationReport.data.report?.educationOnly !== true ||
    cohortEducationReport.data.report?.cohort?.id !== cohort.data.cohort.id ||
    cohortEducationReport.data.report?.summary?.practiceCompletionRate < 0 ||
    !cohortEducationReport.data.report?.memberHighlights?.some((item) => item.email === "admin@tradegym.local" && item.educationOnly === true) ||
    !cohortEducationReport.data.report?.nextTeachingActions?.length ||
    !cohortEducationReport.data.report?.exportText?.includes("Education-only") ||
    !cohortEducationReport.data.report?.constraints?.some((item) => item.includes("not stock recommendations")) ||
    !cohortEducationReport.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`cohort education report API failed: ${cohortEducationReport.status} ${JSON.stringify(cohortEducationReport.data).slice(0, 1200)}`);
  }

  const cohortEducationJsonExport = await request(`/api/admin/cohort-education-report/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=json`);
  if (
    cohortEducationJsonExport.status !== 200 ||
    cohortEducationJsonExport.data.report?.schemaVersion !== "cohort-education-report-v1" ||
    cohortEducationJsonExport.data.report?.educationOnly !== true ||
    cohortEducationJsonExport.data.report?.cohort?.id !== cohort.data.cohort.id ||
    !cohortEducationJsonExport.data.note?.includes("not investment advice")
  ) {
    throw new Error(`cohort education JSON export failed: ${cohortEducationJsonExport.status} ${JSON.stringify(cohortEducationJsonExport.data).slice(0, 1200)}`);
  }

  const cohortEducationCsvExport = await request(`/api/admin/cohort-education-report/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=csv`);
  if (
    cohortEducationCsvExport.status !== 200 ||
    typeof cohortEducationCsvExport.data !== "string" ||
    !cohortEducationCsvExport.data.startsWith("userId,email,name") ||
    !cohortEducationCsvExport.data.includes("admin@tradegym.local")
  ) {
    throw new Error(`cohort education CSV export failed: ${cohortEducationCsvExport.status} ${String(cohortEducationCsvExport.data).slice(0, 1000)}`);
  }

  const cohortEducationMdExport = await request(`/api/admin/cohort-education-report/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=md`);
  if (
    cohortEducationMdExport.status !== 200 ||
    typeof cohortEducationMdExport.data !== "string" ||
    !cohortEducationMdExport.data.includes("# TradeGym Cohort Education Report") ||
    !cohortEducationMdExport.data.includes("not a trading-skill certification") ||
    !cohortEducationMdExport.data.includes("stock recommendation")
  ) {
    throw new Error(`cohort education MD export failed: ${cohortEducationMdExport.status} ${String(cohortEducationMdExport.data).slice(0, 1200)}`);
  }
  const cohortSuccessBrief = await request(`/api/admin/cohort-success-brief?cohortId=${encodeURIComponent(cohort.data.cohort.id)}`);
  if (
    cohortSuccessBrief.status !== 200 ||
    cohortSuccessBrief.data.brief?.schemaVersion !== "cohort-success-brief-v1" ||
    cohortSuccessBrief.data.brief?.educationOnly !== true ||
    cohortSuccessBrief.data.brief?.productionReady !== false ||
    cohortSuccessBrief.data.brief?.cohort?.id !== cohort.data.cohort.id ||
    typeof cohortSuccessBrief.data.brief?.healthScore !== "number" ||
    !["healthy", "watch", "needs_attention"].includes(cohortSuccessBrief.data.brief?.status) ||
    typeof cohortSuccessBrief.data.brief?.summary?.learningRecordStatements !== "number" ||
    !cohortSuccessBrief.data.brief?.sections?.educationReport?.memberHighlights?.some((item) => item.email === "admin@tradegym.local") ||
    cohortSuccessBrief.data.brief?.sections?.rosterOnboarding?.educationOnly !== true ||
    cohortSuccessBrief.data.brief?.sections?.activationFollowups?.educationOnly !== true ||
    !cohortSuccessBrief.data.brief?.nextCustomerSuccessActions?.length ||
    !cohortSuccessBrief.data.brief?.constraints?.some((item) => item.includes("does not measure trading performance")) ||
    !cohortSuccessBrief.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`cohort success brief API failed: ${cohortSuccessBrief.status} ${JSON.stringify(cohortSuccessBrief.data).slice(0, 1400)}`);
  }
  const cohortSuccessJsonExport = await request(`/api/admin/cohort-success-brief/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=json`);
  if (
    cohortSuccessJsonExport.status !== 200 ||
    cohortSuccessJsonExport.data.brief?.schemaVersion !== "cohort-success-brief-v1" ||
    cohortSuccessJsonExport.data.brief?.productionReady !== false ||
    !cohortSuccessJsonExport.data.note?.includes("education SaaS customer-success")
  ) {
    throw new Error(`cohort success JSON export failed: ${cohortSuccessJsonExport.status} ${JSON.stringify(cohortSuccessJsonExport.data).slice(0, 1200)}`);
  }
  const cohortSuccessCsvExport = await request(`/api/admin/cohort-success-brief/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=csv`);
  if (
    cohortSuccessCsvExport.status !== 200 ||
    typeof cohortSuccessCsvExport.data !== "string" ||
    !cohortSuccessCsvExport.data.startsWith("section,metric,value,next") ||
    !cohortSuccessCsvExport.data.includes("healthScore") ||
    !cohortSuccessCsvExport.data.includes("productionReady")
  ) {
    throw new Error(`cohort success CSV export failed: ${cohortSuccessCsvExport.status} ${String(cohortSuccessCsvExport.data).slice(0, 1000)}`);
  }
  const cohortSuccessMdExport = await request(`/api/admin/cohort-success-brief/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=md`);
  if (
    cohortSuccessMdExport.status !== 200 ||
    typeof cohortSuccessMdExport.data !== "string" ||
    !cohortSuccessMdExport.data.includes("# TradeGym Cohort Success Brief") ||
    !cohortSuccessMdExport.data.includes("No stock recommendation") ||
    !cohortSuccessMdExport.data.includes("trading performance")
  ) {
    throw new Error(`cohort success MD export failed: ${cohortSuccessMdExport.status} ${String(cohortSuccessMdExport.data).slice(0, 1200)}`);
  }
  const cohortSuccessAudit = await request("/api/admin/audit-logs?type=cohort_success_brief_exported&limit=20");
  if (
    cohortSuccessAudit.status !== 200 ||
    !cohortSuccessAudit.data.items?.some((item) => item.type === "cohort_success_brief_exported" && item.cohortId === cohort.data.cohort.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`cohort success brief audit missing: ${cohortSuccessAudit.status} ${JSON.stringify(cohortSuccessAudit.data).slice(0, 1200)}`);
  }
  const cohortCompliancePack = await request(`/api/admin/cohort-compliance-pack?cohortId=${encodeURIComponent(cohort.data.cohort.id)}`);
  if (
    cohortCompliancePack.status !== 200 ||
    cohortCompliancePack.data.pack?.schemaVersion !== "cohort-compliance-pack-v1" ||
    cohortCompliancePack.data.pack?.educationOnly !== true ||
    cohortCompliancePack.data.pack?.productionReady !== false ||
    cohortCompliancePack.data.pack?.cohort?.id !== cohort.data.cohort.id ||
    cohortCompliancePack.data.pack?.currentLegalVersions?.terms !== legalVersions.terms ||
    cohortCompliancePack.data.pack?.currentLegalVersions?.privacy !== legalVersions.privacy ||
    cohortCompliancePack.data.pack?.currentLegalVersions?.risk !== legalVersions.risk ||
    typeof cohortCompliancePack.data.pack?.summary?.complianceRate !== "number" ||
    !cohortCompliancePack.data.pack?.learners?.some((item) => item.email === "admin@tradegym.local" && item.educationOnly === true && item.productionReady === false) ||
    !cohortCompliancePack.data.pack?.constraints?.some((item) => item.includes("do not certify trading skill")) ||
    !cohortCompliancePack.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`cohort compliance pack API failed: ${cohortCompliancePack.status} ${JSON.stringify(cohortCompliancePack.data).slice(0, 1400)}`);
  }
  const cohortComplianceJsonExport = await request(`/api/admin/cohort-compliance-pack/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=json`);
  if (
    cohortComplianceJsonExport.status !== 200 ||
    cohortComplianceJsonExport.data.pack?.schemaVersion !== "cohort-compliance-pack-v1" ||
    cohortComplianceJsonExport.data.pack?.productionReady !== false ||
    !cohortComplianceJsonExport.data.note?.includes("education SaaS institution evidence")
  ) {
    throw new Error(`cohort compliance JSON export failed: ${cohortComplianceJsonExport.status} ${JSON.stringify(cohortComplianceJsonExport.data).slice(0, 1200)}`);
  }
  const cohortComplianceCsvExport = await request(`/api/admin/cohort-compliance-pack/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=csv`);
  if (
    cohortComplianceCsvExport.status !== 200 ||
    typeof cohortComplianceCsvExport.data !== "string" ||
    !cohortComplianceCsvExport.data.startsWith("cohortId,email,name") ||
    !cohortComplianceCsvExport.data.includes("admin@tradegym.local") ||
    !cohortComplianceCsvExport.data.includes("productionReady")
  ) {
    throw new Error(`cohort compliance CSV export failed: ${cohortComplianceCsvExport.status} ${String(cohortComplianceCsvExport.data).slice(0, 1000)}`);
  }
  const cohortComplianceMdExport = await request(`/api/admin/cohort-compliance-pack/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=md`);
  if (
    cohortComplianceMdExport.status !== 200 ||
    typeof cohortComplianceMdExport.data !== "string" ||
    !cohortComplianceMdExport.data.includes("# TradeGym Cohort Compliance Pack") ||
    !cohortComplianceMdExport.data.includes("No stock recommendation") ||
    !cohortComplianceMdExport.data.includes("trading performance")
  ) {
    throw new Error(`cohort compliance MD export failed: ${cohortComplianceMdExport.status} ${String(cohortComplianceMdExport.data).slice(0, 1200)}`);
  }
  const cohortComplianceAudit = await request("/api/admin/audit-logs?type=cohort_compliance_pack_exported&limit=20");
  if (
    cohortComplianceAudit.status !== 200 ||
    !cohortComplianceAudit.data.items?.some((item) => item.type === "cohort_compliance_pack_exported" && item.cohortId === cohort.data.cohort.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`cohort compliance pack audit missing: ${cohortComplianceAudit.status} ${JSON.stringify(cohortComplianceAudit.data).slice(0, 1200)}`);
  }
  const cohortProcurementPacket = await request(`/api/admin/cohort-procurement-packet?cohortId=${encodeURIComponent(cohort.data.cohort.id)}`);
  if (
    cohortProcurementPacket.status !== 200 ||
    cohortProcurementPacket.data.packet?.schemaVersion !== "cohort-procurement-packet-v1" ||
    cohortProcurementPacket.data.packet?.educationOnly !== true ||
    cohortProcurementPacket.data.packet?.productionReady !== false ||
    cohortProcurementPacket.data.packet?.cohort?.id !== cohort.data.cohort.id ||
    !["procurement_review_gaps", "education_procurement_packet_ready", "education_procurement_watch"].includes(cohortProcurementPacket.data.packet?.readiness) ||
    typeof cohortProcurementPacket.data.packet?.summary?.healthScore !== "number" ||
    typeof cohortProcurementPacket.data.packet?.summary?.complianceRate !== "number" ||
    cohortProcurementPacket.data.packet?.summary?.curriculumPackages < 1 ||
    cohortProcurementPacket.data.packet?.summary?.curriculumSourceBlockers < 1 ||
    cohortProcurementPacket.data.packet?.evidence?.successBrief?.schemaVersion !== "cohort-success-brief-v1" ||
    cohortProcurementPacket.data.packet?.evidence?.compliancePack?.schemaVersion !== "cohort-compliance-pack-v1" ||
    cohortProcurementPacket.data.packet?.evidence?.curriculumSourceEvidence?.schemaVersion !== "cohort-curriculum-source-evidence-v1" ||
    !cohortProcurementPacket.data.packet?.evidence?.curriculumSourceEvidence?.packages?.some((item) => item.blockers?.includes("content_source_missing") && item.educationOnly === true && item.productionReady === false) ||
    !cohortProcurementPacket.data.packet?.blockerCategories?.some((item) => item.category === "compliance_evidence" && item.educationOnly === true && item.productionReady === false) ||
    !cohortProcurementPacket.data.packet?.blockerCategories?.some((item) => item.category === "curriculum_source_evidence" && item.status === "needs_action") ||
    !cohortProcurementPacket.data.packet?.blockerCategories?.some((item) => item.category === "learning_evidence" && item.nextCustomerSuccessAction?.includes("education adoption")) ||
    !cohortProcurementPacket.data.packet?.executiveSummary?.some((item) => item.includes("Compliance evidence")) ||
    !cohortProcurementPacket.data.packet?.constraints?.some((item) => item.includes("win-rate evidence")) ||
    !cohortProcurementPacket.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`cohort procurement packet API failed: ${cohortProcurementPacket.status} ${JSON.stringify(cohortProcurementPacket.data).slice(0, 1600)}`);
  }
  const cohortProcurementJsonExport = await request(`/api/admin/cohort-procurement-packet/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=json`);
  if (
    cohortProcurementJsonExport.status !== 200 ||
    cohortProcurementJsonExport.data.packet?.schemaVersion !== "cohort-procurement-packet-v1" ||
    cohortProcurementJsonExport.data.packet?.productionReady !== false ||
    !cohortProcurementJsonExport.data.packet?.blockerCategories?.some((item) => item.category === "compliance_evidence" && item.educationOnly === true) ||
    !cohortProcurementJsonExport.data.packet?.evidence?.curriculumSourceEvidence?.packages?.some((item) => item.blockers?.includes("content_source_missing")) ||
    !cohortProcurementJsonExport.data.note?.includes("education SaaS institution procurement")
  ) {
    throw new Error(`cohort procurement JSON export failed: ${cohortProcurementJsonExport.status} ${JSON.stringify(cohortProcurementJsonExport.data).slice(0, 1200)}`);
  }
  const cohortProcurementCsvExport = await request(`/api/admin/cohort-procurement-packet/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=csv`);
  if (
    cohortProcurementCsvExport.status !== 200 ||
    typeof cohortProcurementCsvExport.data !== "string" ||
    !cohortProcurementCsvExport.data.startsWith("section,metric,value,next") ||
    !cohortProcurementCsvExport.data.includes("complianceRate") ||
    !cohortProcurementCsvExport.data.includes("blocker_category") ||
    !cohortProcurementCsvExport.data.includes("compliance_evidence") ||
    !cohortProcurementCsvExport.data.includes("curriculum_source") ||
    !cohortProcurementCsvExport.data.includes("content_source_missing") ||
    !cohortProcurementCsvExport.data.includes("productionReady")
  ) {
    throw new Error(`cohort procurement CSV export failed: ${cohortProcurementCsvExport.status} ${String(cohortProcurementCsvExport.data).slice(0, 1000)}`);
  }
  const cohortProcurementMdExport = await request(`/api/admin/cohort-procurement-packet/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=md`);
  if (
    cohortProcurementMdExport.status !== 200 ||
    typeof cohortProcurementMdExport.data !== "string" ||
    !cohortProcurementMdExport.data.includes("# TradeGym Cohort Procurement Packet") ||
    !cohortProcurementMdExport.data.includes("## Blocker Categories") ||
    !cohortProcurementMdExport.data.includes("## Curriculum Source Evidence") ||
    !cohortProcurementMdExport.data.includes("content_source_missing") ||
    !cohortProcurementMdExport.data.includes("Compliance evidence") ||
    !cohortProcurementMdExport.data.includes("No stock recommendation") ||
    !cohortProcurementMdExport.data.includes("trading-performance evidence")
  ) {
    throw new Error(`cohort procurement MD export failed: ${cohortProcurementMdExport.status} ${String(cohortProcurementMdExport.data).slice(0, 1200)}`);
  }
  const cohortProcurementAudit = await request("/api/admin/audit-logs?type=cohort_procurement_packet_exported&limit=20");
  if (
    cohortProcurementAudit.status !== 200 ||
    !cohortProcurementAudit.data.items?.some((item) => item.type === "cohort_procurement_packet_exported" && item.cohortId === cohort.data.cohort.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`cohort procurement packet audit missing: ${cohortProcurementAudit.status} ${JSON.stringify(cohortProcurementAudit.data).slice(0, 1200)}`);
  }
  const cohortProcurementFollowup = await request("/api/admin/cohort-procurement-followups", {
    method: "POST",
    body: { cohortId: cohort.data.cohort.id },
  });
  if (
    cohortProcurementFollowup.status !== 201 ||
    cohortProcurementFollowup.data.task?.source !== "cohort_procurement_followup" ||
    cohortProcurementFollowup.data.task?.cohortId !== cohort.data.cohort.id ||
    cohortProcurementFollowup.data.task?.educationOnly !== true ||
    cohortProcurementFollowup.data.task?.productionReady !== false ||
    cohortProcurementFollowup.data.packet?.schemaVersion !== "cohort-procurement-packet-v1" ||
    cohortProcurementFollowup.data.productionReady !== false ||
    cohortProcurementFollowup.data.educationOnly !== true ||
    !cohortProcurementFollowup.data.constraints?.some((item) => item.includes("institution customer-success tasks"))
  ) {
    throw new Error(`cohort procurement follow-up create failed: ${cohortProcurementFollowup.status} ${JSON.stringify(cohortProcurementFollowup.data).slice(0, 1400)}`);
  }
  const cohortProcurementFollowupReused = await request("/api/admin/cohort-procurement-followups", {
    method: "POST",
    body: { cohortId: cohort.data.cohort.id },
  });
  if (
    cohortProcurementFollowupReused.status !== 200 ||
    cohortProcurementFollowupReused.data.reused !== true ||
    cohortProcurementFollowupReused.data.task?.id !== cohortProcurementFollowup.data.task.id ||
    cohortProcurementFollowupReused.data.productionReady !== false ||
    cohortProcurementFollowupReused.data.educationOnly !== true
  ) {
    throw new Error(`cohort procurement follow-up reuse failed: ${cohortProcurementFollowupReused.status} ${JSON.stringify(cohortProcurementFollowupReused.data).slice(0, 1200)}`);
  }
  const cohortProcurementFollowupQueue = await request(`/api/admin/activation-interventions?q=${encodeURIComponent(cohort.data.cohort.name)}&limit=20`);
  if (
    cohortProcurementFollowupQueue.status !== 200 ||
    !cohortProcurementFollowupQueue.data.tasks?.some((item) => item.id === cohortProcurementFollowup.data.task.id && item.source === "cohort_procurement_followup")
  ) {
    throw new Error(`cohort procurement follow-up queue missing: ${cohortProcurementFollowupQueue.status} ${JSON.stringify(cohortProcurementFollowupQueue.data).slice(0, 1200)}`);
  }
  const cohortProcurementFollowupAudit = await request("/api/admin/audit-logs?type=cohort_procurement_followup_created&limit=20");
  if (
    cohortProcurementFollowupAudit.status !== 200 ||
    !cohortProcurementFollowupAudit.data.items?.some((item) => item.type === "cohort_procurement_followup_created" && item.cohortId === cohort.data.cohort.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`cohort procurement follow-up audit missing: ${cohortProcurementFollowupAudit.status} ${JSON.stringify(cohortProcurementFollowupAudit.data).slice(0, 1200)}`);
  }
  const cohortProcurementDelivery = await request("/api/admin/cohort-procurement-deliveries", {
    method: "POST",
    body: {
      cohortId: cohort.data.cohort.id,
      recipientEmail: "success@tradegym.local",
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    cohortProcurementDelivery.status !== 201 ||
    cohortProcurementDelivery.data.productionReady !== false ||
    cohortProcurementDelivery.data.educationOnly !== true ||
    cohortProcurementDelivery.data.delivery?.cohortId !== cohort.data.cohort.id ||
    cohortProcurementDelivery.data.delivery?.recipientEmail !== "success@tradegym.local" ||
    cohortProcurementDelivery.data.delivery?.providerMode !== "local-simulated" ||
    cohortProcurementDelivery.data.delivery?.feedbackStatus !== "pending_feedback" ||
    !cohortProcurementDelivery.data.delivery?.blockerCategories?.some((item) => item.category === "compliance_evidence" && item.educationOnly === true) ||
    cohortProcurementDelivery.data.delivery?.productionReady !== false ||
    cohortProcurementDelivery.data.packet?.schemaVersion !== "cohort-procurement-packet-v1" ||
    !cohortProcurementDelivery.data.constraints?.some((item) => item.includes("Local provider mode is simulated"))
  ) {
    throw new Error(`cohort procurement delivery failed: ${cohortProcurementDelivery.status} ${JSON.stringify(cohortProcurementDelivery.data).slice(0, 1400)}`);
  }
  const cohortProcurementDeliveries = await request("/api/admin/cohort-procurement-deliveries");
  if (
    cohortProcurementDeliveries.status !== 200 ||
    cohortProcurementDeliveries.data.productionReady !== false ||
    cohortProcurementDeliveries.data.educationOnly !== true ||
    cohortProcurementDeliveries.data.summary?.localSimulated < 1 ||
    !cohortProcurementDeliveries.data.deliveries?.some((item) => item.id === cohortProcurementDelivery.data.delivery.id && item.providerMode === "local-simulated") ||
    !cohortProcurementDeliveries.data.constraints?.some((item) => item.includes("does not prove production email delivery"))
  ) {
    throw new Error(`cohort procurement deliveries list failed: ${cohortProcurementDeliveries.status} ${JSON.stringify(cohortProcurementDeliveries.data).slice(0, 1200)}`);
  }
  const cohortProcurementDeliveryAudit = await request("/api/admin/audit-logs?type=cohort_procurement_packet_delivered&limit=20");
  if (
    cohortProcurementDeliveryAudit.status !== 200 ||
    !cohortProcurementDeliveryAudit.data.items?.some((item) => item.type === "cohort_procurement_packet_delivered" && item.cohortId === cohort.data.cohort.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`cohort procurement delivery audit missing: ${cohortProcurementDeliveryAudit.status} ${JSON.stringify(cohortProcurementDeliveryAudit.data).slice(0, 1200)}`);
  }
  const cohortProcurementFeedbackMissingNote = await request("/api/admin/cohort-procurement-deliveries/feedback", {
    method: "POST",
    body: {
      deliveryId: cohortProcurementDelivery.data.delivery.id,
      feedbackStatus: "procurement_ready",
      feedbackNote: "",
      nextCustomerSuccessAction: "Prepare education procurement review only.",
    },
  });
  if (
    cohortProcurementFeedbackMissingNote.status !== 400 ||
    !cohortProcurementFeedbackMissingNote.data.error?.includes("Feedback note is required")
  ) {
    throw new Error(`cohort procurement feedback missing note was not blocked: ${cohortProcurementFeedbackMissingNote.status} ${JSON.stringify(cohortProcurementFeedbackMissingNote.data).slice(0, 1000)}`);
  }
  const cohortProcurementFeedback = await request("/api/admin/cohort-procurement-deliveries/feedback", {
    method: "POST",
    body: {
      deliveryId: cohortProcurementDelivery.data.delivery.id,
      feedbackStatus: "needs_more_evidence",
      feedbackNote: "Institution requested more education adoption and compliance evidence without trading-performance, win-rate, return, signal, broker, or real-money readiness claims.",
      nextCustomerSuccessAction: "Collect additional learning adoption and compliance evidence for the education SaaS procurement review.",
      institutionOwnerEmail: "buyer@institution.local",
      targetReviewAt: "2026-06-20T09:00:00.000Z",
      decisionNote: "Buyer needs education adoption evidence for internal procurement review; not production readiness or real-money trading readiness.",
    },
  });
  if (
    cohortProcurementFeedback.status !== 200 ||
    cohortProcurementFeedback.data.productionReady !== false ||
    cohortProcurementFeedback.data.educationOnly !== true ||
    cohortProcurementFeedback.data.delivery?.id !== cohortProcurementDelivery.data.delivery.id ||
    cohortProcurementFeedback.data.delivery?.feedbackStatus !== "needs_more_evidence" ||
    cohortProcurementFeedback.data.delivery?.institutionOwnerEmail !== "buyer@institution.local" ||
    cohortProcurementFeedback.data.delivery?.targetReviewAt !== "2026-06-20T09:00:00.000Z" ||
    !cohortProcurementFeedback.data.delivery?.decisionNote?.includes("education adoption evidence") ||
    !cohortProcurementFeedback.data.delivery?.feedbackAt ||
    cohortProcurementFeedback.data.delivery?.productionReady !== false ||
    !cohortProcurementFeedback.data.constraints?.some((item) => item.includes("not trading performance"))
  ) {
    throw new Error(`cohort procurement feedback failed: ${cohortProcurementFeedback.status} ${JSON.stringify(cohortProcurementFeedback.data).slice(0, 1400)}`);
  }
  const cohortProcurementFeedbackAudit = await request("/api/admin/audit-logs?type=cohort_procurement_feedback_recorded&limit=20");
  if (
    cohortProcurementFeedbackAudit.status !== 200 ||
    !cohortProcurementFeedbackAudit.data.items?.some((item) => item.type === "cohort_procurement_feedback_recorded" && item.cohortId === cohort.data.cohort.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`cohort procurement feedback audit missing: ${cohortProcurementFeedbackAudit.status} ${JSON.stringify(cohortProcurementFeedbackAudit.data).slice(0, 1200)}`);
  }
  const cohortProcurementBuyerReview = await request(`/api/admin/cohort-procurement-buyer-review?deliveryId=${encodeURIComponent(cohortProcurementDelivery.data.delivery.id)}`);
  if (
    cohortProcurementBuyerReview.status !== 200 ||
    cohortProcurementBuyerReview.data.productionReady !== false ||
    cohortProcurementBuyerReview.data.educationOnly !== true ||
    cohortProcurementBuyerReview.data.package?.schemaVersion !== "cohort-procurement-buyer-review-package-v1" ||
    cohortProcurementBuyerReview.data.package?.deliveryId !== cohortProcurementDelivery.data.delivery.id ||
    cohortProcurementBuyerReview.data.package?.cohortId !== cohort.data.cohort.id ||
    cohortProcurementBuyerReview.data.package?.redactedLearnerSample?.some((item) => String(item.email || "").includes("student@")) ||
    !cohortProcurementBuyerReview.data.package?.checklist?.some((item) => item.category === "compliance_evidence" && item.educationOnly === true && item.productionReady === false) ||
    !cohortProcurementBuyerReview.data.package?.constraints?.some((item) => item.includes("Redacted learner samples"))
  ) {
    throw new Error(`cohort procurement buyer review package failed: ${cohortProcurementBuyerReview.status} ${JSON.stringify(cohortProcurementBuyerReview.data).slice(0, 1600)}`);
  }
  const cohortProcurementBuyerObjection = await request("/api/admin/cohort-procurement-buyer-review/objection", {
    method: "POST",
    body: {
      deliveryId: cohortProcurementDelivery.data.delivery.id,
      reviewStatus: "needs_more_evidence",
      objectionType: "evidence_gap",
      reviewerEmail: "buyer@institution.local",
      requestedEvidence: "Buyer requested additional education adoption, compliance, and curriculum source evidence before sign-off.",
      reviewNote: "Institution buyer needs clearer education SaaS evidence and redacted learner sample follow-through before procurement review can continue.",
      targetReviewAt: "2026-06-25",
    },
  });
  if (
    cohortProcurementBuyerObjection.status !== 201 ||
    cohortProcurementBuyerObjection.data.productionReady !== false ||
    cohortProcurementBuyerObjection.data.educationOnly !== true ||
    cohortProcurementBuyerObjection.data.review?.reviewStatus !== "needs_more_evidence" ||
    cohortProcurementBuyerObjection.data.review?.educationOnly !== true ||
    cohortProcurementBuyerObjection.data.review?.productionReady !== false ||
    cohortProcurementBuyerObjection.data.delivery?.feedbackStatus !== "needs_more_evidence" ||
    cohortProcurementBuyerObjection.data.delivery?.buyerReviewHistory?.length < 1 ||
    cohortProcurementBuyerObjection.data.package?.buyerReviewStatus !== "needs_more_evidence" ||
    !cohortProcurementBuyerObjection.data.package?.objectionHistory?.some((item) => item.objectionType === "evidence_gap") ||
    !cohortProcurementBuyerObjection.data.constraints?.some((item) => item.includes("not trading-performance evidence"))
  ) {
    throw new Error(`cohort procurement buyer objection failed: ${cohortProcurementBuyerObjection.status} ${JSON.stringify(cohortProcurementBuyerObjection.data).slice(0, 1600)}`);
  }
  const cohortProcurementBuyerReviewAudit = await request("/api/admin/audit-logs?type=cohort_procurement_buyer_review_recorded&limit=20");
  if (
    cohortProcurementBuyerReviewAudit.status !== 200 ||
    !cohortProcurementBuyerReviewAudit.data.items?.some((item) => (
      item.type === "cohort_procurement_buyer_review_recorded" &&
      item.deliveryId === cohortProcurementDelivery.data.delivery.id &&
      item.reviewStatus === "needs_more_evidence" &&
      item.educationOnly === true &&
      item.productionReady === false
    ))
  ) {
    throw new Error(`cohort procurement buyer review audit missing: ${cohortProcurementBuyerReviewAudit.status} ${JSON.stringify(cohortProcurementBuyerReviewAudit.data).slice(0, 1200)}`);
  }
  const cohortProcurementFeedbackAction = await request("/api/admin/cohort-procurement-deliveries/create-action", {
    method: "POST",
    body: {
      deliveryId: cohortProcurementDelivery.data.delivery.id,
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    cohortProcurementFeedbackAction.status !== 201 ||
    cohortProcurementFeedbackAction.data.productionReady !== false ||
    cohortProcurementFeedbackAction.data.educationOnly !== true ||
    cohortProcurementFeedbackAction.data.action?.sourceKey !== `cohort_procurement_feedback:${cohortProcurementDelivery.data.delivery.id}:needs_more_evidence` ||
    cohortProcurementFeedbackAction.data.action?.cohortId !== cohort.data.cohort.id ||
    cohortProcurementFeedbackAction.data.action?.deliveryId !== cohortProcurementDelivery.data.delivery.id ||
    cohortProcurementFeedbackAction.data.action?.ownerEmail !== "success@tradegym.local" ||
    cohortProcurementFeedbackAction.data.action?.buyerReviewId !== cohortProcurementBuyerObjection.data.review.id ||
    cohortProcurementFeedbackAction.data.action?.buyerReviewerEmail !== "buyer@institution.local" ||
    !cohortProcurementFeedbackAction.data.action?.evidence?.some((item) => item.includes("Requested evidence")) ||
    !cohortProcurementFeedbackAction.data.action?.next?.includes("Buyer requested additional education adoption") ||
    cohortProcurementFeedbackAction.data.action?.educationOnly !== true ||
    cohortProcurementFeedbackAction.data.action?.productionReady !== false ||
    cohortProcurementFeedbackAction.data.delivery?.nextActionId !== cohortProcurementFeedbackAction.data.action?.id ||
    !cohortProcurementFeedbackAction.data.actionQueue?.actions?.some((item) => item.id === cohortProcurementFeedbackAction.data.action.id) ||
    !cohortProcurementFeedbackAction.data.constraints?.some((item) => item.includes("institution feedback into education customer-success follow-up"))
  ) {
    throw new Error(`cohort procurement feedback action create failed: ${cohortProcurementFeedbackAction.status} ${JSON.stringify(cohortProcurementFeedbackAction.data).slice(0, 1400)}`);
  }
  const cohortProcurementFeedbackActionReused = await request("/api/admin/cohort-procurement-deliveries/create-action", {
    method: "POST",
    body: {
      deliveryId: cohortProcurementDelivery.data.delivery.id,
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    cohortProcurementFeedbackActionReused.status !== 200 ||
    cohortProcurementFeedbackActionReused.data.reused !== true ||
    cohortProcurementFeedbackActionReused.data.action?.id !== cohortProcurementFeedbackAction.data.action.id ||
    cohortProcurementFeedbackActionReused.data.productionReady !== false ||
    cohortProcurementFeedbackActionReused.data.educationOnly !== true
  ) {
    throw new Error(`cohort procurement feedback action reuse failed: ${cohortProcurementFeedbackActionReused.status} ${JSON.stringify(cohortProcurementFeedbackActionReused.data).slice(0, 1200)}`);
  }
  const cohortProcurementFeedbackActionAudit = await request("/api/admin/audit-logs?type=cohort_procurement_feedback_action_created&limit=20");
  if (
    cohortProcurementFeedbackActionAudit.status !== 200 ||
    !cohortProcurementFeedbackActionAudit.data.items?.some((item) => item.type === "cohort_procurement_feedback_action_created" && item.cohortId === cohort.data.cohort.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`cohort procurement feedback action audit missing: ${cohortProcurementFeedbackActionAudit.status} ${JSON.stringify(cohortProcurementFeedbackActionAudit.data).slice(0, 1200)}`);
  }
  const cohortProcurementActionDone = await request("/api/admin/pilot-success-actions/update", {
    method: "POST",
    body: {
      actionId: cohortProcurementFeedbackAction.data.action.id,
      status: "done",
      ownerEmail: "success@tradegym.local",
      resolutionNote: "Verifier completed this cohort procurement feedback action as education customer-success follow-up only.",
    },
  });
  if (
    cohortProcurementActionDone.status !== 200 ||
    cohortProcurementActionDone.data.productionReady !== false ||
    cohortProcurementActionDone.data.educationOnly !== true ||
    cohortProcurementActionDone.data.action?.status !== "done" ||
    !cohortProcurementActionDone.data.action?.completedAt ||
    cohortProcurementActionDone.data.linkedCohortProcurementDelivery?.id !== cohortProcurementDelivery.data.delivery.id ||
    cohortProcurementActionDone.data.linkedCohortProcurementDelivery?.nextActionStatus !== "done" ||
    cohortProcurementActionDone.data.linkedCohortProcurementDelivery?.productionReady !== false
  ) {
    throw new Error(`cohort procurement action completion link failed: ${cohortProcurementActionDone.status} ${JSON.stringify(cohortProcurementActionDone.data).slice(0, 1400)}`);
  }
  const cohortRenewalReview = await request(`/api/admin/cohort-renewal-review?cohortId=${encodeURIComponent(cohort.data.cohort.id)}`);
  if (
    cohortRenewalReview.status !== 200 ||
    cohortRenewalReview.data.productionReady !== false ||
    cohortRenewalReview.data.educationOnly !== true ||
    cohortRenewalReview.data.packet?.schemaVersion !== "cohort-renewal-review-v1" ||
    cohortRenewalReview.data.packet?.productionReady !== false ||
    cohortRenewalReview.data.packet?.educationOnly !== true ||
    cohortRenewalReview.data.packet?.cohort?.id !== cohort.data.cohort.id ||
    !["renewal_review_needs_evidence", "education_renewal_review_ready", "education_renewal_watch"].includes(cohortRenewalReview.data.packet?.renewalStatus) ||
    cohortRenewalReview.data.packet?.summary?.procurementDeliveries < 1 ||
    cohortRenewalReview.data.packet?.summary?.procurementActionsDone < 1 ||
    cohortRenewalReview.data.packet?.summary?.buyerEvidenceRequests < 1 ||
    cohortRenewalReview.data.packet?.sections?.successBrief?.schemaVersion !== "cohort-success-brief-v1" ||
    cohortRenewalReview.data.packet?.sections?.compliancePack?.schemaVersion !== "cohort-compliance-pack-v1" ||
    cohortRenewalReview.data.packet?.sections?.procurementPacket?.schemaVersion !== "cohort-procurement-packet-v1" ||
    cohortRenewalReview.data.packet?.sections?.procurementProgress?.schemaVersion !== "cohort-procurement-progress-v1" ||
    cohortRenewalReview.data.packet?.sections?.buyerHistory?.[0]?.reviewerEmail?.includes("buyer@") ||
    !cohortRenewalReview.data.packet?.sections?.buyerHistory?.some((item) => item.requestedEvidence?.includes("Buyer requested additional education adoption")) ||
    !cohortRenewalReview.data.packet?.renewalBlockers?.some((item) => item.category === "institution_feedback" || item.category === "provider_readiness") ||
    !cohortRenewalReview.data.packet?.constraints?.some((item) => item.includes("not investment advice")) ||
    !cohortRenewalReview.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`cohort renewal review failed: ${cohortRenewalReview.status} ${JSON.stringify(cohortRenewalReview.data).slice(0, 1800)}`);
  }
  const cohortRenewalReviewJsonExport = await request(`/api/admin/cohort-renewal-review/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=json`);
  if (
    cohortRenewalReviewJsonExport.status !== 200 ||
    cohortRenewalReviewJsonExport.data.productionReady !== false ||
    cohortRenewalReviewJsonExport.data.educationOnly !== true ||
    cohortRenewalReviewJsonExport.data.packet?.schemaVersion !== "cohort-renewal-review-v1" ||
    cohortRenewalReviewJsonExport.data.packet?.summary?.buyerEvidenceRequests < 1 ||
    !cohortRenewalReviewJsonExport.data.note?.includes("education SaaS customer-success")
  ) {
    throw new Error(`cohort renewal review JSON export failed: ${cohortRenewalReviewJsonExport.status} ${JSON.stringify(cohortRenewalReviewJsonExport.data).slice(0, 1400)}`);
  }
  const cohortRenewalReviewCsvExport = await request(`/api/admin/cohort-renewal-review/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=csv`);
  if (
    cohortRenewalReviewCsvExport.status !== 200 ||
    typeof cohortRenewalReviewCsvExport.data !== "string" ||
    !cohortRenewalReviewCsvExport.data.startsWith("section,metric,value,next") ||
    !cohortRenewalReviewCsvExport.data.includes("buyer_evidence_request") ||
    !cohortRenewalReviewCsvExport.data.includes("renewal_blocker") ||
    !cohortRenewalReviewCsvExport.data.includes("productionReady")
  ) {
    throw new Error(`cohort renewal review CSV export failed: ${cohortRenewalReviewCsvExport.status} ${String(cohortRenewalReviewCsvExport.data).slice(0, 1200)}`);
  }
  const cohortRenewalReviewMdExport = await request(`/api/admin/cohort-renewal-review/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=md`);
  if (
    cohortRenewalReviewMdExport.status !== 200 ||
    typeof cohortRenewalReviewMdExport.data !== "string" ||
    !cohortRenewalReviewMdExport.data.includes("# TradeGym Cohort Renewal Review") ||
    !cohortRenewalReviewMdExport.data.includes("## Buyer Evidence Requests") ||
    !cohortRenewalReviewMdExport.data.includes("Buyer requested additional education adoption") ||
    !cohortRenewalReviewMdExport.data.includes("Production ready: false") ||
    !cohortRenewalReviewMdExport.data.includes("not investment advice")
  ) {
    throw new Error(`cohort renewal review MD export failed: ${cohortRenewalReviewMdExport.status} ${String(cohortRenewalReviewMdExport.data).slice(0, 1400)}`);
  }
  const cohortRenewalReviewAudit = await request("/api/admin/audit-logs?type=cohort_renewal_review_exported&limit=20");
  if (
    cohortRenewalReviewAudit.status !== 200 ||
    !cohortRenewalReviewAudit.data.items?.some((item) => (
      item.type === "cohort_renewal_review_exported" &&
      item.cohortId === cohort.data.cohort.id &&
      item.buyerEvidenceRequests >= 1 &&
      item.educationOnly === true &&
      item.productionReady === false
    ))
  ) {
    throw new Error(`cohort renewal review audit missing: ${cohortRenewalReviewAudit.status} ${JSON.stringify(cohortRenewalReviewAudit.data).slice(0, 1200)}`);
  }
  const cohortRenewalActions = await request("/api/admin/cohort-renewal-review/create-actions", {
    method: "POST",
    body: {
      cohortId: cohort.data.cohort.id,
      ownerEmail: "success@tradegym.local",
      maxCreate: 4,
    },
  });
  if (
    cohortRenewalActions.status !== 201 ||
    cohortRenewalActions.data.productionReady !== false ||
    cohortRenewalActions.data.educationOnly !== true ||
    cohortRenewalActions.data.created < 1 ||
    cohortRenewalActions.data.actions?.some((item) => (
      item.educationOnly !== true ||
      item.productionReady !== false ||
      item.ownerEmail !== "success@tradegym.local" ||
      !String(item.sourceKey || "").startsWith(`cohort_renewal_review:${cohort.data.cohort.id}:`) ||
      !String(item.title || "").includes("renewal review follow-up")
    )) ||
    !cohortRenewalActions.data.actionQueue?.actions?.some((item) => (
      String(item.sourceKey || "").startsWith(`cohort_renewal_review:${cohort.data.cohort.id}:`) &&
      item.ownerEmail === "success@tradegym.local"
    )) ||
    !cohortRenewalActions.data.constraints?.some((item) => item.includes("education renewal blockers"))
  ) {
    throw new Error(`cohort renewal review action creation failed: ${cohortRenewalActions.status} ${JSON.stringify(cohortRenewalActions.data).slice(0, 1600)}`);
  }
  const cohortRenewalActionsReused = await request("/api/admin/cohort-renewal-review/create-actions", {
    method: "POST",
    body: {
      cohortId: cohort.data.cohort.id,
      ownerEmail: "success@tradegym.local",
      maxCreate: 4,
    },
  });
  if (
    cohortRenewalActionsReused.status !== 200 ||
    cohortRenewalActionsReused.data.reused < 1 ||
    cohortRenewalActionsReused.data.created !== 0 ||
    cohortRenewalActionsReused.data.productionReady !== false ||
    cohortRenewalActionsReused.data.educationOnly !== true
  ) {
    throw new Error(`cohort renewal review action reuse failed: ${cohortRenewalActionsReused.status} ${JSON.stringify(cohortRenewalActionsReused.data).slice(0, 1200)}`);
  }
  const cohortRenewalActionsAudit = await request("/api/admin/audit-logs?type=cohort_renewal_review_actions_created&limit=20");
  if (
    cohortRenewalActionsAudit.status !== 200 ||
    !cohortRenewalActionsAudit.data.items?.some((item) => (
      item.type === "cohort_renewal_review_actions_created" &&
      item.cohortId === cohort.data.cohort.id &&
      item.created >= 1 &&
      item.educationOnly === true &&
      item.productionReady === false
    ))
  ) {
    throw new Error(`cohort renewal review action audit missing: ${cohortRenewalActionsAudit.status} ${JSON.stringify(cohortRenewalActionsAudit.data).slice(0, 1200)}`);
  }
  const cohortProcurementDeliveryAfterAction = await request(`/api/admin/cohort-procurement-deliveries?q=${encodeURIComponent(cohort.data.cohort.name)}`);
  if (
    cohortProcurementDeliveryAfterAction.status !== 200 ||
    !cohortProcurementDeliveryAfterAction.data.deliveries?.some((item) => (
      item.id === cohortProcurementDelivery.data.delivery.id &&
      item.nextActionId === cohortProcurementFeedbackAction.data.action.id &&
      item.nextActionStatus === "done" &&
      item.educationOnly === true &&
      item.productionReady === false
    ))
  ) {
    throw new Error(`cohort procurement delivery action status missing: ${cohortProcurementDeliveryAfterAction.status} ${JSON.stringify(cohortProcurementDeliveryAfterAction.data).slice(0, 1200)}`);
  }
  const cohortProcurementProgress = await request(`/api/admin/cohort-procurement-progress?cohortId=${encodeURIComponent(cohort.data.cohort.id)}`);
  if (
    cohortProcurementProgress.status !== 200 ||
    cohortProcurementProgress.data.productionReady !== false ||
    cohortProcurementProgress.data.educationOnly !== true ||
    cohortProcurementProgress.data.report?.schemaVersion !== "cohort-procurement-progress-v1" ||
    cohortProcurementProgress.data.report?.productionReady !== false ||
    cohortProcurementProgress.data.report?.educationOnly !== true ||
    cohortProcurementProgress.data.report?.summary?.feedbackActionsDone < 1 ||
    cohortProcurementProgress.data.report?.summary?.institutionCsActionRollup?.productionReady !== false ||
    cohortProcurementProgress.data.report?.summary?.institutionCsActionRollup?.educationOnly !== true ||
    cohortProcurementProgress.data.report?.summary?.institutionCsActionRollup?.done < 1 ||
    !cohortProcurementProgress.data.report?.summary?.institutionCsActionRollup?.byOwner?.some((item) => item.ownerEmail === "success@tradegym.local" && item.done >= 1) ||
    !cohortProcurementProgress.data.report?.summary?.institutionCsActionRollup?.byPriority?.some((item) => item.priority === "high" && item.done >= 1) ||
    !cohortProcurementProgress.data.report?.summary?.institutionCsActionRollup?.byBlockerCategory?.some((item) => item.category === "provider_readiness" && item.done >= 1 && item.productionReady === false) ||
    !cohortProcurementProgress.data.report?.deliveries?.some((item) => (
      item.id === cohortProcurementDelivery.data.delivery.id &&
      item.cohortId === cohort.data.cohort.id &&
      item.feedbackStatus === "needs_more_evidence" &&
      item.institutionOwnerEmail === "buyer@institution.local" &&
      item.targetReviewAt === "2026-06-25" &&
      item.decisionNote?.includes("education adoption evidence") &&
      item.blockerCategories?.some((category) => category.category === "provider_readiness" && category.status === "prototype_only") &&
      item.dominantBlockerCategory &&
      item.nextActionId === cohortProcurementFeedbackAction.data.action.id &&
      item.nextActionStatus === "done" &&
      item.productionReady === false &&
      item.educationOnly === true
    )) ||
    !cohortProcurementProgress.data.constraints?.some((item) => item.includes("not trading performance"))
  ) {
    throw new Error(`cohort procurement progress failed: ${cohortProcurementProgress.status} ${JSON.stringify(cohortProcurementProgress.data).slice(0, 1400)}`);
  }
  const globalCohortProcurementProgress = await request("/api/admin/cohort-procurement-progress");
  if (
    globalCohortProcurementProgress.status !== 200 ||
    globalCohortProcurementProgress.data.productionReady !== false ||
    globalCohortProcurementProgress.data.educationOnly !== true ||
    !globalCohortProcurementProgress.data.report?.deliveries?.some((item) => (
      item.id === cohortProcurementDelivery.data.delivery.id &&
      item.cohortId === cohort.data.cohort.id &&
      item.institutionOwnerEmail === "buyer@institution.local" &&
      item.blockerCategories?.some((category) => category.category === "provider_readiness") &&
      item.nextActionStatus === "done" &&
      item.educationOnly === true &&
      item.productionReady === false
    )) ||
    !globalCohortProcurementProgress.data.report?.summary?.institutionCsActionRollup?.byCohort?.some((item) => item.cohortId === cohort.data.cohort.id && item.done >= 1 && item.blockers?.includes("provider_readiness")) ||
    !globalCohortProcurementProgress.data.note?.includes("education SaaS customer-success")
  ) {
    throw new Error(`global cohort procurement progress failed: ${globalCohortProcurementProgress.status} ${JSON.stringify(globalCohortProcurementProgress.data).slice(0, 1400)}`);
  }
  const cohortProcurementProgressJsonExport = await request(`/api/admin/cohort-procurement-progress/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=json`);
  if (
    cohortProcurementProgressJsonExport.status !== 200 ||
    cohortProcurementProgressJsonExport.data.productionReady !== false ||
    cohortProcurementProgressJsonExport.data.educationOnly !== true ||
    cohortProcurementProgressJsonExport.data.report?.schemaVersion !== "cohort-procurement-progress-v1" ||
    cohortProcurementProgressJsonExport.data.report?.summary?.feedbackActionsDone < 1 ||
    !cohortProcurementProgressJsonExport.data.report?.summary?.institutionCsActionRollup?.byOwner?.some((item) => item.ownerEmail === "success@tradegym.local") ||
    !cohortProcurementProgressJsonExport.data.report?.summary?.blockerCategoryCounts?.some((item) => item.key === "provider_readiness") ||
    !cohortProcurementProgressJsonExport.data.report?.deliveries?.some((item) => item.id === cohortProcurementDelivery.data.delivery.id && item.nextActionStatus === "done" && item.dominantBlockerCategory)
  ) {
    throw new Error(`cohort procurement progress JSON export failed: ${cohortProcurementProgressJsonExport.status} ${JSON.stringify(cohortProcurementProgressJsonExport.data).slice(0, 1200)}`);
  }
  const cohortProcurementProgressCsvExport = await request(`/api/admin/cohort-procurement-progress/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=csv`);
  if (
    cohortProcurementProgressCsvExport.status !== 200 ||
    typeof cohortProcurementProgressCsvExport.data !== "string" ||
    !cohortProcurementProgressCsvExport.data.startsWith("cohortName,recipientEmail,readiness,status,dominantBlockerCategory,dominantBlockerLabel,blockerCategories,feedbackStatus,nextActionStatus") ||
    !cohortProcurementProgressCsvExport.data.includes("dominantBlockerCategory") ||
    !cohortProcurementProgressCsvExport.data.includes("provider_readiness") ||
    !cohortProcurementProgressCsvExport.data.includes("institutionOwnerEmail") ||
    !cohortProcurementProgressCsvExport.data.includes("buyer@institution.local") ||
    !cohortProcurementProgressCsvExport.data.includes("2026-06-25") ||
    !cohortProcurementProgressCsvExport.data.includes("needs_more_evidence") ||
    !cohortProcurementProgressCsvExport.data.includes("done") ||
    !cohortProcurementProgressCsvExport.data.includes("false")
  ) {
    throw new Error(`cohort procurement progress CSV export failed: ${cohortProcurementProgressCsvExport.status} ${String(cohortProcurementProgressCsvExport.data).slice(0, 1000)}`);
  }
  const cohortProcurementProgressMdExport = await request(`/api/admin/cohort-procurement-progress/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=md`);
  if (
    cohortProcurementProgressMdExport.status !== 200 ||
    typeof cohortProcurementProgressMdExport.data !== "string" ||
    !cohortProcurementProgressMdExport.data.includes("# TradeGym Cohort Procurement Progress") ||
    !cohortProcurementProgressMdExport.data.includes("## Blocker Categories") ||
    !cohortProcurementProgressMdExport.data.includes("## Institution CS Action Rollup") ||
    !cohortProcurementProgressMdExport.data.includes("success@tradegym.local") ||
    !cohortProcurementProgressMdExport.data.includes("Provider readiness") ||
    !cohortProcurementProgressMdExport.data.includes("Production ready: false") ||
    !cohortProcurementProgressMdExport.data.includes("buyer@institution.local") ||
    !cohortProcurementProgressMdExport.data.includes("2026-06-25") ||
    !cohortProcurementProgressMdExport.data.includes("not trading performance")
  ) {
    throw new Error(`cohort procurement progress MD export failed: ${cohortProcurementProgressMdExport.status} ${String(cohortProcurementProgressMdExport.data).slice(0, 1000)}`);
  }
  const cohortProcurementProgressMeetingBriefExport = await request(`/api/admin/cohort-procurement-progress/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=meeting_brief`);
  if (
    cohortProcurementProgressMeetingBriefExport.status !== 200 ||
    typeof cohortProcurementProgressMeetingBriefExport.data !== "string" ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("# TradeGym Procurement Meeting Brief") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("## Decision") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("## Key Asks") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("## Top Blockers") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("## Owner / Date") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("## CS Action Rollup") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("buyer@institution.local") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("success@tradegym.local") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("Production ready: false") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("not investment advice") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("not trading-performance evidence") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("not broker readiness") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("not auto-trading approval") ||
    !cohortProcurementProgressMeetingBriefExport.data.includes("not real-money trading readiness")
  ) {
    throw new Error(`cohort procurement progress meeting brief export failed: ${cohortProcurementProgressMeetingBriefExport.status} ${String(cohortProcurementProgressMeetingBriefExport.data).slice(0, 1200)}`);
  }
  const cohortProcurementMeetingActions = await request("/api/admin/cohort-procurement-progress/create-meeting-actions", {
    method: "POST",
    body: {
      cohortId: cohort.data.cohort.id,
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    ![200, 201].includes(cohortProcurementMeetingActions.status) ||
    cohortProcurementMeetingActions.data.productionReady !== false ||
    cohortProcurementMeetingActions.data.educationOnly !== true ||
    cohortProcurementMeetingActions.data.created < 1 ||
    !cohortProcurementMeetingActions.data.actions?.some((item) => (
      item.title?.includes("procurement meeting follow-up") &&
      item.ownerEmail === "success@tradegym.local" &&
      item.educationOnly === true &&
      item.productionReady === false &&
      item.constraints?.some((constraint) => constraint.includes("not investment advice"))
    )) ||
    !cohortProcurementMeetingActions.data.note?.includes("education SaaS customer-success")
  ) {
    throw new Error(`cohort procurement meeting actions failed: ${cohortProcurementMeetingActions.status} ${JSON.stringify(cohortProcurementMeetingActions.data).slice(0, 1400)}`);
  }
  const cohortProcurementMeetingActionsReused = await request("/api/admin/cohort-procurement-progress/create-meeting-actions", {
    method: "POST",
    body: {
      cohortId: cohort.data.cohort.id,
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    cohortProcurementMeetingActionsReused.status !== 200 ||
    cohortProcurementMeetingActionsReused.data.reused < 1 ||
    cohortProcurementMeetingActionsReused.data.created !== 0 ||
    cohortProcurementMeetingActionsReused.data.productionReady !== false
  ) {
    throw new Error(`cohort procurement meeting actions reuse failed: ${cohortProcurementMeetingActionsReused.status} ${JSON.stringify(cohortProcurementMeetingActionsReused.data).slice(0, 1000)}`);
  }
  const cohortProcurementProgressAudit = await request("/api/admin/audit-logs?type=cohort_procurement_progress_exported&limit=20");
  if (
    cohortProcurementProgressAudit.status !== 200 ||
    !cohortProcurementProgressAudit.data.items?.some((item) => (
      item.type === "cohort_procurement_progress_exported" &&
      item.cohortId === cohort.data.cohort.id &&
      item.cohortIds?.includes(cohort.data.cohort.id) &&
      item.educationOnly === true &&
      item.productionReady === false
    ))
  ) {
    throw new Error(`cohort procurement progress audit missing: ${cohortProcurementProgressAudit.status} ${JSON.stringify(cohortProcurementProgressAudit.data).slice(0, 1200)}`);
  }

  const learningRecordsJsonExport = await request(`/api/admin/learning-records/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=json&limit=100`);
  if (
    learningRecordsJsonExport.status !== 200 ||
    learningRecordsJsonExport.data.report?.schemaVersion !== "tradegym-learning-records-export-v1" ||
    learningRecordsJsonExport.data.report?.xapiLike !== true ||
    learningRecordsJsonExport.data.report?.educationOnly !== true ||
    learningRecordsJsonExport.data.report?.productionReady !== false ||
    learningRecordsJsonExport.data.report?.cohort?.id !== cohort.data.cohort.id ||
    !Array.isArray(learningRecordsJsonExport.data.report?.statements) ||
    !learningRecordsJsonExport.data.report?.constraints?.some((item) => item.includes("not a production LRS")) ||
    !learningRecordsJsonExport.data.note?.includes("xAPI-like local evidence")
  ) {
    throw new Error(`learning records JSON export failed: ${learningRecordsJsonExport.status} ${JSON.stringify(learningRecordsJsonExport.data).slice(0, 1200)}`);
  }
  const learningRecordsCsvExport = await request(`/api/admin/learning-records/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=csv&limit=100`);
  if (
    learningRecordsCsvExport.status !== 200 ||
    typeof learningRecordsCsvExport.data !== "string" ||
    !learningRecordsCsvExport.data.startsWith("statementId,timestamp,learnerEmail") ||
    !learningRecordsCsvExport.data.includes("admin@tradegym.local")
  ) {
    throw new Error(`learning records CSV export failed: ${learningRecordsCsvExport.status} ${String(learningRecordsCsvExport.data).slice(0, 1000)}`);
  }
  const learningRecordsMdExport = await request(`/api/admin/learning-records/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=md&limit=100`);
  if (
    learningRecordsMdExport.status !== 200 ||
    typeof learningRecordsMdExport.data !== "string" ||
    !learningRecordsMdExport.data.includes("# TradeGym Learning Records Export") ||
    !learningRecordsMdExport.data.includes("not a production LRS") ||
    !learningRecordsMdExport.data.includes("No stock recommendation")
  ) {
    throw new Error(`learning records markdown export failed: ${learningRecordsMdExport.status} ${String(learningRecordsMdExport.data).slice(0, 1200)}`);
  }
  const learningRecordsAudit = await request("/api/admin/audit-logs?type=learning_records_exported&limit=20");
  if (
    learningRecordsAudit.status !== 200 ||
    !learningRecordsAudit.data.items?.some((item) => item.type === "learning_records_exported" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error("learning records export audit log missing");
  }

  const attempt = await request("/api/attempts", {
    method: "POST",
    body: {
      scenarioId: scenario.id,
      selectedIndex: scenario.answer,
      plan: "等待回踩确认，跌回关键位下方就放弃，不重仓追高。",
    },
  });
  if (attempt.status !== 201 || !attempt.data.feedback || !attempt.data.profile) {
    throw new Error("attempt API failed");
  }
  if (!attempt.data.practiceAssignments?.some((item) => item.id === assignment.data.assignment.id && item.status === "completed" && item.completedAttemptId === attempt.data.attempt.id)) {
    throw new Error("practice assignment was not completed by training attempt");
  }
  if (!attempt.data.practiceAssignments?.some((item) => item.id === cohortAssignment.data.assignments[0].id && item.status === "completed" && item.cohortId === cohort.data.cohort.id)) {
    throw new Error("cohort assignment was not completed by training attempt");
  }
  if (!attempt.data.coursePackageAssignments?.some((item) => item.id === packageAssignment.data.coursePackageAssignments[0].id && item.status === "assigned")) {
    throw new Error("course package assignment completed before required safety drills");
  }
  if (attempt.data.completionReports?.some((item) => item.coursePackageId === coursePackage.data.coursePackage.id && item.status === "issued")) {
    throw new Error("completion report issued before required safety drills");
  }
  if (
    !attempt.data.courseProgressUpdates?.some((item) => (
      item.coursePackageId === coursePackage.data.coursePackage.id &&
      item.itemType === "scenario" &&
      item.itemId === scenario.id &&
      item.attemptId === attempt.data.attempt.id &&
      item.progress?.percent < 100 &&
      item.educationOnly === true
    ))
  ) {
    throw new Error("attempt response did not expose course package scenario progress");
  }
  const learnerCoursePackagesAfterAttempt = await request("/api/course-packages");
  const completedPackage = learnerCoursePackagesAfterAttempt.data.packages?.find((item) => item.id === coursePackage.data.coursePackage.id);
  if (
    learnerCoursePackagesAfterAttempt.status !== 200 ||
    completedPackage?.progress?.percent >= 100 ||
    !completedPackage?.progress?.completedScenarioIds?.includes(scenario.id) ||
    completedPackage?.progress?.completedBacktestDrillIds?.includes("backtest_metric_misconception") ||
    completedPackage?.progress?.completedContextDrillIds?.includes("market_context_misconception") ||
    completedPackage?.progress?.completedSourceTransparencyDrillIds?.includes("source_transparency_misconception") ||
    completedPackage?.enrolled !== true ||
    completedPackage?.coursePackageAssignment?.status !== "assigned" ||
    completedPackage?.completionReport?.status === "issued" ||
    learnerCoursePackagesAfterAttempt.data.completionReports?.some((item) => item.coursePackageId === coursePackage.data.coursePackage.id)
  ) {
    throw new Error("course package should remain incomplete until required safety drills");
  }
  const learnerEnrollments = await request("/api/course-enrollments");
  if (
    learnerEnrollments.status !== 200 ||
    !learnerEnrollments.data.packages?.some((item) => item.id === coursePackage.data.coursePackage.id && item.progress.percent < 100) ||
    !learnerEnrollments.data.constraints?.some((item) => item.includes("Enrollment tracks education delivery"))
  ) {
    throw new Error("learner course enrollment summary failed");
  }
  const cohortsAfterAttempt = await request("/api/admin/cohorts");
  const completedCohort = cohortsAfterAttempt.data.cohorts?.find((item) => item.id === cohort.data.cohort.id);
  if (
    cohortsAfterAttempt.status !== 200 ||
    completedCohort?.assignmentSummary?.completionRate !== 100 ||
    completedCohort?.coursePackageSummary?.completionRate >= 100 ||
    completedCohort?.memberProgress?.[0]?.coursePackageCompletionRate >= 100 ||
    completedCohort?.memberProgress?.[0]?.completedAssignments < 1 ||
    !Array.isArray(completedCohort?.topMistakes) ||
    !Array.isArray(completedCohort?.needsCoachReview)
  ) {
    throw new Error("cohort progress dashboard did not update after training");
  }
  if (
    attempt.data.learningPath?.educationOnly !== true ||
    !attempt.data.learningPath?.nextActions?.length ||
    !attempt.data.learningPath?.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("attempt learning path missing education guardrails");
  }

  const learningPath = await request("/api/learning-path");
  if (
    learningPath.status !== 200 ||
    learningPath.data.learningPath?.educationOnly !== true ||
    !learningPath.data.learningPath?.recommendedScenario?.id ||
    !learningPath.data.learningPath?.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("learning path API failed");
  }

  await request("/api/auth/logout", { method: "POST", body: {} });
  const adminForMetricBlocker = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminForMetricBlocker.status !== 200 || adminForMetricBlocker.data.session?.role !== "admin") {
    throw new Error("admin relogin for metric blocker failed");
  }
  const blockedMetricProgressReport = await request(`/api/admin/learner-progress-report?userId=${encodeURIComponent(login.data.session.userId)}`);
  if (
    blockedMetricProgressReport.status !== 200 ||
    blockedMetricProgressReport.data.report?.activity?.metricDrillBlockers < 1 ||
    blockedMetricProgressReport.data.report?.activity?.courseEvidenceBlockers < 1 ||
    !blockedMetricProgressReport.data.report?.courseCompletionEvidence?.some((item) => (
      item.coursePackageId === coursePackage.data.coursePackage.id &&
      item.status === "incomplete" &&
      item.blockers?.some((blocker) => blocker.itemType === "source_transparency_misconception") &&
      item.requiredItems?.some((required) => required.itemType === "source_transparency_misconception" && required.completed === false) &&
      item.constraints?.some((constraint) => constraint.includes("not trading skill certification"))
    )) ||
    !blockedMetricProgressReport.data.report?.metricDrillBlockers?.some((item) => item.coursePackageId === coursePackage.data.coursePackage.id && item.drillId === "backtest_metric_misconception")
  ) {
    throw new Error(`admin learner progress report did not expose metric drill blocker: ${blockedMetricProgressReport.status} ${JSON.stringify(blockedMetricProgressReport.data).slice(0, 1600)}`);
  }
  const blockedMetricCoachReports = await request(`/api/admin/coach-reports?q=${encodeURIComponent(login.data.session.email)}&limit=20`);
  if (
    blockedMetricCoachReports.status !== 200 ||
    blockedMetricCoachReports.data.totals?.metricDrillBlocked < 1 ||
    !blockedMetricCoachReports.data.reports?.some((item) => item.learner?.id === login.data.session.userId && item.metricDrillBlockers?.some((blocker) => blocker.coursePackageId === coursePackage.data.coursePackage.id))
  ) {
    throw new Error("admin coach reports did not expose metric drill blocker");
  }
  const metricFollowup = await request("/api/admin/backtest-metric-followups", {
    method: "POST",
    body: {
      userId: login.data.session.userId,
      coursePackageId: coursePackage.data.coursePackage.id,
    },
  });
  if (
    metricFollowup.status !== 201 ||
    metricFollowup.data.task?.source !== "backtest_metric_followup" ||
    metricFollowup.data.task?.coursePackageId !== coursePackage.data.coursePackage.id ||
    metricFollowup.data.task?.educationOnly !== true ||
    !metricFollowup.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("backtest metric follow-up API failed");
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const learnerReloginForBacktest = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (learnerReloginForBacktest.status !== 200 || learnerReloginForBacktest.data.session?.role !== "admin") {
    throw new Error("admin relogin for backtest classroom failed");
  }

  const replay = await request("/api/replay-notes", {
    method: "POST",
    body: {
      scenarioId: scenario.id,
      step: 10,
      note: "先观望，只有重新站上前高并回踩不破才考虑小仓试错。",
    },
  });
  if (replay.status !== 201 || !replay.data.replayNote) {
    throw new Error(`replay API failed: ${replay.status} ${JSON.stringify(replay.data)}`);
  }

  const paperTrade = await request("/api/paper-trades", {
    method: "POST",
    body: {
      scenarioId: scenario.id,
      step: 10,
      side: "long",
      riskPercent: 1,
      thesis: "Practice a historical breakout plan after context confirmation, using demo data only.",
      invalidation: "The simulated plan is invalid if price loses the prior range and cannot reclaim it.",
      marketContext: "Demo news and sentiment are background context only; they are not a buy signal, sell signal, return forecast, or permission to trade.",
    },
  });
  if (
    paperTrade.status !== 201 ||
    paperTrade.data.paperTrade?.evaluation?.educationOnly !== true ||
    paperTrade.data.paperTrade?.evaluation?.demoData !== true ||
    paperTrade.data.paperTrade?.contextReview?.educationOnly !== true ||
    paperTrade.data.paperTrade?.contextReview?.mentionsContext !== true ||
    paperTrade.data.paperTrade?.contextReview?.separatesSignal !== true ||
    paperTrade.data.paperTrade?.replayDebrief?.schemaVersion !== "replay-debrief-card-v1" ||
    paperTrade.data.paperTrade?.replayDebrief?.educationOnly !== true ||
    paperTrade.data.paperTrade?.replayDebrief?.productionReady !== false ||
    paperTrade.data.paperTrade?.replayDebrief?.revealStep !== 10 ||
    paperTrade.data.paperTrade?.replayDebrief?.hiddenCandlesBeforeDecision < 1 ||
    !paperTrade.data.paperTrade?.replayDebrief?.nextPractice?.length ||
    !paperTrade.data.paperTrade?.replayDebrief?.reviewPrompts?.some((item) => item.includes("hindsight")) ||
    !paperTrade.data.paperTrade?.replayDebrief?.constraints?.some((item) => item.includes("classroom feedback")) ||
    !paperTrade.data.paperTrade?.evaluation?.constraints?.some((item) => item.includes("No stock recommendation")) ||
    paperTrade.data.backtestClassroom?.educationOnly !== true ||
    paperTrade.data.backtestClassroom?.metrics?.sampleSize < 1 ||
    typeof paperTrade.data.backtestClassroom?.metrics?.winRatePct !== "number" ||
    typeof paperTrade.data.backtestClassroom?.metrics?.maxDrawdownR !== "number" ||
    paperTrade.data.backtestClassroom?.reliabilityAudit?.educationOnly !== true ||
    paperTrade.data.backtestClassroom?.reliabilityAudit?.productionReady !== false ||
    paperTrade.data.backtestClassroom?.reliabilityAudit?.signalUseProhibited !== true ||
    !paperTrade.data.backtestClassroom?.reliabilityAudit?.constraints?.some((item) => item.includes("not a stock recommendation")) ||
    !paperTrade.data.backtestClassroom?.reliabilityAudit?.interpretation?.some((item) => item.includes("Win rate")) ||
    !paperTrade.data.backtestClassroom?.setupDiagnostics?.some((item) =>
      item.sampleSize >= 1 &&
      item.educationOnly === true &&
      item.warnings?.some((warning) => warning.includes("not to judge strategy quality"))
    ) ||
    paperTrade.data.backtestClassroom?.simulationAssumptions?.educationOnly !== true ||
    paperTrade.data.backtestClassroom?.simulationAssumptions?.frictionModel?.slippageIncluded !== false ||
    !paperTrade.data.backtestClassroom?.simulationAssumptions?.limitations?.some((item) => item.includes("No broker execution")) ||
    !paperTrade.data.backtestClassroom?.constraints?.some((item) => item.includes("Win rate")) ||
    !paperTrade.data.paperTrades?.some((item) => item.id === paperTrade.data.paperTrade.id)
  ) {
    const checks = {
      status: paperTrade.status,
      evaluationEducationOnly: paperTrade.data.paperTrade?.evaluation?.educationOnly === true,
      evaluationDemoData: paperTrade.data.paperTrade?.evaluation?.demoData === true,
      contextEducationOnly: paperTrade.data.paperTrade?.contextReview?.educationOnly === true,
      contextMentions: paperTrade.data.paperTrade?.contextReview?.mentionsContext === true,
      contextSeparates: paperTrade.data.paperTrade?.contextReview?.separatesSignal === true,
      replayDebriefSchema: paperTrade.data.paperTrade?.replayDebrief?.schemaVersion,
      replayDebriefEducationOnly: paperTrade.data.paperTrade?.replayDebrief?.educationOnly === true,
      replayDebriefProductionFalse: paperTrade.data.paperTrade?.replayDebrief?.productionReady === false,
      replayDebriefRevealStep: paperTrade.data.paperTrade?.replayDebrief?.revealStep,
      replayDebriefHiddenCandles: paperTrade.data.paperTrade?.replayDebrief?.hiddenCandlesBeforeDecision,
      replayDebriefNextPractice: paperTrade.data.paperTrade?.replayDebrief?.nextPractice?.length,
      evaluationConstraint: paperTrade.data.paperTrade?.evaluation?.constraints?.some((item) => item.includes("No stock recommendation")) === true,
      classroomEducationOnly: paperTrade.data.backtestClassroom?.educationOnly === true,
      sampleSize: paperTrade.data.backtestClassroom?.metrics?.sampleSize,
      winRateType: typeof paperTrade.data.backtestClassroom?.metrics?.winRatePct,
      drawdownType: typeof paperTrade.data.backtestClassroom?.metrics?.maxDrawdownR,
      reliabilityEducationOnly: paperTrade.data.backtestClassroom?.reliabilityAudit?.educationOnly === true,
      reliabilityProductionFalse: paperTrade.data.backtestClassroom?.reliabilityAudit?.productionReady === false,
      reliabilitySignalBlocked: paperTrade.data.backtestClassroom?.reliabilityAudit?.signalUseProhibited === true,
      setupDiagnostic: paperTrade.data.backtestClassroom?.setupDiagnostics?.some((item) =>
        item.sampleSize >= 1 &&
        item.educationOnly === true &&
        item.warnings?.some((warning) => warning.includes("not to judge strategy quality"))
      ) === true,
      assumptionEducationOnly: paperTrade.data.backtestClassroom?.simulationAssumptions?.educationOnly === true,
      assumptionSlippageExcluded: paperTrade.data.backtestClassroom?.simulationAssumptions?.frictionModel?.slippageIncluded === false,
      classroomConstraint: paperTrade.data.backtestClassroom?.constraints?.some((item) => item.includes("Win rate")) === true,
      paperTradeListed: paperTrade.data.paperTrades?.some((item) => item.id === paperTrade.data.paperTrade.id) === true,
    };
    throw new Error(`paper trade API failed: ${JSON.stringify(checks)}`);
  }

  const replayDebriefFollowup = await request("/api/admin/replay-debrief-followups", {
    method: "POST",
    body: {
      paperTradeId: paperTrade.data.paperTrade.id,
      assignedCoachEmail: "coach@tradegym.local",
    },
  });
  if (
    replayDebriefFollowup.status !== 201 ||
    replayDebriefFollowup.data.productionReady !== false ||
    replayDebriefFollowup.data.educationOnly !== true ||
    replayDebriefFollowup.data.task?.source !== "learning_evidence_followup" ||
    replayDebriefFollowup.data.task?.replayDebrief?.paperTradeId !== paperTrade.data.paperTrade.id ||
    replayDebriefFollowup.data.task?.replayDebrief?.processScore !== paperTrade.data.paperTrade.replayDebrief.processScore ||
    replayDebriefFollowup.data.task?.assignedCoachEmail !== "coach@tradegym.local" ||
    replayDebriefFollowup.data.task?.educationOnly !== true ||
    replayDebriefFollowup.data.task?.productionReady !== false ||
    !replayDebriefFollowup.data.task?.requestNote?.includes("Replay debrief") ||
    !replayDebriefFollowup.data.constraints?.some((item) => item.includes("historical/demo replay"))
  ) {
    throw new Error(`replay debrief follow-up failed: ${replayDebriefFollowup.status} ${JSON.stringify(replayDebriefFollowup.data).slice(0, 1400)}`);
  }
  const replayDebriefFollowupReused = await request("/api/admin/replay-debrief-followups", {
    method: "POST",
    body: { paperTradeId: paperTrade.data.paperTrade.id },
  });
  if (
    replayDebriefFollowupReused.status !== 200 ||
    replayDebriefFollowupReused.data.reused !== true ||
    replayDebriefFollowupReused.data.task?.id !== replayDebriefFollowup.data.task.id
  ) {
    throw new Error(`replay debrief follow-up reuse failed: ${replayDebriefFollowupReused.status} ${JSON.stringify(replayDebriefFollowupReused.data).slice(0, 1000)}`);
  }
  const replayDebriefFollowupTasks = await request(`/api/admin/coach-review-tasks?status=open&q=${encodeURIComponent("Replay debrief")}&limit=40`);
  if (
    replayDebriefFollowupTasks.status !== 200 ||
    !replayDebriefFollowupTasks.data.tasks?.some((item) => (
      item.id === replayDebriefFollowup.data.task.id &&
      item.source === "learning_evidence_followup" &&
      item.replayDebrief?.paperTradeId === paperTrade.data.paperTrade.id
    ))
  ) {
    throw new Error(`replay debrief follow-up task missing from coach queue: ${replayDebriefFollowupTasks.status} ${JSON.stringify(replayDebriefFollowupTasks.data).slice(0, 1200)}`);
  }
  const replayDebriefFollowupAudit = await request("/api/admin/audit-logs?type=replay_debrief_followup_created&limit=20");
  if (
    replayDebriefFollowupAudit.status !== 200 ||
    !replayDebriefFollowupAudit.data.items?.some((item) => (
      item.type === "replay_debrief_followup_created" &&
      item.taskId === replayDebriefFollowup.data.task.id &&
      item.paperTradeId === paperTrade.data.paperTrade.id &&
      item.educationOnly === true &&
      item.productionReady === false
    ))
  ) {
    throw new Error(`replay debrief follow-up audit missing: ${replayDebriefFollowupAudit.status} ${JSON.stringify(replayDebriefFollowupAudit.data).slice(0, 1200)}`);
  }
  const replayDebriefFollowupResponse = await request("/api/learning-evidence-followups/respond", {
    method: "POST",
    body: {
      taskId: replayDebriefFollowup.data.task.id,
      learnerResponse: "I will revise the replay debrief by stating what was visible before reveal, the invalidation condition, context boundary, and risk discipline improvement.",
    },
  });
  if (
    replayDebriefFollowupResponse.status !== 200 ||
    replayDebriefFollowupResponse.data.task?.id !== replayDebriefFollowup.data.task.id ||
    replayDebriefFollowupResponse.data.task?.nextEducationAction?.actionType !== "repeat_replay_debrief" ||
    !replayDebriefFollowupResponse.data.task?.nextEducationAction?.label?.includes("revised debrief") ||
    replayDebriefFollowupResponse.data.task?.replayDebrief?.paperTradeId !== paperTrade.data.paperTrade.id ||
    !replayDebriefFollowupResponse.data.report?.learningEvidencePacket?.evidenceNextActionCandidates?.some((item) => (
      item.taskId === replayDebriefFollowup.data.task.id &&
      item.actionType === "repeat_replay_debrief"
    ))
  ) {
    throw new Error(`replay debrief follow-up response failed: ${replayDebriefFollowupResponse.status} ${JSON.stringify(replayDebriefFollowupResponse.data).slice(0, 1400)}`);
  }
  const replayDebriefNextAction = await request("/api/admin/learning-evidence-next-actions/apply", {
    method: "POST",
    body: { taskId: replayDebriefFollowup.data.task.id },
  });
  if (
    replayDebriefNextAction.status !== 201 ||
    replayDebriefNextAction.data.assignment?.source !== "learning_evidence_next_action" ||
    replayDebriefNextAction.data.assignment?.nextEducationActionType !== "repeat_replay_debrief" ||
    replayDebriefNextAction.data.task?.nextEducationActionAppliedAt == null ||
    replayDebriefNextAction.data.task?.nextEducationActionAssignment?.id !== replayDebriefNextAction.data.assignment.id ||
    !replayDebriefNextAction.data.assignment?.instructions?.includes("revised debrief")
  ) {
    throw new Error(`replay debrief next action apply failed: ${replayDebriefNextAction.status} ${JSON.stringify(replayDebriefNextAction.data).slice(0, 1400)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const replayDebriefAssignmentEmail = replayDebriefNextAction.data.assignment.email;
  const replayDebriefAssignmentPassword =
    replayDebriefAssignmentEmail === learnerEmail ? "demo67890" :
    replayDebriefAssignmentEmail === "student@tradegym.local" ? "demo123" :
    replayDebriefAssignmentEmail === "admin@tradegym.local" ? "admin123" :
    null;
  if (!replayDebriefAssignmentPassword) {
    throw new Error(`cannot verify replay debrief assignment completion without known learner password: ${replayDebriefAssignmentEmail}`);
  }
  const replayDebriefLearnerLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: replayDebriefAssignmentEmail, password: replayDebriefAssignmentPassword },
  });
  if (replayDebriefLearnerLogin.status !== 200 || replayDebriefLearnerLogin.data.session?.email !== replayDebriefAssignmentEmail) {
    throw new Error("learner login for replay debrief next-action assignment failed");
  }
  const replayDebriefBootstrap = await request("/api/bootstrap");
  const replayDebriefScenario = replayDebriefBootstrap.data.scenarios?.find((item) => item.id === replayDebriefNextAction.data.assignment.scenarioId);
  if (!replayDebriefScenario) {
    throw new Error("replay debrief next-action assignment scenario missing from learner bootstrap");
  }
  const replayDebriefAssignmentAttempt = await request("/api/attempts", {
    method: "POST",
    body: {
      scenarioId: replayDebriefScenario.id,
      selectedIndex: replayDebriefScenario.answer,
      plan: "Education-only replay revision: state what was visible before reveal, invalidation, risk boundary, context boundary, and what I would improve before checking outcome.",
    },
  });
  if (
    replayDebriefAssignmentAttempt.status !== 201 ||
    !replayDebriefAssignmentAttempt.data.practiceAssignments?.some((item) => (
      item.id === replayDebriefNextAction.data.assignment.id &&
      item.status === "completed" &&
      item.completedAttemptId === replayDebriefAssignmentAttempt.data.attempt.id &&
      item.source === "learning_evidence_next_action" &&
      item.nextEducationActionType === "repeat_replay_debrief"
    ))
  ) {
    throw new Error(`replay debrief next-action assignment was not completed by learner attempt: ${replayDebriefAssignmentAttempt.status} ${JSON.stringify(replayDebriefAssignmentAttempt.data).slice(0, 1200)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const adminAfterReplayDebriefAssignment = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminAfterReplayDebriefAssignment.status !== 200 || adminAfterReplayDebriefAssignment.data.session?.role !== "admin") {
    throw new Error("admin relogin after replay debrief next-action attempt failed");
  }
  const replayDebriefAssignmentProgress = await request(`/api/admin/learner-progress-report?userId=${encodeURIComponent(replayDebriefNextAction.data.assignment.userId)}`);
  if (
    replayDebriefAssignmentProgress.status !== 200 ||
    replayDebriefAssignmentProgress.data.report?.learningEvidencePacket?.replayDebriefFollowupSummary?.replayDebriefFollowups < 1 ||
    replayDebriefAssignmentProgress.data.report?.learningEvidencePacket?.replayDebriefFollowupSummary?.assignedReplayDebriefFollowups < 1 ||
    replayDebriefAssignmentProgress.data.report?.learningEvidencePacket?.replayDebriefFollowupSummary?.completedReplayDebriefAssignments < 1 ||
    replayDebriefAssignmentProgress.data.report?.learningEvidencePacket?.replayDebriefFollowupSummary?.latestCompletedReplayDebriefAttemptId !== replayDebriefAssignmentAttempt.data.attempt.id ||
    !replayDebriefAssignmentProgress.data.report?.learningEvidencePacket?.recentEvidenceFollowups?.some((item) => (
      item.id === replayDebriefFollowup.data.task.id &&
      item.replayDebrief?.paperTradeId === paperTrade.data.paperTrade.id &&
      item.nextEducationActionAssignment?.id === replayDebriefNextAction.data.assignment.id &&
      item.nextEducationActionAssignment?.status === "completed" &&
      item.nextEducationActionAssignment?.completedAttemptId === replayDebriefAssignmentAttempt.data.attempt.id
    ))
  ) {
    throw new Error(`completed replay debrief assignment missing from learning evidence packet: ${replayDebriefAssignmentProgress.status} ${JSON.stringify(replayDebriefAssignmentProgress.data).slice(0, 1400)}`);
  }
  const replayDebriefCoachQueue = await request("/api/admin/coach-review-tasks?status=open&replayDebriefOnly=true&limit=40");
  if (
    replayDebriefCoachQueue.status !== 200 ||
    replayDebriefCoachQueue.data.evidenceLoop?.replayDebrief?.assigned < 1 ||
    replayDebriefCoachQueue.data.evidenceLoop?.replayDebrief?.readyForCoachCompletion < 1 ||
    replayDebriefCoachQueue.data.evidenceLoop?.replayDebrief?.assignmentsCompleted < 1 ||
    !replayDebriefCoachQueue.data.evidenceLoop?.nextOperations?.some((item) => item.includes("replay debrief assignment")) ||
    !replayDebriefCoachQueue.data.evidenceLoop?.coachBreakdown?.some((item) => item.replayDebriefReadyForCoachCompletion >= 1) ||
    !replayDebriefCoachQueue.data.tasks?.some((item) => (
      item.id === replayDebriefFollowup.data.task.id &&
      item.replayDebrief?.paperTradeId === paperTrade.data.paperTrade.id &&
      item.nextEducationActionAssignment?.status === "completed"
    ))
  ) {
    throw new Error(`replay debrief evidence loop queue failed: ${replayDebriefCoachQueue.status} ${JSON.stringify(replayDebriefCoachQueue.data).slice(0, 1400)}`);
  }
  const replayDebriefEvidenceLoopJson = await request(`/api/admin/learning-evidence-loop/export?format=json&q=${encodeURIComponent(replayDebriefNextAction.data.assignment.email)}`);
  if (
    replayDebriefEvidenceLoopJson.status !== 200 ||
    replayDebriefEvidenceLoopJson.data.summary?.replayDebrief?.assignmentsCompleted < 1 ||
    !replayDebriefEvidenceLoopJson.data.rows?.some((item) => (
      item.taskId === replayDebriefFollowup.data.task.id &&
      item.evidenceType === "replay_debrief" &&
      item.replayPaperTradeId === paperTrade.data.paperTrade.id &&
      item.assignmentStatus === "completed"
    ))
  ) {
    throw new Error(`replay debrief evidence loop JSON export failed: ${replayDebriefEvidenceLoopJson.status} ${JSON.stringify(replayDebriefEvidenceLoopJson.data).slice(0, 1400)}`);
  }
  const replayDebriefEvidenceLoopCsv = await request(`/api/admin/learning-evidence-loop/export?format=csv&q=${encodeURIComponent(replayDebriefNextAction.data.assignment.email)}`);
  if (
    replayDebriefEvidenceLoopCsv.status !== 200 ||
    typeof replayDebriefEvidenceLoopCsv.data !== "string" ||
    !replayDebriefEvidenceLoopCsv.data.includes("taskId,evidenceType,email") ||
    !replayDebriefEvidenceLoopCsv.data.includes("replay_debrief") ||
    !replayDebriefEvidenceLoopCsv.data.includes(paperTrade.data.paperTrade.id)
  ) {
    throw new Error(`replay debrief evidence loop CSV export failed: ${replayDebriefEvidenceLoopCsv.status} ${String(replayDebriefEvidenceLoopCsv.data).slice(0, 1200)}`);
  }

  const teachingEvolutionLab = await request(`/api/admin/teaching-evolution-lab?intent=${encodeURIComponent("突破后追涨")}`);
  if (
    teachingEvolutionLab.status !== 200 ||
    teachingEvolutionLab.data.lab?.schemaVersion !== "teaching-evolution-lab-v1" ||
    teachingEvolutionLab.data.lab?.educationOnly !== true ||
    teachingEvolutionLab.data.lab?.productionReady !== false ||
    teachingEvolutionLab.data.lab?.semanticGuardrail?.schemaVersion !== "semantic-intent-guardrail-v1" ||
    teachingEvolutionLab.data.lab?.semanticGuardrail?.signalUseProhibited !== true ||
    !teachingEvolutionLab.data.lab?.semanticGuardrail?.parsedForClassroom?.marketHypothesis ||
    !teachingEvolutionLab.data.lab?.semanticGuardrail?.parsedForClassroom?.counterEvidence?.length ||
    !teachingEvolutionLab.data.lab?.semanticGuardrail?.parsedForClassroom?.riskPlan?.length ||
    !teachingEvolutionLab.data.lab?.semanticGuardrail?.forbiddenInterpretations?.some((item) => item.includes("buy recommendation")) ||
    !teachingEvolutionLab.data.lab?.teachingSamples?.some((item) => item.strategyAsTeachingSample === true && item.productionReady === false) ||
    teachingEvolutionLab.data.lab?.backtestAntiHallucination?.schemaVersion !== "backtest-anti-hallucination-v1" ||
    !teachingEvolutionLab.data.lab?.backtestAntiHallucination?.explanationPrompts?.some((item) => item.includes("small-sample illusion")) ||
    !teachingEvolutionLab.data.lab?.backtestAntiHallucination?.forbiddenInterpretations?.some((item) => item.includes("strategy score")) ||
    !Array.isArray(teachingEvolutionLab.data.lab?.courseQualityQueue) ||
    !teachingEvolutionLab.data.lab?.constraints?.some((item) => item.includes("education content and curriculum quality"))
  ) {
    throw new Error(`teaching evolution lab API failed: ${teachingEvolutionLab.status} ${JSON.stringify(teachingEvolutionLab.data).slice(0, 1400)}`);
  }

  const backtestClassroom = await request("/api/backtest/classroom");
  if (
    backtestClassroom.status !== 200 ||
    backtestClassroom.data.classroom?.educationOnly !== true ||
    backtestClassroom.data.classroom?.demoData !== true ||
    backtestClassroom.data.classroom?.metrics?.sampleSize < 1 ||
    !backtestClassroom.data.classroom?.setupDiagnostics?.some((item) =>
      item.sampleSize >= 1 &&
      typeof item.winRatePct === "number" &&
      typeof item.expectancyR === "number" &&
      typeof item.maxDrawdownR === "number" &&
      item.educationOnly === true &&
      item.warnings?.some((warning) => warning.includes("not to judge strategy quality"))
    ) ||
    backtestClassroom.data.classroom?.misconceptionDrill?.educationOnly !== true ||
    backtestClassroom.data.classroom?.simulationAssumptions?.educationOnly !== true ||
    backtestClassroom.data.classroom?.simulationAssumptions?.frictionModel?.feesIncluded !== false ||
    !backtestClassroom.data.classroom?.simulationAssumptions?.learnerChecklist?.some((item) => item.includes("slippage")) ||
    backtestClassroom.data.classroom?.reliabilityAudit?.educationOnly !== true ||
    backtestClassroom.data.classroom?.reliabilityAudit?.productionReady !== false ||
    backtestClassroom.data.classroom?.reliabilityAudit?.signalUseProhibited !== true ||
    !backtestClassroom.data.classroom?.reliabilityAudit?.sourceInspiredBy?.some((item) => item.includes("backtesting.py")) ||
    !backtestClassroom.data.classroom?.reliabilityAudit?.constraints?.some((item) => item.includes("strategy score")) ||
    !backtestClassroom.data.classroom?.reliabilityAudit?.nextLearningActions?.length ||
    !backtestClassroom.data.classroom?.misconceptionDrill?.options?.length ||
    !backtestClassroom.data.classroom?.warnings?.some((item) => item.includes("overfitting")) ||
    !backtestClassroom.data.classroom?.constraints?.some((item) => item.includes("No stock recommendation")) ||
    !backtestClassroom.data.classroom?.constraints?.some((item) => item.includes("not strategy proof"))
  ) {
    throw new Error("backtest classroom API failed");
  }

  const backtestLiteracyBrief = await request("/api/backtest/literacy-brief");
  if (
    backtestLiteracyBrief.status !== 200 ||
    backtestLiteracyBrief.data.brief?.reportType !== "backtest_literacy_brief" ||
    backtestLiteracyBrief.data.brief?.educationOnly !== true ||
    backtestLiteracyBrief.data.brief?.productionReady !== false ||
    backtestLiteracyBrief.data.brief?.demoData !== true ||
    backtestLiteracyBrief.data.brief?.summary?.sampleSize < 1 ||
    !backtestLiteracyBrief.data.brief?.rows?.some((item) => item.item === "execution_friction" && item.productionReady === false) ||
    !backtestLiteracyBrief.data.brief?.rows?.some((item) => item.item === "news_sentiment_boundary") ||
    !backtestLiteracyBrief.data.brief?.learnerBrief?.some((item) => item.includes("not proof")) ||
    !backtestLiteracyBrief.data.brief?.coachPrompts?.some((item) => item.includes("sample size")) ||
    !backtestLiteracyBrief.data.brief?.methodReference?.some((item) => item.includes("backtesting.py")) ||
    !backtestLiteracyBrief.data.brief?.constraints?.some((item) => item.includes("not strategy proof"))
  ) {
    throw new Error(`backtest literacy brief API failed: ${backtestLiteracyBrief.status} ${JSON.stringify(backtestLiteracyBrief.data).slice(0, 1400)}`);
  }

  const backtestLiteracyJson = await request("/api/backtest/literacy-brief/export?format=json");
  if (
    backtestLiteracyJson.status !== 200 ||
    backtestLiteracyJson.data.brief?.reportType !== "backtest_literacy_brief" ||
    backtestLiteracyJson.data.brief?.productionReady !== false ||
    !backtestLiteracyJson.data.note?.includes("education-only metric literacy")
  ) {
    throw new Error(`backtest literacy JSON export failed: ${backtestLiteracyJson.status} ${JSON.stringify(backtestLiteracyJson.data).slice(0, 1000)}`);
  }

  const backtestLiteracyCsv = await request("/api/backtest/literacy-brief/export?format=csv");
  if (
    backtestLiteracyCsv.status !== 200 ||
    !String(backtestLiteracyCsv.data).includes("execution_friction") ||
    !String(backtestLiteracyCsv.data).includes("news_sentiment_boundary") ||
    !backtestLiteracyCsv.headers?.["content-disposition"]?.includes("tradegym-backtest-literacy-brief.csv")
  ) {
    throw new Error(`backtest literacy CSV export failed: ${backtestLiteracyCsv.status} ${String(backtestLiteracyCsv.data).slice(0, 600)}`);
  }

  const backtestLiteracyMd = await request("/api/backtest/literacy-brief/export?format=md");
  if (
    backtestLiteracyMd.status !== 200 ||
    !String(backtestLiteracyMd.data).startsWith("# TradeGym Backtest Literacy Brief") ||
    !String(backtestLiteracyMd.data).includes("not investment advice") ||
    !backtestLiteracyMd.headers?.["content-disposition"]?.includes("tradegym-backtest-literacy-brief.md")
  ) {
    throw new Error(`backtest literacy Markdown export failed: ${backtestLiteracyMd.status} ${String(backtestLiteracyMd.data).slice(0, 600)}`);
  }

  const contextClassroom = await request("/api/context/classroom");
  if (
    contextClassroom.status !== 200 ||
    contextClassroom.data.classroom?.educationOnly !== true ||
    contextClassroom.data.classroom?.demoData !== true ||
    contextClassroom.data.classroom?.coverage?.approvedScenarios < 1 ||
    typeof contextClassroom.data.classroom?.coverage?.contextAttempts !== "number" ||
    contextClassroom.data.classroom?.riskSummary?.educationOnly !== true ||
    contextClassroom.data.classroom?.riskSummary?.signalUseProhibited !== true ||
    !contextClassroom.data.classroom?.riskSummary?.riskItems?.some((item) => item.key === "headline_chasing") ||
    !contextClassroom.data.classroom?.riskSummary?.coachActions?.some((item) => item.includes("Do not convert news")) ||
    !contextClassroom.data.classroom?.riskSummary?.constraints?.some((item) => item.includes("not sentiment scoring")) ||
    contextClassroom.data.classroom?.drill?.educationOnly !== true ||
    !contextClassroom.data.classroom?.drill?.options?.length ||
    !contextClassroom.data.classroom?.constraints?.some((item) => item.includes("No stock recommendation")) ||
    !contextClassroom.data.classroom?.constraints?.some((item) => item.includes("market prediction"))
  ) {
    throw new Error(`market context classroom API failed: ${contextClassroom.status} ${JSON.stringify(contextClassroom.data).slice(0, 1200)}`);
  }
  const contextDrill = contextClassroom.data.classroom.drill;
  const wrongContextAnswer = contextDrill.answer === 0 ? 1 : 0;
  const contextMisconceptionAttempt = await request("/api/context/misconception-attempts", {
    method: "POST",
    body: { selectedIndex: wrongContextAnswer },
  });
  if (
    contextMisconceptionAttempt.status !== 201 ||
    contextMisconceptionAttempt.data.attempt?.type !== "context_misconception" ||
    contextMisconceptionAttempt.data.attempt?.correct !== false ||
    contextMisconceptionAttempt.data.feedback?.educationOnly !== true ||
    !contextMisconceptionAttempt.data.feedback?.constraints?.some((item) => item.includes("No stock recommendation")) ||
    !contextMisconceptionAttempt.data.profile?.["headline-chasing-risk"] ||
    contextMisconceptionAttempt.data.classroom?.drill?.educationOnly !== true ||
    !contextMisconceptionAttempt.data.classroom?.constraints?.some((item) => item.includes("News and sentiment")) ||
    !contextMisconceptionAttempt.data.courseProgressUpdates?.some((item) => (
      item.coursePackageId === coursePackage.data.coursePackage.id &&
      item.itemType === "context_misconception" &&
      item.itemId === "market_context_misconception" &&
      item.progress?.percent < 100 &&
      item.educationOnly === true
    )) ||
    contextMisconceptionAttempt.data.completionReports?.some((item) => item.coursePackageId === coursePackage.data.coursePackage.id && item.status === "issued")
  ) {
    throw new Error(`market context misconception drill API failed: ${contextMisconceptionAttempt.status} ${JSON.stringify(contextMisconceptionAttempt.data).slice(0, 1200)}`);
  }
  const evidenceIntegrity = await request("/api/learning/evidence-integrity");
  if (
    evidenceIntegrity.status !== 200 ||
    evidenceIntegrity.data.audit?.educationOnly !== true ||
    evidenceIntegrity.data.audit?.productionReady !== false ||
    evidenceIntegrity.data.audit?.signalUseProhibited !== true ||
    evidenceIntegrity.data.audit?.demoData !== true ||
    evidenceIntegrity.data.audit?.summary?.dimensions !== 4 ||
    !evidenceIntegrity.data.audit?.dimensions?.some((item) => item.key === "price_action" && item.educationOnly === true) ||
    !evidenceIntegrity.data.audit?.dimensions?.some((item) => (
      item.key === "backtest_sample" &&
      ["too_small_for_strategy_claims", "larger_practice_sample_still_not_predictive"].includes(item.status)
    )) ||
    !evidenceIntegrity.data.audit?.dimensions?.some((item) => item.key === "news_sentiment_boundary") ||
    !evidenceIntegrity.data.audit?.dimensions?.some((item) => item.key === "risk_discipline") ||
    !evidenceIntegrity.data.audit?.methodReference?.some((item) => item.includes("OpenBB")) ||
    !evidenceIntegrity.data.audit?.methodReference?.some((item) => item.includes("backtesting.py")) ||
    !evidenceIntegrity.data.audit?.constraints?.some((item) => item.includes("not a stock recommendation")) ||
    !evidenceIntegrity.data.audit?.constraints?.some((item) => item.includes("neither proves future performance"))
  ) {
    throw new Error(`learning evidence integrity API failed: ${evidenceIntegrity.status} ${JSON.stringify(evidenceIntegrity.data).slice(0, 1200)}`);
  }
  const sourceClassroom = await request("/api/source-transparency/classroom");
  if (
    sourceClassroom.status !== 200 ||
    sourceClassroom.data.classroom?.educationOnly !== true ||
    sourceClassroom.data.classroom?.demoData !== true ||
    sourceClassroom.data.classroom?.coverage?.approvedScenarios < 1 ||
    typeof sourceClassroom.data.classroom?.coverage?.internalDemoLicenses !== "number" ||
    sourceClassroom.data.classroom?.drill?.educationOnly !== true ||
    !sourceClassroom.data.classroom?.drill?.options?.length ||
    !sourceClassroom.data.classroom?.constraints?.some((item) => item.includes("live signals")) ||
    !sourceClassroom.data.classroom?.constraints?.some((item) => item.includes("production data licenses"))
  ) {
    throw new Error(`source transparency classroom API failed: ${sourceClassroom.status} ${JSON.stringify(sourceClassroom.data).slice(0, 1200)}`);
  }
  const sourceDrill = sourceClassroom.data.classroom.drill;
  const wrongSourceAnswer = sourceDrill.answer === 0 ? 1 : 0;
  const sourceMisconceptionAttempt = await request("/api/source-transparency/misconception-attempts", {
    method: "POST",
    body: { selectedIndex: wrongSourceAnswer },
  });
  if (
    sourceMisconceptionAttempt.status !== 201 ||
    sourceMisconceptionAttempt.data.attempt?.type !== "source_transparency_misconception" ||
    sourceMisconceptionAttempt.data.attempt?.correct !== false ||
    sourceMisconceptionAttempt.data.feedback?.educationOnly !== true ||
    !sourceMisconceptionAttempt.data.feedback?.constraints?.some((item) => item.includes("live signals")) ||
    !sourceMisconceptionAttempt.data.profile?.["source-label-as-signal-risk"] ||
    sourceMisconceptionAttempt.data.classroom?.drill?.educationOnly !== true ||
    !sourceMisconceptionAttempt.data.classroom?.constraints?.some((item) => item.includes("production data licenses")) ||
    !sourceMisconceptionAttempt.data.courseProgressUpdates?.some((item) => (
      item.coursePackageId === coursePackage.data.coursePackage.id &&
      item.itemType === "source_transparency_misconception" &&
      item.itemId === "source_transparency_misconception" &&
      item.progress?.percent < 100 &&
      item.progress?.completedSourceTransparencyDrillIds?.includes("source_transparency_misconception") &&
      item.educationOnly === true
    )) ||
    sourceMisconceptionAttempt.data.completionReports?.some((item) => item.coursePackageId === coursePackage.data.coursePackage.id && item.status === "issued")
  ) {
    throw new Error(`source transparency misconception drill API failed: ${sourceMisconceptionAttempt.status} ${JSON.stringify(sourceMisconceptionAttempt.data).slice(0, 1200)}`);
  }
  const drill = backtestClassroom.data.classroom.misconceptionDrill;
  const wrongBacktestAnswer = drill.answer === 0 ? 1 : 0;
  const misconceptionAttempt = await request("/api/backtest/misconception-attempts", {
    method: "POST",
    body: { selectedIndex: wrongBacktestAnswer },
  });
  if (
    misconceptionAttempt.status !== 201 ||
    misconceptionAttempt.data.attempt?.type !== "backtest_misconception" ||
    misconceptionAttempt.data.attempt?.correct !== false ||
    misconceptionAttempt.data.feedback?.educationOnly !== true ||
    !misconceptionAttempt.data.feedback?.constraints?.some((item) => item.includes("No stock recommendation")) ||
    !misconceptionAttempt.data.profile?.["backtest-misread-risk"] ||
    misconceptionAttempt.data.classroom?.misconceptionDrill?.educationOnly !== true ||
    !misconceptionAttempt.data.courseProgressUpdates?.some((item) => (
      item.coursePackageId === coursePackage.data.coursePackage.id &&
      item.itemType === "backtest_misconception" &&
      item.itemId === "backtest_metric_misconception" &&
      item.progress?.percent === 100 &&
      item.progress?.completedContextDrillIds?.includes("market_context_misconception") &&
      item.progress?.completedSourceTransparencyDrillIds?.includes("source_transparency_misconception") &&
      item.educationOnly === true
    )) ||
    !misconceptionAttempt.data.completionReports?.some((item) => item.coursePackageId === coursePackage.data.coursePackage.id && item.status === "issued" && item.educationOnly === true)
  ) {
    throw new Error("backtest misconception drill API failed");
  }
  const learnerCoursePackagesAfterMetricDrill = await request("/api/course-packages");
  const completedPackageAfterMetricDrill = learnerCoursePackagesAfterMetricDrill.data.packages?.find((item) => item.id === coursePackage.data.coursePackage.id);
  if (
    learnerCoursePackagesAfterMetricDrill.status !== 200 ||
    completedPackageAfterMetricDrill?.progress?.percent !== 100 ||
    !completedPackageAfterMetricDrill?.progress?.completedBacktestDrillIds?.includes("backtest_metric_misconception") ||
    !completedPackageAfterMetricDrill?.progress?.completedContextDrillIds?.includes("market_context_misconception") ||
    !completedPackageAfterMetricDrill?.progress?.completedSourceTransparencyDrillIds?.includes("source_transparency_misconception") ||
    completedPackageAfterMetricDrill?.coursePackageAssignment?.status !== "completed" ||
    completedPackageAfterMetricDrill?.completionReport?.status !== "issued"
  ) {
    throw new Error("course package did not complete after backtest metric drill");
  }

  const coachReport = await request("/api/coach/report");
  if (
    coachReport.status !== 200 ||
    coachReport.data.report?.educationOnly !== true ||
    coachReport.data.report?.activity?.trainingAttempts < 1 ||
    coachReport.data.report?.activity?.replayNotes < 1 ||
    coachReport.data.report?.activity?.paperTrades < 1 ||
    typeof coachReport.data.report?.discipline?.averageContextDiscipline !== "number" ||
    coachReport.data.report?.backtestClassroom?.educationOnly !== true ||
    coachReport.data.report?.backtestClassroom?.metrics?.sampleSize < 1 ||
    coachReport.data.report?.activity?.backtestMisconceptionAttempts < 1 ||
    coachReport.data.report?.activity?.sourceTransparencyMisconceptionAttempts < 1 ||
    coachReport.data.report?.backtestClassroom?.misconceptionAttempts < 1 ||
    !coachReport.data.report?.nextActions?.length ||
    !coachReport.data.report?.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("coach report API failed");
  }

  const progressReport = await request("/api/learner/progress-report");
  const progressConstraints = progressReport.data.report?.constraints || [];
  const progressShareText = progressReport.data.report?.shareText || "";
  const nextLearningProduct = progressReport.data.report?.nextLearningProduct;
  const courseProgressCompletionReport = progressReport.data.report?.completionReports?.find((item) => item.coursePackageId === coursePackage.data.coursePackage.id);
  const nextLearningCompletionReport = progressReport.data.report?.completionReports?.find((item) => (
    item.id === nextLearningProduct?.sourceCompletionReportId &&
    item.coursePackageId === coursePackage.data.coursePackage.id
  ));
  const progressCompletionReport = courseProgressCompletionReport || nextLearningCompletionReport;
  const nextLearningConstraints = nextLearningProduct?.constraints || [];
  if (
    progressReport.status !== 200 ||
    progressReport.data.report?.educationOnly !== true ||
    progressReport.data.report?.habit?.educationOnly !== true ||
    progressReport.data.report?.achievements?.educationOnly !== true ||
    progressReport.data.report?.coachReport?.activity?.trainingAttempts < 1 ||
    progressReport.data.report?.educationModelContext?.educationOnly !== true ||
    progressReport.data.report?.educationModelContext?.schemaVersion !== "education-model-context-v1" ||
    progressReport.data.report?.educationModelContext?.dataScope !== "learning_profile_and_course_evidence_only" ||
    progressReport.data.report?.educationModelContext?.learningSignals?.contextRiskSummary?.educationOnly !== true ||
    progressReport.data.report?.educationModelContext?.learningSignals?.contextRiskSummary?.signalUseProhibited !== true ||
    !progressReport.data.report?.educationModelContext?.prohibitedUses?.some((item) => item.includes("live buy/sell signals")) ||
    !progressReport.data.report?.educationModelContext?.constraints?.some((item) => item.includes("excludes raw K-line")) ||
    progressReport.data.report?.educationTutoringPlan?.educationOnly !== true ||
    progressReport.data.report?.educationTutoringPlan?.schemaVersion !== "education-tutoring-plan-v1" ||
    progressReport.data.report?.educationTutoringPlan?.moderationStatus !== "approved" ||
    !progressReport.data.report?.educationTutoringPlan?.lessonSteps?.length ||
    !progressReport.data.report?.educationTutoringPlan?.prohibitedUses?.some((item) => item.includes("live buy/sell signals")) ||
    progressReport.data.report?.learningEvidencePacket?.educationOnly !== true ||
    progressReport.data.report?.learningEvidencePacket?.schemaVersion !== "learning-evidence-packet-v1" ||
    progressReport.data.report?.learningEvidencePacket?.counts?.paperTrades < 1 ||
    progressReport.data.report?.learningEvidencePacket?.followUpSummary?.educationOnly !== true ||
    !progressReport.data.report?.learningEvidencePacket?.setupDiagnostics?.some((item) => item.educationOnly === true) ||
    !progressReport.data.report?.learningEvidencePacket?.exportText?.includes("learning evidence packet") ||
    !progressReport.data.report?.learningEvidencePacket?.constraints?.some((item) => item.includes("No stock recommendation")) ||
    progressReport.data.report?.activity?.replayNotes < 1 ||
    progressReport.data.report?.activity?.paperTrades < 1 ||
    !progressReport.data.report?.topMistakes ||
    !progressReport.data.report?.exportText ||
    progressCompletionReport?.progress?.percent !== 100 ||
    progressCompletionReport?.practiceSummary?.trainingAttempts < 1 ||
    !progressCompletionReport?.statements?.some((item) => item.includes("not trading skill certification")) ||
    progressCompletionReport?.educationOnly !== true ||
    nextLearningProduct?.educationOnly !== true ||
    !nextLearningProduct?.title ||
    !nextLearningProduct?.reason ||
    !nextLearningProduct?.action ||
    nextLearningProduct?.sourceCompletionReportId !== progressCompletionReport?.id ||
    !nextLearningConstraints.some((item) => item.includes("No stock recommendation")) ||
    !nextLearningConstraints.some((item) => item.includes("live signal")) ||
    !nextLearningConstraints.some((item) => item.includes("real-money")) ||
    !nextLearningConstraints.some((item) => item.includes("market prediction")) ||
    !progressShareText.includes("Education-only") ||
    !progressConstraints.some((item) => item.includes("No stock recommendation")) ||
    !progressConstraints.some((item) => item.includes("live signal")) ||
    !progressConstraints.some((item) => item.includes("return")) ||
    !progressConstraints.some((item) => item.includes("real-money"))
  ) {
    const progressDiagnostics = {
      status: progressReport.status,
      checks: {
        reportEducationOnly: progressReport.data.report?.educationOnly === true,
        habitEducationOnly: progressReport.data.report?.habit?.educationOnly === true,
        achievementsEducationOnly: progressReport.data.report?.achievements?.educationOnly === true,
        coachTrainingAttempts: progressReport.data.report?.coachReport?.activity?.trainingAttempts >= 1,
        learningEvidenceEducationOnly: progressReport.data.report?.learningEvidencePacket?.educationOnly === true,
        learningEvidenceSchema: progressReport.data.report?.learningEvidencePacket?.schemaVersion === "learning-evidence-packet-v1",
        learningEvidencePaperTrades: progressReport.data.report?.learningEvidencePacket?.counts?.paperTrades >= 1,
        followUpSummaryEducationOnly: progressReport.data.report?.learningEvidencePacket?.followUpSummary?.educationOnly === true,
        setupDiagnostics: progressReport.data.report?.learningEvidencePacket?.setupDiagnostics?.some((item) => item.educationOnly === true) === true,
        learningEvidenceExportText: progressReport.data.report?.learningEvidencePacket?.exportText?.includes("learning evidence packet") === true,
        learningEvidenceConstraint: progressReport.data.report?.learningEvidencePacket?.constraints?.some((item) => item.includes("No stock recommendation")) === true,
        replayNotes: progressReport.data.report?.activity?.replayNotes >= 1,
        paperTrades: progressReport.data.report?.activity?.paperTrades >= 1,
        topMistakes: Boolean(progressReport.data.report?.topMistakes),
        exportText: Boolean(progressReport.data.report?.exportText),
        completionPercent: progressCompletionReport?.progress?.percent === 100,
        completionTrainingAttempts: progressCompletionReport?.practiceSummary?.trainingAttempts >= 1,
        completionStatement: progressCompletionReport?.statements?.some((item) => item.includes("not trading skill certification")) === true,
        completionEducationOnly: progressCompletionReport?.educationOnly === true,
        nextLearningEducationOnly: nextLearningProduct?.educationOnly === true,
        nextLearningTitle: Boolean(nextLearningProduct?.title),
        nextLearningReason: Boolean(nextLearningProduct?.reason),
        nextLearningAction: Boolean(nextLearningProduct?.action),
        nextLearningSource: nextLearningProduct?.sourceCompletionReportId === progressCompletionReport?.id,
        nextConstraintNoStock: nextLearningConstraints.some((item) => item.includes("No stock recommendation")),
        nextConstraintLiveSignal: nextLearningConstraints.some((item) => item.includes("live signal")),
        nextConstraintRealMoney: nextLearningConstraints.some((item) => item.includes("real-money")),
        nextConstraintMarketPrediction: nextLearningConstraints.some((item) => item.includes("market prediction")),
        shareTextEducationOnly: progressShareText.includes("Education-only"),
        progressConstraintNoStock: progressConstraints.some((item) => item.includes("No stock recommendation")),
        progressConstraintLiveSignal: progressConstraints.some((item) => item.includes("live signal")),
        progressConstraintReturn: progressConstraints.some((item) => item.includes("return")),
        progressConstraintRealMoney: progressConstraints.some((item) => item.includes("real-money")),
      },
      educationOnly: progressReport.data.report?.educationOnly,
      habitEducationOnly: progressReport.data.report?.habit?.educationOnly,
      achievementsEducationOnly: progressReport.data.report?.achievements?.educationOnly,
      coachTrainingAttempts: progressReport.data.report?.coachReport?.activity?.trainingAttempts,
      learningEvidencePacket: progressReport.data.report?.learningEvidencePacket,
      replayNotes: progressReport.data.report?.activity?.replayNotes,
      paperTrades: progressReport.data.report?.activity?.paperTrades,
      hasTopMistakes: Boolean(progressReport.data.report?.topMistakes),
      hasExportText: Boolean(progressReport.data.report?.exportText),
      expectedCoursePackageId: coursePackage.data.coursePackage.id,
      completionReportIds: progressReport.data.report?.completionReports?.map((item) => ({
        id: item.id,
        coursePackageId: item.coursePackageId,
        percent: item.progress?.percent,
        trainingAttempts: item.practiceSummary?.trainingAttempts,
        educationOnly: item.educationOnly,
        statements: item.statements
      })),
      matchedCompletionReport: progressCompletionReport,
      nextLearningProduct,
      progressShareText,
      progressConstraints
    };
    throw new Error(`learner progress report API failed: ${JSON.stringify(progressDiagnostics).slice(0, 3000)}`);
  }

  const learnerCompletionCertificateJson = await request(`/api/completion-certificate/export?reportId=${encodeURIComponent(progressCompletionReport.id)}&format=json`);
  const certificateOwnerEmail = progressCompletionReport.email || progressReport.data.report?.learner?.email;
  if (
    learnerCompletionCertificateJson.status !== 200 ||
    learnerCompletionCertificateJson.data.certificate?.schemaVersion !== "education-completion-certificate-v1" ||
    learnerCompletionCertificateJson.data.certificate?.reportId !== progressCompletionReport.id ||
    learnerCompletionCertificateJson.data.certificate?.learner?.email !== certificateOwnerEmail ||
    learnerCompletionCertificateJson.data.certificate?.educationOnly !== true ||
    learnerCompletionCertificateJson.data.certificate?.productionReady !== false ||
    !learnerCompletionCertificateJson.data.certificate?.verificationCode ||
    !learnerCompletionCertificateJson.data.certificate?.statements?.some((item) => item.includes("not trading skill certification")) ||
    !learnerCompletionCertificateJson.data.note?.includes("not investment advice")
  ) {
    throw new Error(`learner completion certificate JSON export failed: ${learnerCompletionCertificateJson.status} ${JSON.stringify(learnerCompletionCertificateJson.data).slice(0, 1200)}`);
  }

  const learnerCompletionCertificateCsv = await request(`/api/completion-certificate/export?reportId=${encodeURIComponent(progressCompletionReport.id)}&format=csv`);
  if (
    learnerCompletionCertificateCsv.status !== 200 ||
    typeof learnerCompletionCertificateCsv.data !== "string" ||
    !learnerCompletionCertificateCsv.data.startsWith("id,reportId,verificationCode") ||
    !learnerCompletionCertificateCsv.data.includes(progressCompletionReport.id) ||
    !learnerCompletionCertificateCsv.data.includes(certificateOwnerEmail)
  ) {
    throw new Error(`learner completion certificate CSV export failed: ${learnerCompletionCertificateCsv.status} ${String(learnerCompletionCertificateCsv.data).slice(0, 1000)}`);
  }

  const learnerCompletionCertificateMd = await request(`/api/completion-certificate/export?reportId=${encodeURIComponent(progressCompletionReport.id)}&format=md`);
  if (
    learnerCompletionCertificateMd.status !== 200 ||
    typeof learnerCompletionCertificateMd.data !== "string" ||
    !learnerCompletionCertificateMd.data.includes("# TradeGym Education Completion Certificate") ||
    !learnerCompletionCertificateMd.data.includes("not trading skill certification") ||
    !learnerCompletionCertificateMd.data.includes("No stock recommendation")
  ) {
    throw new Error(`learner completion certificate MD export failed: ${learnerCompletionCertificateMd.status} ${String(learnerCompletionCertificateMd.data).slice(0, 1200)}`);
  }

  const nextProductNotifications = await request("/api/notifications");
  const nextProductNotification = nextProductNotifications.data.notifications?.find((item) => (
    item.type === "next_learning_product" &&
    item.status === "unread" &&
    item.educationOnly === true &&
    item.actionLabel === "Open next education step"
  ));
  if (
    nextProductNotifications.status !== 200 ||
    nextProductNotifications.data.summary?.nextLearningProducts < 1 ||
    !nextProductNotification ||
    nextProductNotification.sourceCompletionReportId !== progressCompletionReport?.id ||
    !nextProductNotifications.data.constraints?.some((item) => item.includes("not stock recommendations"))
  ) {
    throw new Error(`next learning product notification missing: ${nextProductNotifications.status} ${JSON.stringify(nextProductNotifications.data).slice(0, 1200)}`);
  }
  const nextProductRead = await request("/api/next-learning-products/read", {
    method: "POST",
    body: { reportId: nextProductNotification.sourceCompletionReportId },
  });
  const nextProductReadNotification = nextProductRead.data.notifications?.notifications?.find((item) => (
    item.type === "next_learning_product" &&
    item.sourceCompletionReportId === progressCompletionReport?.id
  ));
  if (
    nextProductRead.status !== 200 ||
    nextProductRead.data.report?.id !== progressCompletionReport?.id ||
    !nextProductRead.data.report?.nextLearningOpenedAt ||
    nextProductRead.data.report?.nextLearningStatus !== "opened" ||
    nextProductReadNotification?.status !== "read" ||
    nextProductRead.data.notifications?.summary?.unread >= nextProductNotifications.data.summary?.unread ||
    !nextProductRead.data.progressReport?.nextLearningProduct?.nextLearningOpenedAt ||
    !nextProductRead.data.constraints?.some((item) => item.includes("education follow-through only"))
  ) {
    throw new Error(`next learning product read acknowledgement failed: ${nextProductRead.status} ${JSON.stringify(nextProductRead.data).slice(0, 1600)}`);
  }
  await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  const nextLearningAdminMetrics = await request(`/api/admin/metrics?q=${encodeURIComponent(learnerEmail)}`);
  if (
    nextLearningAdminMetrics.status !== 200 ||
    !nextLearningAdminMetrics.data.activationFunnel?.constraints?.some((item) => item.includes("not investment advice"))
  ) {
    throw new Error(`admin next learning queue did not reflect learner acknowledgement: ${nextLearningAdminMetrics.status} ${JSON.stringify(nextLearningAdminMetrics.data).slice(0, 1600)}`);
  }
  const educationModelContext = await request("/api/education-model/context");
  if (
    educationModelContext.status !== 200 ||
    educationModelContext.data.context?.educationOnly !== true ||
    educationModelContext.data.context?.schemaVersion !== "education-model-context-v1" ||
    educationModelContext.data.context?.learnerRef?.userId !== login.data.session.userId ||
    educationModelContext.data.context?.activity?.sourceTransparencyMisconceptionAttempts < 1 ||
    typeof educationModelContext.data.context?.activity?.courseEvidenceBlockers !== "number" ||
    educationModelContext.data.context?.learningSignals?.contextRiskSummary?.educationOnly !== true ||
    educationModelContext.data.context?.learningSignals?.contextRiskSummary?.signalUseProhibited !== true ||
    !educationModelContext.data.context?.learningSignals?.contextRiskSummary?.constraints?.some((item) => item.includes("not sentiment scoring")) ||
    !educationModelContext.data.context?.recommendedTeachingMoves?.some((item) => item.includes("Do not convert news")) ||
    !educationModelContext.data.context?.allowedUses?.some((item) => item.includes("tutoring")) ||
    !educationModelContext.data.context?.prohibitedUses?.some((item) => item.includes("stock recommendations")) ||
    educationModelContext.data.tutoringPlan?.educationOnly !== true ||
    educationModelContext.data.tutoringPlan?.schemaVersion !== "education-tutoring-plan-v1" ||
    !educationModelContext.data.tutoringPlan?.coachScript?.length ||
    !educationModelContext.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`education model context API failed: ${educationModelContext.status} ${JSON.stringify(educationModelContext.data).slice(0, 1200)}`);
  }
  const educationTutoringPlan = await request("/api/education-model/tutoring-plan");
  if (
    educationTutoringPlan.status !== 200 ||
    educationTutoringPlan.data.plan?.educationOnly !== true ||
    educationTutoringPlan.data.plan?.schemaVersion !== "education-tutoring-plan-v1" ||
    educationTutoringPlan.data.plan?.sourceContextVersion !== "education-model-context-v1" ||
    educationTutoringPlan.data.plan?.moderationStatus !== "approved" ||
    !educationTutoringPlan.data.plan?.focusAreas?.length ||
    !educationTutoringPlan.data.plan?.constraints?.some((item) => item.includes("does not provide stock recommendations")) ||
    !educationTutoringPlan.data.context?.prohibitedUses?.some((item) => item.includes("real-money trading")) ||
    !educationTutoringPlan.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`education tutoring plan API failed: ${educationTutoringPlan.status} ${JSON.stringify(educationTutoringPlan.data).slice(0, 1200)}`);
  }
  const educationModelRun = await request("/api/education-model/tutoring-plan/runs", {
    method: "POST",
    body: {},
  });
  if (
    educationModelRun.status !== 201 ||
    educationModelRun.data.run?.type !== "education_tutoring_plan" ||
    educationModelRun.data.run?.userId !== login.data.session.userId ||
    educationModelRun.data.run?.educationOnly !== true ||
    educationModelRun.data.run?.reviewStatus !== "needs_review" ||
    educationModelRun.data.run?.tutoringPlan?.schemaVersion !== "education-tutoring-plan-v1" ||
    educationModelRun.data.run?.contextSummary?.prohibitedUses?.some((item) => item.includes("live buy/sell signals")) !== true ||
    !educationModelRun.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`education model run archive failed: ${educationModelRun.status} ${JSON.stringify(educationModelRun.data).slice(0, 1200)}`);
  }
  const followupLearnerEmail = progressReport.data.report?.learner?.email || learnerEmail;
  const followupLearnerPassword = followupLearnerEmail === "admin@tradegym.local"
    ? "admin123"
    : followupLearnerEmail === learnerEmail
      ? "demo67890"
      : null;
  if (!followupLearnerPassword) {
    throw new Error(`cannot repair completion follow-up quota for unknown learner ${followupLearnerEmail}`);
  }
  let completionFollowup = await request("/api/admin/completion-report-followups", {
    method: "POST",
    body: {
      reportId: progressCompletionReport?.id,
    },
  });
  let repairedCoachCredits = 0;
  while (completionFollowup.status === 402 && completionFollowup.data?.error === "Coach review quota reached") {
    const entitlement = completionFollowup.data?.entitlement || {};
    const neededCredits = Math.max(
      1,
      Number(entitlement.usage?.coachReview || 0) - Number(entitlement.limits?.totalCoachReviews || 0) + 1
    );
    const repairCredits = neededCredits + 20;
    repairedCoachCredits += repairCredits;
    if (repairedCoachCredits > 500) {
      throw new Error(`completion follow-up quota repair needs more than ${repairedCoachCredits} add-on credits, above verify safety cap`);
    }
    await buyCoachReviewAddonForLearner({
      email: followupLearnerEmail,
      password: followupLearnerPassword,
      credits: repairCredits,
    });
    completionFollowup = await request("/api/admin/completion-report-followups", {
      method: "POST",
      body: {
        reportId: progressCompletionReport?.id,
      },
    });
  }
  const completionFollowupConstraints = [
    ...(completionFollowup.data.constraints || []),
    ...(completionFollowup.data.task?.constraints || []),
  ];
  if (
    ![200, 201].includes(completionFollowup.status) ||
    completionFollowup.data.task?.source !== "completion_report_followup" ||
    completionFollowup.data.task?.completionReportId !== progressCompletionReport?.id ||
    completionFollowup.data.task?.coursePackageId !== coursePackage.data.coursePackage.id ||
    completionFollowup.data.task?.educationOnly !== true ||
    !completionFollowupConstraints.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`completion report follow-up API failed: ${completionFollowup.status} ${JSON.stringify(completionFollowup.data).slice(0, 1200)}`);
  }
  const completionFollowupTasks = await request(`/api/admin/coach-review-tasks?status=open&q=${encodeURIComponent(completionFollowup.data.task.focus)}&limit=100`);
  if (
    completionFollowupTasks.status !== 200 ||
    !completionFollowupTasks.data.tasks?.some((item) => (
      item.source === "completion_report_followup" &&
      item.completionReportId === progressCompletionReport?.id
    ))
  ) {
    throw new Error("completion report follow-up task missing from coach task list");
  }

  const metrics = await request("/api/admin/metrics");
  if (
    metrics.status !== 200 ||
    metrics.data.attempts < 1 ||
    metrics.data.auditLogs < 1 ||
    metrics.data.sessions < 1 ||
    metrics.data.paperTrades < 1 ||
    metrics.data.educationModelRuns < 1 ||
    metrics.data.activationFunnel?.educationOnly !== true ||
    metrics.data.activationFunnel?.totalLearners < 1 ||
    typeof metrics.data.activationFunnel?.averagePercent !== "number" ||
    metrics.data.activationFunnel?.buckets?.completed < 0 ||
    !Array.isArray(metrics.data.activationFunnel?.interventionQueue) ||
    metrics.data.activationFunnel?.interventionQueue?.length < 1 ||
    metrics.data.activationFunnel?.interventionQueue?.some((item) => (
      item.educationOnly !== true ||
      !item.currentStepId ||
      typeof item.percent !== "number" ||
      item.nextLearningProduct?.educationOnly !== true ||
      !item.nextLearningProduct?.action ||
      !["opened", "unread", undefined].includes(item.nextLearningProduct?.status) ||
      !item.nextLearningProduct?.constraints?.some((constraint) => constraint.includes("No stock recommendation"))
    )) ||
    !metrics.data.activationFunnel?.constraints?.some((item) => item.includes("not investment advice"))
  ) {
    throw new Error("metrics API failed");
  }
  if (!metrics.data.aiCoach?.provider) {
    throw new Error("AI provider status missing");
  }
  const educationServiceHealth = await request("/api/admin/education-service-health");
  if (
    educationServiceHealth.status !== 200 ||
    educationServiceHealth.data.educationOnly !== true ||
    educationServiceHealth.data.productionReady !== false ||
    typeof educationServiceHealth.data.healthScore !== "number" ||
    !["healthy", "watch", "needs_attention"].includes(educationServiceHealth.data.status) ||
    educationServiceHealth.data.summary?.openCoachTasks < 1 ||
    typeof educationServiceHealth.data.summary?.contextCompletionRatePct !== "number" ||
    typeof educationServiceHealth.data.summary?.educationModelNeedsReview !== "number" ||
    typeof educationServiceHealth.data.summary?.chartEvidenceOpen !== "number" ||
    typeof educationServiceHealth.data.summary?.chartEvidenceReadyToApply !== "number" ||
    educationServiceHealth.data.sections?.evidenceLoop?.chartEvidence?.educationOnly !== true ||
    educationServiceHealth.data.sections?.evidenceLoop?.educationOnly !== true ||
    educationServiceHealth.data.sections?.coachWorkload?.educationOnly !== true ||
    educationServiceHealth.data.sections?.educationModelReview?.educationOnly !== true ||
    educationServiceHealth.data.trend?.educationOnly !== true ||
    !Array.isArray(educationServiceHealth.data.trend?.rows) ||
    educationServiceHealth.data.trend.rows.length < 1 ||
    educationServiceHealth.data.trend.rows.some((item) => item.educationOnly !== true) ||
    typeof educationServiceHealth.data.trend?.totals?.coachTasksCreated !== "number" ||
    !educationServiceHealth.data.constraints?.some((item) => item.includes("does not measure trading performance")) ||
    !educationServiceHealth.data.constraints?.some((item) => item.includes("productionReady remains false"))
  ) {
    throw new Error(`education service health API failed: ${educationServiceHealth.status} ${JSON.stringify(educationServiceHealth.data).slice(0, 1200)}`);
  }
  const educationServiceHealthJsonExport = await request("/api/admin/education-service-health/export?format=json&days=7");
  if (
    educationServiceHealthJsonExport.status !== 200 ||
    educationServiceHealthJsonExport.data.educationOnly !== true ||
    educationServiceHealthJsonExport.data.productionReady !== false ||
    educationServiceHealthJsonExport.data.trend?.days !== 7 ||
    educationServiceHealthJsonExport.data.trend?.rows?.length !== 7 ||
    educationServiceHealthJsonExport.data.trend.rows.some((item) => item.educationOnly !== true) ||
    typeof educationServiceHealthJsonExport.data.health?.healthScore !== "number" ||
    !educationServiceHealthJsonExport.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`education service health JSON export failed: ${educationServiceHealthJsonExport.status} ${JSON.stringify(educationServiceHealthJsonExport.data).slice(0, 1200)}`);
  }
  const educationServiceHealthCsvExport = await request("/api/admin/education-service-health/export?format=csv&days=7");
  if (
    educationServiceHealthCsvExport.status !== 200 ||
    typeof educationServiceHealthCsvExport.data !== "string" ||
    !educationServiceHealthCsvExport.data.includes("date,coachTasksCreated,coachTasksCompleted") ||
    !educationServiceHealthCsvExport.data.includes("educationOnly") ||
    educationServiceHealthCsvExport.data.split("\n").length < 2
  ) {
    throw new Error(`education service health CSV export failed: ${educationServiceHealthCsvExport.status} ${String(educationServiceHealthCsvExport.data).slice(0, 1200)}`);
  }
  const educationServiceHealthExportAudit = await request("/api/admin/audit-logs?type=education_service_health_exported&limit=20");
  if (
    educationServiceHealthExportAudit.status !== 200 ||
    !educationServiceHealthExportAudit.data.items?.some((item) => (
      item.type === "education_service_health_exported" &&
      item.educationOnly === true &&
      item.rowCount === 7
    ))
  ) {
    throw new Error(`education service health export audit failed: ${educationServiceHealthExportAudit.status} ${JSON.stringify(educationServiceHealthExportAudit.data).slice(0, 1200)}`);
  }
  const activationQueueItem = metrics.data.activationFunnel.interventionQueue[0];
  const activationIntervention = await request("/api/admin/activation-interventions", {
    method: "POST",
    body: {
      userId: activationQueueItem.userId,
      focus: `Activation follow-up: ${activationQueueItem.currentStepId}`,
    },
  });
  if (
    ![200, 201].includes(activationIntervention.status) ||
    activationIntervention.data.task?.source !== "activation_intervention" ||
    activationIntervention.data.task?.userId !== activationQueueItem.userId ||
    activationIntervention.data.task?.currentStepId !== activationQueueItem.currentStepId ||
    activationIntervention.data.task?.educationOnly !== true ||
    !activationIntervention.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`activation intervention API failed: ${activationIntervention.status} ${JSON.stringify(activationIntervention.data).slice(0, 1200)}`);
  }
  const activationInterventionList = await request(`/api/admin/activation-interventions?status=open&q=${encodeURIComponent(activationQueueItem.email)}&limit=20`);
  if (
    activationInterventionList.status !== 200 ||
    !activationInterventionList.data.tasks?.some((item) => (
      item.id === activationIntervention.data.task.id &&
      item.source === "activation_intervention" &&
      item.educationOnly === true
    )) ||
    activationInterventionList.data.totals?.open < 1 ||
    !activationInterventionList.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`activation intervention list API failed: ${activationInterventionList.status} ${JSON.stringify(activationInterventionList.data).slice(0, 1200)}`);
  }
  const learnerActivationIntervention = await request("/api/admin/activation-interventions", {
    method: "POST",
    body: {
      userId: primaryLearnerId,
      focus: "Activation follow-up: learner notification",
    },
  });
  if (
    ![200, 201].includes(learnerActivationIntervention.status) ||
    learnerActivationIntervention.data.task?.userId !== primaryLearnerId ||
    learnerActivationIntervention.data.task?.educationOnly !== true
  ) {
    throw new Error(`learner activation intervention create failed: ${learnerActivationIntervention.status} ${JSON.stringify(learnerActivationIntervention.data).slice(0, 1200)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const learnerActivationLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: learnerEmail, password: "demo67890" },
  });
  if (learnerActivationLogin.status !== 200 || learnerActivationLogin.data.session?.email !== learnerEmail) {
    throw new Error("learner relogin for activation notification failed");
  }
  const activationNotifications = await request("/api/notifications");
  if (
    activationNotifications.status !== 200 ||
    activationNotifications.data.summary?.activationInterventions < 1 ||
    !activationNotifications.data.notifications?.some((item) => (
      item.type === "activation_intervention" &&
      item.taskId === learnerActivationIntervention.data.task.id &&
      item.status === "unread" &&
      item.educationOnly === true &&
      item.actionLabel === "Open activation plan"
    )) ||
    !activationNotifications.data.constraints?.some((item) => item.includes("not stock recommendations"))
  ) {
    throw new Error(`activation learner notification missing: ${activationNotifications.status} ${JSON.stringify(activationNotifications.data).slice(0, 1200)}`);
  }
  const activationRead = await request("/api/activation-interventions/read", {
    method: "POST",
    body: {
      taskId: learnerActivationIntervention.data.task.id,
    },
  });
  if (
    activationRead.status !== 200 ||
    activationRead.data.task?.learnerOpenedAt == null ||
    activationRead.data.task?.learnerStatus !== "opened" ||
    activationRead.data.notifications?.notifications?.some((item) => (
      item.taskId === learnerActivationIntervention.data.task.id &&
      item.status !== "read"
    )) ||
    !activationRead.data.constraints?.some((item) => item.includes("stock recommendation"))
  ) {
    throw new Error(`activation learner read API failed: ${activationRead.status} ${JSON.stringify(activationRead.data).slice(0, 1200)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const adminAfterActivationNotification = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminAfterActivationNotification.status !== 200 || adminAfterActivationNotification.data.session?.role !== "admin") {
    throw new Error("admin relogin after activation notification failed");
  }
  const activationInterventionOpenedList = await request(`/api/admin/activation-interventions?q=${encodeURIComponent(learnerEmail)}&limit=20`);
  if (
    activationInterventionOpenedList.status !== 200 ||
    !activationInterventionOpenedList.data.tasks?.some((item) => (
      item.id === learnerActivationIntervention.data.task.id &&
      item.learnerOpened === true &&
      item.learnerOpenedAt != null
    ))
  ) {
    throw new Error(`activation intervention opened state missing from admin list: ${activationInterventionOpenedList.status} ${JSON.stringify(activationInterventionOpenedList.data).slice(0, 1200)}`);
  }
  const learnerActivationInterventionUpdate = await request("/api/admin/activation-interventions/update", {
    method: "POST",
    body: {
      taskId: learnerActivationIntervention.data.task.id,
      status: "completed",
      resolutionNote: "Verified learner-facing activation reminder as education onboarding support.",
    },
  });
  if (
    learnerActivationInterventionUpdate.status !== 200 ||
    learnerActivationInterventionUpdate.data.task?.status !== "completed" ||
    learnerActivationInterventionUpdate.data.task?.educationOnly !== true
  ) {
    throw new Error(`learner activation intervention update failed: ${learnerActivationInterventionUpdate.status} ${JSON.stringify(learnerActivationInterventionUpdate.data).slice(0, 1200)}`);
  }
  const activationInterventionUpdate = await request("/api/admin/activation-interventions/update", {
    method: "POST",
    body: {
      taskId: activationIntervention.data.task.id,
      status: "completed",
      resolutionNote: "Verified activation education follow-up as an onboarding support task with no market advice or real-money instruction.",
    },
  });
  if (
    activationInterventionUpdate.status !== 200 ||
    activationInterventionUpdate.data.task?.status !== "completed" ||
    activationInterventionUpdate.data.task?.completedAt == null ||
    activationInterventionUpdate.data.task?.educationOnly !== true ||
    !activationInterventionUpdate.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`activation intervention update API failed: ${activationInterventionUpdate.status} ${JSON.stringify(activationInterventionUpdate.data).slice(0, 1200)}`);
  }
  const adminEducationModelRuns = await request(`/api/admin/education-model-runs?userId=${encodeURIComponent(login.data.session.userId)}&limit=20`);
  if (
    adminEducationModelRuns.status !== 200 ||
    adminEducationModelRuns.data.summary?.filtered < 1 ||
    !adminEducationModelRuns.data.runs?.some((item) => (
      item.id === educationModelRun.data.run.id &&
      item.educationOnly === true &&
      item.reviewStatus === "needs_review" &&
      item.tutoringPlan?.schemaVersion === "education-tutoring-plan-v1" &&
      item.constraints?.some((constraint) => constraint.includes("not stock recommendations"))
    )) ||
    !adminEducationModelRuns.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`admin education model runs API failed: ${adminEducationModelRuns.status} ${JSON.stringify(adminEducationModelRuns.data).slice(0, 1200)}`);
  }
  const needsReviewEducationModelRuns = await request("/api/admin/education-model-runs?reviewStatus=needs_review&limit=20");
  if (
    needsReviewEducationModelRuns.status !== 200 ||
    needsReviewEducationModelRuns.data.summary?.filtered < 1 ||
    needsReviewEducationModelRuns.data.runs?.some((item) => (item.reviewStatus || "needs_review") !== "needs_review") ||
    !needsReviewEducationModelRuns.data.runs?.some((item) => item.id === educationModelRun.data.run.id) ||
    !needsReviewEducationModelRuns.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`education model needs-review filter failed: ${needsReviewEducationModelRuns.status} ${JSON.stringify(needsReviewEducationModelRuns.data).slice(0, 1200)}`);
  }
  const reviewedEducationModelRun = await request("/api/admin/education-model-runs/review", {
    method: "POST",
    body: {
      runId: educationModelRun.data.run.id,
      action: "approve",
      note: "Approved for education-only tutoring workflow review.",
    },
  });
  if (
    reviewedEducationModelRun.status !== 200 ||
    reviewedEducationModelRun.data.run?.id !== educationModelRun.data.run.id ||
    reviewedEducationModelRun.data.run?.reviewStatus !== "approved" ||
    !reviewedEducationModelRun.data.run?.reviewedBy ||
    !reviewedEducationModelRun.data.run?.reviewedAt ||
    !reviewedEducationModelRun.data.run?.reviewNote?.includes("education-only") ||
    !reviewedEducationModelRun.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`education model run review failed: ${reviewedEducationModelRun.status} ${JSON.stringify(reviewedEducationModelRun.data).slice(0, 1200)}`);
  }
  const approvedEducationModelRuns = await request(`/api/admin/education-model-runs?userId=${encodeURIComponent(login.data.session.userId)}&limit=20`);
  if (
    approvedEducationModelRuns.status !== 200 ||
    approvedEducationModelRuns.data.summary?.approved < 1 ||
    !approvedEducationModelRuns.data.runs?.some((item) => (
      item.id === educationModelRun.data.run.id &&
      item.reviewStatus === "approved" &&
      item.reviewedBy &&
      item.reviewNote?.includes("education-only")
    ))
  ) {
    throw new Error(`approved education model run missing: ${approvedEducationModelRuns.status} ${JSON.stringify(approvedEducationModelRuns.data).slice(0, 1200)}`);
  }
  const progressReportAfterModelReview = await request("/api/learner/progress-report");
  if (
    progressReportAfterModelReview.status !== 200 ||
    progressReportAfterModelReview.data.report?.approvedEducationModelRun?.id !== educationModelRun.data.run.id ||
    progressReportAfterModelReview.data.report?.approvedEducationModelRun?.reviewStatus !== "approved" ||
    progressReportAfterModelReview.data.report?.approvedEducationModelRun?.educationOnly !== true ||
    !progressReportAfterModelReview.data.report?.approvedEducationModelRun?.reviewedBy ||
    !progressReportAfterModelReview.data.report?.approvedEducationModelRun?.constraints?.some((item) => item.includes("not a stock recommendation"))
  ) {
    throw new Error(`approved education model run missing from learner progress report: ${progressReportAfterModelReview.status} ${JSON.stringify(progressReportAfterModelReview.data).slice(0, 1200)}`);
  }
  const adminReviewedLearnerProgressReport = await request(`/api/admin/learner-progress-report?userId=${encodeURIComponent(login.data.session.userId)}`);
  if (
    adminReviewedLearnerProgressReport.status !== 200 ||
    adminReviewedLearnerProgressReport.data.report?.approvedEducationModelRun?.id !== educationModelRun.data.run.id ||
    adminReviewedLearnerProgressReport.data.report?.approvedEducationModelRun?.reviewStatus !== "approved" ||
    adminReviewedLearnerProgressReport.data.report?.approvedEducationModelRun?.educationOnly !== true ||
    !adminReviewedLearnerProgressReport.data.report?.approvedEducationModelRun?.constraints?.some((item) => item.includes("not a stock recommendation"))
  ) {
    throw new Error(`approved education model run missing from admin reviewed learner report: ${adminReviewedLearnerProgressReport.status} ${JSON.stringify(adminReviewedLearnerProgressReport.data).slice(0, 1200)}`);
  }
  const educationModelRunAudit = await request("/api/admin/audit-logs?type=education_model_run_created&limit=20");
  if (
    educationModelRunAudit.status !== 200 ||
    !educationModelRunAudit.data.items?.some((item) => item.runId === educationModelRun.data.run.id && item.educationOnly === true)
  ) {
    throw new Error("education model run audit log missing");
  }
  const educationModelRunReviewAudit = await request("/api/admin/audit-logs?type=education_model_run_reviewed&limit=20");
  if (
    educationModelRunReviewAudit.status !== 200 ||
    !educationModelRunReviewAudit.data.items?.some((item) => (
      item.runId === educationModelRun.data.run.id &&
      item.educationOnly === true &&
      item.reviewStatus === "approved" &&
      item.reviewedBy
    ))
  ) {
    throw new Error("education model run review audit log missing");
  }
  const educationModelRunNeedsChanges = await request("/api/education-model/tutoring-plan/runs", {
    method: "POST",
    body: {},
  });
  const changedEducationModelRun = await request("/api/admin/education-model-runs/review", {
    method: "POST",
    body: {
      runId: educationModelRunNeedsChanges.data.run?.id,
      action: "request_changes",
      note: "Request changes before using this tutoring plan in learner support.",
    },
  });
  if (
    educationModelRunNeedsChanges.status !== 201 ||
    changedEducationModelRun.status !== 200 ||
    changedEducationModelRun.data.run?.reviewStatus !== "changes_requested" ||
    !changedEducationModelRun.data.run?.reviewNote?.includes("Request changes")
  ) {
    throw new Error(`education model run request-changes review failed: ${changedEducationModelRun.status} ${JSON.stringify(changedEducationModelRun.data).slice(0, 1200)}`);
  }
  const educationModelRunRejected = await request("/api/education-model/tutoring-plan/runs", {
    method: "POST",
    body: {},
  });
  const rejectedEducationModelRun = await request("/api/admin/education-model-runs/review", {
    method: "POST",
    body: {
      runId: educationModelRunRejected.data.run?.id,
      action: "reject",
      note: "Rejected for education-only tutoring workflow review.",
    },
  });
  if (
    educationModelRunRejected.status !== 201 ||
    rejectedEducationModelRun.status !== 200 ||
    rejectedEducationModelRun.data.run?.reviewStatus !== "rejected" ||
    !rejectedEducationModelRun.data.run?.reviewNote?.includes("Rejected")
  ) {
    throw new Error(`education model run reject review failed: ${rejectedEducationModelRun.status} ${JSON.stringify(rejectedEducationModelRun.data).slice(0, 1200)}`);
  }
  const reviewedEducationModelRuns = await request(`/api/admin/education-model-runs?userId=${encodeURIComponent(login.data.session.userId)}&limit=20`);
  if (
    reviewedEducationModelRuns.status !== 200 ||
    reviewedEducationModelRuns.data.summary?.changesRequested < 1 ||
    reviewedEducationModelRuns.data.summary?.rejected < 1 ||
    !reviewedEducationModelRuns.data.runs?.some((item) => item.id === educationModelRunNeedsChanges.data.run.id && item.reviewStatus === "changes_requested") ||
    !reviewedEducationModelRuns.data.runs?.some((item) => item.id === educationModelRunRejected.data.run.id && item.reviewStatus === "rejected")
  ) {
    throw new Error(`education model run review status summary failed: ${reviewedEducationModelRuns.status} ${JSON.stringify(reviewedEducationModelRuns.data).slice(0, 1200)}`);
  }
  const educationModelRunJsonExport = await request(`/api/admin/education-model-runs/export?format=json&userId=${encodeURIComponent(login.data.session.userId)}`);
  if (
    educationModelRunJsonExport.status !== 200 ||
    educationModelRunJsonExport.data.educationOnly !== true ||
    educationModelRunJsonExport.data.total < 3 ||
    !educationModelRunJsonExport.data.runs?.some((item) => item.id === educationModelRun.data.run.id && item.reviewStatus === "approved") ||
    !educationModelRunJsonExport.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`education model run JSON export failed: ${educationModelRunJsonExport.status} ${JSON.stringify(educationModelRunJsonExport.data).slice(0, 1200)}`);
  }
  const educationModelRunCsvExport = await request(`/api/admin/education-model-runs/export?format=csv&userId=${encodeURIComponent(login.data.session.userId)}&reviewStatus=approved`);
  if (
    educationModelRunCsvExport.status !== 200 ||
    typeof educationModelRunCsvExport.data !== "string" ||
    !educationModelRunCsvExport.data.includes("reviewStatus") ||
    !educationModelRunCsvExport.data.includes("approved") ||
    !educationModelRunCsvExport.data.includes(educationModelRun.data.run.id)
  ) {
    throw new Error(`education model run CSV export failed: ${educationModelRunCsvExport.status} ${String(educationModelRunCsvExport.data).slice(0, 1200)}`);
  }

  const adminCoachReports = await request("/api/admin/coach-reports?limit=20");
  if (
    adminCoachReports.status !== 200 ||
    !adminCoachReports.data.reports?.length ||
    !adminCoachReports.data.reports.some((item) => item.educationOnly === true && item.activity?.paperTrades >= 1) ||
    !adminCoachReports.data.reports.some((item) => item.entitlement?.coachReviewIncluded === true) ||
    typeof adminCoachReports.data.totals?.contextBoundaryRepair !== "number" ||
    !adminCoachReports.data.reports.some((item) => (
      item.marketContextClassroom?.educationOnly === true &&
      item.marketContextClassroom?.riskSummary?.educationOnly === true &&
      item.marketContextClassroom?.riskSummary?.signalUseProhibited === true &&
      item.marketContextClassroom?.riskSummary?.constraints?.some((constraint) => constraint.includes("not sentiment scoring"))
    )) ||
    !adminCoachReports.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("admin coach reports API failed");
  }
  const learningActionQueue = await request("/api/admin/learning-action-queue?limit=20");
  if (
    learningActionQueue.status !== 200 ||
    learningActionQueue.data.educationOnly !== true ||
    !learningActionQueue.data.actions?.length ||
    learningActionQueue.data.actions?.some((item) => item.educationOnly !== true) ||
    !learningActionQueue.data.actions?.some((item) => (
      ["metric_followup", "context_followup", "evidence_followup", "assign_course_package", "coach_review", "collect_prerequisites"].includes(item.actionType) &&
      item.learner?.id &&
      item.label &&
      item.rationale &&
      item.constraints?.some((constraint) => constraint.includes("No stock recommendation"))
    )) ||
    typeof learningActionQueue.data.totals?.metricFollowups !== "number" ||
    typeof learningActionQueue.data.totals?.contextFollowups !== "number" ||
    !learningActionQueue.data.sourceInspiration?.some((item) => item.includes("analyzers")) ||
    !learningActionQueue.data.sourceInspiration?.some((item) => item.includes("execution")) ||
    !learningActionQueue.data.constraints?.some((item) => item.includes("real-money")) ||
    !learningActionQueue.data.constraints?.some((item) => item.includes("Backtest"))
  ) {
    throw new Error(`learning action queue API failed: ${learningActionQueue.status} ${JSON.stringify(learningActionQueue.data).slice(0, 1600)}`);
  }
  const contextLearningActionQueue = await request("/api/admin/learning-action-queue?actionType=context_followup&limit=20");
  if (
    contextLearningActionQueue.status !== 200 ||
    contextLearningActionQueue.data.educationOnly !== true ||
    contextLearningActionQueue.data.actions?.some((item) => item.actionType !== "context_followup") ||
    contextLearningActionQueue.data.constraints?.some((item) => /buy|sell|guaranteed profit/i.test(item))
  ) {
    throw new Error(`context learning action queue filter failed: ${contextLearningActionQueue.status} ${JSON.stringify(contextLearningActionQueue.data).slice(0, 1200)}`);
  }
  const bulkLearningActionQueue = await request("/api/admin/learning-action-queue/bulk", {
    method: "POST",
    body: {
      maxCreate: 5,
    },
  });
  if (
    bulkLearningActionQueue.status !== 201 ||
    bulkLearningActionQueue.data.educationOnly !== true ||
    bulkLearningActionQueue.data.summary?.candidates < 1 ||
    (bulkLearningActionQueue.data.summary?.created + bulkLearningActionQueue.data.summary?.reused + bulkLearningActionQueue.data.summary?.skipped) < 1 ||
    bulkLearningActionQueue.data.created?.some((item) => item.educationOnly !== true) ||
    bulkLearningActionQueue.data.reused?.some((item) => item.educationOnly !== true) ||
    bulkLearningActionQueue.data.skipped?.some((item) => item.educationOnly !== true) ||
    !bulkLearningActionQueue.data.queue?.educationOnly ||
    !bulkLearningActionQueue.data.constraints?.some((item) => item.includes("No stock recommendation")) ||
    !bulkLearningActionQueue.data.constraints?.some((item) => item.includes("real-money"))
  ) {
    throw new Error(`bulk learning action queue failed: ${bulkLearningActionQueue.status} ${JSON.stringify(bulkLearningActionQueue.data).slice(0, 1600)}`);
  }
  const learningActionOutcomes = await request("/api/admin/learning-action-outcomes?limit=20");
  if (
    learningActionOutcomes.status !== 200 ||
    learningActionOutcomes.data.educationOnly !== true ||
    learningActionOutcomes.data.summary?.total < 1 ||
    typeof learningActionOutcomes.data.summary?.completionRatePct !== "number" ||
    !learningActionOutcomes.data.items?.every((item) => item.educationOnly === true && item.actionType && item.outcome) ||
    !learningActionOutcomes.data.items?.some((item) => ["in_progress", "completed", "pending", "stuck"].includes(item.outcome)) ||
    !learningActionOutcomes.data.items?.every((item) => item.coach && item.segment) ||
    learningActionOutcomes.data.breakdowns?.educationOnly !== true ||
    !learningActionOutcomes.data.breakdowns?.byActionType?.some((item) => item.educationOnly === true && item.total >= 1 && typeof item.completionRatePct === "number") ||
    !learningActionOutcomes.data.breakdowns?.byCoach?.some((item) => item.educationOnly === true && item.total >= 1) ||
    !learningActionOutcomes.data.breakdowns?.bySegment?.some((item) => item.educationOnly === true && item.total >= 1) ||
    !learningActionOutcomes.data.constraints?.some((item) => item.includes("education service follow-through")) ||
    !learningActionOutcomes.data.constraints?.some((item) => item.includes("trading performance")) ||
    !learningActionOutcomes.data.constraints?.some((item) => item.includes("real-money"))
  ) {
    throw new Error(`learning action outcomes API failed: ${learningActionOutcomes.status} ${JSON.stringify(learningActionOutcomes.data).slice(0, 1600)}`);
  }
  const learningActionSlaQueue = await request("/api/admin/learning-action-sla-queue?limit=20&stuckThresholdPct=25");
  if (
    learningActionSlaQueue.status !== 200 ||
    learningActionSlaQueue.data.educationOnly !== true ||
    typeof learningActionSlaQueue.data.summary?.total !== "number" ||
    typeof learningActionSlaQueue.data.summary?.highPriority !== "number" ||
    learningActionSlaQueue.data.summary?.threshold !== 25 ||
    learningActionSlaQueue.data.outcomes?.educationOnly !== true ||
    learningActionSlaQueue.data.queue?.some((item) => (
      item.educationOnly !== true ||
      !["action_type", "coach", "segment"].includes(item.type) ||
      !["high", "normal", "low"].includes(item.priority) ||
      !["needs_intervention", "watch", "healthy"].includes(item.status) ||
      !item.nextAction
    )) ||
    !learningActionSlaQueue.data.constraints?.some((item) => item.includes("education service intervention")) ||
    !learningActionSlaQueue.data.constraints?.some((item) => item.includes("trading performance")) ||
    !learningActionSlaQueue.data.constraints?.some((item) => item.includes("real-money"))
  ) {
    throw new Error(`learning action SLA queue API failed: ${learningActionSlaQueue.status} ${JSON.stringify(learningActionSlaQueue.data).slice(0, 1600)}`);
  }
  const learningActionSlaTarget = learningActionSlaQueue.data.queue?.[0] || { type: "action_type", owner: "metric_followup" };
  const learningActionSlaAction = await request("/api/admin/learning-action-sla-queue/actions", {
    method: "POST",
    body: {
      action: "assign_owner",
      type: learningActionSlaTarget.type,
      owner: learningActionSlaTarget.owner,
      assignedCoachEmail: "coach-a@tradegym.local",
      note: "Assign education-service SLA owner for stuck learning actions. Keep the follow-up limited to learning operations and classroom support.",
    },
  });
  if (
    learningActionSlaAction.status !== 201 ||
    learningActionSlaAction.data.educationOnly !== true ||
    learningActionSlaAction.data.action?.type !== "learning_action_sla_action" ||
    learningActionSlaAction.data.action?.action !== "assign_owner" ||
    learningActionSlaAction.data.action?.assignedCoachEmail !== "coach-a@tradegym.local" ||
    learningActionSlaAction.data.action?.educationOnly !== true ||
    !learningActionSlaAction.data.queue?.recentActions?.some((item) => item.action === "assign_owner" && item.owner === learningActionSlaTarget.owner) ||
    !learningActionSlaAction.data.constraints?.some((item) => item.includes("stock recommendations")) ||
    !learningActionSlaAction.data.constraints?.some((item) => item.includes("real-money"))
  ) {
    throw new Error(`learning action SLA action API failed: ${learningActionSlaAction.status} ${JSON.stringify(learningActionSlaAction.data).slice(0, 1600)}`);
  }
  const contextRiskReport = adminCoachReports.data.reports.find((item) => (
    item.marketContextClassroom?.riskSummary?.educationOnly === true &&
    (
      item.marketContextClassroom?.riskSummary?.operatingStatus === "needs_boundary_repair" ||
      item.marketContextClassroom?.riskSummary?.dominantRisk
    )
  ));
  if (!contextRiskReport?.learner?.id) {
    throw new Error("admin coach reports did not expose a context-risk follow-up candidate");
  }
  const contextRiskFollowup = await request("/api/admin/context-risk-followups", {
    method: "POST",
    body: { userId: contextRiskReport.learner.id },
  });
  if (
    ![200, 201].includes(contextRiskFollowup.status) ||
    contextRiskFollowup.data.task?.source !== "context_risk_followup" ||
    contextRiskFollowup.data.task?.priority !== "high" ||
    !contextRiskFollowup.data.task?.dueAt ||
    contextRiskFollowup.data.task?.educationOnly !== true ||
    !contextRiskFollowup.data.task?.requestNote?.includes("Do not convert news") ||
    !contextRiskFollowup.data.task?.constraints?.some((item) => item.includes("No stock recommendation")) ||
    contextRiskFollowup.data.riskSummary?.signalUseProhibited !== true
  ) {
    throw new Error(`context risk follow-up API failed: ${contextRiskFollowup.status} ${JSON.stringify(contextRiskFollowup.data).slice(0, 1200)}`);
  }
  const reusedContextRiskFollowup = await request("/api/admin/context-risk-followups", {
    method: "POST",
    body: { userId: contextRiskReport.learner.id },
  });
  if (
    reusedContextRiskFollowup.status !== 200 ||
    reusedContextRiskFollowup.data.reused !== true ||
    reusedContextRiskFollowup.data.task?.id !== contextRiskFollowup.data.task.id
  ) {
    throw new Error(`context risk follow-up reuse failed: ${reusedContextRiskFollowup.status} ${JSON.stringify(reusedContextRiskFollowup.data).slice(0, 1200)}`);
  }
  const bulkContextRiskFollowups = await request("/api/admin/context-risk-followups/bulk", {
    method: "POST",
    body: { maxCreate: 5 },
  });
  if (
    bulkContextRiskFollowups.status !== 201 ||
    bulkContextRiskFollowups.data.summary?.candidates < 1 ||
    (bulkContextRiskFollowups.data.summary?.created + bulkContextRiskFollowups.data.summary?.reused) < 1 ||
    !bulkContextRiskFollowups.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`bulk context risk follow-up failed: ${bulkContextRiskFollowups.status} ${JSON.stringify(bulkContextRiskFollowups.data).slice(0, 1200)}`);
  }
  const contextRiskCoachTasks = await request(`/api/admin/coach-review-tasks?status=open&priority=high&q=${encodeURIComponent("news and sentiment boundary repair")}&limit=40`);
  if (
    contextRiskCoachTasks.status !== 200 ||
    !contextRiskCoachTasks.data.tasks?.some((item) => (
      item.id === contextRiskFollowup.data.task.id &&
      item.source === "context_risk_followup" &&
      item.educationOnly === true &&
      item.overdue === false
    ))
  ) {
    throw new Error(`context risk follow-up missing from coach task queue: ${contextRiskCoachTasks.status} ${JSON.stringify(contextRiskCoachTasks.data).slice(0, 1200)}`);
  }
  if (contextRiskFollowup.data.reused !== true) {
    const contextRiskFollowupAudit = await request("/api/admin/audit-logs?type=context_risk_followup_created&limit=100");
    if (
      contextRiskFollowupAudit.status !== 200 ||
      !contextRiskFollowupAudit.data.items?.some((item) => (
        item.taskId === contextRiskFollowup.data.task.id &&
        item.educationOnly === true &&
        item.moderationStatus === "approved"
      ))
    ) {
      throw new Error(`context risk follow-up audit missing: ${contextRiskFollowupAudit.status} ${JSON.stringify(contextRiskFollowupAudit.data).slice(0, 1200)}`);
    }
  }
  const completedContextRiskFollowup = await request("/api/admin/coach-review-tasks/update", {
    method: "POST",
    body: {
      taskId: contextRiskFollowup.data.task.id,
      status: "completed",
      coachNote: "Context boundary repair completed: learner should separate price action, news context, invalidation, risk size, and no-trade alternatives before the next education drill.",
    },
  });
  if (
    completedContextRiskFollowup.status !== 200 ||
    completedContextRiskFollowup.data.task?.status !== "completed" ||
    completedContextRiskFollowup.data.task?.source !== "context_risk_followup" ||
    completedContextRiskFollowup.data.task?.educationOnly !== true
  ) {
    throw new Error(`context risk follow-up completion failed: ${completedContextRiskFollowup.status} ${JSON.stringify(completedContextRiskFollowup.data).slice(0, 1200)}`);
  }
  const contextRiskProgressReport = await request(`/api/admin/learner-progress-report?userId=${encodeURIComponent(contextRiskReport.learner.id)}`);
  if (
    contextRiskProgressReport.status !== 200 ||
    contextRiskProgressReport.data.report?.learningEvidencePacket?.contextRiskFollowupSummary?.completedContextRiskFollowups < 1 ||
    !contextRiskProgressReport.data.report?.learningEvidencePacket?.recentContextRiskFollowups?.some((item) => (
      item.id === contextRiskFollowup.data.task.id &&
      item.status === "completed" &&
      item.coachNote?.includes("Context boundary repair completed") &&
      item.educationOnly === true
    )) ||
    contextRiskProgressReport.data.report?.educationModelContext?.activity?.completedContextRiskFollowups < 1 ||
    contextRiskProgressReport.data.report?.educationModelContext?.learningSignals?.contextFollowupSummary?.completedContextRiskFollowups < 1 ||
    !contextRiskProgressReport.data.report?.educationModelContext?.recommendedTeachingMoves?.some((item) => item.includes("completed context-risk coach note")) ||
    !contextRiskProgressReport.data.report?.educationTutoringPlan?.focusAreas?.some((item) => item.includes("completed context-risk coach note"))
  ) {
    throw new Error(`completed context risk follow-up did not flow into learning evidence/model: ${contextRiskProgressReport.status} ${JSON.stringify(contextRiskProgressReport.data).slice(0, 1600)}`);
  }
  const contextRiskCompletionAudit = await request("/api/admin/audit-logs?type=context_risk_followup_completed&limit=20");
  if (
    contextRiskCompletionAudit.status !== 200 ||
    !contextRiskCompletionAudit.data.items?.some((item) => (
      item.taskId === contextRiskFollowup.data.task.id &&
      item.educationOnly === true &&
      item.moderationStatus === "approved"
    ))
  ) {
    throw new Error(`context risk follow-up completion audit missing: ${contextRiskCompletionAudit.status} ${JSON.stringify(contextRiskCompletionAudit.data).slice(0, 1200)}`);
  }
  const reportLearner = (
    adminCoachReports.data.reports.find((item) => item.learner?.email === learnerEmail) ||
    adminCoachReports.data.reports.find((item) => item.activity?.trainingAttempts >= 1)
  )?.learner;
  const adminProgressReport = await request(`/api/admin/learner-progress-report?userId=${encodeURIComponent(reportLearner?.id || "")}`);
  const adminNextLearningProduct = adminProgressReport.data.report?.nextLearningProduct;
  const adminNextLearningConstraints = adminNextLearningProduct?.constraints || [];
  if (
    adminProgressReport.status !== 200 ||
    adminProgressReport.data.report?.educationOnly !== true ||
    adminProgressReport.data.report?.learner?.id !== reportLearner?.id ||
    adminProgressReport.data.report?.activity?.trainingAttempts < 1 ||
    adminProgressReport.data.report?.educationModelContext?.educationOnly !== true ||
    adminProgressReport.data.report?.educationModelContext?.learningSignals?.contextRiskSummary?.educationOnly !== true ||
    !adminProgressReport.data.report?.educationModelContext?.prohibitedUses?.some((item) => item.includes("stock recommendations")) ||
    adminProgressReport.data.report?.educationTutoringPlan?.educationOnly !== true ||
    !adminProgressReport.data.report?.educationTutoringPlan?.lessonSteps?.length ||
    adminProgressReport.data.report?.coachReport?.marketContextClassroom?.riskSummary?.educationOnly !== true ||
    adminProgressReport.data.report?.coachReport?.marketContextClassroom?.riskSummary?.signalUseProhibited !== true ||
    !adminProgressReport.data.report?.courseCompletionEvidence?.every((item) => (
      item.educationOnly === true &&
      Array.isArray(item.requiredItems) &&
      Array.isArray(item.blockers) &&
      item.constraints?.some((constraint) => constraint.includes("not trading skill certification"))
    )) ||
    !adminProgressReport.data.report?.coachReport?.educationOnly ||
    adminNextLearningProduct?.educationOnly !== true ||
    !adminNextLearningProduct?.title ||
    !adminNextLearningProduct?.action ||
    ((adminProgressReport.data.report?.completionReports?.length || 0) > 0 && !adminNextLearningProduct?.sourceCompletionReportId) ||
    !adminNextLearningConstraints.some((item) => item.includes("No stock recommendation")) ||
    !adminNextLearningConstraints.some((item) => item.includes("real-money")) ||
    !adminProgressReport.data.report?.exportText?.includes("Education-only") ||
    !adminProgressReport.data.constraints?.some((item) => item.includes("No stock recommendation")) ||
    !adminProgressReport.data.constraints?.some((item) => item.includes("real-money"))
  ) {
    throw new Error(`admin learner progress report API failed: ${adminProgressReport.status} ${JSON.stringify(adminProgressReport.data).slice(0, 1600)}`);
  }
  const adminCompletionReport = adminProgressReport.data.report?.completionReports?.find((item) => item.status === "issued");
  if (adminCompletionReport) {
    const adminCompletionCertificate = await request(`/api/completion-certificate/export?reportId=${encodeURIComponent(adminCompletionReport.id)}&format=json`);
    if (
      adminCompletionCertificate.status !== 200 ||
      adminCompletionCertificate.data.certificate?.schemaVersion !== "education-completion-certificate-v1" ||
      adminCompletionCertificate.data.certificate?.reportId !== adminCompletionReport.id ||
      adminCompletionCertificate.data.certificate?.educationOnly !== true ||
      adminCompletionCertificate.data.certificate?.productionReady !== false ||
      !adminCompletionCertificate.data.certificate?.statements?.some((item) => item.includes("not trading skill certification")) ||
      !adminCompletionCertificate.data.note?.includes("not investment advice")
    ) {
      throw new Error(`admin completion certificate export failed: ${adminCompletionCertificate.status} ${JSON.stringify(adminCompletionCertificate.data).slice(0, 1200)}`);
    }
  }
  const adminEvidencePackets = await request(`/api/admin/learning-evidence-packets?q=${encodeURIComponent(reportLearner.email)}&limit=20`);
  if (
    adminEvidencePackets.status !== 200 ||
    adminEvidencePackets.data.educationOnly !== true ||
    !adminEvidencePackets.data.packets?.some((item) => (
      item.learnerId === reportLearner.id &&
      item.educationOnly === true &&
      item.packet?.schemaVersion === "learning-evidence-packet-v1" &&
      item.packet?.counts?.trainingAttempts >= 1 &&
      item.constraints?.some((constraint) => constraint.includes("No stock recommendation"))
    )) ||
    !adminEvidencePackets.data.constraints?.some((item) => item.includes("real-money"))
  ) {
    throw new Error(`admin learning evidence packets API failed: ${adminEvidencePackets.status} ${JSON.stringify(adminEvidencePackets.data).slice(0, 1200)}`);
  }
  const evidencePacketJsonExport = await request(`/api/admin/learning-evidence-packets/export?format=json&q=${encodeURIComponent(reportLearner.email)}`);
  if (
    evidencePacketJsonExport.status !== 200 ||
    evidencePacketJsonExport.data.educationOnly !== true ||
    !evidencePacketJsonExport.data.packets?.some((item) => item.learnerId === reportLearner.id) ||
    !evidencePacketJsonExport.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`learning evidence packet JSON export failed: ${evidencePacketJsonExport.status} ${JSON.stringify(evidencePacketJsonExport.data).slice(0, 1200)}`);
  }
  const evidencePacketCsvExport = await request(`/api/admin/learning-evidence-packets/export?format=csv&q=${encodeURIComponent(reportLearner.email)}`);
  if (
    evidencePacketCsvExport.status !== 200 ||
    typeof evidencePacketCsvExport.data !== "string" ||
    !evidencePacketCsvExport.data.includes("learnerId,email,name") ||
    !evidencePacketCsvExport.data.includes(reportLearner.email)
  ) {
    throw new Error(`learning evidence packet CSV export failed: ${evidencePacketCsvExport.status} ${String(evidencePacketCsvExport.data).slice(0, 1200)}`);
  }
  const evidenceFollowup = await request("/api/admin/learning-evidence-followups", {
    method: "POST",
    body: { userId: reportLearner.id },
  });
  if (
    ![200, 201].includes(evidenceFollowup.status) ||
    evidenceFollowup.data.task?.source !== "learning_evidence_followup" ||
    evidenceFollowup.data.task?.userId !== reportLearner.id ||
    evidenceFollowup.data.task?.priority !== "high" ||
    evidenceFollowup.data.task?.educationOnly !== true ||
    evidenceFollowup.data.packet?.schemaVersion !== "learning-evidence-packet-v1" ||
    !evidenceFollowup.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`learning evidence follow-up API failed: ${evidenceFollowup.status} ${JSON.stringify(evidenceFollowup.data).slice(0, 1200)}`);
  }
  const evidenceFollowupTasks = await request(`/api/admin/coach-review-tasks?status=open&q=${encodeURIComponent(reportLearner.email)}&limit=40`);
  if (
    evidenceFollowupTasks.status !== 200 ||
    !evidenceFollowupTasks.data.tasks?.some((item) => (
      item.id === evidenceFollowup.data.task.id &&
      item.source === "learning_evidence_followup" &&
      item.priority === "high" &&
      item.educationOnly === true
    ))
  ) {
    throw new Error(`learning evidence follow-up task missing from coach task list: ${evidenceFollowupTasks.status} ${JSON.stringify(evidenceFollowupTasks.data).slice(0, 1200)}`);
  }
  const adminProgressReportAfterEvidenceFollowup = await request(`/api/admin/learner-progress-report?userId=${encodeURIComponent(reportLearner.id)}`);
  if (
    adminProgressReportAfterEvidenceFollowup.status !== 200 ||
    adminProgressReportAfterEvidenceFollowup.data.report?.learningEvidencePacket?.followUpSummary?.openEvidenceFollowups < 1 ||
    adminProgressReportAfterEvidenceFollowup.data.report?.learningEvidencePacket?.followUpSummary?.educationOnly !== true ||
    !adminProgressReportAfterEvidenceFollowup.data.report?.learningEvidencePacket?.recentEvidenceFollowups?.some((item) => (
      item.id === evidenceFollowup.data.task.id &&
      item.status === "open" &&
      item.educationOnly === true
    )) ||
    !adminProgressReportAfterEvidenceFollowup.data.report?.learningEvidencePacket?.exportText?.includes("Evidence follow-ups")
  ) {
    throw new Error(`learning evidence follow-up missing from evidence packet: ${adminProgressReportAfterEvidenceFollowup.status} ${JSON.stringify(adminProgressReportAfterEvidenceFollowup.data).slice(0, 1200)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const evidenceLearnerPassword =
    reportLearner.email === learnerEmail ? "demo67890" :
    reportLearner.email === "student@tradegym.local" ? "demo123" :
    reportLearner.email === "admin@tradegym.local" ? "admin123" :
    null;
  if (!evidenceLearnerPassword) {
    throw new Error("cannot verify evidence follow-up read state without known learner password");
  }
  const evidenceLearnerLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: reportLearner.email, password: evidenceLearnerPassword },
  });
  if (evidenceLearnerLogin.status !== 200 || evidenceLearnerLogin.data.session?.email !== reportLearner.email) {
    throw new Error("learner login for evidence follow-up read failed");
  }
  const evidenceFollowupRead = await request("/api/learning-evidence-followups/read", {
    method: "POST",
    body: { taskId: evidenceFollowup.data.task.id },
  });
  if (
    evidenceFollowupRead.status !== 200 ||
    evidenceFollowupRead.data.task?.id !== evidenceFollowup.data.task.id ||
    evidenceFollowupRead.data.task?.status !== "open" ||
    !evidenceFollowupRead.data.task?.learnerOpenedAt ||
    evidenceFollowupRead.data.notifications?.notifications?.some((item) => (
      item.type === "learning_evidence_followup" &&
      item.taskId === evidenceFollowup.data.task.id &&
      item.status !== "read"
    )) ||
    evidenceFollowupRead.data.report?.learningEvidencePacket?.followUpSummary?.openEvidenceFollowups < 1 ||
    !evidenceFollowupRead.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`learning evidence follow-up read failed: ${evidenceFollowupRead.status} ${JSON.stringify(evidenceFollowupRead.data).slice(0, 1200)}`);
  }
  const evidenceFollowupResponse = await request("/api/learning-evidence-followups/respond", {
    method: "POST",
    body: {
      taskId: evidenceFollowup.data.task.id,
      learnerResponse: "I will add one replay note and one paper trade journal that separates news and sentiment context from any simulated decision.",
    },
  });
  if (
    evidenceFollowupResponse.status !== 200 ||
    evidenceFollowupResponse.data.task?.id !== evidenceFollowup.data.task.id ||
    evidenceFollowupResponse.data.task?.status !== "open" ||
    evidenceFollowupResponse.data.task?.learnerStatus !== "responded" ||
    !evidenceFollowupResponse.data.task?.learnerRespondedAt ||
    !evidenceFollowupResponse.data.task?.learnerResponse?.includes("paper trade journal") ||
    evidenceFollowupResponse.data.task?.nextEducationAction?.actionType !== "add_replay_note" ||
    !evidenceFollowupResponse.data.task?.nextEducationAction?.label?.includes("replay note") ||
    evidenceFollowupResponse.data.report?.learningEvidencePacket?.followUpSummary?.respondedEvidenceFollowups < 1 ||
    !evidenceFollowupResponse.data.report?.learningEvidencePacket?.evidenceNextActionCandidates?.some((item) => (
      item.taskId === evidenceFollowup.data.task.id &&
      item.actionType === "add_replay_note" &&
      item.educationOnly === true
    )) ||
    !evidenceFollowupResponse.data.report?.learningEvidencePacket?.recentEvidenceFollowups?.some((item) => (
      item.id === evidenceFollowup.data.task.id &&
      item.learnerStatus === "responded" &&
      item.learnerResponse?.includes("paper trade journal") &&
      item.nextEducationAction?.actionType === "add_replay_note"
    )) ||
    !evidenceFollowupResponse.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`learning evidence follow-up response failed: ${evidenceFollowupResponse.status} ${JSON.stringify(evidenceFollowupResponse.data).slice(0, 1200)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const adminAfterEvidenceRead = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminAfterEvidenceRead.status !== 200 || adminAfterEvidenceRead.data.session?.role !== "admin") {
    throw new Error("admin relogin after evidence follow-up read failed");
  }
  const respondedEvidenceFollowupTasks = await request(`/api/admin/coach-review-tasks?status=open&learnerStatus=responded&q=${encodeURIComponent("paper trade journal")}&limit=40`);
  if (
    respondedEvidenceFollowupTasks.status !== 200 ||
    respondedEvidenceFollowupTasks.data.totals?.respondedOpen < 1 ||
    !respondedEvidenceFollowupTasks.data.tasks?.some((item) => (
      item.id === evidenceFollowup.data.task.id &&
      item.learnerStatus === "responded" &&
      item.learnerResponse?.includes("paper trade journal") &&
      item.nextEducationAction?.actionType === "add_replay_note" &&
      item.educationOnly === true
    )) ||
    !respondedEvidenceFollowupTasks.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`responded evidence follow-up missing from coach queue: ${respondedEvidenceFollowupTasks.status} ${JSON.stringify(respondedEvidenceFollowupTasks.data).slice(0, 1200)}`);
  }
  const readyToApplyEvidenceTasks = await request("/api/admin/coach-review-tasks?status=open&evidenceLoopStatus=ready_to_apply&limit=40");
  if (
    readyToApplyEvidenceTasks.status !== 200 ||
    !readyToApplyEvidenceTasks.data.tasks?.some((item) => (
      item.id === evidenceFollowup.data.task.id &&
      item.source === "learning_evidence_followup" &&
      item.learnerRespondedAt &&
      item.nextEducationAction?.actionType === "add_replay_note" &&
      !item.nextEducationActionAppliedAt
    )) ||
    !readyToApplyEvidenceTasks.data.constraints?.some((item) => item.includes("Evidence loop filters"))
  ) {
    throw new Error(`ready-to-apply evidence loop filter failed: ${readyToApplyEvidenceTasks.status} ${JSON.stringify(readyToApplyEvidenceTasks.data).slice(0, 1200)}`);
  }
  const appliedEvidenceNextAction = await request("/api/admin/learning-evidence-next-actions/apply", {
    method: "POST",
    body: { taskId: evidenceFollowup.data.task.id },
  });
  if (
    appliedEvidenceNextAction.status !== 201 ||
    appliedEvidenceNextAction.data.assignment?.source !== "learning_evidence_next_action" ||
    appliedEvidenceNextAction.data.assignment?.evidenceFollowupTaskId !== evidenceFollowup.data.task.id ||
    appliedEvidenceNextAction.data.assignment?.nextEducationActionType !== "add_replay_note" ||
    appliedEvidenceNextAction.data.assignment?.educationOnly !== true ||
    appliedEvidenceNextAction.data.task?.nextEducationActionAppliedAt == null ||
    appliedEvidenceNextAction.data.task?.nextEducationActionAssignmentId !== appliedEvidenceNextAction.data.assignment?.id ||
    appliedEvidenceNextAction.data.task?.nextEducationActionAssignment?.status !== "assigned" ||
    !appliedEvidenceNextAction.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`apply evidence next action failed: ${appliedEvidenceNextAction.status} ${JSON.stringify(appliedEvidenceNextAction.data).slice(0, 1200)}`);
  }
  const awaitingAssignmentEvidenceTasks = await request("/api/admin/coach-review-tasks?status=open&evidenceLoopStatus=awaiting_assignment_completion&limit=40");
  if (
    awaitingAssignmentEvidenceTasks.status !== 200 ||
    !awaitingAssignmentEvidenceTasks.data.tasks?.some((item) => (
      item.id === evidenceFollowup.data.task.id &&
      item.source === "learning_evidence_followup" &&
      item.nextEducationActionAppliedAt &&
      item.nextEducationActionAssignment?.id === appliedEvidenceNextAction.data.assignment.id &&
      item.nextEducationActionAssignment?.status === "assigned"
    )) ||
    !awaitingAssignmentEvidenceTasks.data.constraints?.some((item) => item.includes("Evidence loop filters"))
  ) {
    throw new Error(`awaiting-assignment evidence loop filter failed: ${awaitingAssignmentEvidenceTasks.status} ${JSON.stringify(awaitingAssignmentEvidenceTasks.data).slice(0, 1200)}`);
  }
  const reusedEvidenceNextAction = await request("/api/admin/learning-evidence-next-actions/apply", {
    method: "POST",
    body: { taskId: evidenceFollowup.data.task.id },
  });
  if (
    reusedEvidenceNextAction.status !== 200 ||
    reusedEvidenceNextAction.data.reused !== true ||
    reusedEvidenceNextAction.data.assignment?.id !== appliedEvidenceNextAction.data.assignment.id ||
    !reusedEvidenceNextAction.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`reused evidence next action failed: ${reusedEvidenceNextAction.status} ${JSON.stringify(reusedEvidenceNextAction.data).slice(0, 1200)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const evidenceLearnerNextActionLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: reportLearner.email, password: evidenceLearnerPassword },
  });
  if (evidenceLearnerNextActionLogin.status !== 200 || evidenceLearnerNextActionLogin.data.session?.email !== reportLearner.email) {
    throw new Error("learner login for evidence next-action assignment failed");
  }
  const learnerBootstrapForNextAction = await request("/api/bootstrap");
  const nextActionScenario = learnerBootstrapForNextAction.data.scenarios?.find((item) => item.id === appliedEvidenceNextAction.data.assignment.scenarioId);
  if (!nextActionScenario) {
    throw new Error("next-action assignment scenario missing from learner bootstrap");
  }
  const nextActionAttempt = await request("/api/attempts", {
    method: "POST",
    body: {
      scenarioId: nextActionScenario.id,
      selectedIndex: nextActionScenario.answer,
      plan: "Education-only next action: write the replay note, invalidation rule, risk boundary, and context boundary before reading outcome feedback.",
    },
  });
  if (
    nextActionAttempt.status !== 201 ||
    !nextActionAttempt.data.practiceAssignments?.some((item) => (
      item.id === appliedEvidenceNextAction.data.assignment.id &&
      item.status === "completed" &&
      item.completedAttemptId === nextActionAttempt.data.attempt.id &&
      item.source === "learning_evidence_next_action"
    ))
  ) {
    throw new Error(`next-action assignment was not completed by learner attempt: ${nextActionAttempt.status} ${JSON.stringify(nextActionAttempt.data).slice(0, 1200)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const adminAfterNextActionAttempt = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminAfterNextActionAttempt.status !== 200 || adminAfterNextActionAttempt.data.session?.role !== "admin") {
    throw new Error("admin relogin after evidence next-action attempt failed");
  }
  const completedNextActionCoachTask = await request(`/api/admin/coach-review-tasks?status=open&learnerStatus=responded&q=${encodeURIComponent("paper trade journal")}&limit=40`);
  if (
    completedNextActionCoachTask.status !== 200 ||
    completedNextActionCoachTask.data.evidenceLoop?.assigned < 1 ||
    completedNextActionCoachTask.data.evidenceLoop?.learnerResponded < 1 ||
    completedNextActionCoachTask.data.evidenceLoop?.nextActionApplied < 1 ||
    completedNextActionCoachTask.data.evidenceLoop?.nextActionAssignmentsCompleted < 1 ||
    completedNextActionCoachTask.data.evidenceLoop?.backlog?.readyForCoachCompletion < 1 ||
    !completedNextActionCoachTask.data.evidenceLoop?.nextOperations?.some((item) => item.includes("ready for coach closure")) ||
    !completedNextActionCoachTask.data.evidenceLoop?.coachBreakdown?.some((item) => item.educationOnly === true && item.readyForCoachCompletion >= 1) ||
    completedNextActionCoachTask.data.evidenceLoop?.educationOnly !== true ||
    !completedNextActionCoachTask.data.evidenceLoop?.constraints?.some((item) => item.includes("education service follow-through")) ||
    !completedNextActionCoachTask.data.tasks?.some((item) => (
      item.id === evidenceFollowup.data.task.id &&
      item.nextEducationActionAssignment?.id === appliedEvidenceNextAction.data.assignment.id &&
      item.nextEducationActionAssignment?.status === "completed" &&
      item.nextEducationActionAssignment?.completedAttemptId === nextActionAttempt.data.attempt.id
    ))
  ) {
    throw new Error(`completed next-action assignment missing from coach task: ${completedNextActionCoachTask.status} ${JSON.stringify(completedNextActionCoachTask.data).slice(0, 1200)}`);
  }
  const readyClosureLoopTasks = await request("/api/admin/coach-review-tasks?evidenceLoopStatus=ready_for_coach_closure&limit=40");
  if (
    readyClosureLoopTasks.status !== 200 ||
    !readyClosureLoopTasks.data.tasks?.some((item) => (
      item.id === evidenceFollowup.data.task.id &&
      item.nextEducationActionAssignment?.status === "completed"
    )) ||
    !readyClosureLoopTasks.data.constraints?.some((item) => item.includes("Evidence loop filters"))
  ) {
    throw new Error(`ready-for-closure evidence loop filter failed: ${readyClosureLoopTasks.status} ${JSON.stringify(readyClosureLoopTasks.data).slice(0, 1200)}`);
  }
  const evidenceLoopJsonExport = await request(`/api/admin/learning-evidence-loop/export?format=json&q=${encodeURIComponent(reportLearner.email)}`);
  if (
    evidenceLoopJsonExport.status !== 200 ||
    evidenceLoopJsonExport.data.summary?.educationOnly !== true ||
    evidenceLoopJsonExport.data.summary?.nextActionAssignmentsCompleted < 1 ||
    evidenceLoopJsonExport.data.summary?.backlog?.readyForCoachCompletion < 1 ||
    !evidenceLoopJsonExport.data.summary?.nextOperations?.some((item) => item.includes("ready for coach closure")) ||
    !evidenceLoopJsonExport.data.summary?.coachBreakdown?.some((item) => item.educationOnly === true && item.readyForCoachCompletion >= 1) ||
    !evidenceLoopJsonExport.data.rows?.some((item) => (
      item.taskId === evidenceFollowup.data.task.id &&
      item.assignmentId === appliedEvidenceNextAction.data.assignment.id &&
      item.assignmentStatus === "completed" &&
      item.backlogStatus === "ready_for_coach_closure" &&
      item.coach &&
      item.educationOnly === true
    )) ||
    !evidenceLoopJsonExport.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`learning evidence loop JSON export failed: ${evidenceLoopJsonExport.status} ${JSON.stringify(evidenceLoopJsonExport.data).slice(0, 1200)}`);
  }
  const evidenceLoopCsvExport = await request(`/api/admin/learning-evidence-loop/export?format=csv&q=${encodeURIComponent(reportLearner.email)}`);
  if (
    evidenceLoopCsvExport.status !== 200 ||
    typeof evidenceLoopCsvExport.data !== "string" ||
    !evidenceLoopCsvExport.data.includes("taskId,evidenceType,email,learnerName,coach,backlogStatus") ||
    !evidenceLoopCsvExport.data.includes(appliedEvidenceNextAction.data.assignment.id) ||
    !evidenceLoopCsvExport.data.includes("ready_for_coach_closure") ||
    !evidenceLoopCsvExport.data.includes("completed")
  ) {
    throw new Error(`learning evidence loop CSV export failed: ${evidenceLoopCsvExport.status} ${String(evidenceLoopCsvExport.data).slice(0, 1200)}`);
  }
  const evidenceLoopExportAudit = await request("/api/admin/audit-logs?type=learning_evidence_loop_exported&limit=20");
  if (
    evidenceLoopExportAudit.status !== 200 ||
    !evidenceLoopExportAudit.data.items?.some((item) => (
      item.type === "learning_evidence_loop_exported" &&
      item.educationOnly === true &&
      item.moderationStatus === "approved" &&
      item.rowCount >= 1 &&
      ["json", "csv"].includes(item.format)
    ))
  ) {
    throw new Error(`learning evidence loop export audit missing: ${evidenceLoopExportAudit.status} ${JSON.stringify(evidenceLoopExportAudit.data).slice(0, 1200)}`);
  }
  const completedEvidenceFollowup = await request("/api/admin/coach-review-tasks/update", {
    method: "POST",
    body: {
      taskId: evidenceFollowup.data.task.id,
      status: "completed",
      coachNote: "Evidence follow-up completed: learner should add one context-bound paper trade journal and one replay note before the next review.",
    },
  });
  if (
    completedEvidenceFollowup.status !== 200 ||
    completedEvidenceFollowup.data.task?.status !== "completed" ||
    completedEvidenceFollowup.data.task?.source !== "learning_evidence_followup" ||
    completedEvidenceFollowup.data.task?.educationOnly !== true
  ) {
    throw new Error(`learning evidence follow-up completion failed: ${completedEvidenceFollowup.status} ${JSON.stringify(completedEvidenceFollowup.data).slice(0, 1200)}`);
  }
  const adminProgressReportAfterEvidenceCompletion = await request(`/api/admin/learner-progress-report?userId=${encodeURIComponent(reportLearner.id)}`);
  if (
    adminProgressReportAfterEvidenceCompletion.status !== 200 ||
    adminProgressReportAfterEvidenceCompletion.data.report?.learningEvidencePacket?.followUpSummary?.completedEvidenceFollowups < 1 ||
    !adminProgressReportAfterEvidenceCompletion.data.report?.learningEvidencePacket?.recentEvidenceFollowups?.some((item) => (
      item.id === evidenceFollowup.data.task.id &&
      item.status === "completed" &&
      item.coachNote?.includes("Evidence follow-up completed") &&
      item.educationOnly === true
    ))
  ) {
    throw new Error(`completed learning evidence follow-up missing from evidence packet: ${adminProgressReportAfterEvidenceCompletion.status} ${JSON.stringify(adminProgressReportAfterEvidenceCompletion.data).slice(0, 1200)}`);
  }
  const learnerReportDelivery = await request("/api/admin/learner-report-deliveries", {
    method: "POST",
    body: {
      userId: reportLearner.id,
      coachNote: "The learner has completed education drills and should focus on a clearer invalidation plan before taking the next simulated practice.",
      nextStep: "Complete one replay note and rewrite the risk plan before the next drill.",
    },
  });
  if (
    learnerReportDelivery.status !== 201 ||
    learnerReportDelivery.data.delivery?.educationOnly !== true ||
    learnerReportDelivery.data.delivery?.userId !== reportLearner.id ||
    !learnerReportDelivery.data.assignment?.id ||
    learnerReportDelivery.data.assignment?.educationOnly !== true ||
    learnerReportDelivery.data.delivery?.assignmentId !== learnerReportDelivery.data.assignment.id ||
    !learnerReportDelivery.data.delivery?.constraints?.some((item) => item.includes("No stock recommendation")) ||
    !learnerReportDelivery.data.report?.reportDeliveries?.some((item) => (
      item.id === learnerReportDelivery.data.delivery.id &&
      item.assignment?.id === learnerReportDelivery.data.assignment.id &&
      item.assignment?.status === "assigned"
    ))
  ) {
    throw new Error("learner report delivery API failed");
  }
  const blockedLearnerReportDelivery = await request("/api/admin/learner-report-deliveries", {
    method: "POST",
    body: {
      userId: reportLearner.id,
      coachNote: "The learner should buy AAPL now based on this live signal for guaranteed profit.",
      nextStep: "Follow this trade in real money.",
    },
  });
  if (
    blockedLearnerReportDelivery.status !== 422 ||
    blockedLearnerReportDelivery.data.complianceGuard?.blocked !== true ||
    !blockedLearnerReportDelivery.data.complianceGuard?.matches?.length
  ) {
    throw new Error("learner report delivery compliance guard did not block prohibited advice");
  }
  const learnerReportDeliveries = await request(`/api/admin/learner-report-deliveries?userId=${encodeURIComponent(reportLearner.id)}&limit=20`);
  if (
    learnerReportDeliveries.status !== 200 ||
    !learnerReportDeliveries.data.deliveries?.some((item) => item.id === learnerReportDelivery.data.delivery.id) ||
    !learnerReportDeliveries.data.constraints?.some((item) => item.includes("real-money trading instructions"))
  ) {
    throw new Error("learner report deliveries list API failed");
  }
  const adminProgressReportAfterDelivery = await request(`/api/admin/learner-progress-report?userId=${encodeURIComponent(reportLearner.id)}`);
  if (
    adminProgressReportAfterDelivery.status !== 200 ||
    !adminProgressReportAfterDelivery.data.report?.reportDeliveries?.some((item) => item.id === learnerReportDelivery.data.delivery.id)
  ) {
    throw new Error("learner progress report delivery history missing");
  }
  const serviceDeliveryDashboard = await request("/api/admin/service-delivery-dashboard?limit=40");
  if (
    serviceDeliveryDashboard.status !== 200 ||
    serviceDeliveryDashboard.data.summary?.delivered < 1 ||
    serviceDeliveryDashboard.data.summary?.unread < 1 ||
    serviceDeliveryDashboard.data.summary?.linkedAssignments < 1 ||
    serviceDeliveryDashboard.data.summary?.waitingForRead < 1 ||
    !serviceDeliveryDashboard.data.items?.some((item) => (
      item.id === learnerReportDelivery.data.delivery.id &&
      item.learnerStatus === "unread" &&
      item.followUpStatus === "waiting_for_read" &&
      item.followUpReason?.includes("Waiting for learner") &&
      item.assignment?.id === learnerReportDelivery.data.assignment.id
    )) ||
    !serviceDeliveryDashboard.data.constraints?.some((item) => item.includes("education follow-through"))
  ) {
    throw new Error("service delivery dashboard API failed");
  }
  const serviceSlaQueue = await request("/api/admin/service-sla-queue?limit=40&openLimit=1");
  if (
    serviceSlaQueue.status !== 200 ||
    serviceSlaQueue.data.summary?.total < 1 ||
    typeof serviceSlaQueue.data.summary?.openCoachTasks !== "number" ||
    serviceSlaQueue.data.summary?.openLimit !== 1 ||
    serviceSlaQueue.data.summary?.serviceFollowUps < 1 ||
    !serviceSlaQueue.data.queue?.some((item) => item.type === "learner_report_delivery" && item.educationOnly === true) ||
    serviceSlaQueue.data.workload?.educationOnly !== true ||
    typeof serviceSlaQueue.data.workload?.availableCoachCount !== "number" ||
    !Array.isArray(serviceSlaQueue.data.workload?.recommendations) ||
    !serviceSlaQueue.data.workload?.coaches?.every((item) => (
      typeof item.capacityRemaining === "number" &&
      typeof item.utilizationPct === "number" &&
      typeof item.recommendation === "string"
    )) ||
    !serviceSlaQueue.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`service SLA queue API failed: ${serviceSlaQueue.status} ${JSON.stringify(serviceSlaQueue.data).slice(0, 1200)}`);
  }
  const serviceFollowup = await request("/api/admin/service-delivery-followups", {
    method: "POST",
    body: {
      deliveryId: learnerReportDelivery.data.delivery.id,
    },
  });
  if (
    serviceFollowup.status !== 201 ||
    serviceFollowup.data.task?.source !== "service_delivery_followup" ||
    serviceFollowup.data.task?.deliveryId !== learnerReportDelivery.data.delivery.id ||
    serviceFollowup.data.task?.assignmentId !== learnerReportDelivery.data.assignment.id ||
    serviceFollowup.data.task?.educationOnly !== true ||
    !serviceFollowup.data.dashboard?.items?.some((item) => item.id === learnerReportDelivery.data.delivery.id)
  ) {
    throw new Error("service delivery follow-up task API failed");
  }
  const recommendedServiceAssignment = await request("/api/admin/coach-review-tasks/assign-recommended", {
    method: "POST",
    body: {
      taskId: serviceFollowup.data.task.id,
      openLimit: 500,
    },
  });
  if (
    recommendedServiceAssignment.status !== 200 ||
    recommendedServiceAssignment.data.task?.id !== serviceFollowup.data.task.id ||
    !recommendedServiceAssignment.data.assignment?.assignedCoachEmail ||
    recommendedServiceAssignment.data.assignment?.educationOnly !== true ||
    recommendedServiceAssignment.data.task?.assignedCoachEmail !== recommendedServiceAssignment.data.assignment.assignedCoachEmail ||
    recommendedServiceAssignment.data.slaQueue?.workload?.educationOnly !== true ||
    !recommendedServiceAssignment.data.constraints?.some((item) => item.includes("workload balancing"))
  ) {
    throw new Error(`recommended coach assignment API failed: ${recommendedServiceAssignment.status} ${JSON.stringify(recommendedServiceAssignment.data).slice(0, 1200)}`);
  }
  const serviceFollowupTasks = await request(`/api/admin/coach-review-tasks?status=open&q=${encodeURIComponent(reportLearner.email)}&limit=40`);
  if (
    serviceFollowupTasks.status !== 200 ||
    !serviceFollowupTasks.data.tasks?.some((item) => item.id === serviceFollowup.data.task.id && item.source === "service_delivery_followup")
  ) {
    throw new Error("service delivery follow-up task missing from coach task list");
  }
  const bulkServiceFollowups = await request("/api/admin/service-delivery-followups/bulk", {
    method: "POST",
    body: {
      includeWaiting: true,
      maxCreate: 0,
    },
  });
  if (
    bulkServiceFollowups.status !== 201 ||
    bulkServiceFollowups.data.summary?.candidates < 1 ||
    bulkServiceFollowups.data.summary?.maxCreate !== 0 ||
    bulkServiceFollowups.data.summary?.reused < 1 ||
    !bulkServiceFollowups.data.reused?.some((item) => item.id === serviceFollowup.data.task.id) ||
    !bulkServiceFollowups.data.slaQueue?.summary ||
    !bulkServiceFollowups.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("bulk service delivery follow-up API failed");
  }
  const cohortServiceSupportTicket = await request("/api/support/tickets", {
    method: "POST",
    body: {
      category: "coach_service",
      priority: "high",
      subject: "Cohort service SLA evidence",
      message: "Please route this education service request to customer success before the institution review packet is refreshed.",
    },
  });
  if (
    cohortServiceSupportTicket.status !== 201 ||
    cohortServiceSupportTicket.data.ticket?.email !== "admin@tradegym.local" ||
    cohortServiceSupportTicket.data.ticket?.educationOnly !== true
  ) {
    throw new Error(`cohort service support ticket failed: ${cohortServiceSupportTicket.status} ${JSON.stringify(cohortServiceSupportTicket.data).slice(0, 1000)}`);
  }
  const serviceSlaActions = await request("/api/admin/service-sla-actions/create", {
    method: "POST",
    body: {
      ownerEmail: "success@tradegym.local",
      limit: 12,
      openLimit: 1,
    },
  });
  if (
    ![200, 201].includes(serviceSlaActions.status) ||
    serviceSlaActions.data.productionReady !== false ||
    serviceSlaActions.data.educationOnly !== true ||
    serviceSlaActions.data.created < 1 ||
    !serviceSlaActions.data.actions?.some((item) => (
      String(item.sourceKey || "").startsWith("service_sla:") &&
      item.ownerEmail === "success@tradegym.local" &&
      item.educationOnly === true &&
      item.productionReady === false &&
      item.constraints?.some((constraint) => constraint.includes("not investment advice"))
    )) ||
    !serviceSlaActions.data.pilotSuccessActions?.actions?.some((item) => String(item.sourceKey || "").startsWith("service_sla:")) ||
    !serviceSlaActions.data.constraints?.some((item) => item.includes("customer-success tasks only"))
  ) {
    throw new Error(`service SLA actions API failed: ${serviceSlaActions.status} ${JSON.stringify(serviceSlaActions.data).slice(0, 1400)}`);
  }
  const cohortProcurementPacketWithSlaActions = await request(`/api/admin/cohort-procurement-packet?cohortId=${encodeURIComponent(cohort.data.cohort.id)}`);
  if (
    cohortProcurementPacketWithSlaActions.status !== 200 ||
    cohortProcurementPacketWithSlaActions.data.packet?.summary?.serviceSlaActionsOpen < 1 ||
    cohortProcurementPacketWithSlaActions.data.packet?.evidence?.serviceSlaActionRollup?.open < 1 ||
    !cohortProcurementPacketWithSlaActions.data.packet?.blockerCategories?.some((item) => item.category === "support_sla" && item.count >= 1 && item.evidence?.includes("service SLA action")) ||
    !cohortProcurementPacketWithSlaActions.data.packet?.executiveSummary?.some((item) => item.includes("Service follow-through"))
  ) {
    throw new Error(`cohort procurement packet service SLA rollup failed: ${cohortProcurementPacketWithSlaActions.status} ${JSON.stringify(cohortProcurementPacketWithSlaActions.data).slice(0, 1400)}`);
  }
  const cohortProcurementProgressWithSlaActions = await request(`/api/admin/cohort-procurement-progress?cohortId=${encodeURIComponent(cohort.data.cohort.id)}`);
  if (
    cohortProcurementProgressWithSlaActions.status !== 200 ||
    cohortProcurementProgressWithSlaActions.data.report?.summary?.serviceSlaActionRollup?.open < 1 ||
    cohortProcurementProgressWithSlaActions.data.report?.summary?.serviceSlaActionRollup?.productionReady !== false
  ) {
    throw new Error(`cohort procurement progress service SLA rollup failed: ${cohortProcurementProgressWithSlaActions.status} ${JSON.stringify(cohortProcurementProgressWithSlaActions.data).slice(0, 1400)}`);
  }
  const cohortRenewalReviewWithSlaActions = await request(`/api/admin/cohort-renewal-review?cohortId=${encodeURIComponent(cohort.data.cohort.id)}`);
  if (
    cohortRenewalReviewWithSlaActions.status !== 200 ||
    cohortRenewalReviewWithSlaActions.data.packet?.summary?.serviceSlaActionsOpen < 1 ||
    !cohortRenewalReviewWithSlaActions.data.packet?.renewalBlockers?.some((item) => item.category === "support_sla" && item.evidence?.includes("education service SLA action")) ||
    cohortRenewalReviewWithSlaActions.data.packet?.sections?.serviceSlaActionRollup?.productionReady !== false
  ) {
    throw new Error(`cohort renewal review service SLA rollup failed: ${cohortRenewalReviewWithSlaActions.status} ${JSON.stringify(cohortRenewalReviewWithSlaActions.data).slice(0, 1400)}`);
  }
  const cohortRenewalReviewMdWithSlaActions = await request(`/api/admin/cohort-renewal-review/export?cohortId=${encodeURIComponent(cohort.data.cohort.id)}&format=md`);
  if (
    cohortRenewalReviewMdWithSlaActions.status !== 200 ||
    typeof cohortRenewalReviewMdWithSlaActions.data !== "string" ||
    !cohortRenewalReviewMdWithSlaActions.data.includes("Service SLA actions: open")
  ) {
    throw new Error(`cohort renewal review service SLA markdown failed: ${cohortRenewalReviewMdWithSlaActions.status} ${String(cohortRenewalReviewMdWithSlaActions.data).slice(0, 1200)}`);
  }
  const serviceSlaActionsReuse = await request("/api/admin/service-sla-actions/create", {
    method: "POST",
    body: {
      ownerEmail: "success@tradegym.local",
      limit: 12,
      openLimit: 1,
    },
  });
  if (
    serviceSlaActionsReuse.status !== 200 ||
    serviceSlaActionsReuse.data.created !== 0 ||
    serviceSlaActionsReuse.data.reused < serviceSlaActions.data.created ||
    serviceSlaActionsReuse.data.productionReady !== false
  ) {
    throw new Error(`service SLA action reuse failed: ${serviceSlaActionsReuse.status} ${JSON.stringify(serviceSlaActionsReuse.data).slice(0, 1200)}`);
  }
  const serviceSlaActionAudit = await request("/api/admin/audit-logs?type=service_sla_action_created&limit=20");
  if (
    serviceSlaActionAudit.status !== 200 ||
    !serviceSlaActionAudit.data.items?.some((item) => item.type === "service_sla_action_created" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`service SLA action audit missing: ${serviceSlaActionAudit.status} ${JSON.stringify(serviceSlaActionAudit.data).slice(0, 1200)}`);
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const learnerDeliveryPassword =
    reportLearner.email === learnerEmail ? "demo67890" :
    reportLearner.email === "student@tradegym.local" ? "demo123" :
    reportLearner.email === "admin@tradegym.local" ? "admin123" :
    null;
  if (!learnerDeliveryPassword) {
    throw new Error("cannot verify learner delivery status without known learner password");
  }
  const learnerDeliveryLogin = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: reportLearner.email,
      password: learnerDeliveryPassword,
    },
  });
  if (learnerDeliveryLogin.status !== 200 || learnerDeliveryLogin.data.session?.email !== reportLearner.email) {
    throw new Error("learner delivery login failed");
  }
  const learnerOwnDeliveries = await request("/api/learner/report-deliveries");
  if (
    learnerOwnDeliveries.status !== 200 ||
    !learnerOwnDeliveries.data.deliveries?.some((item) => (
      item.id === learnerReportDelivery.data.delivery.id &&
      (item.learnerStatus || "unread") === "unread" &&
      item.assignmentId === learnerReportDelivery.data.assignment.id
    )) ||
    !learnerOwnDeliveries.data.constraints?.some((item) => item.includes("not stock recommendations"))
  ) {
    throw new Error("learner own report deliveries API failed");
  }
  const learnerAssignmentsAfterDelivery = await request("/api/assignments");
  if (
    learnerAssignmentsAfterDelivery.status !== 200 ||
    !learnerAssignmentsAfterDelivery.data.assignments?.some((item) => (
      item.id === learnerReportDelivery.data.assignment.id &&
      item.status === "assigned" &&
      item.reportDeliveryId === learnerReportDelivery.data.delivery.id
    ))
  ) {
    throw new Error("learner report linked assignment missing");
  }
  const learnerNotifications = await request("/api/notifications");
  if (
    learnerNotifications.status !== 200 ||
    learnerNotifications.data.summary?.unread < 1 ||
    learnerNotifications.data.summary?.openAssignments < 1 ||
    learnerNotifications.data.summary?.evidenceFollowups < 1 ||
    !learnerNotifications.data.notifications?.some((item) => item.type === "coach_report_delivery" && item.deliveryId === learnerReportDelivery.data.delivery.id) ||
    !learnerNotifications.data.notifications?.some((item) => item.type === "practice_assignment" && item.assignmentId === learnerReportDelivery.data.assignment.id) ||
    !learnerNotifications.data.notifications?.some((item) => (
      item.type === "learning_evidence_followup" &&
      item.taskId === evidenceFollowup.data.task.id &&
      item.status === "read" &&
      item.actionLabel === "View coach note"
    )) ||
    !learnerNotifications.data.constraints?.some((item) => item.includes("not stock recommendations"))
  ) {
    throw new Error("learner notifications API failed");
  }
  const learnerReadDelivery = await request("/api/learner/report-deliveries/update", {
    method: "POST",
    body: {
      deliveryId: learnerReportDelivery.data.delivery.id,
      action: "read",
    },
  });
  if (
    learnerReadDelivery.status !== 200 ||
    learnerReadDelivery.data.delivery?.learnerStatus !== "read" ||
    !learnerReadDelivery.data.report?.reportDeliveries?.some((item) => item.id === learnerReportDelivery.data.delivery.id && item.learnerStatus === "read")
  ) {
    throw new Error("learner report delivery read update failed");
  }
  const learnerNotificationsAfterRead = await request("/api/notifications");
  if (
    learnerNotificationsAfterRead.status !== 200 ||
    !learnerNotificationsAfterRead.data.notifications?.some((item) => item.type === "coach_report_delivery" && item.deliveryId === learnerReportDelivery.data.delivery.id && item.status === "read")
  ) {
    throw new Error("learner notification did not reflect read delivery");
  }
  const learnerCompleteDelivery = await request("/api/learner/report-deliveries/update", {
    method: "POST",
    body: {
      deliveryId: learnerReportDelivery.data.delivery.id,
      action: "completed",
    },
  });
  if (
    learnerCompleteDelivery.status !== 200 ||
    learnerCompleteDelivery.data.delivery?.learnerStatus !== "completed" ||
    !learnerCompleteDelivery.data.delivery?.learnerCompletedAt ||
    !learnerCompleteDelivery.data.constraints?.some((item) => item.includes("education follow-through")) ||
    !learnerCompleteDelivery.data.report?.reportDeliveries?.some((item) => item.id === learnerReportDelivery.data.delivery.id && item.learnerStatus === "completed")
  ) {
    throw new Error("learner report delivery completion update failed");
  }
  const quotaEmail = `coach-quota-${Date.now()}@tradegym.local`;
  const quotaRegister = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Coach Quota Learner",
      email: quotaEmail,
      password: "demo12345",
      legalAcceptance: {
        accepted: true,
        termsVersion: legalVersions.terms,
        privacyVersion: legalVersions.privacy,
        riskDisclosureVersion: legalVersions.risk,
      },
    },
  });
  if (quotaRegister.status !== 201 || !quotaRegister.data.account?.id) {
    throw new Error("coach quota learner registration failed");
  }
  const quotaUserId = quotaRegister.data.account.id;
  const quotaCompliance = await request("/api/compliance/acknowledge", {
    method: "POST",
    body: {
      accepted: true,
      version: quotaRegister.data.compliance.version,
    },
  });
  if (quotaCompliance.status !== 200) {
    throw new Error("coach quota learner compliance failed");
  }
  const quotaCoachCheckout = await request("/api/billing/checkout-session", {
    method: "POST",
    body: { plan: "Coach" },
  });
  const quotaCoachPaid = await request("/api/billing/webhook", {
    method: "POST",
    body: { type: "payment.succeeded", orderId: quotaCoachCheckout.data.order.id },
  });
  if (quotaCoachPaid.status !== 200 || quotaCoachPaid.data.entitlement?.plan !== "Coach") {
    throw new Error("coach quota learner upgrade failed");
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const adminForCoachTasks = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminForCoachTasks.status !== 200 || adminForCoachTasks.data.session?.role !== "admin") {
    throw new Error("admin relogin for coach tasks failed");
  }
  const blockedCoachReviewTask = await request("/api/admin/coach-review-tasks", {
    method: "POST",
    body: {
      userId: quotaUserId,
      focus: "decision process",
      requestNote: "卖出 TSLA，跟单这个实盘信号。",
    },
  });
  if (
    blockedCoachReviewTask.status !== 422 ||
    blockedCoachReviewTask.data.complianceGuard?.blocked !== true ||
    !blockedCoachReviewTask.data.complianceGuard?.matches?.length
  ) {
    throw new Error("coach review task create compliance guard did not block prohibited advice");
  }
  const coachReviewTask = await request("/api/admin/coach-review-tasks", {
    method: "POST",
    body: {
      userId: quotaUserId,
      focus: "decision process",
      requestNote: "API verification coach review task",
      priority: "high",
      dueAt: "2000-01-01T00:00:00.000Z",
      assignedCoachEmail: "coach-a@tradegym.local",
    },
  });
  if (
    coachReviewTask.status !== 201 ||
    coachReviewTask.data.task?.status !== "open" ||
    coachReviewTask.data.task?.entitlementPlan !== "Coach" ||
    coachReviewTask.data.task?.quotaLimit !== 1 ||
    coachReviewTask.data.task?.quotaUsageAfterCreate !== 1 ||
    coachReviewTask.data.task?.priority !== "high" ||
    coachReviewTask.data.task?.dueAt !== "2000-01-01T00:00:00.000Z" ||
    coachReviewTask.data.task?.overdue !== true ||
    coachReviewTask.data.task?.assignedCoachEmail !== "coach-a@tradegym.local" ||
    coachReviewTask.data.task?.educationOnly !== true ||
    !coachReviewTask.data.task?.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`coach review task create API failed: ${coachReviewTask.status} ${JSON.stringify(coachReviewTask.data).slice(0, 1200)}`);
  }

  const exhaustedCoachReviewTask = await request("/api/admin/coach-review-tasks", {
    method: "POST",
    body: {
      userId: quotaUserId,
      focus: "quota should block this task",
      requestNote: "API verification quota exhaustion task",
    },
  });
  if (exhaustedCoachReviewTask.status !== 402 || exhaustedCoachReviewTask.data.entitlement?.remaining?.coachReview !== 0) {
    throw new Error("coach review quota exhaustion was not enforced");
  }

  await request("/api/auth/logout", { method: "POST", body: {} });
  const quotaRelogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: quotaEmail, password: "demo12345" },
  });
  if (quotaRelogin.status !== 200) {
    throw new Error("quota learner relogin failed");
  }
  const addonCheckoutLearner = await request("/api/billing/addon-checkout-session", {
    method: "POST",
    body: { productId: "coach_review_1" },
  });
  if (addonCheckoutLearner.status !== 200 || addonCheckoutLearner.data.order?.kind !== "addon" || addonCheckoutLearner.data.order?.coachReviewCredits !== 1) {
    throw new Error("coach review add-on checkout failed");
  }

  const addonPaid = await request("/api/billing/webhook", {
    method: "POST",
    body: { type: "payment.succeeded", orderId: addonCheckoutLearner.data.order.id },
  });
  if (
    addonPaid.status !== 200 ||
    addonPaid.data.order?.status !== "paid" ||
    addonPaid.data.entitlement?.limits?.addonCoachReviews < 1 ||
    addonPaid.data.entitlement?.remaining?.coachReview !== 1
  ) {
    throw new Error("coach review add-on payment failed");
  }

  const receipts = await request("/api/billing/receipts");
  if (
    receipts.status !== 200 ||
    !receipts.data.receipts?.some((item) => item.orderId === quotaCoachCheckout.data.order.id && item.kind === "subscription") ||
    !receipts.data.receipts?.some((item) => item.orderId === addonCheckoutLearner.data.order.id && item.kind === "addon") ||
    !receipts.data.note?.includes("Local demo receipts")
  ) {
    throw new Error("billing receipts API failed");
  }

  await request("/api/auth/logout", { method: "POST", body: {} });
  const adminForRevenueLedger = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminForRevenueLedger.status !== 200 || adminForRevenueLedger.data.session?.role !== "admin") {
    throw new Error("admin relogin for revenue ledger failed");
  }
  const revenueLedger = await request("/api/admin/revenue-ledger");
  if (
    revenueLedger.status !== 200 ||
    revenueLedger.data.totals?.grossCents < 69800 ||
    !revenueLedger.data.entries?.some((item) => item.orderId === addonCheckoutLearner.data.order.id && item.kind === "addon") ||
    !revenueLedger.data.note?.includes("Local demo revenue ledger")
  ) {
    throw new Error("admin revenue ledger API failed");
  }
  const billingComplianceQueue = await request("/api/admin/billing-compliance-queue?limit=80");
  if (
    billingComplianceQueue.status !== 200 ||
    billingComplianceQueue.data.educationOnly !== true ||
    billingComplianceQueue.data.productionReady !== false ||
    billingComplianceQueue.data.summary?.total < 1 ||
    typeof billingComplianceQueue.data.summary?.missingTaxInvoices !== "number" ||
    typeof billingComplianceQueue.data.summary?.localReconciliationGaps !== "number" ||
    !billingComplianceQueue.data.items?.some((item) => (
      item.orderId === addonCheckoutLearner.data.order.id &&
      item.educationOnly === true &&
      item.productionReady === false &&
      item.gaps?.includes("tax_invoice_missing") &&
      item.gaps?.includes("tax_profile_missing") &&
      item.gaps?.includes("processor_reconciliation_missing")
    )) ||
    !billingComplianceQueue.data.constraints?.some((item) => item.includes("Local receipts are not tax invoices")) ||
    !billingComplianceQueue.data.constraints?.some((item) => item.includes("production launch readiness"))
  ) {
    throw new Error(`billing compliance queue API failed: ${billingComplianceQueue.status} ${JSON.stringify(billingComplianceQueue.data).slice(0, 1600)}`);
  }
  const revenueOps = await request("/api/admin/revenue-ops?limit=80");
  if (
    revenueOps.status !== 200 ||
    revenueOps.data.summary?.activeAccounts < 1 ||
    revenueOps.data.summary?.netRevenueCents < 0 ||
    !revenueOps.data.items?.some((item) => item.educationOnly === true && item.renewalRisk && Array.isArray(item.riskReasons)) ||
    !revenueOps.data.constraints?.some((item) => item.includes("stock recommendation"))
  ) {
    throw new Error(`admin revenue ops API failed: ${revenueOps.status} ${JSON.stringify(revenueOps.data).slice(0, 1200)}`);
  }
  const revenueOpsTarget = revenueOps.data.items.find((item) => item.userId)?.userId;
  const revenueReminder = await request("/api/admin/revenue-ops/actions", {
    method: "POST",
    body: {
      userId: revenueOpsTarget,
      action: "send_reminder",
      message: "Complete the next education-only drill and review your coach note before the next session.",
    },
  });
  if (
    revenueReminder.status !== 201 ||
    revenueReminder.data.action?.educationOnly !== true ||
    !revenueReminder.data.action?.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("revenue ops reminder action failed");
  }
  const revenuePractice = await request("/api/admin/revenue-ops/actions", {
    method: "POST",
    body: {
      userId: revenueOpsTarget,
      action: "assign_practice",
    },
  });
  if (
    revenuePractice.status !== 201 ||
    revenuePractice.data.assignment?.source !== "revenue_ops" ||
    revenuePractice.data.assignment?.educationOnly !== true
  ) {
    throw new Error("revenue ops assign practice action failed");
  }
  const revenueFollowup = await request("/api/admin/revenue-ops/actions", {
    method: "POST",
    body: {
      userId: revenueOpsTarget,
      action: "create_followup",
    },
  });
  if (
    ![200, 201].includes(revenueFollowup.status) ||
    revenueFollowup.data.task?.source !== "revenue_ops_followup" ||
    revenueFollowup.data.task?.educationOnly !== true
  ) {
    throw new Error("revenue ops follow-up action failed");
  }
  const revenueOpsActions = await request("/api/admin/revenue-ops/actions?limit=80");
  if (
    revenueOpsActions.status !== 200 ||
    revenueOpsActions.data.summary?.total < 3 ||
    !revenueOpsActions.data.actions?.some((item) => item.type === "revenue_ops_reminder_created" && item.educationOnly === true) ||
    !revenueOpsActions.data.actions?.some((item) => item.type === "revenue_ops_practice_assigned" && item.assignment?.id === revenuePractice.data.assignment.id) ||
    (revenueFollowup.status === 201 && !revenueOpsActions.data.actions?.some((item) => item.type === "revenue_ops_followup_created" && item.task?.id === revenueFollowup.data.task.id)) ||
    !revenueOpsActions.data.constraints?.some((item) => item.includes("stock recommendation"))
  ) {
    throw new Error(`revenue ops action history API failed: ${revenueOpsActions.status} ${JSON.stringify(revenueOpsActions.data).slice(0, 1600)}`);
  }

  const productReadiness = await request("/api/admin/product-readiness");
  const productReadinessKeys = new Set((productReadiness.data.checks || []).map((item) => item.key));
  const requiredProductReadinessKeys = [
    "education_boundary",
    "training_loop",
    "replay_and_paper",
    "backtest_classroom",
    "content_pipeline",
    "coach_service",
    "commercial_ops",
    "data_governance",
  ];
  const productReadinessConstraints = (productReadiness.data.constraints || []).join(" ").toLowerCase();
  if (
    productReadiness.status !== 200 ||
    productReadiness.data.productionReady !== false ||
    productReadiness.data.educationOnly !== true ||
    productReadiness.data.summary?.total !== requiredProductReadinessKeys.length ||
    !requiredProductReadinessKeys.every((key) => productReadinessKeys.has(key)) ||
    !productReadiness.data.checks?.some((item) => (
      item.key === "data_governance" &&
      item.status === "gap" &&
      item.controls?.some((control) => control.key === "append_only_audit_storage" && control.status === "gap")
    )) ||
    !productReadinessConstraints.includes("investment advice") ||
    !productReadinessConstraints.includes("live trading signals") ||
    !productReadinessConstraints.includes("guaranteed returns") ||
    !productReadinessConstraints.includes("real-money trading readiness")
  ) {
    throw new Error(`admin product readiness API failed: ${productReadiness.status} ${JSON.stringify(productReadiness.data).slice(0, 1200)}`);
  }

  const prototypeScorecard = await request("/api/admin/commercial-prototype-scorecard");
  const prototypeScorecardConstraints = (prototypeScorecard.data.constraints || []).join(" ").toLowerCase();
  const prototypeScorecardProhibited = (prototypeScorecard.data.prohibitedUses || []).join(" ").toLowerCase();
  if (
    prototypeScorecard.status !== 200 ||
    prototypeScorecard.data.schemaVersion !== "commercial-prototype-scorecard-v1" ||
    prototypeScorecard.data.productionReady !== false ||
    prototypeScorecard.data.educationOnly !== true ||
    typeof prototypeScorecard.data.customerTrialReadinessScore !== "number" ||
    prototypeScorecard.data.customerTrialReadinessScore < 0 ||
    prototypeScorecard.data.customerTrialReadinessScore > 100 ||
    !["customer_trial_needs_owner_follow_through", "customer_trial_review_ready", "customer_trial_operating_gaps"].includes(prototypeScorecard.data.decision) ||
    prototypeScorecard.data.summary?.lanes !== 5 ||
    typeof prototypeScorecard.data.summary?.buyerReviewNeedsMoreEvidence !== "number" ||
    prototypeScorecard.data.summary?.readinessTotal !== requiredProductReadinessKeys.length ||
    !prototypeScorecard.data.lanes?.some((item) => item.key === "customer_trial" && item.productionReady === false) ||
    !prototypeScorecard.data.lanes?.some((item) => item.key === "education_boundary" && item.educationOnly === true) ||
    prototypeScorecard.data.summary?.blockers < 1 ||
    !prototypeScorecard.data.blockers?.some((item) => item.priority === "high" && item.productionReady === false) ||
    !prototypeScorecardConstraints.includes("education saas operating completeness") ||
    !prototypeScorecardConstraints.includes("productionready remains false") ||
    !prototypeScorecardProhibited.includes("stock recommendation") ||
    !prototypeScorecardProhibited.includes("profitability forecast")
  ) {
    throw new Error(`commercial prototype scorecard API failed: ${prototypeScorecard.status} ${JSON.stringify(prototypeScorecard.data).slice(0, 1800)}`);
  }
  const prototypeScorecardJsonExport = await request("/api/admin/commercial-prototype-scorecard/export?format=json");
  if (
    prototypeScorecardJsonExport.status !== 200 ||
    prototypeScorecardJsonExport.data.scorecard?.schemaVersion !== "commercial-prototype-scorecard-v1" ||
    prototypeScorecardJsonExport.data.scorecard?.productionReady !== false ||
    !prototypeScorecardJsonExport.data.note?.includes("education SaaS customer trial operations")
  ) {
    throw new Error(`commercial prototype scorecard JSON export failed: ${prototypeScorecardJsonExport.status} ${JSON.stringify(prototypeScorecardJsonExport.data).slice(0, 1200)}`);
  }
  const prototypeScorecardCsvExport = await request("/api/admin/commercial-prototype-scorecard/export?format=csv");
  if (
    prototypeScorecardCsvExport.status !== 200 ||
    typeof prototypeScorecardCsvExport.data !== "string" ||
    !prototypeScorecardCsvExport.data.startsWith("section,key,title,status,score,metric,priority,next,ownerEmail,educationOnly,productionReady") ||
    !prototypeScorecardCsvExport.data.includes("lane,customer_trial") ||
    !prototypeScorecardCsvExport.headers?.["content-disposition"]?.includes("tradegym-commercial-prototype-scorecard.csv")
  ) {
    throw new Error(`commercial prototype scorecard CSV export failed: ${prototypeScorecardCsvExport.status} ${String(prototypeScorecardCsvExport.data).slice(0, 1000)}`);
  }
  const prototypeScorecardMdExport = await request("/api/admin/commercial-prototype-scorecard/export?format=md");
  if (
    prototypeScorecardMdExport.status !== 200 ||
    typeof prototypeScorecardMdExport.data !== "string" ||
    !prototypeScorecardMdExport.data.includes("# TradeGym Commercial Prototype Scorecard") ||
    !prototypeScorecardMdExport.data.includes("Production ready: false") ||
    !prototypeScorecardMdExport.data.includes("real-money trading readiness") ||
    !prototypeScorecardMdExport.headers?.["content-disposition"]?.includes("tradegym-commercial-prototype-scorecard.md")
  ) {
    throw new Error(`commercial prototype scorecard Markdown export failed: ${prototypeScorecardMdExport.status} ${String(prototypeScorecardMdExport.data).slice(0, 1000)}`);
  }
  const prototypeScorecardExportAudit = await request("/api/admin/audit-logs?type=commercial_prototype_scorecard_exported&limit=20");
  if (
    prototypeScorecardExportAudit.status !== 200 ||
    !prototypeScorecardExportAudit.data.items?.some((item) => item.type === "commercial_prototype_scorecard_exported" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`commercial prototype scorecard export audit missing: ${prototypeScorecardExportAudit.status} ${JSON.stringify(prototypeScorecardExportAudit.data).slice(0, 1200)}`);
  }
  const trialKickoffPlan = await request("/api/admin/customer-trial-kickoff-plan");
  const trialKickoffConstraints = (trialKickoffPlan.data.constraints || []).join(" ").toLowerCase();
  const trialKickoffProhibited = (trialKickoffPlan.data.prohibitedUses || []).join(" ").toLowerCase();
  if (
    trialKickoffPlan.status !== 200 ||
    trialKickoffPlan.data.schemaVersion !== "customer-trial-kickoff-plan-v1" ||
    trialKickoffPlan.data.productionReady !== false ||
    trialKickoffPlan.data.educationOnly !== true ||
    !["kickoff_blocked_until_follow_through", "kickoff_needs_owner_follow_through", "kickoff_review_ready"].includes(trialKickoffPlan.data.decision) ||
    typeof trialKickoffPlan.data.scorecard?.customerTrialReadinessScore !== "number" ||
    trialKickoffPlan.data.scorecard?.customerTrialReadinessScore < 0 ||
    trialKickoffPlan.data.scorecard?.customerTrialReadinessScore > 100 ||
    trialKickoffPlan.data.summary?.steps !== 5 ||
    trialKickoffPlan.data.summary?.actionRecommended < 1 ||
    !trialKickoffPlan.data.steps?.some((item) => item.key === "share_trial_packet" && item.productionReady === false) ||
    !trialKickoffPlan.data.agenda?.some((item) => item.includes("education-only trial boundaries")) ||
    !trialKickoffPlan.data.successCriteria?.some((item) => item.includes("education workflow")) ||
    !trialKickoffConstraints.includes("bounded education saas trial") ||
    !trialKickoffConstraints.includes("productionready remains false") ||
    !trialKickoffProhibited.includes("stock recommendation") ||
    !trialKickoffProhibited.includes("production launch certification")
  ) {
    throw new Error(`customer trial kickoff plan API failed: ${trialKickoffPlan.status} ${JSON.stringify(trialKickoffPlan.data).slice(0, 1800)}`);
  }
  const trialKickoffJsonExport = await request("/api/admin/customer-trial-kickoff-plan/export?format=json");
  if (
    trialKickoffJsonExport.status !== 200 ||
    trialKickoffJsonExport.data.plan?.schemaVersion !== "customer-trial-kickoff-plan-v1" ||
    trialKickoffJsonExport.data.plan?.productionReady !== false ||
    !trialKickoffJsonExport.data.note?.includes("bounded education SaaS trial operations")
  ) {
    throw new Error(`customer trial kickoff plan JSON export failed: ${trialKickoffJsonExport.status} ${JSON.stringify(trialKickoffJsonExport.data).slice(0, 1200)}`);
  }
  const trialKickoffCsvExport = await request("/api/admin/customer-trial-kickoff-plan/export?format=csv");
  if (
    trialKickoffCsvExport.status !== 200 ||
    typeof trialKickoffCsvExport.data !== "string" ||
    !trialKickoffCsvExport.data.startsWith("section,key,title,status,priority,ownerEmail,evidence,next,educationOnly,productionReady") ||
    !trialKickoffCsvExport.data.includes("step,share_trial_packet") ||
    !trialKickoffCsvExport.headers?.["content-disposition"]?.includes("tradegym-customer-trial-kickoff-plan.csv")
  ) {
    throw new Error(`customer trial kickoff plan CSV export failed: ${trialKickoffCsvExport.status} ${String(trialKickoffCsvExport.data).slice(0, 1000)}`);
  }
  const trialKickoffMdExport = await request("/api/admin/customer-trial-kickoff-plan/export?format=md");
  if (
    trialKickoffMdExport.status !== 200 ||
    typeof trialKickoffMdExport.data !== "string" ||
    !trialKickoffMdExport.data.includes("# TradeGym Customer Trial Kickoff Plan") ||
    !trialKickoffMdExport.data.includes("Production ready: false") ||
    !trialKickoffMdExport.data.includes("real-money trading readiness") ||
    !trialKickoffMdExport.headers?.["content-disposition"]?.includes("tradegym-customer-trial-kickoff-plan.md")
  ) {
    throw new Error(`customer trial kickoff plan Markdown export failed: ${trialKickoffMdExport.status} ${String(trialKickoffMdExport.data).slice(0, 1000)}`);
  }
  const trialKickoffExportAudit = await request("/api/admin/audit-logs?type=customer_trial_kickoff_plan_exported&limit=20");
  if (
    trialKickoffExportAudit.status !== 200 ||
    !trialKickoffExportAudit.data.items?.some((item) => item.type === "customer_trial_kickoff_plan_exported" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`customer trial kickoff plan export audit missing: ${trialKickoffExportAudit.status} ${JSON.stringify(trialKickoffExportAudit.data).slice(0, 1200)}`);
  }
  const trialKickoffActions = await request("/api/admin/customer-trial-kickoff-plan/create-actions", {
    method: "POST",
    body: {
      ownerEmail: "success@tradegym.local",
      maxCreate: 4,
    },
  });
  if (
    ![200, 201].includes(trialKickoffActions.status) ||
    trialKickoffActions.data.productionReady !== false ||
    trialKickoffActions.data.educationOnly !== true ||
    (trialKickoffActions.data.created || 0) + (trialKickoffActions.data.reused || 0) < 1 ||
    !trialKickoffActions.data.actions?.some((item) => String(item.sourceKey || "").startsWith("customer_trial_kickoff:") && item.educationOnly === true && item.productionReady === false) ||
    !trialKickoffActions.data.pilotSuccessActions?.actions?.some((item) => String(item.sourceKey || "").startsWith("customer_trial_kickoff:")) ||
    !trialKickoffActions.data.constraints?.some((item) => item.includes("customer-success tasks only"))
  ) {
    throw new Error(`customer trial kickoff action creation failed: ${trialKickoffActions.status} ${JSON.stringify(trialKickoffActions.data).slice(0, 1600)}`);
  }
  const trialKickoffActionsReuse = await request("/api/admin/customer-trial-kickoff-plan/create-actions", {
    method: "POST",
    body: {
      ownerEmail: "success@tradegym.local",
      maxCreate: 4,
    },
  });
  if (
    trialKickoffActionsReuse.status !== 200 ||
    trialKickoffActionsReuse.data.created !== 0 ||
    trialKickoffActionsReuse.data.reused < (trialKickoffActions.data.created || 0) ||
    trialKickoffActionsReuse.data.productionReady !== false
  ) {
    throw new Error(`customer trial kickoff action reuse failed: ${trialKickoffActionsReuse.status} ${JSON.stringify(trialKickoffActionsReuse.data).slice(0, 1400)}`);
  }
  const trialKickoffActionAudit = await request("/api/admin/audit-logs?type=customer_trial_kickoff_action_created&limit=20");
  if (
    trialKickoffActionAudit.status !== 200 ||
    !trialKickoffActionAudit.data.items?.some((item) => item.type === "customer_trial_kickoff_action_created" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`customer trial kickoff action audit missing: ${trialKickoffActionAudit.status} ${JSON.stringify(trialKickoffActionAudit.data).slice(0, 1200)}`);
  }
  const trialRoom = await request("/api/admin/customer-trial-room");
  const trialRoomConstraints = (trialRoom.data.constraints || []).join(" ").toLowerCase();
  const trialRoomProhibited = (trialRoom.data.prohibitedUses || []).join(" ").toLowerCase();
  if (
    trialRoom.status !== 200 ||
    trialRoom.data.schemaVersion !== "customer-trial-room-v1" ||
    trialRoom.data.productionReady !== false ||
    trialRoom.data.educationOnly !== true ||
    !["customer_trial_room_ready_for_review", "customer_trial_room_needs_follow_through"].includes(trialRoom.data.decision) ||
    trialRoom.data.summary?.sections !== 6 ||
    typeof trialRoom.data.summary?.buyerReviewNeedsMoreEvidence !== "number" ||
    typeof trialRoom.data.summary?.score !== "number" ||
    !trialRoom.data.sections?.some((item) => item.key === "trial_packet" && item.productionReady === false) ||
    !trialRoom.data.sections?.some((item) => item.key === "kickoff_plan" && item.educationOnly === true) ||
    !trialRoom.data.reviewArtifacts?.some((item) => item.key === "scorecard" && item.endpoint?.includes("commercial-prototype-scorecard")) ||
    !trialRoom.data.participantChecklist?.some((item) => item.includes("education practice")) ||
    !trialRoomConstraints.includes("education saas trial evidence hub") ||
    !trialRoomConstraints.includes("productionready remains false") ||
    !trialRoomProhibited.includes("stock recommendation") ||
    !trialRoomProhibited.includes("profitability forecast")
  ) {
    throw new Error(`customer trial room API failed: ${trialRoom.status} ${JSON.stringify(trialRoom.data).slice(0, 1800)}`);
  }
  const trialRoomJsonExport = await request("/api/admin/customer-trial-room/export?format=json");
  if (
    trialRoomJsonExport.status !== 200 ||
    trialRoomJsonExport.data.room?.schemaVersion !== "customer-trial-room-v1" ||
    trialRoomJsonExport.data.room?.productionReady !== false ||
    !trialRoomJsonExport.data.note?.includes("education SaaS trial evidence hub")
  ) {
    throw new Error(`customer trial room JSON export failed: ${trialRoomJsonExport.status} ${JSON.stringify(trialRoomJsonExport.data).slice(0, 1200)}`);
  }
  const trialRoomCsvExport = await request("/api/admin/customer-trial-room/export?format=csv");
  if (
    trialRoomCsvExport.status !== 200 ||
    typeof trialRoomCsvExport.data !== "string" ||
    !trialRoomCsvExport.data.startsWith("section,key,title,status,metric,next,educationOnly,productionReady") ||
    !trialRoomCsvExport.data.includes("room_section,trial_packet") ||
    !trialRoomCsvExport.headers?.["content-disposition"]?.includes("tradegym-customer-trial-room.csv")
  ) {
    throw new Error(`customer trial room CSV export failed: ${trialRoomCsvExport.status} ${String(trialRoomCsvExport.data).slice(0, 1000)}`);
  }
  const trialRoomMdExport = await request("/api/admin/customer-trial-room/export?format=md");
  if (
    trialRoomMdExport.status !== 200 ||
    typeof trialRoomMdExport.data !== "string" ||
    !trialRoomMdExport.data.includes("# TradeGym Customer Trial Room") ||
    !trialRoomMdExport.data.includes("Production ready: false") ||
    !trialRoomMdExport.data.includes("real-money trading readiness") ||
    !trialRoomMdExport.headers?.["content-disposition"]?.includes("tradegym-customer-trial-room.md")
  ) {
    throw new Error(`customer trial room Markdown export failed: ${trialRoomMdExport.status} ${String(trialRoomMdExport.data).slice(0, 1000)}`);
  }
  const trialRoomExportAudit = await request("/api/admin/audit-logs?type=customer_trial_room_exported&limit=20");
  if (
    trialRoomExportAudit.status !== 200 ||
    !trialRoomExportAudit.data.items?.some((item) => item.type === "customer_trial_room_exported" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`customer trial room export audit missing: ${trialRoomExportAudit.status} ${JSON.stringify(trialRoomExportAudit.data).slice(0, 1200)}`);
  }
  const trialRoomShare = await request("/api/admin/customer-trial-room-shares", {
    method: "POST",
    body: {
      recipientEmail: "buyer@institution.local",
      ownerEmail: "success@tradegym.local",
      subject: "TradeGym education trial room",
    },
  });
  if (
    trialRoomShare.status !== 201 ||
    trialRoomShare.data.share?.productionReady !== false ||
    trialRoomShare.data.share?.educationOnly !== true ||
    trialRoomShare.data.share?.recipientEmail !== "buyer@institution.local" ||
    trialRoomShare.data.share?.providerMode !== "local-simulated" ||
    trialRoomShare.data.share?.feedbackStatus !== "pending_feedback" ||
    trialRoomShare.data.room?.schemaVersion !== "customer-trial-room-v1" ||
    !trialRoomShare.data.note?.includes("local education SaaS handoff")
  ) {
    throw new Error(`customer trial room share failed: ${trialRoomShare.status} ${JSON.stringify(trialRoomShare.data).slice(0, 1400)}`);
  }
  const trialRoomShares = await request("/api/admin/customer-trial-room-shares");
  if (
    trialRoomShares.status !== 200 ||
    trialRoomShares.data.productionReady !== false ||
    trialRoomShares.data.educationOnly !== true ||
    trialRoomShares.data.summary?.localSimulated < 1 ||
    !trialRoomShares.data.shares?.some((item) => item.id === trialRoomShare.data.share.id && item.providerMode === "local-simulated") ||
    !trialRoomShares.data.constraints?.some((item) => item.includes("does not prove production email delivery"))
  ) {
    throw new Error(`customer trial room shares list failed: ${trialRoomShares.status} ${JSON.stringify(trialRoomShares.data).slice(0, 1200)}`);
  }
  const trialRoomFeedbackMissingNote = await request("/api/admin/customer-trial-room-shares/feedback", {
    method: "POST",
    body: {
      shareId: trialRoomShare.data.share.id,
      feedbackStatus: "room_accepted_for_review",
    },
  });
  if (trialRoomFeedbackMissingNote.status !== 400 || !trialRoomFeedbackMissingNote.data.error?.includes("Feedback note is required")) {
    throw new Error(`customer trial room feedback missing-note guard failed: ${trialRoomFeedbackMissingNote.status} ${JSON.stringify(trialRoomFeedbackMissingNote.data).slice(0, 1000)}`);
  }
  const trialRoomFeedback = await request("/api/admin/customer-trial-room-shares/feedback", {
    method: "POST",
    body: {
      shareId: trialRoomShare.data.share.id,
      feedbackStatus: "needs_more_evidence",
      feedbackNote: "Buyer requested more education trial evidence before accepting the room for review.",
      nextCustomerSuccessAction: "Prepare education trial room evidence follow-up without trading-performance or production-readiness claims.",
    },
  });
  if (
    trialRoomFeedback.status !== 200 ||
    trialRoomFeedback.data.share?.feedbackStatus !== "needs_more_evidence" ||
    trialRoomFeedback.data.share?.productionReady !== false ||
    trialRoomFeedback.data.share?.educationOnly !== true ||
    !trialRoomFeedback.data.note?.includes("education customer-success evidence")
  ) {
    throw new Error(`customer trial room feedback failed: ${trialRoomFeedback.status} ${JSON.stringify(trialRoomFeedback.data).slice(0, 1400)}`);
  }
  const trialRoomFeedbackAction = await request("/api/admin/customer-trial-room-shares/create-action", {
    method: "POST",
    body: {
      shareId: trialRoomShare.data.share.id,
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    trialRoomFeedbackAction.status !== 201 ||
    trialRoomFeedbackAction.data.action?.productionReady !== false ||
    trialRoomFeedbackAction.data.action?.educationOnly !== true ||
    trialRoomFeedbackAction.data.action?.criterionKey !== "customer_trial_room_feedback_needs_more_evidence" ||
    trialRoomFeedbackAction.data.action?.ownerEmail !== "success@tradegym.local" ||
    trialRoomFeedbackAction.data.share?.nextActionId !== trialRoomFeedbackAction.data.action.id ||
    !trialRoomFeedbackAction.data.note?.includes("productionReady remains false")
  ) {
    throw new Error(`customer trial room feedback action failed: ${trialRoomFeedbackAction.status} ${JSON.stringify(trialRoomFeedbackAction.data).slice(0, 1600)}`);
  }
  const trialRoomFeedbackActionReused = await request("/api/admin/customer-trial-room-shares/create-action", {
    method: "POST",
    body: {
      shareId: trialRoomShare.data.share.id,
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    trialRoomFeedbackActionReused.status !== 200 ||
    trialRoomFeedbackActionReused.data.reused !== true ||
    trialRoomFeedbackActionReused.data.action?.id !== trialRoomFeedbackAction.data.action.id ||
    trialRoomFeedbackActionReused.data.action?.productionReady !== false
  ) {
    throw new Error(`customer trial room feedback action reuse failed: ${trialRoomFeedbackActionReused.status} ${JSON.stringify(trialRoomFeedbackActionReused.data).slice(0, 1400)}`);
  }
  const trialRoomFeedbackActionDone = await request("/api/admin/pilot-success-actions/update", {
    method: "POST",
    body: {
      actionId: trialRoomFeedbackAction.data.action.id,
      status: "done",
      ownerEmail: "success@tradegym.local",
      resolutionNote: "Verifier completed this customer trial room feedback action as education customer-success follow-up only.",
    },
  });
  if (
    trialRoomFeedbackActionDone.status !== 200 ||
    trialRoomFeedbackActionDone.data.action?.status !== "done" ||
    trialRoomFeedbackActionDone.data.linkedCustomerTrialRoomShare?.nextActionStatus !== "done" ||
    trialRoomFeedbackActionDone.data.linkedCustomerTrialRoomShare?.nextActionId !== trialRoomFeedbackAction.data.action.id ||
    trialRoomFeedbackActionDone.data.linkedCustomerTrialRoomShare?.productionReady !== false
  ) {
    throw new Error(`customer trial room feedback action completion failed: ${trialRoomFeedbackActionDone.status} ${JSON.stringify(trialRoomFeedbackActionDone.data).slice(0, 1600)}`);
  }
  const trialRoomSharesAfterActionDone = await request("/api/admin/customer-trial-room-shares");
  if (
    trialRoomSharesAfterActionDone.status !== 200 ||
    trialRoomSharesAfterActionDone.data.summary?.feedbackActionsDone < 1 ||
    !trialRoomSharesAfterActionDone.data.shares?.some((item) => item.id === trialRoomShare.data.share.id && item.nextActionStatus === "done")
  ) {
    throw new Error(`customer trial room feedback action completion rollup failed: ${trialRoomSharesAfterActionDone.status} ${JSON.stringify(trialRoomSharesAfterActionDone.data).slice(0, 1400)}`);
  }
  const trialRoomShareProgressJsonExport = await request("/api/admin/customer-trial-room-shares/export?format=json");
  if (
    trialRoomShareProgressJsonExport.status !== 200 ||
    trialRoomShareProgressJsonExport.data.report?.summary?.feedbackActionsDone < 1 ||
    trialRoomShareProgressJsonExport.data.productionReady !== false
  ) {
    throw new Error(`customer trial room share progress JSON export failed: ${trialRoomShareProgressJsonExport.status} ${JSON.stringify(trialRoomShareProgressJsonExport.data).slice(0, 1200)}`);
  }
  const trialRoomShareProgressCsvExport = await request("/api/admin/customer-trial-room-shares/export?format=csv");
  if (
    trialRoomShareProgressCsvExport.status !== 200 ||
    !String(trialRoomShareProgressCsvExport.data).startsWith("recipientEmail,feedbackStatus,buyerReviewStatus,nextActionStatus") ||
    !trialRoomShareProgressCsvExport.headers?.["content-disposition"]?.includes("tradegym-customer-trial-room-share-progress.csv")
  ) {
    throw new Error(`customer trial room share progress CSV export failed: ${trialRoomShareProgressCsvExport.status} ${String(trialRoomShareProgressCsvExport.data).slice(0, 1000)}`);
  }
  const trialRoomShareProgressMdExport = await request("/api/admin/customer-trial-room-shares/export?format=md");
  if (
    trialRoomShareProgressMdExport.status !== 200 ||
    !String(trialRoomShareProgressMdExport.data).includes("# TradeGym Customer Trial Room Share Progress") ||
    !String(trialRoomShareProgressMdExport.data).includes("Production ready: false") ||
    !trialRoomShareProgressMdExport.headers?.["content-disposition"]?.includes("tradegym-customer-trial-room-share-progress.md")
  ) {
    throw new Error(`customer trial room share progress MD export failed: ${trialRoomShareProgressMdExport.status} ${String(trialRoomShareProgressMdExport.data).slice(0, 1000)}`);
  }
  const trialRoomShareAudit = await request("/api/admin/audit-logs?type=customer_trial_room_shared&limit=20");
  const trialRoomShareProgressExportAudit = await request("/api/admin/audit-logs?type=customer_trial_room_shares_exported&limit=20");
  if (
    trialRoomShareAudit.status !== 200 ||
    !trialRoomShareAudit.data.items?.some((item) => item.type === "customer_trial_room_shared" && item.shareId === trialRoomShare.data.share.id && item.educationOnly === true && item.productionReady === false) ||
    trialRoomShareProgressExportAudit.status !== 200 ||
    !trialRoomShareProgressExportAudit.data.items?.some((item) => item.type === "customer_trial_room_shares_exported" && item.feedbackActionsDone >= 1 && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`customer trial room share audit missing: ${trialRoomShareAudit.status} ${JSON.stringify(trialRoomShareAudit.data).slice(0, 1200)}`);
  }
  const trialRoomFeedbackActionAudit = await request("/api/admin/audit-logs?type=customer_trial_room_feedback_action_created&limit=20");
  if (
    trialRoomFeedbackActionAudit.status !== 200 ||
    !trialRoomFeedbackActionAudit.data.items?.some((item) => item.type === "customer_trial_room_feedback_action_created" && item.actionId === trialRoomFeedbackAction.data.action.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`customer trial room feedback action audit missing: ${trialRoomFeedbackActionAudit.status} ${JSON.stringify(trialRoomFeedbackActionAudit.data).slice(0, 1200)}`);
  }

  const launchOpsBoard = await request("/api/admin/launch-ops-board");
  const launchOpsConstraints = (launchOpsBoard.data.constraints || []).join(" ").toLowerCase();
  if (
    launchOpsBoard.status !== 200 ||
    launchOpsBoard.data.schemaVersion !== "launch-ops-board-v1" ||
    launchOpsBoard.data.productionReady !== false ||
    launchOpsBoard.data.educationOnly !== true ||
    !["education_launch_ops_needs_follow_through", "education_launch_ops_review_ready"].includes(launchOpsBoard.data.decision) ||
    launchOpsBoard.data.summary?.readinessTotal !== requiredProductReadinessKeys.length ||
    typeof launchOpsBoard.data.summary?.serviceSlaItems !== "number" ||
    typeof launchOpsBoard.data.summary?.procurementDeliveries !== "number" ||
    typeof launchOpsBoard.data.summary?.auditVerificationStatus !== "string" ||
    !launchOpsBoard.data.lanes?.some((item) => item.key === "readiness" && item.productionReady === false) ||
    !launchOpsBoard.data.lanes?.some((item) => item.key === "service_sla" && item.educationOnly === true) ||
    !launchOpsBoard.data.lanes?.some((item) => item.key === "audit") ||
    !launchOpsConstraints.includes("does not certify production launch") ||
    !launchOpsConstraints.includes("real-money trading readiness")
  ) {
    throw new Error(`launch ops board API failed: ${launchOpsBoard.status} ${JSON.stringify(launchOpsBoard.data).slice(0, 1600)}`);
  }
  const launchOpsBoardJsonExport = await request("/api/admin/launch-ops-board/export?format=json");
  if (
    launchOpsBoardJsonExport.status !== 200 ||
    launchOpsBoardJsonExport.data.board?.schemaVersion !== "launch-ops-board-v1" ||
    launchOpsBoardJsonExport.data.board?.productionReady !== false ||
    !launchOpsBoardJsonExport.data.note?.includes("education SaaS operating review")
  ) {
    throw new Error(`launch ops board JSON export failed: ${launchOpsBoardJsonExport.status} ${JSON.stringify(launchOpsBoardJsonExport.data).slice(0, 1200)}`);
  }
  const launchOpsBoardCsvExport = await request("/api/admin/launch-ops-board/export?format=csv");
  if (
    launchOpsBoardCsvExport.status !== 200 ||
    typeof launchOpsBoardCsvExport.data !== "string" ||
    !launchOpsBoardCsvExport.data.startsWith("section,key,title,status,metric,priority,next,educationOnly,productionReady") ||
    !launchOpsBoardCsvExport.data.includes("lane,readiness") ||
    !launchOpsBoardCsvExport.headers?.["content-disposition"]?.includes("tradegym-launch-ops-board.csv")
  ) {
    throw new Error(`launch ops board CSV export failed: ${launchOpsBoardCsvExport.status} ${String(launchOpsBoardCsvExport.data).slice(0, 1000)}`);
  }
  const launchOpsBoardMdExport = await request("/api/admin/launch-ops-board/export?format=md");
  if (
    launchOpsBoardMdExport.status !== 200 ||
    typeof launchOpsBoardMdExport.data !== "string" ||
    !launchOpsBoardMdExport.data.includes("# TradeGym Launch Ops Board") ||
    !launchOpsBoardMdExport.data.includes("Production ready: false") ||
    !launchOpsBoardMdExport.data.includes("real-money trading readiness") ||
    !launchOpsBoardMdExport.headers?.["content-disposition"]?.includes("tradegym-launch-ops-board.md")
  ) {
    throw new Error(`launch ops board Markdown export failed: ${launchOpsBoardMdExport.status} ${String(launchOpsBoardMdExport.data).slice(0, 1000)}`);
  }
  const launchOpsBoardExportAudit = await request("/api/admin/audit-logs?type=launch_ops_board_exported&limit=20");
  if (
    launchOpsBoardExportAudit.status !== 200 ||
    !launchOpsBoardExportAudit.data.items?.some((item) => item.type === "launch_ops_board_exported" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`launch ops board export audit missing: ${launchOpsBoardExportAudit.status} ${JSON.stringify(launchOpsBoardExportAudit.data).slice(0, 1200)}`);
  }
  const launchOpsActions = await request("/api/admin/launch-ops-board/create-actions", {
    method: "POST",
    body: {
      ownerEmail: "success@tradegym.local",
      maxCreate: 4,
    },
  });
  if (
    ![200, 201].includes(launchOpsActions.status) ||
    launchOpsActions.data.productionReady !== false ||
    launchOpsActions.data.educationOnly !== true ||
    (launchOpsActions.data.created || 0) + (launchOpsActions.data.reused || 0) < 1 ||
    !launchOpsActions.data.actions?.some((item) => String(item.sourceKey || "").startsWith("launch_ops:") && item.educationOnly === true && item.productionReady === false) ||
    !launchOpsActions.data.constraints?.some((item) => item.includes("customer-success tasks only"))
  ) {
    throw new Error(`launch ops action creation failed: ${launchOpsActions.status} ${JSON.stringify(launchOpsActions.data).slice(0, 1600)}`);
  }
  const launchOpsActionsReuse = await request("/api/admin/launch-ops-board/create-actions", {
    method: "POST",
    body: {
      ownerEmail: "success@tradegym.local",
      maxCreate: 4,
    },
  });
  if (
    launchOpsActionsReuse.status !== 200 ||
    launchOpsActionsReuse.data.created !== 0 ||
    launchOpsActionsReuse.data.reused < launchOpsActions.data.created ||
    launchOpsActionsReuse.data.productionReady !== false
  ) {
    throw new Error(`launch ops action reuse failed: ${launchOpsActionsReuse.status} ${JSON.stringify(launchOpsActionsReuse.data).slice(0, 1400)}`);
  }
  const launchOpsActionAudit = await request("/api/admin/audit-logs?type=launch_ops_action_created&limit=20");
  if (
    (launchOpsActions.data.created || 0) > 0 &&
    (
      launchOpsActionAudit.status !== 200 ||
      !launchOpsActionAudit.data.items?.some((item) => item.type === "launch_ops_action_created" && item.educationOnly === true && item.productionReady === false)
    )
  ) {
    throw new Error(`launch ops action audit missing: ${launchOpsActionAudit.status} ${JSON.stringify(launchOpsActionAudit.data).slice(0, 1200)}`);
  }
  const customerTrialPacket = await request("/api/admin/customer-trial-packet");
  if (
    customerTrialPacket.status !== 200 ||
    customerTrialPacket.data.schemaVersion !== "customer-trial-packet-v1" ||
    customerTrialPacket.data.productionReady !== false ||
    customerTrialPacket.data.educationOnly !== true ||
    customerTrialPacket.data.summary?.launchDecision !== launchOpsBoard.data.decision ||
    customerTrialPacket.data.providerModes?.marketData !== "demo" ||
    !customerTrialPacket.data.trialScope?.some((item) => item.includes("education-only")) ||
    !customerTrialPacket.data.prohibitedUses?.some((item) => item.includes("stock recommendation")) ||
    !customerTrialPacket.data.constraints?.some((item) => item.includes("productionReady remains false"))
  ) {
    throw new Error(`customer trial packet API failed: ${customerTrialPacket.status} ${JSON.stringify(customerTrialPacket.data).slice(0, 1600)}`);
  }
  const customerTrialJsonExport = await request("/api/admin/customer-trial-packet/export?format=json");
  if (
    customerTrialJsonExport.status !== 200 ||
    customerTrialJsonExport.data.packet?.schemaVersion !== "customer-trial-packet-v1" ||
    customerTrialJsonExport.data.packet?.productionReady !== false ||
    !customerTrialJsonExport.data.note?.includes("education SaaS trial evidence")
  ) {
    throw new Error(`customer trial packet JSON export failed: ${customerTrialJsonExport.status} ${JSON.stringify(customerTrialJsonExport.data).slice(0, 1200)}`);
  }
  const customerTrialCsvExport = await request("/api/admin/customer-trial-packet/export?format=csv");
  if (
    customerTrialCsvExport.status !== 200 ||
    typeof customerTrialCsvExport.data !== "string" ||
    !customerTrialCsvExport.data.startsWith("section,key,value,next,educationOnly,productionReady") ||
    !customerTrialCsvExport.data.includes("provider,marketData,demo") ||
    !customerTrialCsvExport.headers?.["content-disposition"]?.includes("tradegym-customer-trial-packet.csv")
  ) {
    throw new Error(`customer trial packet CSV export failed: ${customerTrialCsvExport.status} ${String(customerTrialCsvExport.data).slice(0, 1000)}`);
  }
  const customerTrialMdExport = await request("/api/admin/customer-trial-packet/export?format=md");
  if (
    customerTrialMdExport.status !== 200 ||
    typeof customerTrialMdExport.data !== "string" ||
    !customerTrialMdExport.data.includes("# TradeGym Customer Trial Packet") ||
    !customerTrialMdExport.data.includes("Production ready: false") ||
    !customerTrialMdExport.data.includes("real-money trading readiness") ||
    !customerTrialMdExport.headers?.["content-disposition"]?.includes("tradegym-customer-trial-packet.md")
  ) {
    throw new Error(`customer trial packet Markdown export failed: ${customerTrialMdExport.status} ${String(customerTrialMdExport.data).slice(0, 1000)}`);
  }
  const customerTrialExportAudit = await request("/api/admin/audit-logs?type=customer_trial_packet_exported&limit=20");
  if (
    customerTrialExportAudit.status !== 200 ||
    !customerTrialExportAudit.data.items?.some((item) => item.type === "customer_trial_packet_exported" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`customer trial packet export audit missing: ${customerTrialExportAudit.status} ${JSON.stringify(customerTrialExportAudit.data).slice(0, 1200)}`);
  }
  const customerTrialDelivery = await request("/api/admin/customer-trial-packet-deliveries", {
    method: "POST",
    body: {
      recipientEmail: "buyer@institution.local",
      ownerEmail: "success@tradegym.local",
      subject: "TradeGym education trial packet",
    },
  });
  if (
    customerTrialDelivery.status !== 201 ||
    customerTrialDelivery.data.delivery?.productionReady !== false ||
    customerTrialDelivery.data.delivery?.educationOnly !== true ||
    customerTrialDelivery.data.delivery?.recipientEmail !== "buyer@institution.local" ||
    customerTrialDelivery.data.delivery?.providerMode !== "local-simulated" ||
    customerTrialDelivery.data.delivery?.feedbackStatus !== "pending_feedback" ||
    customerTrialDelivery.data.packet?.schemaVersion !== "customer-trial-packet-v1" ||
    !customerTrialDelivery.data.note?.includes("local education SaaS handoff")
  ) {
    throw new Error(`customer trial packet delivery failed: ${customerTrialDelivery.status} ${JSON.stringify(customerTrialDelivery.data).slice(0, 1400)}`);
  }
  const customerTrialDeliveries = await request("/api/admin/customer-trial-packet-deliveries");
  if (
    customerTrialDeliveries.status !== 200 ||
    customerTrialDeliveries.data.productionReady !== false ||
    customerTrialDeliveries.data.educationOnly !== true ||
    customerTrialDeliveries.data.summary?.localSimulated < 1 ||
    !customerTrialDeliveries.data.deliveries?.some((item) => item.id === customerTrialDelivery.data.delivery.id && item.providerMode === "local-simulated") ||
    !customerTrialDeliveries.data.constraints?.some((item) => item.includes("does not prove production email delivery"))
  ) {
    throw new Error(`customer trial packet deliveries list failed: ${customerTrialDeliveries.status} ${JSON.stringify(customerTrialDeliveries.data).slice(0, 1200)}`);
  }
  const customerTrialFeedbackMissingNote = await request("/api/admin/customer-trial-packet-deliveries/feedback", {
    method: "POST",
    body: {
      deliveryId: customerTrialDelivery.data.delivery.id,
      feedbackStatus: "trial_ready",
    },
  });
  if (customerTrialFeedbackMissingNote.status !== 400 || !customerTrialFeedbackMissingNote.data.error?.includes("Feedback note is required")) {
    throw new Error(`customer trial feedback missing-note guard failed: ${customerTrialFeedbackMissingNote.status} ${JSON.stringify(customerTrialFeedbackMissingNote.data).slice(0, 1000)}`);
  }
  const customerTrialFeedback = await request("/api/admin/customer-trial-packet-deliveries/feedback", {
    method: "POST",
    body: {
      deliveryId: customerTrialDelivery.data.delivery.id,
      feedbackStatus: "needs_more_evidence",
      feedbackNote: "Buyer requested more education onboarding, support, and audit evidence before a bounded trial.",
      nextCustomerSuccessAction: "Prepare education trial evidence follow-up without trading-performance or production-readiness claims.",
    },
  });
  if (
    customerTrialFeedback.status !== 200 ||
    customerTrialFeedback.data.delivery?.feedbackStatus !== "needs_more_evidence" ||
    customerTrialFeedback.data.delivery?.productionReady !== false ||
    customerTrialFeedback.data.delivery?.educationOnly !== true ||
    !customerTrialFeedback.data.note?.includes("education customer-success evidence")
  ) {
    throw new Error(`customer trial feedback failed: ${customerTrialFeedback.status} ${JSON.stringify(customerTrialFeedback.data).slice(0, 1400)}`);
  }
  const customerTrialFeedbackAction = await request("/api/admin/customer-trial-packet-deliveries/create-action", {
    method: "POST",
    body: {
      deliveryId: customerTrialDelivery.data.delivery.id,
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    customerTrialFeedbackAction.status !== 201 ||
    customerTrialFeedbackAction.data.action?.productionReady !== false ||
    customerTrialFeedbackAction.data.action?.educationOnly !== true ||
    customerTrialFeedbackAction.data.action?.criterionKey !== "customer_trial_feedback_needs_more_evidence" ||
    customerTrialFeedbackAction.data.action?.ownerEmail !== "success@tradegym.local" ||
    customerTrialFeedbackAction.data.delivery?.nextActionId !== customerTrialFeedbackAction.data.action.id ||
    !customerTrialFeedbackAction.data.note?.includes("productionReady remains false")
  ) {
    throw new Error(`customer trial feedback action failed: ${customerTrialFeedbackAction.status} ${JSON.stringify(customerTrialFeedbackAction.data).slice(0, 1600)}`);
  }
  const customerTrialFeedbackActionReused = await request("/api/admin/customer-trial-packet-deliveries/create-action", {
    method: "POST",
    body: {
      deliveryId: customerTrialDelivery.data.delivery.id,
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    customerTrialFeedbackActionReused.status !== 200 ||
    customerTrialFeedbackActionReused.data.reused !== true ||
    customerTrialFeedbackActionReused.data.action?.id !== customerTrialFeedbackAction.data.action.id ||
    customerTrialFeedbackActionReused.data.action?.productionReady !== false
  ) {
    throw new Error(`customer trial feedback action reuse failed: ${customerTrialFeedbackActionReused.status} ${JSON.stringify(customerTrialFeedbackActionReused.data).slice(0, 1400)}`);
  }
  const customerTrialAudit = await request("/api/admin/audit-logs?type=customer_trial_packet_delivered&limit=20");
  if (
    customerTrialAudit.status !== 200 ||
    !customerTrialAudit.data.items?.some((item) => item.type === "customer_trial_packet_delivered" && item.deliveryId === customerTrialDelivery.data.delivery.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`customer trial delivery audit missing: ${customerTrialAudit.status} ${JSON.stringify(customerTrialAudit.data).slice(0, 1200)}`);
  }
  const customerTrialFeedbackActionAudit = await request("/api/admin/audit-logs?type=customer_trial_feedback_action_created&limit=20");
  if (
    customerTrialFeedbackActionAudit.status !== 200 ||
    !customerTrialFeedbackActionAudit.data.items?.some((item) => item.type === "customer_trial_feedback_action_created" && item.actionId === customerTrialFeedbackAction.data.action.id && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`customer trial feedback action audit missing: ${customerTrialFeedbackActionAudit.status} ${JSON.stringify(customerTrialFeedbackActionAudit.data).slice(0, 1200)}`);
  }

  const adminNextStepEngagement = await request("/api/admin/next-step-engagement-report?limit=20");
  if (
    adminNextStepEngagement.status !== 200 ||
    adminNextStepEngagement.data.reportType !== "learner_next_step_engagement_report" ||
    adminNextStepEngagement.data.productionReady !== false ||
    adminNextStepEngagement.data.educationOnly !== true ||
    adminNextStepEngagement.data.summary?.totalEvents < 1 ||
    adminNextStepEngagement.data.summary?.opened < 1 ||
    !adminNextStepEngagement.data.recentEvents?.some((item) => item.actionId === "continue_onboarding" && item.eventType === "opened" && item.educationOnly === true) ||
    !adminNextStepEngagement.data.actions?.some((item) => item.actionId === "continue_onboarding" && item.opened >= 1) ||
    !adminNextStepEngagement.data.constraints?.some((item) => item.includes("does not measure trading skill")) ||
    !adminNextStepEngagement.data.constraints?.some((item) => item.includes("stock recommendations"))
  ) {
    throw new Error(`admin next-step engagement report failed: ${adminNextStepEngagement.status} ${JSON.stringify(adminNextStepEngagement.data).slice(0, 1400)}`);
  }

  const adminNextStepEngagementJsonExport = await request("/api/admin/next-step-engagement-report/export?format=json&limit=20");
  if (
    adminNextStepEngagementJsonExport.status !== 200 ||
    adminNextStepEngagementJsonExport.data.reportType !== "learner_next_step_engagement_report" ||
    adminNextStepEngagementJsonExport.data.productionReady !== false ||
    !adminNextStepEngagementJsonExport.data.note?.includes("not investment advice")
  ) {
    throw new Error(`admin next-step engagement JSON export failed: ${adminNextStepEngagementJsonExport.status} ${JSON.stringify(adminNextStepEngagementJsonExport.data).slice(0, 1200)}`);
  }
  const adminNextStepEngagementCsvExport = await request("/api/admin/next-step-engagement-report/export?format=csv&limit=20");
  if (
    adminNextStepEngagementCsvExport.status !== 200 ||
    typeof adminNextStepEngagementCsvExport.data !== "string" ||
    !adminNextStepEngagementCsvExport.data.startsWith("id,createdAt,email") ||
    !adminNextStepEngagementCsvExport.data.includes("continue_onboarding")
  ) {
    throw new Error(`admin next-step engagement CSV export failed: ${adminNextStepEngagementCsvExport.status} ${String(adminNextStepEngagementCsvExport.data).slice(0, 800)}`);
  }
  const adminNextStepEngagementMdExport = await request("/api/admin/next-step-engagement-report/export?format=md&limit=20");
  if (
    adminNextStepEngagementMdExport.status !== 200 ||
    typeof adminNextStepEngagementMdExport.data !== "string" ||
    !adminNextStepEngagementMdExport.data.includes("# TradeGym Next-Step Engagement Report") ||
    !adminNextStepEngagementMdExport.data.includes("not a trading-skill score") ||
    !adminNextStepEngagementMdExport.data.includes("stock recommendations")
  ) {
    throw new Error(`admin next-step engagement MD export failed: ${adminNextStepEngagementMdExport.status} ${String(adminNextStepEngagementMdExport.data).slice(0, 1000)}`);
  }

  const remediationQueueBefore = await request("/api/admin/readiness-remediation-tasks");
  const remediationHasAppendOnlyGap = remediationQueueBefore.data.candidates?.some((item) => item.sourceKey === "control:append_only_audit_storage" && item.priority === "high")
    || remediationQueueBefore.data.tasks?.some((item) => item.sourceKey === "control:append_only_audit_storage" && ["open", "in_progress"].includes(item.status));
  if (
    remediationQueueBefore.status !== 200 ||
    !remediationHasAppendOnlyGap ||
    !remediationQueueBefore.data.constraints?.some((item) => item.includes("stock recommendations"))
  ) {
    throw new Error(`readiness remediation queue API failed: ${remediationQueueBefore.status} ${JSON.stringify(remediationQueueBefore.data).slice(0, 1200)}`);
  }

  const remediationCandidateKeys = (remediationQueueBefore.data.candidates || []).slice(0, 3).map((item) => item.sourceKey);
  const remediationCreated = await request("/api/admin/readiness-remediation-tasks/bulk", {
    method: "POST",
    body: {
      maxCreate: 3,
      sourceKeys: remediationCandidateKeys,
      ownerEmail: "ops@tradegym.local",
    },
  });
  const remediationCreatedCount = remediationCreated.data.created?.length || 0;
  if (
    ![200, 201].includes(remediationCreated.status) ||
    (remediationCandidateKeys.length > 0 && remediationCreated.status !== 201) ||
    (remediationCandidateKeys.length > 0 && remediationCreatedCount < 1) ||
    !remediationCreated.data.created?.every((item) => item.educationOnly === true && item.status === "open") ||
    remediationCreated.data.summary?.open < remediationCreatedCount
  ) {
    throw new Error(`readiness remediation bulk create failed: ${remediationCreated.status} ${JSON.stringify(remediationCreated.data).slice(0, 1200)}`);
  }

  const remediationTaskForUpdate = remediationCreated.data.created?.[0]
    || remediationQueueBefore.data.tasks?.find((item) => ["open", "in_progress"].includes(item.status));
  if (!remediationTaskForUpdate?.id) {
    throw new Error(`readiness remediation update target missing: ${JSON.stringify(remediationCreated.data).slice(0, 1200)}`);
  }
  const remediationUpdated = await request("/api/admin/readiness-remediation-tasks/update", {
    method: "POST",
    body: {
      taskId: remediationTaskForUpdate.id,
      status: "in_progress",
      ownerEmail: "ops@tradegym.local",
      resolutionNote: "Verifier starts product operations follow-up.",
    },
  });
  if (
    remediationUpdated.status !== 200 ||
    remediationUpdated.data.task?.status !== "in_progress" ||
    remediationUpdated.data.task?.ownerEmail !== "ops@tradegym.local" ||
    !remediationUpdated.data.constraints?.some((item) => item.includes("does not mark the product production-ready"))
  ) {
    throw new Error(`readiness remediation update failed: ${remediationUpdated.status} ${JSON.stringify(remediationUpdated.data).slice(0, 1200)}`);
  }

  const readinessEvidencePacket = await request("/api/admin/readiness-evidence-packet/export?format=json");
  const readinessEvidenceConstraints = (readinessEvidencePacket.data.constraints || []).join(" ").toLowerCase();
  if (
    readinessEvidencePacket.status !== 200 ||
    readinessEvidencePacket.data.productionReady !== false ||
    readinessEvidencePacket.data.educationOnly !== true ||
    readinessEvidencePacket.data.providers?.marketData !== "demo" ||
    readinessEvidencePacket.data.summary?.rows < requiredProductReadinessKeys.length ||
    !readinessEvidencePacket.data.rows?.some((item) => item.kind === "readiness_check" && item.sourceKey === "check:data_governance") ||
    !readinessEvidencePacket.data.sourceModel?.note?.includes("does not add live trading") ||
    !readinessEvidenceConstraints.includes("live trading signals") ||
    !readinessEvidenceConstraints.includes("broker connectivity")
  ) {
    throw new Error(`readiness evidence packet export failed: ${readinessEvidencePacket.status} ${JSON.stringify(readinessEvidencePacket.data).slice(0, 1200)}`);
  }

  const readinessEvidenceCsv = await request("/api/admin/readiness-evidence-packet/export?format=csv");
  if (
    readinessEvidenceCsv.status !== 200 ||
    typeof readinessEvidenceCsv.data !== "string" ||
    !readinessEvidenceCsv.data.startsWith("kind,sourceKey,title,status,priority") ||
    !readinessEvidenceCsv.data.includes("readiness_check,check:data_governance") ||
    !readinessEvidenceCsv.headers?.["content-disposition"]?.includes("tradegym-readiness-evidence-packet.csv")
  ) {
    throw new Error(`readiness evidence packet CSV export failed: ${readinessEvidenceCsv.status} ${String(readinessEvidenceCsv.data).slice(0, 600)}`);
  }

  const pilotHandoffReport = await request("/api/admin/pilot-handoff-report/export?format=json");
  const pilotHandoffConstraints = (pilotHandoffReport.data.constraints || []).join(" ").toLowerCase();
  if (
    pilotHandoffReport.status !== 200 ||
    pilotHandoffReport.data.reportType !== "pilot_handoff_report" ||
    pilotHandoffReport.data.productionReady !== false ||
    pilotHandoffReport.data.educationOnly !== true ||
    pilotHandoffReport.data.summary?.rows < 4 ||
    pilotHandoffReport.data.sections?.learningEvidence?.educationOnly !== true ||
    pilotHandoffReport.data.sections?.educationServiceHealth?.productionReady !== false ||
    pilotHandoffReport.data.sections?.readinessEvidence?.providers?.marketData !== "demo" ||
    !pilotHandoffReport.data.rows?.some((item) => item.section === "readiness" && item.metric === "operating_gaps") ||
    !pilotHandoffReport.data.prohibitedUses?.some((item) => item.includes("stock recommendation")) ||
    !pilotHandoffConstraints.includes("live trading signals") ||
    !pilotHandoffConstraints.includes("auto-trading")
  ) {
    throw new Error(`pilot handoff report export failed: ${pilotHandoffReport.status} ${JSON.stringify(pilotHandoffReport.data).slice(0, 1400)}`);
  }

  const pilotHandoffCsv = await request("/api/admin/pilot-handoff-report/export?format=csv");
  if (
    pilotHandoffCsv.status !== 200 ||
    typeof pilotHandoffCsv.data !== "string" ||
    !pilotHandoffCsv.data.startsWith("section,metric,value,evidence,next") ||
    !pilotHandoffCsv.data.includes("readiness,operating_gaps") ||
    !pilotHandoffCsv.headers?.["content-disposition"]?.includes("tradegym-pilot-handoff-report.csv")
  ) {
    throw new Error(`pilot handoff report CSV export failed: ${pilotHandoffCsv.status} ${String(pilotHandoffCsv.data).slice(0, 600)}`);
  }

  const pilotSuccessChecklist = await request("/api/admin/pilot-success-checklist");
  const pilotSuccessConstraints = (pilotSuccessChecklist.data.constraints || []).join(" ").toLowerCase();
  if (
    pilotSuccessChecklist.status !== 200 ||
    pilotSuccessChecklist.data.productionReady !== false ||
    pilotSuccessChecklist.data.educationOnly !== true ||
    !["continue_pilot_before_expansion", "review_before_expansion", "education_expansion_review_ready"].includes(pilotSuccessChecklist.data.decision) ||
    pilotSuccessChecklist.data.summary?.total < 5 ||
    !pilotSuccessChecklist.data.criteria?.some((item) => item.key === "production_boundary_clear" && item.educationOnly === true) ||
    !pilotSuccessChecklist.data.prohibitedUses?.some((item) => item.includes("win rate")) ||
    !pilotSuccessConstraints.includes("does not measure trading performance") ||
    !pilotSuccessConstraints.includes("productionready remains false")
  ) {
    throw new Error(`pilot success checklist API failed: ${pilotSuccessChecklist.status} ${JSON.stringify(pilotSuccessChecklist.data).slice(0, 1400)}`);
  }

  const pilotSuccessActionsBefore = await request("/api/admin/pilot-success-actions");
  if (
    pilotSuccessActionsBefore.status !== 200 ||
    pilotSuccessActionsBefore.data.productionReady !== false ||
    pilotSuccessActionsBefore.data.educationOnly !== true ||
    !Array.isArray(pilotSuccessActionsBefore.data.candidates) ||
    !Array.isArray(pilotSuccessActionsBefore.data.actions) ||
    typeof pilotSuccessActionsBefore.data.summary?.candidates !== "number" ||
    !pilotSuccessActionsBefore.data.constraints?.some((item) => item.includes("customer-success"))
  ) {
    throw new Error(`pilot success actions API failed: ${pilotSuccessActionsBefore.status} ${JSON.stringify(pilotSuccessActionsBefore.data).slice(0, 1200)}`);
  }

  const pilotSuccessActionsCreated = await request("/api/admin/pilot-success-actions/bulk", {
    method: "POST",
    body: {
      maxCreate: 5,
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    ![200, 201].includes(pilotSuccessActionsCreated.status) ||
    pilotSuccessActionsCreated.data.productionReady !== false ||
    pilotSuccessActionsCreated.data.educationOnly !== true ||
    pilotSuccessActionsCreated.data.created?.some((item) => item.educationOnly !== true || item.productionReady !== false || item.ownerEmail !== "success@tradegym.local") ||
    typeof pilotSuccessActionsCreated.data.summary?.open !== "number" ||
    !pilotSuccessActionsCreated.data.constraints?.some((item) => item.includes("stock recommendation")) ||
    !pilotSuccessActionsCreated.data.constraints?.some((item) => item.includes("real-money"))
  ) {
    throw new Error(`pilot success actions bulk API failed: ${pilotSuccessActionsCreated.status} ${JSON.stringify(pilotSuccessActionsCreated.data).slice(0, 1200)}`);
  }

  const pilotSuccessActionsAudit = await request("/api/admin/audit-logs?type=pilot_success_action_created&limit=20");
  if (
    pilotSuccessActionsCreated.data.created?.length &&
    (
      pilotSuccessActionsAudit.status !== 200 ||
      !pilotSuccessActionsAudit.data.items?.some((item) => item.type === "pilot_success_action_created" && item.educationOnly === true)
    )
  ) {
    throw new Error(`pilot success action audit missing: ${pilotSuccessActionsAudit.status} ${JSON.stringify(pilotSuccessActionsAudit.data).slice(0, 1200)}`);
  }

  const pilotActionForUpdate = pilotSuccessActionsCreated.data.created?.[0]
    || pilotSuccessActionsCreated.data.actions?.find((item) => ["open", "in_progress"].includes(item.status || "open"));
  if (pilotActionForUpdate?.id) {
    const pilotSuccessActionUpdated = await request("/api/admin/pilot-success-actions/update", {
      method: "POST",
      body: {
        actionId: pilotActionForUpdate.id,
        status: "done",
        ownerEmail: "success@tradegym.local",
        resolutionNote: "Verifier completed this customer-success follow-up for education-only pilot review.",
      },
    });
    if (
      pilotSuccessActionUpdated.status !== 200 ||
      pilotSuccessActionUpdated.data.productionReady !== false ||
      pilotSuccessActionUpdated.data.educationOnly !== true ||
      pilotSuccessActionUpdated.data.action?.status !== "done" ||
      pilotSuccessActionUpdated.data.action?.completedAt == null ||
      !pilotSuccessActionUpdated.data.constraints?.some((item) => item.includes("Completing an action does not mark the product production-ready"))
    ) {
      throw new Error(`pilot success action update API failed: ${pilotSuccessActionUpdated.status} ${JSON.stringify(pilotSuccessActionUpdated.data).slice(0, 1200)}`);
    }
    const pilotSuccessActionUpdateAudit = await request("/api/admin/audit-logs?type=pilot_success_action_updated&limit=20");
    if (
      pilotSuccessActionUpdateAudit.status !== 200 ||
      !pilotSuccessActionUpdateAudit.data.items?.some((item) => item.type === "pilot_success_action_updated" && item.educationOnly === true)
    ) {
      throw new Error(`pilot success action update audit missing: ${pilotSuccessActionUpdateAudit.status} ${JSON.stringify(pilotSuccessActionUpdateAudit.data).slice(0, 1200)}`);
    }
  }

  const pilotRenewalReview = await request("/api/admin/pilot-renewal-review/export?format=json");
  const pilotRenewalConstraints = (pilotRenewalReview.data.constraints || []).join(" ").toLowerCase();
  if (
    pilotRenewalReview.status !== 200 ||
    pilotRenewalReview.data.reportType !== "pilot_renewal_review" ||
    pilotRenewalReview.data.productionReady !== false ||
    pilotRenewalReview.data.educationOnly !== true ||
    !["continue_pilot_before_renewal_or_expansion", "customer_success_review_required", "education_renewal_review_ready"].includes(pilotRenewalReview.data.recommendation) ||
    typeof pilotRenewalReview.data.summary?.actionsDone !== "number" ||
    !pilotRenewalReview.data.rows?.some((item) => item.section === "decision" && item.item === "renewal_review_recommendation") ||
    !pilotRenewalReview.data.prohibitedUses?.some((item) => item.includes("win-rate evidence")) ||
    !pilotRenewalConstraints.includes("does not measure trading performance") ||
    !pilotRenewalConstraints.includes("productionready remains false")
  ) {
    throw new Error(`pilot renewal review export failed: ${pilotRenewalReview.status} ${JSON.stringify(pilotRenewalReview.data).slice(0, 1400)}`);
  }

  const pilotRenewalCsv = await request("/api/admin/pilot-renewal-review/export?format=csv");
  if (
    pilotRenewalCsv.status !== 200 ||
    typeof pilotRenewalCsv.data !== "string" ||
    !pilotRenewalCsv.data.startsWith("section,item,status,evidence,next") ||
    !pilotRenewalCsv.data.includes("decision,renewal_review_recommendation") ||
    !pilotRenewalCsv.headers?.["content-disposition"]?.includes("tradegym-pilot-renewal-review.csv")
  ) {
    throw new Error(`pilot renewal review CSV export failed: ${pilotRenewalCsv.status} ${String(pilotRenewalCsv.data).slice(0, 600)}`);
  }

  const pilotRenewalBrief = await request("/api/admin/pilot-renewal-review/export?format=md");
  if (
    pilotRenewalBrief.status !== 200 ||
    typeof pilotRenewalBrief.data !== "string" ||
    !pilotRenewalBrief.data.startsWith("# TradeGym Pilot Renewal Brief") ||
    !pilotRenewalBrief.data.includes("not investment advice") ||
    !pilotRenewalBrief.data.includes("Production ready: false") ||
    !pilotRenewalBrief.headers?.["content-disposition"]?.includes("tradegym-pilot-renewal-brief.md")
  ) {
    throw new Error(`pilot renewal brief export failed: ${pilotRenewalBrief.status} ${String(pilotRenewalBrief.data).slice(0, 900)}`);
  }

  const pilotRenewalAudit = await request("/api/admin/audit-logs?type=pilot_renewal_review_exported&limit=20");
  if (
    pilotRenewalAudit.status !== 200 ||
    !pilotRenewalAudit.data.items?.some((item) => item.type === "pilot_renewal_review_exported" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`pilot renewal review audit missing: ${pilotRenewalAudit.status} ${JSON.stringify(pilotRenewalAudit.data).slice(0, 1200)}`);
  }

  const pilotRenewalBriefsBefore = await request("/api/admin/pilot-renewal-briefs");
  if (
    pilotRenewalBriefsBefore.status !== 200 ||
    pilotRenewalBriefsBefore.data.productionReady !== false ||
    pilotRenewalBriefsBefore.data.educationOnly !== true ||
    !Array.isArray(pilotRenewalBriefsBefore.data.briefs) ||
    typeof pilotRenewalBriefsBefore.data.summary?.draft !== "number" ||
    !pilotRenewalBriefsBefore.data.constraints?.some((item) => item.includes("customer-success"))
  ) {
    throw new Error(`pilot renewal briefs API failed: ${pilotRenewalBriefsBefore.status} ${JSON.stringify(pilotRenewalBriefsBefore.data).slice(0, 1200)}`);
  }

  const pilotRenewalBriefCreated = await request("/api/admin/pilot-renewal-briefs", {
    method: "POST",
    body: {
      ownerEmail: "success@tradegym.local",
      title: "Verifier pilot renewal brief",
    },
  });
  if (
    pilotRenewalBriefCreated.status !== 201 ||
    pilotRenewalBriefCreated.data.productionReady !== false ||
    pilotRenewalBriefCreated.data.educationOnly !== true ||
    pilotRenewalBriefCreated.data.brief?.status !== "draft" ||
    pilotRenewalBriefCreated.data.brief?.ownerEmail !== "success@tradegym.local" ||
    !pilotRenewalBriefCreated.data.brief?.markdown?.includes("# TradeGym Pilot Renewal Brief") ||
    !pilotRenewalBriefCreated.data.brief?.prohibitedUses?.some((item) => item.includes("stock recommendation")) ||
    !pilotRenewalBriefCreated.data.constraints?.some((item) => item.includes("Creating a brief does not mark the product production-ready"))
  ) {
    throw new Error(`pilot renewal brief create failed: ${pilotRenewalBriefCreated.status} ${JSON.stringify(pilotRenewalBriefCreated.data).slice(0, 1400)}`);
  }

  const pilotRenewalBriefAudit = await request("/api/admin/audit-logs?type=pilot_renewal_brief_created&limit=20");
  if (
    pilotRenewalBriefAudit.status !== 200 ||
    !pilotRenewalBriefAudit.data.items?.some((item) => item.type === "pilot_renewal_brief_created" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`pilot renewal brief create audit missing: ${pilotRenewalBriefAudit.status} ${JSON.stringify(pilotRenewalBriefAudit.data).slice(0, 1200)}`);
  }

  const pilotRenewalBriefDelivery = await request("/api/admin/pilot-renewal-brief-deliveries", {
    method: "POST",
    body: {
      briefId: pilotRenewalBriefCreated.data.brief.id,
      recipientEmail: "success@tradegym.local",
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    pilotRenewalBriefDelivery.status !== 201 ||
    pilotRenewalBriefDelivery.data.productionReady !== false ||
    pilotRenewalBriefDelivery.data.educationOnly !== true ||
    pilotRenewalBriefDelivery.data.delivery?.briefId !== pilotRenewalBriefCreated.data.brief.id ||
    pilotRenewalBriefDelivery.data.delivery?.recipientEmail !== "success@tradegym.local" ||
    pilotRenewalBriefDelivery.data.delivery?.providerMode !== "local-simulated" ||
    pilotRenewalBriefDelivery.data.brief?.status !== "sent" ||
    !pilotRenewalBriefDelivery.data.constraints?.some((item) => item.includes("Local provider mode is simulated"))
  ) {
    throw new Error(`pilot renewal brief delivery failed: ${pilotRenewalBriefDelivery.status} ${JSON.stringify(pilotRenewalBriefDelivery.data).slice(0, 1400)}`);
  }

  const pilotRenewalBriefDeliveries = await request("/api/admin/pilot-renewal-brief-deliveries");
  if (
    pilotRenewalBriefDeliveries.status !== 200 ||
    pilotRenewalBriefDeliveries.data.productionReady !== false ||
    pilotRenewalBriefDeliveries.data.educationOnly !== true ||
    pilotRenewalBriefDeliveries.data.summary?.localSimulated < 1 ||
    !pilotRenewalBriefDeliveries.data.deliveries?.some((item) => item.id === pilotRenewalBriefDelivery.data.delivery.id && item.providerMode === "local-simulated") ||
    !pilotRenewalBriefDeliveries.data.constraints?.some((item) => item.includes("not proof of real email delivery"))
  ) {
    throw new Error(`pilot renewal brief deliveries list failed: ${pilotRenewalBriefDeliveries.status} ${JSON.stringify(pilotRenewalBriefDeliveries.data).slice(0, 1200)}`);
  }

  const pilotRenewalBriefDeliveryAudit = await request("/api/admin/audit-logs?type=pilot_renewal_brief_delivered&limit=20");
  if (
    pilotRenewalBriefDeliveryAudit.status !== 200 ||
    !pilotRenewalBriefDeliveryAudit.data.items?.some((item) => item.type === "pilot_renewal_brief_delivered" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`pilot renewal brief delivery audit missing: ${pilotRenewalBriefDeliveryAudit.status} ${JSON.stringify(pilotRenewalBriefDeliveryAudit.data).slice(0, 1200)}`);
  }

  const pilotRenewalBriefFeedback = await request("/api/admin/pilot-renewal-brief-deliveries/feedback", {
    method: "POST",
    body: {
      deliveryId: pilotRenewalBriefDelivery.data.delivery.id,
      feedbackStatus: "expansion_interest",
      feedbackNote: "Customer-success review found education-only expansion interest without trading-performance, win-rate, return, signal, broker, or real-money readiness claims.",
      nextCustomerSuccessAction: "Prepare an education-only expansion plan with cohort scope, coach capacity, and learning evidence milestones.",
    },
  });
  if (
    pilotRenewalBriefFeedback.status !== 200 ||
    pilotRenewalBriefFeedback.data.productionReady !== false ||
    pilotRenewalBriefFeedback.data.educationOnly !== true ||
    pilotRenewalBriefFeedback.data.delivery?.feedbackStatus !== "expansion_interest" ||
    !pilotRenewalBriefFeedback.data.delivery?.feedbackAt ||
    pilotRenewalBriefFeedback.data.brief?.lastDeliveryFeedbackStatus !== "expansion_interest" ||
    pilotRenewalBriefFeedback.data.summary?.expansionInterest < 1 ||
    !pilotRenewalBriefFeedback.data.constraints?.some((item) => item.includes("Feedback status is not trading performance"))
  ) {
    throw new Error(`pilot renewal brief feedback failed: ${pilotRenewalBriefFeedback.status} ${JSON.stringify(pilotRenewalBriefFeedback.data).slice(0, 1400)}`);
  }

  const pilotRenewalBriefFeedbackAudit = await request("/api/admin/audit-logs?type=pilot_renewal_brief_feedback_recorded&limit=20");
  if (
    pilotRenewalBriefFeedbackAudit.status !== 200 ||
    !pilotRenewalBriefFeedbackAudit.data.items?.some((item) => item.type === "pilot_renewal_brief_feedback_recorded" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`pilot renewal brief feedback audit missing: ${pilotRenewalBriefFeedbackAudit.status} ${JSON.stringify(pilotRenewalBriefFeedbackAudit.data).slice(0, 1200)}`);
  }

  const pilotRenewalFeedbackAction = await request("/api/admin/pilot-renewal-brief-deliveries/create-action", {
    method: "POST",
    body: {
      deliveryId: pilotRenewalBriefDelivery.data.delivery.id,
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    pilotRenewalFeedbackAction.status !== 201 ||
    pilotRenewalFeedbackAction.data.productionReady !== false ||
    pilotRenewalFeedbackAction.data.educationOnly !== true ||
    pilotRenewalFeedbackAction.data.action?.deliveryId !== pilotRenewalBriefDelivery.data.delivery.id ||
    pilotRenewalFeedbackAction.data.action?.feedbackStatus !== "expansion_interest" ||
    pilotRenewalFeedbackAction.data.action?.ownerEmail !== "success@tradegym.local" ||
    pilotRenewalFeedbackAction.data.delivery?.nextActionId !== pilotRenewalFeedbackAction.data.action?.id ||
    !pilotRenewalFeedbackAction.data.actionQueue?.actions?.some((item) => item.id === pilotRenewalFeedbackAction.data.action.id) ||
    !pilotRenewalFeedbackAction.data.constraints?.some((item) => item.includes("education customer-success follow-up"))
  ) {
    throw new Error(`pilot renewal feedback action create failed: ${pilotRenewalFeedbackAction.status} ${JSON.stringify(pilotRenewalFeedbackAction.data).slice(0, 1400)}`);
  }

  const pilotRenewalFeedbackActionReused = await request("/api/admin/pilot-renewal-brief-deliveries/create-action", {
    method: "POST",
    body: {
      deliveryId: pilotRenewalBriefDelivery.data.delivery.id,
      ownerEmail: "success@tradegym.local",
    },
  });
  if (
    pilotRenewalFeedbackActionReused.status !== 200 ||
    pilotRenewalFeedbackActionReused.data.reused !== true ||
    pilotRenewalFeedbackActionReused.data.action?.id !== pilotRenewalFeedbackAction.data.action.id ||
    pilotRenewalFeedbackActionReused.data.productionReady !== false ||
    pilotRenewalFeedbackActionReused.data.educationOnly !== true
  ) {
    throw new Error(`pilot renewal feedback action reuse failed: ${pilotRenewalFeedbackActionReused.status} ${JSON.stringify(pilotRenewalFeedbackActionReused.data).slice(0, 1200)}`);
  }

  const pilotRenewalFeedbackActionAudit = await request("/api/admin/audit-logs?type=pilot_renewal_feedback_action_created&limit=20");
  if (
    pilotRenewalFeedbackActionAudit.status !== 200 ||
    !pilotRenewalFeedbackActionAudit.data.items?.some((item) => item.type === "pilot_renewal_feedback_action_created" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`pilot renewal feedback action audit missing: ${pilotRenewalFeedbackActionAudit.status} ${JSON.stringify(pilotRenewalFeedbackActionAudit.data).slice(0, 1200)}`);
  }

  const pilotExpansionPlan = await request("/api/admin/pilot-expansion-plan");
  const expansionConstraints = (pilotExpansionPlan.data.constraints || []).join(" ").toLowerCase();
  if (
    pilotExpansionPlan.status !== 200 ||
    pilotExpansionPlan.data.reportType !== "pilot_expansion_plan" ||
    pilotExpansionPlan.data.productionReady !== false ||
    pilotExpansionPlan.data.educationOnly !== true ||
    !["expand_after_customer_success_gaps_close", "expand_in_phased_cohorts", "education_expansion_plan_ready"].includes(pilotExpansionPlan.data.decision) ||
    typeof pilotExpansionPlan.data.summary?.targetLearners !== "number" ||
    typeof pilotExpansionPlan.data.summary?.coachCapacityRemaining !== "number" ||
    !pilotExpansionPlan.data.rows?.some((item) => item.section === "capacity" && item.item === "coach_capacity") ||
    !pilotExpansionPlan.data.milestones?.some((item) => item.includes("Wave 1")) ||
    !expansionConstraints.includes("does not provide stock recommendations") ||
    !expansionConstraints.includes("productionready")
  ) {
    throw new Error(`pilot expansion plan API failed: ${pilotExpansionPlan.status} ${JSON.stringify(pilotExpansionPlan.data).slice(0, 1600)}`);
  }

  const pilotExpansionPlanSaved = await request("/api/admin/pilot-expansion-plans", {
    method: "POST",
    body: {
      ownerEmail: "success@tradegym.local",
      title: "Verifier pilot expansion plan",
    },
  });
  if (
    pilotExpansionPlanSaved.status !== 201 ||
    pilotExpansionPlanSaved.data.productionReady !== false ||
    pilotExpansionPlanSaved.data.educationOnly !== true ||
    pilotExpansionPlanSaved.data.saved?.productionReady !== false ||
    pilotExpansionPlanSaved.data.saved?.educationOnly !== true ||
    pilotExpansionPlanSaved.data.saved?.plan?.reportType !== "pilot_expansion_plan" ||
    pilotExpansionPlanSaved.data.saved?.ownerEmail !== "success@tradegym.local" ||
    !pilotExpansionPlanSaved.data.constraints?.some((item) => item.includes("does not mark the product production-ready"))
  ) {
    throw new Error(`pilot expansion plan save failed: ${pilotExpansionPlanSaved.status} ${JSON.stringify(pilotExpansionPlanSaved.data).slice(0, 1400)}`);
  }

  const pilotExpansionPlanList = await request("/api/admin/pilot-expansion-plans");
  if (
    pilotExpansionPlanList.status !== 200 ||
    pilotExpansionPlanList.data.productionReady !== false ||
    pilotExpansionPlanList.data.educationOnly !== true ||
    !pilotExpansionPlanList.data.plans?.some((item) => item.id === pilotExpansionPlanSaved.data.saved.id) ||
    typeof pilotExpansionPlanList.data.summary?.draft !== "number" ||
    !pilotExpansionPlanList.data.constraints?.some((item) => item.includes("education SaaS implementation tracking"))
  ) {
    throw new Error(`pilot expansion plan list failed: ${pilotExpansionPlanList.status} ${JSON.stringify(pilotExpansionPlanList.data).slice(0, 1400)}`);
  }

  const pilotExpansionLaunchChecklist = await request(`/api/admin/pilot-expansion-launch-checklist?planId=${encodeURIComponent(pilotExpansionPlanSaved.data.saved.id)}`);
  const launchConstraints = (pilotExpansionLaunchChecklist.data.constraints || []).join(" ").toLowerCase();
  if (
    pilotExpansionLaunchChecklist.status !== 200 ||
    pilotExpansionLaunchChecklist.data.reportType !== "pilot_expansion_launch_checklist" ||
    pilotExpansionLaunchChecklist.data.productionReady !== false ||
    pilotExpansionLaunchChecklist.data.educationOnly !== true ||
    pilotExpansionLaunchChecklist.data.plan?.id !== pilotExpansionPlanSaved.data.saved.id ||
    typeof pilotExpansionLaunchChecklist.data.summary?.ready !== "number" ||
    !pilotExpansionLaunchChecklist.data.checklist?.some((item) => item.key === "production_boundary" && item.productionReady === false) ||
    !pilotExpansionLaunchChecklist.data.checklist?.some((item) => item.key === "package_ready") ||
    !launchConstraints.includes("does not provide stock recommendations") ||
    !launchConstraints.includes("does not mark the product production-ready")
  ) {
    throw new Error(`pilot expansion launch checklist failed: ${pilotExpansionLaunchChecklist.status} ${JSON.stringify(pilotExpansionLaunchChecklist.data).slice(0, 1600)}`);
  }

  const pilotExpansionLaunchExport = await request(`/api/admin/pilot-expansion-launch-checklist/export?format=json&planId=${encodeURIComponent(pilotExpansionPlanSaved.data.saved.id)}`);
  if (
    pilotExpansionLaunchExport.status !== 200 ||
    pilotExpansionLaunchExport.data.reportType !== "pilot_expansion_launch_checklist" ||
    pilotExpansionLaunchExport.data.productionReady !== false ||
    pilotExpansionLaunchExport.data.educationOnly !== true ||
    pilotExpansionLaunchExport.data.plan?.id !== pilotExpansionPlanSaved.data.saved.id ||
    !pilotExpansionLaunchExport.data.note?.includes("education SaaS customer-success coordination")
  ) {
    throw new Error(`pilot expansion launch JSON export failed: ${pilotExpansionLaunchExport.status} ${JSON.stringify(pilotExpansionLaunchExport.data).slice(0, 1400)}`);
  }

  const pilotExpansionLaunchCsv = await request(`/api/admin/pilot-expansion-launch-checklist/export?format=csv&planId=${encodeURIComponent(pilotExpansionPlanSaved.data.saved.id)}`);
  if (
    pilotExpansionLaunchCsv.status !== 200 ||
    !String(pilotExpansionLaunchCsv.data).includes("production_boundary") ||
    !String(pilotExpansionLaunchCsv.data).includes("package_ready") ||
    !pilotExpansionLaunchCsv.headers?.["content-disposition"]?.includes("tradegym-pilot-expansion-launch-checklist.csv")
  ) {
    throw new Error(`pilot expansion launch CSV export failed: ${pilotExpansionLaunchCsv.status} ${String(pilotExpansionLaunchCsv.data).slice(0, 600)}`);
  }

  const pilotExpansionLaunchBrief = await request(`/api/admin/pilot-expansion-launch-checklist/export?format=md&planId=${encodeURIComponent(pilotExpansionPlanSaved.data.saved.id)}`);
  if (
    pilotExpansionLaunchBrief.status !== 200 ||
    !String(pilotExpansionLaunchBrief.data).startsWith("# TradeGym Pilot Expansion Launch Brief") ||
    !String(pilotExpansionLaunchBrief.data).includes("not investment advice") ||
    !pilotExpansionLaunchBrief.headers?.["content-disposition"]?.includes("tradegym-pilot-expansion-launch-brief.md")
  ) {
    throw new Error(`pilot expansion launch Markdown export failed: ${pilotExpansionLaunchBrief.status} ${String(pilotExpansionLaunchBrief.data).slice(0, 600)}`);
  }

  const pilotExpansionLaunchBriefsBefore = await request("/api/admin/pilot-expansion-launch-briefs");
  if (
    pilotExpansionLaunchBriefsBefore.status !== 200 ||
    pilotExpansionLaunchBriefsBefore.data.productionReady !== false ||
    pilotExpansionLaunchBriefsBefore.data.educationOnly !== true ||
    !Array.isArray(pilotExpansionLaunchBriefsBefore.data.briefs) ||
    typeof pilotExpansionLaunchBriefsBefore.data.summary?.draft !== "number" ||
    !pilotExpansionLaunchBriefsBefore.data.constraints?.some((item) => item.includes("customer-success education launch records"))
  ) {
    throw new Error(`pilot expansion launch briefs API failed: ${pilotExpansionLaunchBriefsBefore.status} ${JSON.stringify(pilotExpansionLaunchBriefsBefore.data).slice(0, 1200)}`);
  }

  const pilotExpansionLaunchBriefCreated = await request("/api/admin/pilot-expansion-launch-briefs", {
    method: "POST",
    body: {
      planId: pilotExpansionPlanSaved.data.saved.id,
      ownerEmail: "success@tradegym.local",
      title: "Verifier pilot expansion launch brief",
    },
  });
  if (
    pilotExpansionLaunchBriefCreated.status !== 201 ||
    pilotExpansionLaunchBriefCreated.data.productionReady !== false ||
    pilotExpansionLaunchBriefCreated.data.educationOnly !== true ||
    pilotExpansionLaunchBriefCreated.data.brief?.productionReady !== false ||
    pilotExpansionLaunchBriefCreated.data.brief?.educationOnly !== true ||
    pilotExpansionLaunchBriefCreated.data.brief?.status !== "draft" ||
    pilotExpansionLaunchBriefCreated.data.brief?.planId !== pilotExpansionPlanSaved.data.saved.id ||
    !String(pilotExpansionLaunchBriefCreated.data.brief?.markdown || "").startsWith("# TradeGym Pilot Expansion Launch Brief") ||
    !pilotExpansionLaunchBriefCreated.data.constraints?.some((item) => item.includes("does not mark the product production-ready"))
  ) {
    throw new Error(`pilot expansion launch brief create failed: ${pilotExpansionLaunchBriefCreated.status} ${JSON.stringify(pilotExpansionLaunchBriefCreated.data).slice(0, 1400)}`);
  }

  const pilotExpansionLaunchBriefUpdated = await request("/api/admin/pilot-expansion-launch-briefs/update", {
    method: "POST",
    body: {
      briefId: pilotExpansionLaunchBriefCreated.data.brief.id,
      status: "reviewed",
      ownerEmail: "success@tradegym.local",
      reviewNote: "Verifier reviewed this education-only pilot expansion launch brief for customer-success coordination.",
    },
  });
  if (
    pilotExpansionLaunchBriefUpdated.status !== 200 ||
    pilotExpansionLaunchBriefUpdated.data.productionReady !== false ||
    pilotExpansionLaunchBriefUpdated.data.educationOnly !== true ||
    pilotExpansionLaunchBriefUpdated.data.brief?.status !== "reviewed" ||
    !pilotExpansionLaunchBriefUpdated.data.brief?.reviewedAt ||
    pilotExpansionLaunchBriefUpdated.data.brief?.productionReady !== false ||
    pilotExpansionLaunchBriefUpdated.data.brief?.educationOnly !== true ||
    !pilotExpansionLaunchBriefUpdated.data.constraints?.some((item) => item.includes("does not mark the product production-ready"))
  ) {
    throw new Error(`pilot expansion launch brief update failed: ${pilotExpansionLaunchBriefUpdated.status} ${JSON.stringify(pilotExpansionLaunchBriefUpdated.data).slice(0, 1400)}`);
  }

  const pilotExpansionPlanUpdated = await request("/api/admin/pilot-expansion-plans/update", {
    method: "POST",
    body: {
      planId: pilotExpansionPlanSaved.data.saved.id,
      status: "completed",
      ownerEmail: "success@tradegym.local",
      executionNote: "Verifier marked this education delivery expansion plan complete after customer-success review.",
    },
  });
  if (
    pilotExpansionPlanUpdated.status !== 200 ||
    pilotExpansionPlanUpdated.data.productionReady !== false ||
    pilotExpansionPlanUpdated.data.educationOnly !== true ||
    pilotExpansionPlanUpdated.data.updated?.status !== "completed" ||
    !pilotExpansionPlanUpdated.data.updated?.completedAt ||
    pilotExpansionPlanUpdated.data.updated?.productionReady !== false ||
    pilotExpansionPlanUpdated.data.updated?.educationOnly !== true ||
    !pilotExpansionPlanUpdated.data.constraints?.some((item) => item.includes("does not mark the product production-ready"))
  ) {
    throw new Error(`pilot expansion plan update failed: ${pilotExpansionPlanUpdated.status} ${JSON.stringify(pilotExpansionPlanUpdated.data).slice(0, 1400)}`);
  }

  const pilotExpansionPlanAudit = await request("/api/admin/audit-logs?type=pilot_expansion_plan_created&limit=20");
  if (
    pilotExpansionPlanAudit.status !== 200 ||
    !pilotExpansionPlanAudit.data.items?.some((item) => item.type === "pilot_expansion_plan_created" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`pilot expansion plan audit missing: ${pilotExpansionPlanAudit.status} ${JSON.stringify(pilotExpansionPlanAudit.data).slice(0, 1200)}`);
  }

  const pilotExpansionPlanUpdateAudit = await request("/api/admin/audit-logs?type=pilot_expansion_plan_updated&limit=20");
  if (
    pilotExpansionPlanUpdateAudit.status !== 200 ||
    !pilotExpansionPlanUpdateAudit.data.items?.some((item) => item.type === "pilot_expansion_plan_updated" && item.status === "completed" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`pilot expansion plan update audit missing: ${pilotExpansionPlanUpdateAudit.status} ${JSON.stringify(pilotExpansionPlanUpdateAudit.data).slice(0, 1200)}`);
  }

  const pilotExpansionLaunchExportAudit = await request("/api/admin/audit-logs?type=pilot_expansion_launch_checklist_exported&limit=20");
  if (
    pilotExpansionLaunchExportAudit.status !== 200 ||
    !pilotExpansionLaunchExportAudit.data.items?.some((item) => item.type === "pilot_expansion_launch_checklist_exported" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`pilot expansion launch export audit missing: ${pilotExpansionLaunchExportAudit.status} ${JSON.stringify(pilotExpansionLaunchExportAudit.data).slice(0, 1200)}`);
  }

  const pilotExpansionLaunchBriefCreateAudit = await request("/api/admin/audit-logs?type=pilot_expansion_launch_brief_created&limit=20");
  if (
    pilotExpansionLaunchBriefCreateAudit.status !== 200 ||
    !pilotExpansionLaunchBriefCreateAudit.data.items?.some((item) => item.type === "pilot_expansion_launch_brief_created" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`pilot expansion launch brief create audit missing: ${pilotExpansionLaunchBriefCreateAudit.status} ${JSON.stringify(pilotExpansionLaunchBriefCreateAudit.data).slice(0, 1200)}`);
  }

  const pilotExpansionLaunchBriefUpdateAudit = await request("/api/admin/audit-logs?type=pilot_expansion_launch_brief_updated&limit=20");
  if (
    pilotExpansionLaunchBriefUpdateAudit.status !== 200 ||
    !pilotExpansionLaunchBriefUpdateAudit.data.items?.some((item) => item.type === "pilot_expansion_launch_brief_updated" && item.status === "reviewed" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`pilot expansion launch brief update audit missing: ${pilotExpansionLaunchBriefUpdateAudit.status} ${JSON.stringify(pilotExpansionLaunchBriefUpdateAudit.data).slice(0, 1200)}`);
  }

  const pilotRenewalBriefUpdated = await request("/api/admin/pilot-renewal-briefs/update", {
    method: "POST",
    body: {
      briefId: pilotRenewalBriefCreated.data.brief.id,
      status: "reviewed",
      ownerEmail: "success@tradegym.local",
      reviewNote: "Verifier reviewed this education-only renewal brief without trading-performance, win-rate, return, signal, broker, or real-money readiness claims.",
    },
  });
  if (
    pilotRenewalBriefUpdated.status !== 200 ||
    pilotRenewalBriefUpdated.data.productionReady !== false ||
    pilotRenewalBriefUpdated.data.educationOnly !== true ||
    pilotRenewalBriefUpdated.data.brief?.status !== "reviewed" ||
    !pilotRenewalBriefUpdated.data.brief?.reviewedAt ||
    !pilotRenewalBriefUpdated.data.constraints?.some((item) => item.includes("Reviewing a brief does not mark the product production-ready"))
  ) {
    throw new Error(`pilot renewal brief update failed: ${pilotRenewalBriefUpdated.status} ${JSON.stringify(pilotRenewalBriefUpdated.data).slice(0, 1400)}`);
  }

  const pilotRenewalBriefUpdateAudit = await request("/api/admin/audit-logs?type=pilot_renewal_brief_updated&limit=20");
  if (
    pilotRenewalBriefUpdateAudit.status !== 200 ||
    !pilotRenewalBriefUpdateAudit.data.items?.some((item) => item.type === "pilot_renewal_brief_updated" && item.educationOnly === true && item.productionReady === false)
  ) {
    throw new Error(`pilot renewal brief update audit missing: ${pilotRenewalBriefUpdateAudit.status} ${JSON.stringify(pilotRenewalBriefUpdateAudit.data).slice(0, 1200)}`);
  }

  const addonCoachReviewTask = await request("/api/admin/coach-review-tasks", {
    method: "POST",
    body: {
      userId: quotaUserId,
      focus: "add-on quota task",
      requestNote: "API verification add-on quota task",
    },
  });
  if (
    addonCoachReviewTask.status !== 201 ||
    addonCoachReviewTask.data.task?.quotaLimit < 2 ||
    addonCoachReviewTask.data.task?.quotaUsageAfterCreate !== 2
  ) {
    throw new Error("coach review add-on quota was not applied");
  }

  const coachReviewTasks = await request(`/api/admin/coach-review-tasks?status=open&q=${encodeURIComponent(quotaEmail)}&limit=100`);
  if (
    coachReviewTasks.status !== 200 ||
    !coachReviewTasks.data.tasks?.some((item) => item.id === coachReviewTask.data.task.id) ||
    !coachReviewTasks.data.tasks?.some((item) => item.id === addonCoachReviewTask.data.task.id) ||
    typeof coachReviewTasks.data.totals?.overdueOpen !== "number" ||
    coachReviewTasks.data.totals?.highPriorityOpen < 1 ||
    !coachReviewTasks.data.tasks?.some((item) => item.id === coachReviewTask.data.task.id && item.priority === "high" && item.overdue === true && item.dueAt) ||
    !coachReviewTasks.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("coach review task list API failed");
  }
  const overdueCoachTasks = await request("/api/admin/coach-review-tasks?status=open&overdue=true&limit=20");
  if (
    overdueCoachTasks.status !== 200 ||
    !overdueCoachTasks.data.tasks?.some((item) => item.id === coachReviewTask.data.task.id && item.overdue === true) ||
    overdueCoachTasks.data.tasks?.some((item) => item.overdue !== true) ||
    !overdueCoachTasks.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error(`coach task overdue filter failed: ${overdueCoachTasks.status} ${JSON.stringify(overdueCoachTasks.data).slice(0, 1000)}`);
  }
  const coachFilteredTasks = await request("/api/admin/coach-review-tasks?status=open&coach=coach-a%40tradegym.local&limit=20");
  if (
    coachFilteredTasks.status !== 200 ||
    !coachFilteredTasks.data.tasks?.some((item) => item.id === coachReviewTask.data.task.id && item.assignedCoachEmail === "coach-a@tradegym.local") ||
    coachFilteredTasks.data.tasks?.some((item) => item.assignedCoachEmail !== "coach-a@tradegym.local")
  ) {
    throw new Error(`coach task assigned-coach filter failed: ${coachFilteredTasks.status} ${JSON.stringify(coachFilteredTasks.data).slice(0, 1000)}`);
  }

  const completedCoachReviewTask = await request("/api/admin/coach-review-tasks/update", {
    method: "POST",
    body: {
      taskId: coachReviewTask.data.task.id,
      status: "completed",
      priority: "normal",
      assignedCoachEmail: "coach-b@tradegym.local",
      coachNote: "Education review completed: practice invalidation first, keep simulated risk small, and write the reason before judging outcomes.",
    },
  });
  if (
    completedCoachReviewTask.status !== 200 ||
    completedCoachReviewTask.data.task?.status !== "completed" ||
    completedCoachReviewTask.data.task?.priority !== "normal" ||
    completedCoachReviewTask.data.task?.assignedCoachEmail !== "coach-b@tradegym.local"
  ) {
    throw new Error("coach review task complete API failed");
  }

  const learnerCoachReviews = await request("/api/coach/reviews");
  if (learnerCoachReviews.status !== 200 && learnerCoachReviews.status !== 403) {
    throw new Error("unexpected admin coach reviews response");
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const quotaLearnerAgain = await request("/api/auth/login", {
    method: "POST",
    body: { email: quotaEmail, password: "demo12345" },
  });
  if (quotaLearnerAgain.status !== 200) {
    throw new Error("quota learner relogin for reviews failed");
  }
  const quotaLearnerCoachReviews = await request("/api/coach/reviews");
  if (
    quotaLearnerCoachReviews.status !== 200 ||
    !quotaLearnerCoachReviews.data.tasks?.some((item) => item.id === coachReviewTask.data.task.id && item.status === "completed") ||
    !quotaLearnerCoachReviews.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("learner coach reviews API failed");
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const adminAfterCoachReviews = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminAfterCoachReviews.status !== 200 || adminAfterCoachReviews.data.session?.role !== "admin") {
    throw new Error("admin relogin after coach reviews failed");
  }

  const reviewQueue = await request("/api/admin/review-queue");
  if (reviewQueue.status !== 200 || !Array.isArray(reviewQueue.data.items) || !reviewQueue.data.aiCoach?.promptVersion) {
    throw new Error("review queue API failed");
  }
  if (!reviewQueue.data.items.some((item) => item.id === deletionRequestId && item.type === "account_deletion_requested")) {
    throw new Error("deletion request missing from review queue");
  }

  const deletionProcessing = await request("/api/admin/deletion-requests/process", {
    method: "POST",
    body: {
      requestId: deletionRequestId,
      action: "processing",
      note: "API verification processing step",
    },
  });
  if (deletionProcessing.status !== 200 || deletionProcessing.data.request?.moderationStatus !== "processing") {
    throw new Error("deletion request processing action failed");
  }

  const deletionAnonymized = await request("/api/admin/deletion-requests/process", {
    method: "POST",
    body: {
      requestId: deletionRequestId,
      action: "anonymized",
      note: "API verification anonymized step",
    },
  });
  if (deletionAnonymized.status !== 200 || deletionAnonymized.data.request?.resolution !== "anonymized") {
    throw new Error("deletion request anonymize action failed");
  }

  const reviewQueueAfterDeletion = await request("/api/admin/review-queue");
  if (reviewQueueAfterDeletion.data.items.some((item) => item.id === deletionRequestId)) {
    throw new Error("resolved deletion request still in review queue");
  }

  const auditLogs = await request("/api/admin/audit-logs?limit=80");
  if (
    auditLogs.status !== 200 ||
    !auditLogs.data.items?.some((item) => item.type === "account_deletion_request_processed") ||
    !auditLogs.data.typeCounts?.length
  ) {
    throw new Error("audit log API failed");
  }

  const auditIntegrityBeforeSeal = await request("/api/admin/audit-integrity");
  if (
    auditIntegrityBeforeSeal.status !== 200 ||
    auditIntegrityBeforeSeal.data.immutableLedger !== false ||
    !auditIntegrityBeforeSeal.data.current?.rootHash ||
    !auditIntegrityBeforeSeal.data.constraints?.some((item) => item.includes("tamper-evidence"))
  ) {
    throw new Error(`audit integrity API failed: ${auditIntegrityBeforeSeal.status} ${JSON.stringify(auditIntegrityBeforeSeal.data).slice(0, 1000)}`);
  }

  const auditSeal = await request("/api/admin/audit-integrity/seal", {
    method: "POST",
    body: {},
  });
  if (
    auditSeal.status !== 201 ||
    auditSeal.data.seal?.immutableLedger !== false ||
    !auditSeal.data.seal?.rootHash ||
    auditSeal.data.integrity?.verification?.status !== "verified" ||
    auditSeal.data.integrity?.tamperEvidence !== true ||
    !auditSeal.data.constraints?.some((item) => item.includes("not immutable ledger"))
  ) {
    throw new Error(`audit integrity seal API failed: ${auditSeal.status} ${JSON.stringify(auditSeal.data).slice(0, 1200)}`);
  }

  const auditIntegrityAfterSeal = await request("/api/admin/audit-integrity");
  if (
    auditIntegrityAfterSeal.status !== 200 ||
    auditIntegrityAfterSeal.data.verification?.status !== "verified" ||
    auditIntegrityAfterSeal.data.latestSeal?.id !== auditSeal.data.seal.id
  ) {
    throw new Error(`audit integrity verification after seal failed: ${auditIntegrityAfterSeal.status} ${JSON.stringify(auditIntegrityAfterSeal.data).slice(0, 1200)}`);
  }

  const billingAuditLogs = await request("/api/admin/audit-logs?type=billing_webhook_processed&limit=20");
  if (billingAuditLogs.status !== 200 || !billingAuditLogs.data.items?.some((item) => item.billingEventType === "payment.succeeded")) {
    throw new Error("filtered billing audit log API failed");
  }

  const users = await request(`/api/admin/users?status=deleted&q=${encodeURIComponent(register.data.account.id)}&limit=20`);
  if (users.status !== 200 || !users.data.items?.some((item) => item.id === register.data.account.id && item.accountStatus === "deleted")) {
    throw new Error("admin user list API failed");
  }

  const governanceEmail = `governance-${Date.now()}@tradegym.local`;
  const governanceRegister = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Governance Learner",
      email: governanceEmail,
      password: "demo12345",
      legalAcceptance: {
        accepted: true,
        termsVersion: legalVersions.terms,
        privacyVersion: legalVersions.privacy,
        riskDisclosureVersion: legalVersions.risk,
      },
    },
  });
  if (governanceRegister.status !== 201 || !governanceRegister.data.account?.id) {
    throw new Error("governance learner registration failed");
  }
  const governanceUserId = governanceRegister.data.account.id;
  await request("/api/auth/logout", { method: "POST", body: {} });
  const reloginAdmin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (reloginAdmin.status !== 200 || reloginAdmin.data.session?.role !== "admin") {
    throw new Error("admin relogin for governance failed");
  }

  const makeAdmin = await request("/api/admin/users/update", {
    method: "POST",
    body: { userId: governanceUserId, action: "role", role: "admin" },
  });
  if (makeAdmin.status !== 200 || makeAdmin.data.account?.role !== "admin") {
    throw new Error("admin user role update failed");
  }

  const makeStudent = await request("/api/admin/users/update", {
    method: "POST",
    body: { userId: governanceUserId, action: "role", role: "student" },
  });
  if (makeStudent.status !== 200 || makeStudent.data.account?.role !== "student") {
    throw new Error("admin user role restore failed");
  }

  const disabled = await request("/api/admin/users/update", {
    method: "POST",
    body: { userId: governanceUserId, action: "disable", reason: "API verification disable" },
  });
  if (disabled.status !== 200 || disabled.data.account?.accountStatus !== "disabled") {
    throw new Error("admin disable user failed");
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const blockedDisabledLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: governanceEmail, password: "demo12345" },
  });
  if (blockedDisabledLogin.status !== 403 || blockedDisabledLogin.data.accountStatus !== "disabled") {
    throw new Error("disabled user login was not blocked");
  }
  const adminAfterDisabledCheck = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (adminAfterDisabledCheck.status !== 200 || adminAfterDisabledCheck.data.session?.role !== "admin") {
    throw new Error("admin relogin after disabled check failed");
  }

  const reactivated = await request("/api/admin/users/update", {
    method: "POST",
    body: { userId: governanceUserId, action: "reactivate" },
  });
  if (reactivated.status !== 200 || reactivated.data.account?.accountStatus !== "active") {
    throw new Error("admin reactivate user failed");
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const reactivatedLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: governanceEmail, password: "demo12345" },
  });
  if (reactivatedLogin.status !== 200 || reactivatedLogin.data.session?.email !== governanceEmail) {
    throw new Error("reactivated user login failed");
  }
  await request("/api/auth/logout", { method: "POST", body: {} });
  const finalAdminLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@tradegym.local", password: "admin123" },
  });
  if (finalAdminLogin.status !== 200 || finalAdminLogin.data.session?.role !== "admin") {
    throw new Error("final admin login failed");
  }

  const governanceAuditLogs = await request("/api/admin/audit-logs?type=admin_user_updated&moderationStatus=approved&limit=20");
  if (governanceAuditLogs.status !== 200 || !governanceAuditLogs.data.items?.some((item) => item.userId === governanceUserId)) {
    throw new Error("admin governance audit log filtering failed");
  }

  const auditJsonExport = await request("/api/admin/audit-logs/export?format=json&type=admin_user_updated");
  if (auditJsonExport.status !== 200 || auditJsonExport.data.immutableLedger !== false || !auditJsonExport.data.items?.length) {
    throw new Error("audit JSON export failed");
  }

  const auditCsvExport = await request("/api/admin/audit-logs/export?format=csv&type=admin_user_updated");
  if (auditCsvExport.status !== 200 || typeof auditCsvExport.data !== "string" || !auditCsvExport.data.includes("admin_user_updated")) {
    throw new Error("audit CSV export failed");
  }

  const canceled = await request("/api/billing/cancel-subscription", {
    method: "POST",
    body: {},
  });
  if (
    canceled.status !== 200 ||
    canceled.data.entitlement?.plan !== "Starter" ||
    canceled.data.subscription?.status !== "canceled" ||
    canceled.data.order?.status !== "canceled" ||
    !canceled.data.constraints?.some((item) => item.includes("No stock recommendation") || item.includes("stock recommendations"))
  ) {
    throw new Error(`self-service subscription cancellation failed: ${canceled.status} ${JSON.stringify(canceled.data).slice(0, 1200)}`);
  }
  const canceledOrderId = canceled.data.order.id;
  const refundRequest = await request("/api/billing/refund-request", {
    method: "POST",
    body: {
      reason: "Please review the latest canceled education SaaS subscription order for a refund. This is a billing support request only.",
    },
  });
  if (
    ![200, 201].includes(refundRequest.status) ||
    refundRequest.data.ticket?.category !== "billing" ||
    refundRequest.data.ticket?.refundOrderId !== canceledOrderId ||
    refundRequest.data.ticket?.educationOnly !== true ||
    !refundRequest.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("billing refund request API failed");
  }
  const refundSupportQueue = await request(`/api/admin/support-tickets?q=${encodeURIComponent(refundRequest.data.ticket.id)}&limit=20`);
  if (
    refundSupportQueue.status !== 200 ||
    !refundSupportQueue.data.tickets?.some((item) => item.id === refundRequest.data.ticket.id && item.refundOrderId === canceledOrderId)
  ) {
    throw new Error("refund request support queue lookup failed");
  }
  const processedRefund = await request("/api/admin/refund-requests/process", {
    method: "POST",
    body: {
      ticketId: refundRequest.data.ticket.id,
      action: "approve",
      adminNote: "Approved refund review for the canceled education SaaS subscription order. No stock recommendation, live signal, return promise, or real-money trading instruction was provided.",
    },
  });
  if (
    processedRefund.status !== 200 ||
    processedRefund.data.ticket?.refundStatus !== "approved" ||
    processedRefund.data.ticket?.status !== "resolved" ||
    processedRefund.data.order?.status !== "refunded" ||
    processedRefund.data.event?.type !== "payment.refunded" ||
    processedRefund.data.revenueLedger?.totals?.refunds < 1 ||
    !processedRefund.data.constraints?.some((item) => item.includes("No stock recommendation"))
  ) {
    throw new Error("admin refund request processing failed");
  }

  const starterCoursePackages = await request("/api/course-packages");
  if (
    starterCoursePackages.status !== 200 ||
    !starterCoursePackages.data.packages?.some((item) => item.id === coursePackage.data.coursePackage.id && item.canAccess === false && item.access === "preview" && item.lockedCounts.scenarios >= 0)
  ) {
    throw new Error("starter course package preview access failed");
  }

  const knowledgeOverview = await request("/api/knowledge-browser/overview", { timeoutMs: 60000 });
  if (
    knowledgeOverview.status !== 200 ||
    knowledgeOverview.data.educationOnly !== true ||
    knowledgeOverview.data.productionReady !== false ||
    !/does not provide stock recommendations/i.test(knowledgeOverview.data.boundary || "") ||
    !Array.isArray(knowledgeOverview.data.modules) ||
    knowledgeOverview.data.modules.length < 12 ||
    !(knowledgeOverview.data.qualitySummary?.learnerFacingNodes >= 360)
  ) {
    throw new Error("knowledge browser overview endpoint failed");
  }

  const knowledgeBaseReadinessGate = await request("/api/knowledge-browser/knowledge-base-readiness-gate");
  if (
    knowledgeBaseReadinessGate.status !== 200 ||
    knowledgeBaseReadinessGate.data.educationOnly !== true ||
    knowledgeBaseReadinessGate.data.productionReady !== false ||
    knowledgeBaseReadinessGate.data.approvalStatus !== "not_approved" ||
    knowledgeBaseReadinessGate.data.learnerFacingRelease !== false ||
    knowledgeBaseReadinessGate.data.readinessStatus !== "knowledge_base_internal_review_ready_release_blocked" ||
    knowledgeBaseReadinessGate.data.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course" ||
    knowledgeBaseReadinessGate.data.gateMode !== "local_folder_public_source_source_fit_high_risk_release_gate" ||
    knowledgeBaseReadinessGate.data.localPhysicalFiles !== 302 ||
    knowledgeBaseReadinessGate.data.localUniquePdfHashes !== 298 ||
    knowledgeBaseReadinessGate.data.localMappedUniquePdfFiles !== 298 ||
    knowledgeBaseReadinessGate.data.localUnmappedUniquePdfFiles !== 0 ||
    knowledgeBaseReadinessGate.data.localDocumentNodeMatches !== 2375 ||
    knowledgeBaseReadinessGate.data.publicCorpusDocuments !== 1196 ||
    knowledgeBaseReadinessGate.data.wikipediaDocuments !== 96 ||
    knowledgeBaseReadinessGate.data.officialLikeDocuments !== 202 ||
    knowledgeBaseReadinessGate.data.publicMappedDocuments !== 1196 ||
    knowledgeBaseReadinessGate.data.publicDocumentNodeMatches !== 9568 ||
    knowledgeBaseReadinessGate.data.knowledgeNodes !== 360 ||
    knowledgeBaseReadinessGate.data.moduleGroundedNodes !== 360 ||
    knowledgeBaseReadinessGate.data.directTriangulatedNodes !== 87 ||
    knowledgeBaseReadinessGate.data.sourceFitReviewRows !== 1638 ||
    knowledgeBaseReadinessGate.data.readySourceFitReviewRows !== 0 ||
    knowledgeBaseReadinessGate.data.blockedSourceFitReviewRows !== 1638 ||
    knowledgeBaseReadinessGate.data.realHumanInputEntries !== 0 ||
    knowledgeBaseReadinessGate.data.highRiskLessons !== 12 ||
    knowledgeBaseReadinessGate.data.highRiskReadyReviewerNotes !== 0 ||
    knowledgeBaseReadinessGate.data.highRiskBlockedReviewerNotes !== 72 ||
    knowledgeBaseReadinessGate.data.highRiskReadyDirectSourceDecisions !== 0 ||
    knowledgeBaseReadinessGate.data.highRiskBlockedDirectSourceDecisions !== 5 ||
    knowledgeBaseReadinessGate.data.packetHandoffCoverage !== "35/35" ||
    knowledgeBaseReadinessGate.data.reviewerCanStartNow !== true ||
    knowledgeBaseReadinessGate.data.internalReadyGates !== 5 ||
    knowledgeBaseReadinessGate.data.learnerFacingBlockedGates !== 5 ||
    knowledgeBaseReadinessGate.data.writeAllowedNow !== false ||
    knowledgeBaseReadinessGate.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeBaseReadinessGate.data.gateRows) ||
    knowledgeBaseReadinessGate.data.gateRows.length !== 5 ||
    !knowledgeBaseReadinessGate.data.gateRows.every((row) =>
      row.passedForInternalReview === true &&
      row.learnerFacingBlocked === true) ||
    !Array.isArray(knowledgeBaseReadinessGate.data.nextActionQueue) ||
    knowledgeBaseReadinessGate.data.nextActionQueue.length !== 5 ||
    !knowledgeBaseReadinessGate.data.commands.some((command) =>
      /check:knowledge-base-readiness-gate/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeBaseReadinessGate.data.boundary || "") ||
    !/does not generate real reviewer notes/i.test(knowledgeBaseReadinessGate.data.boundary || "") ||
    !/real-money guidance/i.test(knowledgeBaseReadinessGate.data.boundary || "") ||
    !/all real human source-fit rows/i.test(knowledgeBaseReadinessGate.data.completionRule || "")
  ) {
    throw new Error("knowledge browser readiness gate endpoint failed");
  }

  const knowledgeModuleReviewCockpit = await request("/api/knowledge-browser/knowledge-module-review-cockpit");
  if (
    knowledgeModuleReviewCockpit.status !== 200 ||
    knowledgeModuleReviewCockpit.data.educationOnly !== true ||
    knowledgeModuleReviewCockpit.data.productionReady !== false ||
    knowledgeModuleReviewCockpit.data.approvalStatus !== "not_approved" ||
    knowledgeModuleReviewCockpit.data.learnerFacingRelease !== false ||
    knowledgeModuleReviewCockpit.data.cockpitStatus !== "module_review_cockpit_ready_release_blocked" ||
    knowledgeModuleReviewCockpit.data.cockpitMode !== "module_to_nodes_sources_course_path_review_status_navigation" ||
    knowledgeModuleReviewCockpit.data.modules !== 12 ||
    knowledgeModuleReviewCockpit.data.internalNavigationReadyModules !== 12 ||
    knowledgeModuleReviewCockpit.data.learnerReleaseReadyModules !== 0 ||
    knowledgeModuleReviewCockpit.data.localCourseDocuments !== 298 ||
    knowledgeModuleReviewCockpit.data.localCourseChunks !== 3314 ||
    knowledgeModuleReviewCockpit.data.matchedKnowledgeNodes !== 360 ||
    knowledgeModuleReviewCockpit.data.readyForRewriteReviewNodes !== 360 ||
    knowledgeModuleReviewCockpit.data.publicCorpusDocuments !== 1196 ||
    knowledgeModuleReviewCockpit.data.wikipediaDocuments !== 96 ||
    knowledgeModuleReviewCockpit.data.officialLikeDocuments !== 202 ||
    knowledgeModuleReviewCockpit.data.sourceFitReviewRows !== 1638 ||
    knowledgeModuleReviewCockpit.data.readySourceFitReviewRows !== 0 ||
    knowledgeModuleReviewCockpit.data.blockedSourceFitReviewRows !== 1638 ||
    knowledgeModuleReviewCockpit.data.highRiskLessons !== 12 ||
    knowledgeModuleReviewCockpit.data.highRiskReadyReviewerNotes !== 0 ||
    knowledgeModuleReviewCockpit.data.highRiskBlockedReviewerNotes !== 72 ||
    knowledgeModuleReviewCockpit.data.realHumanInputEntries !== 0 ||
    knowledgeModuleReviewCockpit.data.readinessStatus !== "knowledge_base_internal_review_ready_release_blocked" ||
    knowledgeModuleReviewCockpit.data.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course" ||
    knowledgeModuleReviewCockpit.data.writeAllowedNow !== false ||
    knowledgeModuleReviewCockpit.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeModuleReviewCockpit.data.moduleRows) ||
    knowledgeModuleReviewCockpit.data.moduleRows.length !== 12 ||
    !knowledgeModuleReviewCockpit.data.moduleRows.every((row) =>
      row.module &&
      row.coursePath?.lessonCount === 30 &&
      Array.isArray(row.entryNodeIds) &&
      row.entryNodeIds.length > 0 &&
      row.learnerFacingNodes === 30 &&
      row.nodesWithLocalCourseMatches === 30 &&
      row.readyForRewriteReview === 30 &&
      row.publicEvidenceDocs > 0 &&
      row.wikipediaEvidenceDocs > 0 &&
      row.sourceFitRows >= row.readySourceFitRows &&
      row.internalNavigationReady === true &&
      row.learnerFacingRelease === false &&
      row.writeAllowedNow === false &&
      row.realHumanInputEntries === 0 &&
      row.reviewStatus === "module_internal_navigation_ready_learner_release_blocked") ||
    knowledgeModuleReviewCockpit.data.moduleRows.reduce((sum, row) => sum + (row.sourceFitRows || 0), 0) !== 1638 ||
    knowledgeModuleReviewCockpit.data.moduleRows.reduce((sum, row) => sum + (row.highRiskBlockedLessons || 0), 0) !== 12 ||
    !Array.isArray(knowledgeModuleReviewCockpit.data.priorityModuleRows) ||
    knowledgeModuleReviewCockpit.data.priorityModuleRows.length !== 6 ||
    !knowledgeModuleReviewCockpit.data.commands.some((command) =>
      /check:knowledge-module-review-cockpit/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeModuleReviewCockpit.data.boundary || "") ||
    !/modularizes the absorbed local investment course/i.test(knowledgeModuleReviewCockpit.data.boundary || "") ||
    !/does not generate real reviewer notes/i.test(knowledgeModuleReviewCockpit.data.boundary || "") ||
    !/real-money guidance/i.test(knowledgeModuleReviewCockpit.data.boundary || "") ||
    !/does not complete real human review/i.test(knowledgeModuleReviewCockpit.data.completionRule || "")
  ) {
    throw new Error("knowledge browser module review cockpit endpoint failed");
  }

  const knowledgeReviewerActionQueue = await request("/api/knowledge-browser/knowledge-reviewer-action-queue");
  if (
    knowledgeReviewerActionQueue.status !== 200 ||
    knowledgeReviewerActionQueue.data.educationOnly !== true ||
    knowledgeReviewerActionQueue.data.productionReady !== false ||
    knowledgeReviewerActionQueue.data.approvalStatus !== "not_approved" ||
    knowledgeReviewerActionQueue.data.learnerFacingRelease !== false ||
    knowledgeReviewerActionQueue.data.queueStatus !== "knowledge_reviewer_action_queue_ready_blocked_on_real_input" ||
    knowledgeReviewerActionQueue.data.queueMode !== "unified_high_risk_source_fit_direct_source_review_actions" ||
    knowledgeReviewerActionQueue.data.readinessStatus !== "knowledge_base_internal_review_ready_release_blocked" ||
    knowledgeReviewerActionQueue.data.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course" ||
    knowledgeReviewerActionQueue.data.modules !== 12 ||
    knowledgeReviewerActionQueue.data.internalNavigationReadyModules !== 12 ||
    knowledgeReviewerActionQueue.data.totalActionRows !== 52 ||
    knowledgeReviewerActionQueue.data.highRiskLessonActions !== 12 ||
    knowledgeReviewerActionQueue.data.directSourceDecisionActions !== 5 ||
    knowledgeReviewerActionQueue.data.sourceFitPacketActions !== 35 ||
    knowledgeReviewerActionQueue.data.blockedWorkItems !== 1715 ||
    knowledgeReviewerActionQueue.data.readyWorkItems !== 0 ||
    knowledgeReviewerActionQueue.data.sourceFitReviewRows !== 1638 ||
    knowledgeReviewerActionQueue.data.highRiskReviewerNotes !== 72 ||
    knowledgeReviewerActionQueue.data.directSourceDecisions !== 5 ||
    knowledgeReviewerActionQueue.data.realHumanInputEntries !== 0 ||
    knowledgeReviewerActionQueue.data.learnerCitationApprovedRows !== 0 ||
    knowledgeReviewerActionQueue.data.learnerReleaseReadyModules !== 0 ||
    knowledgeReviewerActionQueue.data.writeAllowedNow !== false ||
    knowledgeReviewerActionQueue.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeReviewerActionQueue.data.firstActionRows) ||
    knowledgeReviewerActionQueue.data.firstActionRows.length !== 20 ||
    !knowledgeReviewerActionQueue.data.firstActionRows.every((row) =>
      row.actionId &&
      row.actionType &&
      row.priorityBand &&
      row.module &&
      row.owner === "real_reviewer" &&
      row.blockedItems > 0 &&
      row.readyItems === 0 &&
      row.targetId &&
      row.inputPath &&
      row.validationCommand &&
      row.reviewStatus === "blocked_missing_real_reviewer_input" &&
      row.learnerFacingRelease === false &&
      row.writeAllowedNow === false &&
      row.realHumanInput === false) ||
    !knowledgeReviewerActionQueue.data.firstActionRows.slice(0, 12).every((row) =>
      row.actionType === "high_risk_lesson_reviewer_notes" && row.blockedItems === 6) ||
    !knowledgeReviewerActionQueue.data.firstActionRows.slice(12, 17).every((row) =>
      row.actionType === "direct_source_candidate_decision" && row.blockedItems === 1) ||
    !Array.isArray(knowledgeReviewerActionQueue.data.moduleRows) ||
    knowledgeReviewerActionQueue.data.moduleRows.length !== 12 ||
    knowledgeReviewerActionQueue.data.moduleRows.reduce((sum, row) => sum + (row.blockedItems || 0), 0) !== 1715 ||
    knowledgeReviewerActionQueue.data.moduleRows.reduce((sum, row) => sum + (row.blockedActionRows || 0), 0) !== 52 ||
    !knowledgeReviewerActionQueue.data.commands.some((command) =>
      /check:knowledge-reviewer-action-queue/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeReviewerActionQueue.data.boundary || "") ||
    !/absorbed local course evidence/i.test(knowledgeReviewerActionQueue.data.boundary || "") ||
    !/does not generate reviewer notes/i.test(knowledgeReviewerActionQueue.data.boundary || "") ||
    !/real-money guidance/i.test(knowledgeReviewerActionQueue.data.boundary || "") ||
    !/12 high-risk lesson note actions/i.test(knowledgeReviewerActionQueue.data.completionRule || "") ||
    !/35 source-fit packet actions/i.test(knowledgeReviewerActionQueue.data.completionRule || "")
  ) {
    throw new Error("knowledge browser reviewer action queue endpoint failed");
  }

  const knowledgeFirstReviewerActionHandoff = await request("/api/knowledge-browser/knowledge-first-reviewer-action-handoff");
  if (
    knowledgeFirstReviewerActionHandoff.status !== 200 ||
    knowledgeFirstReviewerActionHandoff.data.educationOnly !== true ||
    knowledgeFirstReviewerActionHandoff.data.productionReady !== false ||
    knowledgeFirstReviewerActionHandoff.data.approvalStatus !== "not_approved" ||
    knowledgeFirstReviewerActionHandoff.data.learnerFacingRelease !== false ||
    knowledgeFirstReviewerActionHandoff.data.handoffStatus !== "first_reviewer_action_handoff_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerActionHandoff.data.handoffMode !== "first_20_actions_high_risk_direct_source_source_fit" ||
    knowledgeFirstReviewerActionHandoff.data.queueStatus !== "knowledge_reviewer_action_queue_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerActionHandoff.data.queueMode !== "unified_high_risk_source_fit_direct_source_review_actions" ||
    knowledgeFirstReviewerActionHandoff.data.readinessStatus !== "knowledge_base_internal_review_ready_release_blocked" ||
    knowledgeFirstReviewerActionHandoff.data.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course" ||
    knowledgeFirstReviewerActionHandoff.data.totalQueueActions !== 52 ||
    knowledgeFirstReviewerActionHandoff.data.totalQueueBlockedWorkItems !== 1715 ||
    knowledgeFirstReviewerActionHandoff.data.handoffActionRows !== 20 ||
    knowledgeFirstReviewerActionHandoff.data.highRiskLessonActions !== 12 ||
    knowledgeFirstReviewerActionHandoff.data.directSourceDecisionActions !== 5 ||
    knowledgeFirstReviewerActionHandoff.data.sourceFitPacketActions !== 3 ||
    knowledgeFirstReviewerActionHandoff.data.blockedWorkItems !== 257 ||
    knowledgeFirstReviewerActionHandoff.data.readyWorkItems !== 0 ||
    knowledgeFirstReviewerActionHandoff.data.highRiskReviewerNotes !== 72 ||
    knowledgeFirstReviewerActionHandoff.data.directSourceDecisions !== 5 ||
    knowledgeFirstReviewerActionHandoff.data.sourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerActionHandoff.data.realHumanInputEntries !== 0 ||
    knowledgeFirstReviewerActionHandoff.data.learnerCitationApprovedRows !== 0 ||
    knowledgeFirstReviewerActionHandoff.data.learnerReleaseReadyModules !== 0 ||
    knowledgeFirstReviewerActionHandoff.data.writeAllowedNow !== false ||
    knowledgeFirstReviewerActionHandoff.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeFirstReviewerActionHandoff.data.sourceFitPacketIds) ||
    knowledgeFirstReviewerActionHandoff.data.sourceFitPacketIds.join(",") !== "node-public-source-fit-batch-001,node-public-source-fit-batch-002,node-public-source-fit-batch-003" ||
    !Array.isArray(knowledgeFirstReviewerActionHandoff.data.firstActionRows) ||
    knowledgeFirstReviewerActionHandoff.data.firstActionRows.length !== 20 ||
    !knowledgeFirstReviewerActionHandoff.data.firstActionRows.every((row, index) =>
      row.handoffRank === index + 1 &&
      row.queueRank === index + 1 &&
      row.actionId &&
      row.actionType &&
      row.priorityBand &&
      row.module &&
      row.owner === "real_reviewer" &&
      row.blockedItems > 0 &&
      row.readyItems === 0 &&
      row.targetId &&
      row.inputPath &&
      row.validationCommand &&
      row.reviewStatus === "blocked_missing_real_reviewer_input" &&
      row.learnerFacingRelease === false &&
      row.writeAllowedNow === false &&
      row.realHumanInput === false) ||
    !knowledgeFirstReviewerActionHandoff.data.firstActionRows.slice(0, 12).every((row) =>
      row.actionType === "high_risk_lesson_reviewer_notes" && row.blockedItems === 6) ||
    !knowledgeFirstReviewerActionHandoff.data.firstActionRows.slice(12, 17).every((row) =>
      row.actionType === "direct_source_candidate_decision" && row.blockedItems === 1) ||
    !knowledgeFirstReviewerActionHandoff.data.firstActionRows.slice(17, 20).every((row) =>
      row.actionType === "source_fit_packet_rows" && row.blockedItems === 60) ||
    !Array.isArray(knowledgeFirstReviewerActionHandoff.data.reviewerChecklist) ||
    knowledgeFirstReviewerActionHandoff.data.reviewerChecklist.length < 6 ||
    !Array.isArray(knowledgeFirstReviewerActionHandoff.data.acceptanceGates) ||
    knowledgeFirstReviewerActionHandoff.data.acceptanceGates.length < 5 ||
    !knowledgeFirstReviewerActionHandoff.data.commands.some((command) =>
      /check:knowledge-first-reviewer-action-handoff/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeFirstReviewerActionHandoff.data.boundary || "") ||
    !/absorbed local course evidence/i.test(knowledgeFirstReviewerActionHandoff.data.boundary || "") ||
    !/does not generate reviewer notes/i.test(knowledgeFirstReviewerActionHandoff.data.boundary || "") ||
    !/real-money guidance/i.test(knowledgeFirstReviewerActionHandoff.data.boundary || "") ||
    !/12 high-risk lesson note actions/i.test(knowledgeFirstReviewerActionHandoff.data.completionRule || "") ||
    !/3 source-fit packet actions/i.test(knowledgeFirstReviewerActionHandoff.data.completionRule || "")
  ) {
    throw new Error("knowledge browser first reviewer action handoff endpoint failed");
  }

  const knowledgeFirstReviewerFieldMap = await request("/api/knowledge-browser/knowledge-first-reviewer-field-map");
  if (
    knowledgeFirstReviewerFieldMap.status !== 200 ||
    knowledgeFirstReviewerFieldMap.data.educationOnly !== true ||
    knowledgeFirstReviewerFieldMap.data.productionReady !== false ||
    knowledgeFirstReviewerFieldMap.data.approvalStatus !== "not_approved" ||
    knowledgeFirstReviewerFieldMap.data.learnerFacingRelease !== false ||
    knowledgeFirstReviewerFieldMap.data.fieldMapStatus !== "first_reviewer_field_map_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerFieldMap.data.fieldMapMode !== "handoff_actions_to_human_owned_input_fields" ||
    knowledgeFirstReviewerFieldMap.data.handoffStatus !== "first_reviewer_action_handoff_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerFieldMap.data.validationStatus !== "blocked_missing_real_reviewer_overlay_input" ||
    knowledgeFirstReviewerFieldMap.data.handoffActionRows !== 20 ||
    knowledgeFirstReviewerFieldMap.data.mappedActionRows !== 20 ||
    knowledgeFirstReviewerFieldMap.data.highRiskLessonActions !== 12 ||
    knowledgeFirstReviewerFieldMap.data.directSourceDecisionActions !== 5 ||
    knowledgeFirstReviewerFieldMap.data.sourceFitPacketActions !== 3 ||
    knowledgeFirstReviewerFieldMap.data.highRiskReviewerNoteFields !== 72 ||
    knowledgeFirstReviewerFieldMap.data.directSourceDecisionFields !== 5 ||
    knowledgeFirstReviewerFieldMap.data.sourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerFieldMap.data.blockedWorkItems !== 257 ||
    knowledgeFirstReviewerFieldMap.data.readyWorkItems !== 0 ||
    knowledgeFirstReviewerFieldMap.data.realHumanInputEntries !== 0 ||
    knowledgeFirstReviewerFieldMap.data.learnerCitationApprovedRows !== 0 ||
    knowledgeFirstReviewerFieldMap.data.learnerReleaseReadyModules !== 0 ||
    knowledgeFirstReviewerFieldMap.data.writeAllowedNow !== false ||
    knowledgeFirstReviewerFieldMap.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeFirstReviewerFieldMap.data.inputPaths) ||
    knowledgeFirstReviewerFieldMap.data.inputPaths.length !== 4 ||
    !Array.isArray(knowledgeFirstReviewerFieldMap.data.fieldRows) ||
    knowledgeFirstReviewerFieldMap.data.fieldRows.length !== 20 ||
    !knowledgeFirstReviewerFieldMap.data.fieldRows.slice(0, 12).every((row, index) =>
      row.actionType === "high_risk_lesson_reviewer_notes" &&
      row.fieldKind === "six_real_reviewer_note_slots" &&
      row.jsonPath === `lessonRows[${index}]` &&
      row.mappedFieldCount === 6 &&
      Array.isArray(row.notePaths) &&
      row.notePaths.length === 6) ||
    !knowledgeFirstReviewerFieldMap.data.fieldRows.slice(12, 17).every((row, index) =>
      row.actionType === "direct_source_candidate_decision" &&
      row.fieldKind === "one_direct_source_decision_row" &&
      row.jsonPath === `directSourceDecisionRows[${index}]` &&
      row.mappedFieldCount === 1) ||
    !knowledgeFirstReviewerFieldMap.data.fieldRows.slice(17, 20).every((row) =>
      row.actionType === "source_fit_packet_rows" &&
      row.fieldKind === "source_fit_packet_review_rows" &&
      row.jsonPath === "reviewRows[*]" &&
      row.mappedFieldCount === 60 &&
      row.packetInputExists === true) ||
    !knowledgeFirstReviewerFieldMap.data.fieldRows.every((row) =>
      row.reviewStatus === "blocked_missing_real_reviewer_input" &&
      row.learnerFacingRelease === false &&
      row.writeAllowedNow === false &&
      row.realHumanInput === false) ||
    !Array.isArray(knowledgeFirstReviewerFieldMap.data.reviewerChecklist) ||
    knowledgeFirstReviewerFieldMap.data.reviewerChecklist.length < 6 ||
    !knowledgeFirstReviewerFieldMap.data.commands.some((command) =>
      /check:knowledge-first-reviewer-field-map/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeFirstReviewerFieldMap.data.boundary || "") ||
    !/absorbed local course evidence/i.test(knowledgeFirstReviewerFieldMap.data.boundary || "") ||
    !/does not generate reviewer notes/i.test(knowledgeFirstReviewerFieldMap.data.boundary || "") ||
    !/real-money guidance/i.test(knowledgeFirstReviewerFieldMap.data.boundary || "") ||
    !/72 high-risk reviewer note fields/i.test(knowledgeFirstReviewerFieldMap.data.completionRule || "") ||
    !/180 source-fit packet rows/i.test(knowledgeFirstReviewerFieldMap.data.completionRule || "")
  ) {
    throw new Error("knowledge browser first reviewer field map endpoint failed");
  }

  const knowledgeFirstReviewerCompletionGate = await request("/api/knowledge-browser/knowledge-first-reviewer-completion-gate");
  if (
    knowledgeFirstReviewerCompletionGate.status !== 200 ||
    knowledgeFirstReviewerCompletionGate.data.educationOnly !== true ||
    knowledgeFirstReviewerCompletionGate.data.productionReady !== false ||
    knowledgeFirstReviewerCompletionGate.data.approvalStatus !== "not_approved" ||
    knowledgeFirstReviewerCompletionGate.data.learnerFacingRelease !== false ||
    knowledgeFirstReviewerCompletionGate.data.completionGateStatus !== "first_reviewer_completion_gate_blocked_missing_real_input" ||
    knowledgeFirstReviewerCompletionGate.data.gateMode !== "first_20_actions_257_work_items_completion_gate" ||
    knowledgeFirstReviewerCompletionGate.data.fieldMapStatus !== "first_reviewer_field_map_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerCompletionGate.data.handoffStatus !== "first_reviewer_action_handoff_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerCompletionGate.data.handoffActionRows !== 20 ||
    knowledgeFirstReviewerCompletionGate.data.mappedActionRows !== 20 ||
    knowledgeFirstReviewerCompletionGate.data.requiredWorkItems !== 257 ||
    knowledgeFirstReviewerCompletionGate.data.readyWorkItems !== 0 ||
    knowledgeFirstReviewerCompletionGate.data.blockedWorkItems !== 257 ||
    knowledgeFirstReviewerCompletionGate.data.highRiskReviewerNoteFields !== 72 ||
    knowledgeFirstReviewerCompletionGate.data.highRiskReadyReviewerNotes !== 0 ||
    knowledgeFirstReviewerCompletionGate.data.highRiskBlockedReviewerNotes !== 72 ||
    knowledgeFirstReviewerCompletionGate.data.directSourceDecisionFields !== 5 ||
    knowledgeFirstReviewerCompletionGate.data.readyDirectSourceDecisions !== 0 ||
    knowledgeFirstReviewerCompletionGate.data.blockedDirectSourceDecisions !== 5 ||
    knowledgeFirstReviewerCompletionGate.data.sourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerCompletionGate.data.readySourceFitReviewRows !== 0 ||
    knowledgeFirstReviewerCompletionGate.data.blockedSourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerCompletionGate.data.missingSourceFitFieldRows !== 180 ||
    knowledgeFirstReviewerCompletionGate.data.realHumanInputEntries !== 0 ||
    knowledgeFirstReviewerCompletionGate.data.learnerCitationApprovedRows !== 0 ||
    knowledgeFirstReviewerCompletionGate.data.learnerReleaseReadyModules !== 0 ||
    knowledgeFirstReviewerCompletionGate.data.writeAllowedNow !== false ||
    knowledgeFirstReviewerCompletionGate.data.manualAuthorizationRequired !== true ||
    knowledgeFirstReviewerCompletionGate.data.readyForSeparateApproval !== false ||
    !Array.isArray(knowledgeFirstReviewerCompletionGate.data.inputPaths) ||
    knowledgeFirstReviewerCompletionGate.data.inputPaths.length !== 4 ||
    !Array.isArray(knowledgeFirstReviewerCompletionGate.data.validationPaths) ||
    knowledgeFirstReviewerCompletionGate.data.validationPaths.length !== 4 ||
    !Array.isArray(knowledgeFirstReviewerCompletionGate.data.gateRows) ||
    knowledgeFirstReviewerCompletionGate.data.gateRows.length !== 3 ||
    knowledgeFirstReviewerCompletionGate.data.gateRows[0].gateId !== "high_risk_reviewer_notes" ||
    knowledgeFirstReviewerCompletionGate.data.gateRows[0].requiredItems !== 72 ||
    knowledgeFirstReviewerCompletionGate.data.gateRows[0].blockedItems !== 72 ||
    knowledgeFirstReviewerCompletionGate.data.gateRows[1].gateId !== "direct_source_decisions" ||
    knowledgeFirstReviewerCompletionGate.data.gateRows[1].requiredItems !== 5 ||
    knowledgeFirstReviewerCompletionGate.data.gateRows[1].blockedItems !== 5 ||
    knowledgeFirstReviewerCompletionGate.data.gateRows[2].gateId !== "source_fit_packets_001_003" ||
    knowledgeFirstReviewerCompletionGate.data.gateRows[2].requiredItems !== 180 ||
    knowledgeFirstReviewerCompletionGate.data.gateRows[2].blockedItems !== 180 ||
    !knowledgeFirstReviewerCompletionGate.data.commands.some((command) =>
      /check:knowledge-first-reviewer-completion-gate/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeFirstReviewerCompletionGate.data.boundary || "") ||
    !/absorbed local course material/i.test(knowledgeFirstReviewerCompletionGate.data.boundary || "") ||
    !/does not generate reviewer notes/i.test(knowledgeFirstReviewerCompletionGate.data.boundary || "") ||
    !/real-money guidance/i.test(knowledgeFirstReviewerCompletionGate.data.boundary || "") ||
    !/257 first-handoff work items/i.test(knowledgeFirstReviewerCompletionGate.data.completionRule || "") ||
    !/separate approval gate/i.test(knowledgeFirstReviewerCompletionGate.data.completionRule || "")
  ) {
    throw new Error("knowledge browser first reviewer completion gate endpoint failed");
  }

  const knowledgeFirstReviewerExecutionChecklist = await request("/api/knowledge-browser/knowledge-first-reviewer-execution-checklist");
  if (
    knowledgeFirstReviewerExecutionChecklist.status !== 200 ||
    knowledgeFirstReviewerExecutionChecklist.data.educationOnly !== true ||
    knowledgeFirstReviewerExecutionChecklist.data.productionReady !== false ||
    knowledgeFirstReviewerExecutionChecklist.data.approvalStatus !== "not_approved" ||
    knowledgeFirstReviewerExecutionChecklist.data.learnerFacingRelease !== false ||
    knowledgeFirstReviewerExecutionChecklist.data.executionChecklistStatus !== "first_reviewer_execution_checklist_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerExecutionChecklist.data.executionChecklistMode !== "day_one_20_actions_257_work_items_execution_sequence" ||
    knowledgeFirstReviewerExecutionChecklist.data.handoffStatus !== "first_reviewer_action_handoff_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerExecutionChecklist.data.fieldMapStatus !== "first_reviewer_field_map_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerExecutionChecklist.data.completionGateStatus !== "first_reviewer_completion_gate_blocked_missing_real_input" ||
    knowledgeFirstReviewerExecutionChecklist.data.sprintPlanStatus !== "module_review_sprint_plan_ready_release_blocked" ||
    knowledgeFirstReviewerExecutionChecklist.data.handoffActionRows !== 20 ||
    knowledgeFirstReviewerExecutionChecklist.data.mappedActionRows !== 20 ||
    knowledgeFirstReviewerExecutionChecklist.data.executionRowCount !== 20 ||
    knowledgeFirstReviewerExecutionChecklist.data.requiredWorkItems !== 257 ||
    knowledgeFirstReviewerExecutionChecklist.data.readyWorkItems !== 0 ||
    knowledgeFirstReviewerExecutionChecklist.data.blockedWorkItems !== 257 ||
    knowledgeFirstReviewerExecutionChecklist.data.highRiskLessonActions !== 12 ||
    knowledgeFirstReviewerExecutionChecklist.data.highRiskReviewerNoteFields !== 72 ||
    knowledgeFirstReviewerExecutionChecklist.data.highRiskReadyReviewerNotes !== 0 ||
    knowledgeFirstReviewerExecutionChecklist.data.highRiskBlockedReviewerNotes !== 72 ||
    knowledgeFirstReviewerExecutionChecklist.data.directSourceDecisionActions !== 5 ||
    knowledgeFirstReviewerExecutionChecklist.data.directSourceDecisionFields !== 5 ||
    knowledgeFirstReviewerExecutionChecklist.data.readyDirectSourceDecisions !== 0 ||
    knowledgeFirstReviewerExecutionChecklist.data.blockedDirectSourceDecisions !== 5 ||
    knowledgeFirstReviewerExecutionChecklist.data.sourceFitPacketActions !== 3 ||
    knowledgeFirstReviewerExecutionChecklist.data.sourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerExecutionChecklist.data.readySourceFitReviewRows !== 0 ||
    knowledgeFirstReviewerExecutionChecklist.data.blockedSourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerExecutionChecklist.data.firstSprintBlockedWorkItems !== 257 ||
    knowledgeFirstReviewerExecutionChecklist.data.totalReviewerBacklogWorkItems !== 1715 ||
    knowledgeFirstReviewerExecutionChecklist.data.realHumanInputEntries !== 0 ||
    knowledgeFirstReviewerExecutionChecklist.data.learnerCitationApprovedRows !== 0 ||
    knowledgeFirstReviewerExecutionChecklist.data.learnerReleaseReadyModules !== 0 ||
    knowledgeFirstReviewerExecutionChecklist.data.readyForSeparateApproval !== false ||
    knowledgeFirstReviewerExecutionChecklist.data.writeAllowedNow !== false ||
    knowledgeFirstReviewerExecutionChecklist.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeFirstReviewerExecutionChecklist.data.inputPaths) ||
    knowledgeFirstReviewerExecutionChecklist.data.inputPaths.length !== 4 ||
    !Array.isArray(knowledgeFirstReviewerExecutionChecklist.data.validationPaths) ||
    knowledgeFirstReviewerExecutionChecklist.data.validationPaths.length !== 4 ||
    !Array.isArray(knowledgeFirstReviewerExecutionChecklist.data.stageRows) ||
    knowledgeFirstReviewerExecutionChecklist.data.stageRows.length !== 5 ||
    knowledgeFirstReviewerExecutionChecklist.data.stageRows[0].stageId !== "preflight_open_input_copies" ||
    knowledgeFirstReviewerExecutionChecklist.data.stageRows[1].requiredItems !== 72 ||
    knowledgeFirstReviewerExecutionChecklist.data.stageRows[2].requiredItems !== 5 ||
    knowledgeFirstReviewerExecutionChecklist.data.stageRows[3].requiredItems !== 180 ||
    knowledgeFirstReviewerExecutionChecklist.data.stageRows[4].requiredItems !== 257 ||
    !Array.isArray(knowledgeFirstReviewerExecutionChecklist.data.firstExecutionRows) ||
    knowledgeFirstReviewerExecutionChecklist.data.firstExecutionRows.length !== 20 ||
    !knowledgeFirstReviewerExecutionChecklist.data.firstExecutionRows.slice(0, 12).every((row) =>
      row.actionType === "high_risk_lesson_reviewer_notes" &&
      row.executionPhase === "phase_1_fill_high_risk_reviewer_notes" &&
      row.blockedItems === 6) ||
    !knowledgeFirstReviewerExecutionChecklist.data.firstExecutionRows.slice(12, 17).every((row) =>
      row.actionType === "direct_source_candidate_decision" &&
      row.executionPhase === "phase_2_resolve_direct_source_candidates" &&
      row.blockedItems === 1) ||
    !knowledgeFirstReviewerExecutionChecklist.data.firstExecutionRows.slice(17).every((row) =>
      row.actionType === "source_fit_packet_rows" &&
      row.executionPhase === "phase_3_fill_source_fit_packet_rows" &&
      row.blockedItems === 60) ||
    !Array.isArray(knowledgeFirstReviewerExecutionChecklist.data.reviewerStartChecklist) ||
    knowledgeFirstReviewerExecutionChecklist.data.reviewerStartChecklist.length < 6 ||
    !knowledgeFirstReviewerExecutionChecklist.data.commands.some((command) =>
      /check:knowledge-first-reviewer-execution-checklist/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeFirstReviewerExecutionChecklist.data.boundary || "") ||
    !/257 first-handoff work items/i.test(knowledgeFirstReviewerExecutionChecklist.data.boundary || "") ||
    !/180 source-fit packet rows/i.test(knowledgeFirstReviewerExecutionChecklist.data.boundary || "") ||
    !/does not generate reviewer notes/i.test(knowledgeFirstReviewerExecutionChecklist.data.boundary || "") ||
    !/learner release/i.test(knowledgeFirstReviewerExecutionChecklist.data.completionRule || "")
  ) {
    throw new Error("knowledge browser first reviewer execution checklist endpoint failed");
  }

  const knowledgeFirstReviewerWorkbench = await request("/api/knowledge-browser/knowledge-first-reviewer-workbench");
  if (
    knowledgeFirstReviewerWorkbench.status !== 200 ||
    knowledgeFirstReviewerWorkbench.data.educationOnly !== true ||
    knowledgeFirstReviewerWorkbench.data.productionReady !== false ||
    knowledgeFirstReviewerWorkbench.data.approvalStatus !== "not_approved" ||
    knowledgeFirstReviewerWorkbench.data.learnerFacingRelease !== false ||
    knowledgeFirstReviewerWorkbench.data.workbenchStatus !== "first_reviewer_workbench_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerWorkbench.data.workbenchMode !== "first_20_action_cards_with_evidence_fields_and_gates" ||
    knowledgeFirstReviewerWorkbench.data.handoffStatus !== "first_reviewer_action_handoff_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerWorkbench.data.fieldMapStatus !== "first_reviewer_field_map_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerWorkbench.data.completionGateStatus !== "first_reviewer_completion_gate_blocked_missing_real_input" ||
    knowledgeFirstReviewerWorkbench.data.executionChecklistStatus !== "first_reviewer_execution_checklist_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerWorkbench.data.handoffActionRows !== 20 ||
    knowledgeFirstReviewerWorkbench.data.mappedActionRows !== 20 ||
    knowledgeFirstReviewerWorkbench.data.executionRowCount !== 20 ||
    knowledgeFirstReviewerWorkbench.data.actionCards !== 20 ||
    knowledgeFirstReviewerWorkbench.data.requiredWorkItems !== 257 ||
    knowledgeFirstReviewerWorkbench.data.readyWorkItems !== 0 ||
    knowledgeFirstReviewerWorkbench.data.blockedWorkItems !== 257 ||
    knowledgeFirstReviewerWorkbench.data.highRiskLessonActions !== 12 ||
    knowledgeFirstReviewerWorkbench.data.highRiskReviewerNoteFields !== 72 ||
    knowledgeFirstReviewerWorkbench.data.highRiskReadyReviewerNotes !== 0 ||
    knowledgeFirstReviewerWorkbench.data.highRiskBlockedReviewerNotes !== 72 ||
    knowledgeFirstReviewerWorkbench.data.directSourceDecisionActions !== 5 ||
    knowledgeFirstReviewerWorkbench.data.directSourceDecisionFields !== 5 ||
    knowledgeFirstReviewerWorkbench.data.readyDirectSourceDecisions !== 0 ||
    knowledgeFirstReviewerWorkbench.data.blockedDirectSourceDecisions !== 5 ||
    knowledgeFirstReviewerWorkbench.data.sourceFitPacketActions !== 3 ||
    knowledgeFirstReviewerWorkbench.data.sourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerWorkbench.data.readySourceFitReviewRows !== 0 ||
    knowledgeFirstReviewerWorkbench.data.blockedSourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerWorkbench.data.realHumanInputEntries !== 0 ||
    knowledgeFirstReviewerWorkbench.data.learnerCitationApprovedRows !== 0 ||
    knowledgeFirstReviewerWorkbench.data.learnerReleaseReadyModules !== 0 ||
    knowledgeFirstReviewerWorkbench.data.readyForSeparateApproval !== false ||
    knowledgeFirstReviewerWorkbench.data.writeAllowedNow !== false ||
    knowledgeFirstReviewerWorkbench.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeFirstReviewerWorkbench.data.inputPaths) ||
    knowledgeFirstReviewerWorkbench.data.inputPaths.length !== 4 ||
    !Array.isArray(knowledgeFirstReviewerWorkbench.data.validationPaths) ||
    knowledgeFirstReviewerWorkbench.data.validationPaths.length !== 4 ||
    !Array.isArray(knowledgeFirstReviewerWorkbench.data.stageRows) ||
    knowledgeFirstReviewerWorkbench.data.stageRows.length !== 5 ||
    !Array.isArray(knowledgeFirstReviewerWorkbench.data.phaseRows) ||
    knowledgeFirstReviewerWorkbench.data.phaseRows.length !== 3 ||
    knowledgeFirstReviewerWorkbench.data.phaseRows[0].actionRows !== 12 ||
    knowledgeFirstReviewerWorkbench.data.phaseRows[0].requiredItems !== 72 ||
    knowledgeFirstReviewerWorkbench.data.phaseRows[1].actionRows !== 5 ||
    knowledgeFirstReviewerWorkbench.data.phaseRows[1].requiredItems !== 5 ||
    knowledgeFirstReviewerWorkbench.data.phaseRows[2].actionRows !== 3 ||
    knowledgeFirstReviewerWorkbench.data.phaseRows[2].requiredItems !== 180 ||
    !Array.isArray(knowledgeFirstReviewerWorkbench.data.actionCardRows) ||
    knowledgeFirstReviewerWorkbench.data.actionCardRows.length !== 20 ||
    !knowledgeFirstReviewerWorkbench.data.actionCardRows.every((row) =>
      row.cardRank >= 1 &&
      row.executionPhase &&
      row.gateId &&
      row.gateStatus &&
      row.actionId &&
      row.actionType &&
      row.module &&
      row.targetId &&
      row.inputPath &&
      row.jsonPath &&
      row.mappedFieldCount === row.blockedItems &&
      row.readyItems === 0 &&
      row.validationCommand &&
      Array.isArray(row.evidenceSamples) &&
      row.evidenceSamples.length >= 1 &&
      row.cardStatus === "workbench_card_blocked_missing_real_reviewer_input" &&
      row.realHumanInputEntries === 0 &&
      row.learnerFacingRelease === false &&
      row.writeAllowedNow === false) ||
    !knowledgeFirstReviewerWorkbench.data.actionCardRows.slice(0, 12).every((row) =>
      row.actionType === "high_risk_lesson_reviewer_notes" &&
      row.executionPhase === "phase_1_fill_high_risk_reviewer_notes" &&
      row.gateId === "high_risk_reviewer_notes" &&
      row.blockedItems === 6) ||
    !knowledgeFirstReviewerWorkbench.data.actionCardRows.slice(12, 17).every((row) =>
      row.actionType === "direct_source_candidate_decision" &&
      row.executionPhase === "phase_2_resolve_direct_source_candidates" &&
      row.gateId === "direct_source_decisions" &&
      row.blockedItems === 1) ||
    !knowledgeFirstReviewerWorkbench.data.actionCardRows.slice(17).every((row) =>
      row.actionType === "source_fit_packet_rows" &&
      row.executionPhase === "phase_3_fill_source_fit_packet_rows" &&
      row.gateId === "source_fit_packets_001_003" &&
      row.blockedItems === 60) ||
    !Array.isArray(knowledgeFirstReviewerWorkbench.data.reviewerGuardrails) ||
    knowledgeFirstReviewerWorkbench.data.reviewerGuardrails.length < 5 ||
    !knowledgeFirstReviewerWorkbench.data.commands.some((command) =>
      /check:knowledge-first-reviewer-workbench/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeFirstReviewerWorkbench.data.boundary || "") ||
    !/20 first reviewer actions/i.test(knowledgeFirstReviewerWorkbench.data.boundary || "") ||
    !/257 first-handoff work items/i.test(knowledgeFirstReviewerWorkbench.data.boundary || "") ||
    !/does not generate reviewer notes/i.test(knowledgeFirstReviewerWorkbench.data.boundary || "") ||
    !/learner release/i.test(knowledgeFirstReviewerWorkbench.data.completionRule || "")
  ) {
    throw new Error("knowledge browser first reviewer workbench endpoint failed");
  }

  const knowledgeFirstReviewerCardStatusMatrix = await request("/api/knowledge-browser/knowledge-first-reviewer-card-status-matrix");
  if (
    knowledgeFirstReviewerCardStatusMatrix.status !== 200 ||
    knowledgeFirstReviewerCardStatusMatrix.data.educationOnly !== true ||
    knowledgeFirstReviewerCardStatusMatrix.data.productionReady !== false ||
    knowledgeFirstReviewerCardStatusMatrix.data.approvalStatus !== "not_approved" ||
    knowledgeFirstReviewerCardStatusMatrix.data.learnerFacingRelease !== false ||
    knowledgeFirstReviewerCardStatusMatrix.data.matrixStatus !== "first_reviewer_card_status_matrix_ready_all_cards_blocked_on_real_input" ||
    knowledgeFirstReviewerCardStatusMatrix.data.matrixMode !== "per_card_missing_real_input_status_for_20_first_reviewer_cards" ||
    knowledgeFirstReviewerCardStatusMatrix.data.workbenchStatus !== "first_reviewer_workbench_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerCardStatusMatrix.data.completionGateStatus !== "first_reviewer_completion_gate_blocked_missing_real_input" ||
    knowledgeFirstReviewerCardStatusMatrix.data.actionCards !== 20 ||
    knowledgeFirstReviewerCardStatusMatrix.data.cardStatusRows !== 20 ||
    knowledgeFirstReviewerCardStatusMatrix.data.phaseStatusRows !== 3 ||
    knowledgeFirstReviewerCardStatusMatrix.data.validationStatusRows !== 4 ||
    knowledgeFirstReviewerCardStatusMatrix.data.requiredWorkItems !== 257 ||
    knowledgeFirstReviewerCardStatusMatrix.data.readyWorkItems !== 0 ||
    knowledgeFirstReviewerCardStatusMatrix.data.blockedWorkItems !== 257 ||
    knowledgeFirstReviewerCardStatusMatrix.data.highRiskReviewerNoteFields !== 72 ||
    knowledgeFirstReviewerCardStatusMatrix.data.highRiskReadyReviewerNotes !== 0 ||
    knowledgeFirstReviewerCardStatusMatrix.data.highRiskBlockedReviewerNotes !== 72 ||
    knowledgeFirstReviewerCardStatusMatrix.data.directSourceDecisionFields !== 5 ||
    knowledgeFirstReviewerCardStatusMatrix.data.readyDirectSourceDecisions !== 0 ||
    knowledgeFirstReviewerCardStatusMatrix.data.blockedDirectSourceDecisions !== 5 ||
    knowledgeFirstReviewerCardStatusMatrix.data.sourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerCardStatusMatrix.data.readySourceFitReviewRows !== 0 ||
    knowledgeFirstReviewerCardStatusMatrix.data.blockedSourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerCardStatusMatrix.data.realHumanInputEntries !== 0 ||
    knowledgeFirstReviewerCardStatusMatrix.data.learnerCitationApprovedRows !== 0 ||
    knowledgeFirstReviewerCardStatusMatrix.data.learnerReleaseReadyModules !== 0 ||
    knowledgeFirstReviewerCardStatusMatrix.data.readyForSeparateApproval !== false ||
    knowledgeFirstReviewerCardStatusMatrix.data.writeAllowedNow !== false ||
    knowledgeFirstReviewerCardStatusMatrix.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeFirstReviewerCardStatusMatrix.data.validationStatusRowsData) ||
    knowledgeFirstReviewerCardStatusMatrix.data.validationStatusRowsData.length !== 4 ||
    !knowledgeFirstReviewerCardStatusMatrix.data.validationStatusRowsData.every((row) =>
      row.readyItems === 0 &&
      row.blockedItems > 0 &&
      row.validationStatus &&
      row.realHumanInputEntries === 0) ||
    !Array.isArray(knowledgeFirstReviewerCardStatusMatrix.data.phaseStatusRowsData) ||
    knowledgeFirstReviewerCardStatusMatrix.data.phaseStatusRowsData.length !== 3 ||
    knowledgeFirstReviewerCardStatusMatrix.data.phaseStatusRowsData[0].requiredItems !== 72 ||
    knowledgeFirstReviewerCardStatusMatrix.data.phaseStatusRowsData[1].requiredItems !== 5 ||
    knowledgeFirstReviewerCardStatusMatrix.data.phaseStatusRowsData[2].requiredItems !== 180 ||
    !Array.isArray(knowledgeFirstReviewerCardStatusMatrix.data.cardRows) ||
    knowledgeFirstReviewerCardStatusMatrix.data.cardRows.length !== 20 ||
    !knowledgeFirstReviewerCardStatusMatrix.data.cardRows.every((row) =>
      row.cardRank >= 1 &&
      row.actionId &&
      row.actionType &&
      row.module &&
      row.targetId &&
      row.gateId &&
      row.inputPath &&
      row.jsonPath &&
      row.validationCommand &&
      row.requiredItems === row.blockedItems &&
      row.readyItems === 0 &&
      row.missingRequiredFieldGroups === row.blockedItems &&
      Array.isArray(row.evidenceSamples) &&
      row.evidenceSamples.length >= 1 &&
      row.humanInputStatus === "missing_real_reviewer_input" &&
      row.cardStatus === "card_status_blocked_missing_real_input" &&
      row.realHumanInputEntries === 0 &&
      row.learnerFacingRelease === false &&
      row.writeAllowedNow === false) ||
    !knowledgeFirstReviewerCardStatusMatrix.data.cardRows.slice(0, 12).every((row) =>
      row.actionType === "high_risk_lesson_reviewer_notes" &&
      row.requiredItems === 6) ||
    !knowledgeFirstReviewerCardStatusMatrix.data.cardRows.slice(12, 17).every((row) =>
      row.actionType === "direct_source_candidate_decision" &&
      row.requiredItems === 1) ||
    !knowledgeFirstReviewerCardStatusMatrix.data.cardRows.slice(17).every((row) =>
      row.actionType === "source_fit_packet_rows" &&
      row.requiredItems === 60) ||
    !Array.isArray(knowledgeFirstReviewerCardStatusMatrix.data.nextBestActions) ||
    knowledgeFirstReviewerCardStatusMatrix.data.nextBestActions.length < 5 ||
    !knowledgeFirstReviewerCardStatusMatrix.data.commands.some((command) =>
      /check:knowledge-first-reviewer-card-status-matrix/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeFirstReviewerCardStatusMatrix.data.boundary || "") ||
    !/20 first reviewer action cards/i.test(knowledgeFirstReviewerCardStatusMatrix.data.boundary || "") ||
    !/257 first-handoff work items/i.test(knowledgeFirstReviewerCardStatusMatrix.data.boundary || "") ||
    !/does not generate reviewer notes/i.test(knowledgeFirstReviewerCardStatusMatrix.data.boundary || "") ||
    !/learner release/i.test(knowledgeFirstReviewerCardStatusMatrix.data.completionRule || "")
  ) {
    throw new Error("knowledge browser first reviewer card status matrix endpoint failed");
  }

  const knowledgeFirstReviewerPostInputRouteMap = await request("/api/knowledge-browser/knowledge-first-reviewer-post-input-route-map");
  if (
    knowledgeFirstReviewerPostInputRouteMap.status !== 200 ||
    knowledgeFirstReviewerPostInputRouteMap.data.educationOnly !== true ||
    knowledgeFirstReviewerPostInputRouteMap.data.productionReady !== false ||
    knowledgeFirstReviewerPostInputRouteMap.data.approvalStatus !== "not_approved" ||
    knowledgeFirstReviewerPostInputRouteMap.data.learnerFacingRelease !== false ||
    knowledgeFirstReviewerPostInputRouteMap.data.routeMapStatus !== "first_reviewer_post_input_route_map_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerPostInputRouteMap.data.routeMapMode !== "post_reviewer_input_validation_then_locked_merge_and_approval_routes" ||
    knowledgeFirstReviewerPostInputRouteMap.data.cardMatrixStatus !== "first_reviewer_card_status_matrix_ready_all_cards_blocked_on_real_input" ||
    knowledgeFirstReviewerPostInputRouteMap.data.workbenchStatus !== "first_reviewer_workbench_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerPostInputRouteMap.data.completionGateStatus !== "first_reviewer_completion_gate_blocked_missing_real_input" ||
    knowledgeFirstReviewerPostInputRouteMap.data.routeRows !== 4 ||
    knowledgeFirstReviewerPostInputRouteMap.data.validationRoutes !== 4 ||
    knowledgeFirstReviewerPostInputRouteMap.data.sourceFitMergeRoutes !== 2 ||
    knowledgeFirstReviewerPostInputRouteMap.data.highRiskApprovalRoutes !== 1 ||
    knowledgeFirstReviewerPostInputRouteMap.data.requiredWorkItems !== 257 ||
    knowledgeFirstReviewerPostInputRouteMap.data.readyWorkItems !== 0 ||
    knowledgeFirstReviewerPostInputRouteMap.data.blockedWorkItems !== 257 ||
    knowledgeFirstReviewerPostInputRouteMap.data.highRiskReviewerNoteFields !== 72 ||
    knowledgeFirstReviewerPostInputRouteMap.data.directSourceDecisionFields !== 5 ||
    knowledgeFirstReviewerPostInputRouteMap.data.sourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerPostInputRouteMap.data.readySourceFitReviewRows !== 0 ||
    knowledgeFirstReviewerPostInputRouteMap.data.blockedSourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerPostInputRouteMap.data.realHumanInputEntries !== 0 ||
    knowledgeFirstReviewerPostInputRouteMap.data.learnerCitationApprovedRows !== 0 ||
    knowledgeFirstReviewerPostInputRouteMap.data.learnerReleaseReadyModules !== 0 ||
    knowledgeFirstReviewerPostInputRouteMap.data.readyForSeparateApproval !== false ||
    knowledgeFirstReviewerPostInputRouteMap.data.mergeAllowedNow !== false ||
    knowledgeFirstReviewerPostInputRouteMap.data.writeAllowedNow !== false ||
    knowledgeFirstReviewerPostInputRouteMap.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeFirstReviewerPostInputRouteMap.data.routeRowsData) ||
    knowledgeFirstReviewerPostInputRouteMap.data.routeRowsData.length !== 4 ||
    knowledgeFirstReviewerPostInputRouteMap.data.routeRowsData[0].requiredItems !== 77 ||
    knowledgeFirstReviewerPostInputRouteMap.data.routeRowsData[1].requiredItems !== 60 ||
    knowledgeFirstReviewerPostInputRouteMap.data.routeRowsData[2].requiredItems !== 60 ||
    knowledgeFirstReviewerPostInputRouteMap.data.routeRowsData[3].requiredItems !== 60 ||
    !knowledgeFirstReviewerPostInputRouteMap.data.routeRowsData.every((row) =>
      row.validationCommand &&
      row.postValidationCommand &&
      row.routeStatus === "route_blocked_missing_real_reviewer_input" &&
      row.readyItems === 0 &&
      row.requiredItems === row.blockedItems &&
      row.mergeAllowedNow === false &&
      row.writeAllowedNow === false) ||
    !Array.isArray(knowledgeFirstReviewerPostInputRouteMap.data.commands) ||
    !knowledgeFirstReviewerPostInputRouteMap.data.commands.some((command) =>
      /check:knowledge-first-reviewer-post-input-route-map/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeFirstReviewerPostInputRouteMap.data.boundary || "") ||
    !/72 high-risk reviewer notes/i.test(knowledgeFirstReviewerPostInputRouteMap.data.boundary || "") ||
    !/180 source-fit packet rows/i.test(knowledgeFirstReviewerPostInputRouteMap.data.boundary || "") ||
    !/does not generate reviewer notes/i.test(knowledgeFirstReviewerPostInputRouteMap.data.boundary || "") ||
    !/learner release/i.test(knowledgeFirstReviewerPostInputRouteMap.data.completionRule || "")
  ) {
    throw new Error("knowledge browser first reviewer post-input route map endpoint failed");
  }

  const knowledgeFirstReviewerInputQueue = await request("/api/knowledge-browser/knowledge-first-reviewer-input-queue");
  if (
    knowledgeFirstReviewerInputQueue.status !== 200 ||
    knowledgeFirstReviewerInputQueue.data.educationOnly !== true ||
    knowledgeFirstReviewerInputQueue.data.productionReady !== false ||
    knowledgeFirstReviewerInputQueue.data.approvalStatus !== "not_approved" ||
    knowledgeFirstReviewerInputQueue.data.learnerFacingRelease !== false ||
    knowledgeFirstReviewerInputQueue.data.queueStatus !== "first_reviewer_input_queue_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerInputQueue.data.queueMode !== "257_human_owned_required_inputs_expanded_from_cards_routes_and_packets" ||
    knowledgeFirstReviewerInputQueue.data.fieldMapStatus !== "first_reviewer_field_map_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerInputQueue.data.workbenchStatus !== "first_reviewer_workbench_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerInputQueue.data.routeMapStatus !== "first_reviewer_post_input_route_map_ready_blocked_on_real_input" ||
    knowledgeFirstReviewerInputQueue.data.actionCards !== 20 ||
    knowledgeFirstReviewerInputQueue.data.routeRows !== 4 ||
    knowledgeFirstReviewerInputQueue.data.queueRows !== 257 ||
    knowledgeFirstReviewerInputQueue.data.highRiskNoteRows !== 72 ||
    knowledgeFirstReviewerInputQueue.data.directSourceDecisionRows !== 5 ||
    knowledgeFirstReviewerInputQueue.data.sourceFitReviewRows !== 180 ||
    knowledgeFirstReviewerInputQueue.data.readyRows !== 0 ||
    knowledgeFirstReviewerInputQueue.data.blockedRows !== 257 ||
    knowledgeFirstReviewerInputQueue.data.realHumanInputEntries !== 0 ||
    knowledgeFirstReviewerInputQueue.data.learnerCitationApprovedRows !== 0 ||
    knowledgeFirstReviewerInputQueue.data.copiedTextApprovedRows !== 0 ||
    knowledgeFirstReviewerInputQueue.data.readyForSeparateApproval !== false ||
    knowledgeFirstReviewerInputQueue.data.mergeAllowedNow !== false ||
    knowledgeFirstReviewerInputQueue.data.writeAllowedNow !== false ||
    knowledgeFirstReviewerInputQueue.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeFirstReviewerInputQueue.data.inputPaths) ||
    knowledgeFirstReviewerInputQueue.data.inputPaths.length !== 4 ||
    !Array.isArray(knowledgeFirstReviewerInputQueue.data.routeBreakdownRows) ||
    knowledgeFirstReviewerInputQueue.data.routeBreakdownRows.length !== 4 ||
    knowledgeFirstReviewerInputQueue.data.routeBreakdownRows.reduce((sum, row) => sum + (row.itemRows || 0), 0) !== 257 ||
    !Array.isArray(knowledgeFirstReviewerInputQueue.data.queueRowsData) ||
    knowledgeFirstReviewerInputQueue.data.queueRowsData.length !== 80 ||
    knowledgeFirstReviewerInputQueue.data.totalQueueRowsData !== 257 ||
    knowledgeFirstReviewerInputQueue.data.rowQuery?.limit !== 80 ||
    knowledgeFirstReviewerInputQueue.data.rowQuery?.offset !== 0 ||
    knowledgeFirstReviewerInputQueue.data.rowQuery?.returnedRows !== 80 ||
    knowledgeFirstReviewerInputQueue.data.rowQuery?.totalFilteredRows !== 257 ||
    knowledgeFirstReviewerInputQueue.data.rowQuery?.hasMoreRows !== true ||
    !knowledgeFirstReviewerInputQueue.data.queueRowsData.every((row) =>
      row.itemRank >= 1 &&
      row.itemType &&
      row.routeId &&
      row.actionId &&
      row.module &&
      row.inputPath &&
      row.jsonPath &&
      row.fillStatus === "missing_real_reviewer_input" &&
      row.learnerFacingRelease === false &&
      row.writeAllowedNow === false &&
      row.approvalStatus === "not_approved") ||
    !knowledgeFirstReviewerInputQueue.data.queueRowsData.slice(0, 72).every((row) =>
      row.itemType === "high_risk_reviewer_note" &&
      /^lessonRows\[\d+\]\.realReviewerNotes\[\d+\]$/.test(row.jsonPath)) ||
    !Array.isArray(knowledgeFirstReviewerInputQueue.data.commands) ||
    !knowledgeFirstReviewerInputQueue.data.commands.some((command) =>
      /check:knowledge-first-reviewer-input-queue/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeFirstReviewerInputQueue.data.boundary || "") ||
    !/72 high-risk reviewer notes/i.test(knowledgeFirstReviewerInputQueue.data.boundary || "") ||
    !/5 direct-source decisions/i.test(knowledgeFirstReviewerInputQueue.data.boundary || "") ||
    !/180 source-fit packet rows/i.test(knowledgeFirstReviewerInputQueue.data.boundary || "") ||
    !/does not generate reviewer notes/i.test(knowledgeFirstReviewerInputQueue.data.boundary || "") ||
    !/learner release/i.test(knowledgeFirstReviewerInputQueue.data.completionRule || "")
  ) {
    throw new Error("knowledge browser first reviewer input queue endpoint failed");
  }

  const directInputQueue = await request("/api/knowledge-browser/knowledge-first-reviewer-input-queue?itemType=direct_source_decision&limit=5");
  if (
    directInputQueue.status !== 200 ||
    directInputQueue.data.rowQuery?.itemType !== "direct_source_decision" ||
    directInputQueue.data.rowQuery?.returnedRows !== 5 ||
    directInputQueue.data.rowQuery?.totalFilteredRows !== 5 ||
    !Array.isArray(directInputQueue.data.queueRowsData) ||
    directInputQueue.data.queueRowsData.length !== 5 ||
    !directInputQueue.data.queueRowsData.every((row) =>
      row.itemType === "direct_source_decision" &&
      row.routeId === "high_risk_overlay_notes_and_direct_sources" &&
      row.learnerCitationApproved === false &&
      row.fillStatus === "missing_real_reviewer_input")
  ) {
    throw new Error("knowledge browser first reviewer input queue itemType filter failed");
  }

  const packetInputQueue = await request("/api/knowledge-browser/knowledge-first-reviewer-input-queue?route=source_fit_packet_001&limit=4");
  if (
    packetInputQueue.status !== 200 ||
    packetInputQueue.data.rowQuery?.route !== "source_fit_packet_001" ||
    packetInputQueue.data.rowQuery?.limit !== 4 ||
    packetInputQueue.data.rowQuery?.returnedRows !== 4 ||
    packetInputQueue.data.rowQuery?.totalFilteredRows !== 60 ||
    packetInputQueue.data.rowQuery?.hasMoreRows !== true ||
    !Array.isArray(packetInputQueue.data.queueRowsData) ||
    packetInputQueue.data.queueRowsData.length !== 4 ||
    !packetInputQueue.data.queueRowsData.every((row) =>
      row.itemType === "source_fit_packet_row" &&
      row.routeId === "source_fit_packet_001" &&
      row.learnerCitationApproved === false &&
      row.copiedTextApproved === false)
  ) {
    throw new Error("knowledge browser first reviewer input queue route filter failed");
  }

  const statusInputQueue = await request("/api/knowledge-browser/knowledge-first-reviewer-input-queue?status=missing_real_reviewer_input&offset=72&limit=5");
  if (
    statusInputQueue.status !== 200 ||
    statusInputQueue.data.rowQuery?.status !== "missing_real_reviewer_input" ||
    statusInputQueue.data.rowQuery?.offset !== 72 ||
    statusInputQueue.data.rowQuery?.limit !== 5 ||
    statusInputQueue.data.rowQuery?.returnedRows !== 5 ||
    statusInputQueue.data.rowQuery?.totalFilteredRows !== 257 ||
    !Array.isArray(statusInputQueue.data.queueRowsData) ||
    statusInputQueue.data.queueRowsData[0]?.itemType !== "direct_source_decision" ||
    !statusInputQueue.data.queueRowsData.every((row) =>
      row.fillStatus === "missing_real_reviewer_input" &&
      row.writeAllowedNow === false)
  ) {
    throw new Error("knowledge browser first reviewer input queue status pagination failed");
  }

  const textInputQueue = await request("/api/knowledge-browser/knowledge-first-reviewer-input-queue?q=Candlestick&limit=6");
  if (
    textInputQueue.status !== 200 ||
    textInputQueue.data.rowQuery?.q !== "candlestick" ||
    textInputQueue.data.rowQuery?.returnedRows !== 6 ||
    textInputQueue.data.rowQuery?.totalFilteredRows < 10 ||
    !Array.isArray(textInputQueue.data.queueRowsData) ||
    textInputQueue.data.queueRowsData.length !== 6 ||
    !textInputQueue.data.queueRowsData.every((row) =>
      `${row.itemRank} ${row.itemType} ${row.routeId} ${row.actionId} ${row.module} ${row.topic} ${row.targetId} ${row.nodeId} ${row.inputPath} ${row.jsonPath} ${row.prompt} ${(row.evidenceSamples || []).map((sample) => `${sample.name} ${sample.url} ${sample.family}`).join(" ")}`
        .toLowerCase()
        .includes("candlestick") &&
      row.learnerFacingRelease === false)
  ) {
    throw new Error("knowledge browser first reviewer input queue text filter failed");
  }

  const inputQueueDetail = await request("/api/knowledge-browser/knowledge-first-reviewer-input-queue-detail?itemRank=78");
  if (
    inputQueueDetail.status !== 200 ||
    inputQueueDetail.data.educationOnly !== true ||
    inputQueueDetail.data.productionReady !== false ||
    inputQueueDetail.data.approvalStatus !== "not_approved" ||
    inputQueueDetail.data.learnerFacingRelease !== false ||
    inputQueueDetail.data.detailStatus !== "first_reviewer_input_queue_detail_ready_blocked_on_real_input" ||
    inputQueueDetail.data.detailMode !== "single_human_owned_input_row_readonly_context" ||
    inputQueueDetail.data.queueStatus !== "first_reviewer_input_queue_ready_blocked_on_real_input" ||
    inputQueueDetail.data.itemRank !== 78 ||
    inputQueueDetail.data.row?.itemRank !== 78 ||
    inputQueueDetail.data.row?.itemType !== "source_fit_packet_row" ||
    inputQueueDetail.data.row?.routeId !== "source_fit_packet_001" ||
    inputQueueDetail.data.row?.nodeId !== "knv2_0003" ||
    inputQueueDetail.data.row?.fillStatus !== "missing_real_reviewer_input" ||
    !inputQueueDetail.data.editableFieldPaths?.reviewerDecision?.includes("rows[0].reviewerDecision") ||
    !Array.isArray(inputQueueDetail.data.requiredFields) ||
    !inputQueueDetail.data.requiredFields.includes("reviewerDecision") ||
    !inputQueueDetail.data.requiredFields.includes("sourceFitNotes") ||
    !Array.isArray(inputQueueDetail.data.allowedDecisionValues) ||
    !inputQueueDetail.data.allowedDecisionValues.includes("accept_for_node_source_fit") ||
    !Array.isArray(inputQueueDetail.data.evidenceSamples) ||
    inputQueueDetail.data.evidenceSamples.length !== 1 ||
    !Array.isArray(inputQueueDetail.data.nearbyRows) ||
    inputQueueDetail.data.nearbyRows.length < 4 ||
    !Array.isArray(inputQueueDetail.data.sameRouteRows) ||
    inputQueueDetail.data.sameRouteRows.length !== 12 ||
    !inputQueueDetail.data.sameRouteRows.every((row) => row.routeId === "source_fit_packet_001") ||
    !Array.isArray(inputQueueDetail.data.sameNodeRows) ||
    inputQueueDetail.data.sameNodeRows.length < 1 ||
    !inputQueueDetail.data.sameNodeRows.every((row) => row.nodeId === "knv2_0003") ||
    inputQueueDetail.data.realHumanInputEntries !== 0 ||
    inputQueueDetail.data.learnerCitationApprovedRows !== 0 ||
    inputQueueDetail.data.copiedTextApprovedRows !== 0 ||
    inputQueueDetail.data.readyForSeparateApproval !== false ||
    inputQueueDetail.data.mergeAllowedNow !== false ||
    inputQueueDetail.data.writeAllowedNow !== false ||
    inputQueueDetail.data.manualAuthorizationRequired !== true ||
    !/does not generate reviewer notes/i.test(inputQueueDetail.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(inputQueueDetail.data.boundary || "")
  ) {
    throw new Error("knowledge browser first reviewer input queue detail endpoint failed");
  }

  const missingInputQueueDetail = await request("/api/knowledge-browser/knowledge-first-reviewer-input-queue-detail");
  if (
    missingInputQueueDetail.status !== 400 ||
    missingInputQueueDetail.data.educationOnly !== true ||
    missingInputQueueDetail.data.detailStatus !== "first_reviewer_input_queue_detail_missing_item_rank"
  ) {
    throw new Error("knowledge browser first reviewer input queue detail missing itemRank guard failed");
  }

  const unknownInputQueueDetail = await request("/api/knowledge-browser/knowledge-first-reviewer-input-queue-detail?itemRank=9999");
  if (
    unknownInputQueueDetail.status !== 404 ||
    unknownInputQueueDetail.data.educationOnly !== true ||
    unknownInputQueueDetail.data.detailStatus !== "first_reviewer_input_queue_detail_not_found" ||
    unknownInputQueueDetail.data.itemRank !== 9999
  ) {
    throw new Error("knowledge browser first reviewer input queue detail unknown itemRank guard failed");
  }

  const knowledgeReleaseBlockerAudit = await request("/api/knowledge-browser/knowledge-release-blocker-audit");
  if (
    knowledgeReleaseBlockerAudit.status !== 200 ||
    knowledgeReleaseBlockerAudit.data.educationOnly !== true ||
    knowledgeReleaseBlockerAudit.data.productionReady !== false ||
    knowledgeReleaseBlockerAudit.data.approvalStatus !== "not_approved" ||
    knowledgeReleaseBlockerAudit.data.learnerFacingRelease !== false ||
    knowledgeReleaseBlockerAudit.data.auditStatus !== "knowledge_release_blocker_audit_ready_release_blocked" ||
    knowledgeReleaseBlockerAudit.data.auditMode !== "end_to_end_absorption_review_release_blocker_chain" ||
    knowledgeReleaseBlockerAudit.data.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course" ||
    knowledgeReleaseBlockerAudit.data.internalUseStatus !== "usable_as_internal_reviewer_workbench" ||
    knowledgeReleaseBlockerAudit.data.learnerUseStatus !== "blocked_not_learner_course" ||
    knowledgeReleaseBlockerAudit.data.localCourseAbsorbed !== true ||
    knowledgeReleaseBlockerAudit.data.publicSourcesAbsorbed !== true ||
    knowledgeReleaseBlockerAudit.data.internalWorkbenchReady !== true ||
    knowledgeReleaseBlockerAudit.data.learnerReleaseBlocked !== true ||
    knowledgeReleaseBlockerAudit.data.physicalPdfFiles !== 302 ||
    knowledgeReleaseBlockerAudit.data.uniquePdfHashes !== 298 ||
    knowledgeReleaseBlockerAudit.data.mappedUniquePdfFiles !== 298 ||
    knowledgeReleaseBlockerAudit.data.publicCorpusDocuments !== 1196 ||
    knowledgeReleaseBlockerAudit.data.wikipediaDocuments !== 96 ||
    knowledgeReleaseBlockerAudit.data.officialLikeDocuments !== 202 ||
    knowledgeReleaseBlockerAudit.data.mappedPublicDocuments !== 1196 ||
    knowledgeReleaseBlockerAudit.data.moduleGroundedNodes !== 360 ||
    knowledgeReleaseBlockerAudit.data.modules !== 12 ||
    knowledgeReleaseBlockerAudit.data.internalNavigationReadyModules !== 12 ||
    knowledgeReleaseBlockerAudit.data.learnerReleaseReadyModules !== 0 ||
    knowledgeReleaseBlockerAudit.data.reviewerActionRows !== 52 ||
    knowledgeReleaseBlockerAudit.data.reviewerBlockedWorkItems !== 1715 ||
    knowledgeReleaseBlockerAudit.data.reviewerReadyWorkItems !== 0 ||
    knowledgeReleaseBlockerAudit.data.firstHandoffActionRows !== 20 ||
    knowledgeReleaseBlockerAudit.data.firstHandoffRequiredWorkItems !== 257 ||
    knowledgeReleaseBlockerAudit.data.firstHandoffReadyWorkItems !== 0 ||
    knowledgeReleaseBlockerAudit.data.firstHandoffBlockedWorkItems !== 257 ||
    knowledgeReleaseBlockerAudit.data.sourceFitReviewRows !== 1638 ||
    knowledgeReleaseBlockerAudit.data.readySourceFitReviewRows !== 0 ||
    knowledgeReleaseBlockerAudit.data.blockedSourceFitReviewRows !== 1638 ||
    knowledgeReleaseBlockerAudit.data.realHumanInputEntries !== 0 ||
    knowledgeReleaseBlockerAudit.data.learnerCitationApprovedRows !== 0 ||
    knowledgeReleaseBlockerAudit.data.writeAllowedNow !== false ||
    knowledgeReleaseBlockerAudit.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeReleaseBlockerAudit.data.stageRows) ||
    knowledgeReleaseBlockerAudit.data.stageRows.length !== 7 ||
    !Array.isArray(knowledgeReleaseBlockerAudit.data.releaseBlockerRows) ||
    knowledgeReleaseBlockerAudit.data.releaseBlockerRows.length !== 4 ||
    !knowledgeReleaseBlockerAudit.data.releaseBlockerRows.some((row) =>
      row.blockerId === "missing_real_human_review" && row.blockedItems === 1715) ||
    !knowledgeReleaseBlockerAudit.data.releaseBlockerRows.some((row) =>
      row.blockerId === "source_fit_rows_not_reviewed" && row.blockedItems === 1638) ||
    !knowledgeReleaseBlockerAudit.data.releaseBlockerRows.some((row) =>
      row.blockerId === "first_reviewer_completion_gate_blocked" && row.blockedItems === 257) ||
    !knowledgeReleaseBlockerAudit.data.releaseBlockerRows.some((row) =>
      row.blockerId === "learner_release_modules_zero" && row.blockedItems === 12) ||
    !Array.isArray(knowledgeReleaseBlockerAudit.data.nextBestActions) ||
    knowledgeReleaseBlockerAudit.data.nextBestActions.length < 4 ||
    !knowledgeReleaseBlockerAudit.data.commands.some((command) =>
      /check:knowledge-release-blocker-audit/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeReleaseBlockerAudit.data.boundary || "") ||
    !/absorbed local investment course PDFs/i.test(knowledgeReleaseBlockerAudit.data.boundary || "") ||
    !/does not generate reviewer notes/i.test(knowledgeReleaseBlockerAudit.data.boundary || "") ||
    !/real-money guidance/i.test(knowledgeReleaseBlockerAudit.data.boundary || "") ||
    !/end-to-end chain/i.test(knowledgeReleaseBlockerAudit.data.completionRule || "")
  ) {
    throw new Error("knowledge browser release blocker audit endpoint failed");
  }

  const knowledgeCoursePathReadinessAudit = await request("/api/knowledge-browser/knowledge-course-path-readiness-audit");
  if (
    knowledgeCoursePathReadinessAudit.status !== 200 ||
    knowledgeCoursePathReadinessAudit.data.educationOnly !== true ||
    knowledgeCoursePathReadinessAudit.data.productionReady !== false ||
    knowledgeCoursePathReadinessAudit.data.approvalStatus !== "not_approved" ||
    knowledgeCoursePathReadinessAudit.data.learnerFacingRelease !== false ||
    knowledgeCoursePathReadinessAudit.data.auditStatus !== "course_path_readiness_audit_ready_release_blocked" ||
    knowledgeCoursePathReadinessAudit.data.auditMode !== "module_course_paths_internal_ready_learner_release_blocked" ||
    knowledgeCoursePathReadinessAudit.data.releaseBlockerAuditStatus !== "knowledge_release_blocker_audit_ready_release_blocked" ||
    knowledgeCoursePathReadinessAudit.data.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course" ||
    knowledgeCoursePathReadinessAudit.data.modules !== 12 ||
    knowledgeCoursePathReadinessAudit.data.coursePaths !== 12 ||
    knowledgeCoursePathReadinessAudit.data.internalReadyPaths !== 12 ||
    knowledgeCoursePathReadinessAudit.data.learnerReleaseReadyPaths !== 0 ||
    knowledgeCoursePathReadinessAudit.data.blockedLearnerReleasePaths !== 12 ||
    knowledgeCoursePathReadinessAudit.data.totalLessons !== 360 ||
    knowledgeCoursePathReadinessAudit.data.totalUnits !== 36 ||
    knowledgeCoursePathReadinessAudit.data.totalEstimatedMinutes !== 2880 ||
    knowledgeCoursePathReadinessAudit.data.nodesWithLocalCourseMatches !== 360 ||
    knowledgeCoursePathReadinessAudit.data.learnerFacingNodes !== 360 ||
    knowledgeCoursePathReadinessAudit.data.sourceFitReviewRows !== 1638 ||
    knowledgeCoursePathReadinessAudit.data.readySourceFitReviewRows !== 0 ||
    knowledgeCoursePathReadinessAudit.data.blockedSourceFitReviewRows !== 1638 ||
    knowledgeCoursePathReadinessAudit.data.highRiskBlockedLessons !== 12 ||
    knowledgeCoursePathReadinessAudit.data.highRiskBlockedReviewerNotes !== 72 ||
    knowledgeCoursePathReadinessAudit.data.directSourceDecisions !== 5 ||
    knowledgeCoursePathReadinessAudit.data.readyDirectSourceDecisions !== 0 ||
    knowledgeCoursePathReadinessAudit.data.realHumanInputEntries !== 0 ||
    knowledgeCoursePathReadinessAudit.data.learnerCitationApprovedRows !== 0 ||
    knowledgeCoursePathReadinessAudit.data.writeAllowedNow !== false ||
    knowledgeCoursePathReadinessAudit.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeCoursePathReadinessAudit.data.pathRows) ||
    knowledgeCoursePathReadinessAudit.data.pathRows.length !== 12 ||
    !knowledgeCoursePathReadinessAudit.data.pathRows.every((row) =>
      row.lessonCount === 30 &&
      row.unitCount === 3 &&
      row.estimatedMinutes === 240 &&
      row.internalPathReady === true &&
      row.learnerPathReleaseReady === false &&
      row.readySourceFitRows === 0 &&
      row.blockedSourceFitRows === row.sourceFitRows &&
      row.reviewStatus === "course_path_internal_navigation_ready_release_blocked" &&
      row.learnerFacingRelease === false &&
      row.writeAllowedNow === false) ||
    !knowledgeCoursePathReadinessAudit.data.pathRows.some((row) =>
      row.highRiskBlockedLessons > 0 && row.blockedReasons?.includes("high_risk_lessons_blocked")) ||
    !Array.isArray(knowledgeCoursePathReadinessAudit.data.nextBestActions) ||
    knowledgeCoursePathReadinessAudit.data.nextBestActions.length < 4 ||
    !knowledgeCoursePathReadinessAudit.data.commands.some((command) =>
      /check:knowledge-course-path-readiness-audit/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeCoursePathReadinessAudit.data.boundary || "") ||
    !/absorbed local investment course material/i.test(knowledgeCoursePathReadinessAudit.data.boundary || "") ||
    !/does not generate reviewer notes/i.test(knowledgeCoursePathReadinessAudit.data.boundary || "") ||
    !/real-money guidance/i.test(knowledgeCoursePathReadinessAudit.data.boundary || "") ||
    !/all 12 course paths/i.test(knowledgeCoursePathReadinessAudit.data.completionRule || "")
  ) {
    throw new Error("knowledge browser course path readiness audit endpoint failed");
  }

  const knowledgeModuleReviewSprintPlan = await request("/api/knowledge-browser/knowledge-module-review-sprint-plan");
  if (
    knowledgeModuleReviewSprintPlan.status !== 200 ||
    knowledgeModuleReviewSprintPlan.data.educationOnly !== true ||
    knowledgeModuleReviewSprintPlan.data.productionReady !== false ||
    knowledgeModuleReviewSprintPlan.data.approvalStatus !== "not_approved" ||
    knowledgeModuleReviewSprintPlan.data.learnerFacingRelease !== false ||
    knowledgeModuleReviewSprintPlan.data.sprintPlanStatus !== "module_review_sprint_plan_ready_release_blocked" ||
    knowledgeModuleReviewSprintPlan.data.sprintPlanMode !== "module_priority_plan_for_1715_reviewer_work_items" ||
    knowledgeModuleReviewSprintPlan.data.coursePathAuditStatus !== "course_path_readiness_audit_ready_release_blocked" ||
    knowledgeModuleReviewSprintPlan.data.actionQueueStatus !== "knowledge_reviewer_action_queue_ready_blocked_on_real_input" ||
    knowledgeModuleReviewSprintPlan.data.progressMatrixStatus !== "node_public_source_fit_review_progress_matrix_ready_release_blocked" ||
    knowledgeModuleReviewSprintPlan.data.firstCompletionGateStatus !== "first_reviewer_completion_gate_blocked_missing_real_input" ||
    knowledgeModuleReviewSprintPlan.data.modules !== 12 ||
    knowledgeModuleReviewSprintPlan.data.coursePaths !== 12 ||
    knowledgeModuleReviewSprintPlan.data.sprintRows !== 12 ||
    knowledgeModuleReviewSprintPlan.data.totalReviewerActions !== 52 ||
    knowledgeModuleReviewSprintPlan.data.totalBlockedWorkItems !== 1715 ||
    knowledgeModuleReviewSprintPlan.data.totalReadyWorkItems !== 0 ||
    knowledgeModuleReviewSprintPlan.data.firstSprintBlockedWorkItems !== 257 ||
    knowledgeModuleReviewSprintPlan.data.firstSprintReadyWorkItems !== 0 ||
    knowledgeModuleReviewSprintPlan.data.highRiskSprintModules !== 4 ||
    knowledgeModuleReviewSprintPlan.data.sourceFitReviewRows !== 1638 ||
    knowledgeModuleReviewSprintPlan.data.readySourceFitReviewRows !== 0 ||
    knowledgeModuleReviewSprintPlan.data.blockedSourceFitReviewRows !== 1638 ||
    knowledgeModuleReviewSprintPlan.data.highRiskBlockedLessons !== 12 ||
    knowledgeModuleReviewSprintPlan.data.highRiskBlockedReviewerNotes !== 72 ||
    knowledgeModuleReviewSprintPlan.data.directSourceDecisions !== 5 ||
    knowledgeModuleReviewSprintPlan.data.readyDirectSourceDecisions !== 0 ||
    knowledgeModuleReviewSprintPlan.data.realHumanInputEntries !== 0 ||
    knowledgeModuleReviewSprintPlan.data.learnerCitationApprovedRows !== 0 ||
    knowledgeModuleReviewSprintPlan.data.learnerReleaseReadyPaths !== 0 ||
    knowledgeModuleReviewSprintPlan.data.writeAllowedNow !== false ||
    knowledgeModuleReviewSprintPlan.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeModuleReviewSprintPlan.data.firstSprintRows) ||
    knowledgeModuleReviewSprintPlan.data.firstSprintRows.length !== 4 ||
    !knowledgeModuleReviewSprintPlan.data.firstSprintRows.every((row) =>
      row.highRiskBlockedLessons > 0 && row.sprintPhase === "phase_1_high_risk_and_source_fit") ||
    !Array.isArray(knowledgeModuleReviewSprintPlan.data.moduleSprintRows) ||
    knowledgeModuleReviewSprintPlan.data.moduleSprintRows.length !== 12 ||
    !knowledgeModuleReviewSprintPlan.data.moduleSprintRows.every((row) =>
      row.lessonCount === 30 &&
      row.unitCount === 3 &&
      row.estimatedMinutes === 240 &&
      row.readySourceFitReviewRows === 0 &&
      row.blockedSourceFitReviewRows === row.sourceFitReviewRows &&
      row.blockedActionRows >= 1 &&
      row.blockedWorkItems >= row.blockedActionRows &&
      row.learnerPathReleaseReady === false &&
      row.learnerFacingRelease === false &&
      row.writeAllowedNow === false &&
      row.reviewStatus === "module_review_sprint_blocked_missing_real_input") ||
    !Array.isArray(knowledgeModuleReviewSprintPlan.data.nextBestActions) ||
    knowledgeModuleReviewSprintPlan.data.nextBestActions.length < 4 ||
    !knowledgeModuleReviewSprintPlan.data.commands.some((command) =>
      /check:knowledge-module-review-sprint-plan/.test(command)) ||
    !/reviewer-facing education-only/i.test(knowledgeModuleReviewSprintPlan.data.boundary || "") ||
    !/1715 reviewer work items/i.test(knowledgeModuleReviewSprintPlan.data.boundary || "") ||
    !/12 high-risk lessons/i.test(knowledgeModuleReviewSprintPlan.data.boundary || "") ||
    !/1638 source-fit rows/i.test(knowledgeModuleReviewSprintPlan.data.boundary || "") ||
    !/does not generate reviewer notes/i.test(knowledgeModuleReviewSprintPlan.data.boundary || "") ||
    !/learner release/i.test(knowledgeModuleReviewSprintPlan.data.completionRule || "")
  ) {
    throw new Error("knowledge browser module review sprint plan endpoint failed");
  }

  const knowledgeModuleId = knowledgeOverview.data.modules[0].id;
  const knowledgeNodes = await request(`/api/knowledge-browser/nodes?module=${encodeURIComponent(knowledgeModuleId)}&limit=5`);
  if (
    knowledgeNodes.status !== 200 ||
    knowledgeNodes.data.educationOnly !== true ||
    !Array.isArray(knowledgeNodes.data.nodes) ||
    knowledgeNodes.data.nodes.length < 1 ||
    !knowledgeNodes.data.nodes.every((node) => node.reviewedSourceRefCount >= 1 && node.reviewStatus)
  ) {
    throw new Error("knowledge browser node list endpoint failed");
  }

  const unknownKnowledgeModule = await request("/api/knowledge-browser/nodes?module=not-a-module");
  if (unknownKnowledgeModule.status !== 404) throw new Error("knowledge browser unknown module should 404");

  const knowledgeNodeId = knowledgeNodes.data.nodes[0].id;
  const knowledgeNodeDetail = await request(`/api/knowledge-browser/nodes/${encodeURIComponent(knowledgeNodeId)}`);
  if (
    knowledgeNodeDetail.status !== 200 ||
    knowledgeNodeDetail.data.educationOnly !== true ||
    knowledgeNodeDetail.data.productionReady !== false ||
    knowledgeNodeDetail.data.node?.id !== knowledgeNodeId ||
    !knowledgeNodeDetail.data.node?.sourceBoundary ||
    !knowledgeNodeDetail.data.node?.licenseBoundary ||
    !Array.isArray(knowledgeNodeDetail.data.node?.reviewedSourceRefs) ||
    knowledgeNodeDetail.data.node.reviewedSourceRefs.length < 1 ||
    knowledgeNodeDetail.data.lesson?.nodeId !== knowledgeNodeId ||
    knowledgeNodeDetail.data.lesson?.reviewStatus !== "curriculum_draft" ||
    !/education/i.test(knowledgeNodeDetail.data.lesson?.learnerBoundary || "")
  ) {
    throw new Error("knowledge browser node detail endpoint failed");
  }

  const unknownKnowledgeNode = await request("/api/knowledge-browser/nodes/knv2_does_not_exist");
  if (unknownKnowledgeNode.status !== 404) throw new Error("knowledge browser unknown node should 404");

  const knowledgeEvidence = await request(`/api/knowledge-browser/nodes/${encodeURIComponent(knowledgeNodeId)}/evidence`, { timeoutMs: 60000 });
  if (
    knowledgeEvidence.status !== 200 ||
    knowledgeEvidence.data.educationOnly !== true ||
    knowledgeEvidence.data.productionReady !== false ||
    knowledgeEvidence.data.nodeId !== knowledgeNodeId ||
    !Array.isArray(knowledgeEvidence.data.evidence) ||
    knowledgeEvidence.data.evidence.length < 1 ||
    !knowledgeEvidence.data.evidence.every((item) =>
      ["public_domain", "open_access", "share_alike", "permissive"].includes(item.tier) &&
      (["public_domain", "share_alike", "permissive"].includes(item.tier) || item.excerpt === null) &&
      item.boundary)
  ) {
    throw new Error("knowledge browser node evidence endpoint failed");
  }

  const unknownEvidence = await request("/api/knowledge-browser/nodes/knv2_does_not_exist/evidence");
  if (unknownEvidence.status !== 404) throw new Error("knowledge evidence unknown node should 404");

  const localCourseCoverage = await request("/api/knowledge-browser/local-course-coverage");
  if (
    localCourseCoverage.status !== 200 ||
    localCourseCoverage.data.educationOnly !== true ||
    localCourseCoverage.data.productionReady !== false ||
    localCourseCoverage.data.tier !== "local_private_course" ||
    localCourseCoverage.data.documents < 298 ||
    localCourseCoverage.data.matchedNodes < 360 ||
    localCourseCoverage.data.readyForRewriteReviewNodes < 360 ||
    !Array.isArray(localCourseCoverage.data.moduleCoverage) ||
    localCourseCoverage.data.moduleCoverage.length < 12 ||
    !/private reviewer intake/i.test(localCourseCoverage.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course coverage endpoint failed");
  }

  const localCourseSourceQuality = await request("/api/knowledge-browser/local-course-source-quality");
  if (
    localCourseSourceQuality.status !== 200 ||
    localCourseSourceQuality.data.educationOnly !== true ||
    localCourseSourceQuality.data.productionReady !== false ||
    localCourseSourceQuality.data.approvalStatus !== "not_approved" ||
    localCourseSourceQuality.data.learnerFacingRelease !== false ||
    localCourseSourceQuality.data.folderFiles < 300 ||
    localCourseSourceQuality.data.pdfOnlyFolder !== true ||
    localCourseSourceQuality.data.uniquePdfFiles < 298 ||
    localCourseSourceQuality.data.importedUniquePdfFiles !== localCourseSourceQuality.data.uniquePdfFiles ||
    localCourseSourceQuality.data.missingUniquePdfFiles !== 0 ||
    localCourseSourceQuality.data.lowExtractionDocs < 1 ||
    localCourseSourceQuality.data.forbiddenLanguageDocs < 1 ||
    localCourseSourceQuality.data.absorptionStatus !== "all_unique_pdfs_imported_with_quality_flags" ||
    !Array.isArray(localCourseSourceQuality.data.lowExtractionList) ||
    localCourseSourceQuality.data.lowExtractionList.length < 1 ||
    !/private reviewer-only/i.test(localCourseSourceQuality.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course source quality endpoint failed");
  }

  const localCourseSourceSyncAudit = await request("/api/knowledge-browser/local-course-source-sync-audit");
  if (
    localCourseSourceSyncAudit.status !== 200 ||
    localCourseSourceSyncAudit.data.educationOnly !== true ||
    localCourseSourceSyncAudit.data.productionReady !== false ||
    localCourseSourceSyncAudit.data.approvalStatus !== "not_approved" ||
    localCourseSourceSyncAudit.data.learnerFacingRelease !== false ||
    localCourseSourceSyncAudit.data.syncStatus !== "source_folder_synced_to_private_research_corpus_release_blocked" ||
    localCourseSourceSyncAudit.data.syncMode !== "current_folder_to_manifest_and_private_corpus_hash_audit" ||
    localCourseSourceSyncAudit.data.sourceRootAvailable !== true ||
    localCourseSourceSyncAudit.data.currentPdfFiles !== 302 ||
    localCourseSourceSyncAudit.data.currentUniquePdfHashes !== 298 ||
    localCourseSourceSyncAudit.data.currentDuplicatePdfFiles !== 4 ||
    localCourseSourceSyncAudit.data.manifestPdfFiles !== 302 ||
    localCourseSourceSyncAudit.data.manifestUniquePdfFiles !== 298 ||
    localCourseSourceSyncAudit.data.harvestReportTotalPdfFiles !== 302 ||
    localCourseSourceSyncAudit.data.harvestReportUniquePdfFiles !== 298 ||
    localCourseSourceSyncAudit.data.localPrivateCourseCorpusDocs < 298 ||
    localCourseSourceSyncAudit.data.corpusDocsForCurrentUniqueHashes !== 298 ||
    localCourseSourceSyncAudit.data.missingCurrentFilesFromManifest !== 0 ||
    localCourseSourceSyncAudit.data.staleManifestFiles !== 0 ||
    localCourseSourceSyncAudit.data.missingCurrentUniqueHashesFromCorpus !== 0 ||
    localCourseSourceSyncAudit.data.corpusDocsMissingSourceFile !== 0 ||
    localCourseSourceSyncAudit.data.learnerFacingAllowedDocs !== 0 ||
    localCourseSourceSyncAudit.data.productionReadyDocs !== 0 ||
    localCourseSourceSyncAudit.data.writeAllowedNow !== false ||
    localCourseSourceSyncAudit.data.manualAuthorizationRequired !== true ||
    !Array.isArray(localCourseSourceSyncAudit.data.duplicateRows) ||
    localCourseSourceSyncAudit.data.duplicateRows.length !== 4 ||
    !Array.isArray(localCourseSourceSyncAudit.data.corpusDocSamples) ||
    localCourseSourceSyncAudit.data.corpusDocSamples.length < 8 ||
    !localCourseSourceSyncAudit.data.corpusDocSamples.every((sample) =>
      sample.id &&
      sample.sourceId &&
      sample.sourceRelativePath &&
      sample.learnerFacingAllowed === false) ||
    !/current local source folder is represented in the private research corpus by hash/i.test(localCourseSourceSyncAudit.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(localCourseSourceSyncAudit.data.boundary || "") ||
    !/does not make private PDFs public citations/i.test(localCourseSourceSyncAudit.data.boundary || "") ||
    !/stock recommendations/i.test(localCourseSourceSyncAudit.data.boundary || "") ||
    !/live signals/i.test(localCourseSourceSyncAudit.data.boundary || "") ||
    !/real-money guidance/i.test(localCourseSourceSyncAudit.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course source sync audit endpoint failed");
  }

  const localCourseDocumentAbsorptionMap = await request("/api/knowledge-browser/local-course-document-absorption-map");
  if (
    localCourseDocumentAbsorptionMap.status !== 200 ||
    localCourseDocumentAbsorptionMap.data.educationOnly !== true ||
    localCourseDocumentAbsorptionMap.data.productionReady !== false ||
    localCourseDocumentAbsorptionMap.data.approvalStatus !== "not_approved" ||
    localCourseDocumentAbsorptionMap.data.learnerFacingRelease !== false ||
    localCourseDocumentAbsorptionMap.data.auditStatus !== "all_unique_pdfs_mapped_to_knowledge_nodes_release_blocked" ||
    localCourseDocumentAbsorptionMap.data.auditMode !== "reverse_pdf_to_knowledge_node_absorption_map" ||
    localCourseDocumentAbsorptionMap.data.physicalPdfFiles !== 302 ||
    localCourseDocumentAbsorptionMap.data.duplicatePdfFiles !== 4 ||
    localCourseDocumentAbsorptionMap.data.uniquePdfFiles !== 298 ||
    localCourseDocumentAbsorptionMap.data.localPrivateCourseCorpusDocs !== 298 ||
    localCourseDocumentAbsorptionMap.data.mappedUniquePdfFiles !== 298 ||
    localCourseDocumentAbsorptionMap.data.unmappedUniquePdfFiles !== 0 ||
    localCourseDocumentAbsorptionMap.data.totalDocumentNodeMatches < 2000 ||
    localCourseDocumentAbsorptionMap.data.coverageTopMatchedPdfFiles < 10 ||
    localCourseDocumentAbsorptionMap.data.reverseScoredMatchedPdfFiles < 290 ||
    localCourseDocumentAbsorptionMap.data.lowOrThinExtractionMappedDocs < 1 ||
    localCourseDocumentAbsorptionMap.data.lowExtractionDocs !== 5 ||
    localCourseDocumentAbsorptionMap.data.manualTranscriptionPages !== 19 ||
    localCourseDocumentAbsorptionMap.data.sourceReplacementCandidates !== 3 ||
    localCourseDocumentAbsorptionMap.data.learnerFacingAllowedDocs !== 0 ||
    localCourseDocumentAbsorptionMap.data.productionReadyDocs !== 0 ||
    localCourseDocumentAbsorptionMap.data.writeAllowedNow !== false ||
    localCourseDocumentAbsorptionMap.data.manualAuthorizationRequired !== true ||
    !Array.isArray(localCourseDocumentAbsorptionMap.data.moduleRows) ||
    localCourseDocumentAbsorptionMap.data.moduleRows.length < 4 ||
    !Array.isArray(localCourseDocumentAbsorptionMap.data.extractionAttentionRows) ||
    localCourseDocumentAbsorptionMap.data.extractionAttentionRows.length < 1 ||
    !Array.isArray(localCourseDocumentAbsorptionMap.data.topMappedDocumentRows) ||
    localCourseDocumentAbsorptionMap.data.topMappedDocumentRows.length < 10 ||
    !/reviewer-facing education-only/i.test(localCourseDocumentAbsorptionMap.data.boundary || "") ||
    !/does not make private PDFs public citations/i.test(localCourseDocumentAbsorptionMap.data.boundary || "") ||
    !/source-fit review/i.test(localCourseDocumentAbsorptionMap.data.completionRule || "")
  ) {
    throw new Error("knowledge browser local course document absorption map endpoint failed");
  }

  const localCourseFolderAbsorptionLedger = await request("/api/knowledge-browser/local-course-folder-absorption-ledger");
  if (
    localCourseFolderAbsorptionLedger.status !== 200 ||
    localCourseFolderAbsorptionLedger.data.educationOnly !== true ||
    localCourseFolderAbsorptionLedger.data.productionReady !== false ||
    localCourseFolderAbsorptionLedger.data.approvalStatus !== "not_approved" ||
    localCourseFolderAbsorptionLedger.data.learnerFacingRelease !== false ||
    localCourseFolderAbsorptionLedger.data.ledgerStatus !== "folder_absorption_ledger_all_current_pdfs_accounted_release_blocked" ||
    localCourseFolderAbsorptionLedger.data.ledgerMode !== "physical_folder_to_manifest_corpus_node_absorption_ledger" ||
    localCourseFolderAbsorptionLedger.data.physicalFiles !== 302 ||
    localCourseFolderAbsorptionLedger.data.physicalPdfFiles !== 302 ||
    localCourseFolderAbsorptionLedger.data.nonPdfFiles !== 0 ||
    localCourseFolderAbsorptionLedger.data.directories !== 19 ||
    localCourseFolderAbsorptionLedger.data.uniquePdfHashes !== 298 ||
    localCourseFolderAbsorptionLedger.data.duplicatePdfFiles !== 4 ||
    localCourseFolderAbsorptionLedger.data.manifestPdfFiles !== 302 ||
    localCourseFolderAbsorptionLedger.data.manifestUniquePdfFiles !== 298 ||
    localCourseFolderAbsorptionLedger.data.corpusDocsForCurrentUniqueHashes !== 298 ||
    localCourseFolderAbsorptionLedger.data.mappedUniquePdfFiles !== 298 ||
    localCourseFolderAbsorptionLedger.data.unmappedUniquePdfFiles !== 0 ||
    localCourseFolderAbsorptionLedger.data.totalDocumentNodeMatches !== 2375 ||
    localCourseFolderAbsorptionLedger.data.matchedKnowledgeNodes !== 360 ||
    localCourseFolderAbsorptionLedger.data.readyForRewriteReviewNodes !== 360 ||
    localCourseFolderAbsorptionLedger.data.publicReferenceReadyModules !== 12 ||
    localCourseFolderAbsorptionLedger.data.modules !== 12 ||
    localCourseFolderAbsorptionLedger.data.learnerFacingAllowedDocs !== 0 ||
    localCourseFolderAbsorptionLedger.data.productionReadyDocs !== 0 ||
    localCourseFolderAbsorptionLedger.data.writeAllowedNow !== false ||
    localCourseFolderAbsorptionLedger.data.manualAuthorizationRequired !== true ||
    !Array.isArray(localCourseFolderAbsorptionLedger.data.extensionRows) ||
    localCourseFolderAbsorptionLedger.data.extensionRows.length !== 1 ||
    localCourseFolderAbsorptionLedger.data.extensionRows[0]?.extension !== ".pdf" ||
    localCourseFolderAbsorptionLedger.data.extensionRows[0]?.files !== 302 ||
    !Array.isArray(localCourseFolderAbsorptionLedger.data.directoryRows) ||
    localCourseFolderAbsorptionLedger.data.directoryRows.length !== 19 ||
    localCourseFolderAbsorptionLedger.data.directoryRows.reduce((sum, row) => sum + (row.physicalFiles || 0), 0) !== 302 ||
    localCourseFolderAbsorptionLedger.data.directoryRows.reduce((sum, row) => sum + (row.unmappedUniqueFiles || 0), 0) !== 0 ||
    !localCourseFolderAbsorptionLedger.data.directoryRows.every((row) =>
      row.absorptionStatus === "all_unique_files_mapped_private_research_only" &&
      Array.isArray(row.sampleFiles) &&
      row.sampleFiles.length > 0) ||
    !Array.isArray(localCourseFolderAbsorptionLedger.data.duplicateRows) ||
    localCourseFolderAbsorptionLedger.data.duplicateRows.length !== 4 ||
    !Array.isArray(localCourseFolderAbsorptionLedger.data.extractionAttentionRows) ||
    localCourseFolderAbsorptionLedger.data.extractionAttentionRows.length < 1 ||
    !Array.isArray(localCourseFolderAbsorptionLedger.data.topPhysicalFiles) ||
    localCourseFolderAbsorptionLedger.data.topPhysicalFiles.length !== 20 ||
    !Array.isArray(localCourseFolderAbsorptionLedger.data.commands) ||
    !localCourseFolderAbsorptionLedger.data.commands.some((command) =>
      /check:local-course-folder-absorption-ledger/.test(command)) ||
    !/reviewer-facing education-only/i.test(localCourseFolderAbsorptionLedger.data.boundary || "") ||
    !/does not make private PDFs learner-facing citations/i.test(localCourseFolderAbsorptionLedger.data.boundary || "") ||
    !/real-money guidance/i.test(localCourseFolderAbsorptionLedger.data.boundary || "") ||
    !/every current file/i.test(localCourseFolderAbsorptionLedger.data.completionRule || "")
  ) {
    throw new Error("knowledge browser local course folder absorption ledger endpoint failed");
  }

  const publicSourceGap = await request("/api/knowledge-browser/public-source-gap");
  if (
    publicSourceGap.status !== 200 ||
    publicSourceGap.data.educationOnly !== true ||
    publicSourceGap.data.productionReady !== false ||
    publicSourceGap.data.approvalStatus !== "not_approved" ||
    publicSourceGap.data.learnerFacingRelease !== false ||
    publicSourceGap.data.publicCorpusDocuments < 1100 ||
    publicSourceGap.data.wikipediaDocuments < 90 ||
    publicSourceGap.data.officialLikeDocuments < 200 ||
    publicSourceGap.data.modules !== 12 ||
    publicSourceGap.data.modulesWithPublicEvidence !== 12 ||
    publicSourceGap.data.modulesWithWikipediaEvidence !== 12 ||
    publicSourceGap.data.publicReferenceReadyModules !== 12 ||
    !Array.isArray(publicSourceGap.data.moduleRows) ||
    publicSourceGap.data.moduleRows.length !== 12 ||
    !publicSourceGap.data.moduleRows.every((row) =>
      row.wikipediaEvidenceDocs >= 1 &&
      Array.isArray(row.wikipediaEvidenceSamples) &&
      row.wikipediaEvidenceSamples.length >= 1 &&
      row.topPublicEvidenceDocs >= 12)
  ) {
    throw new Error("knowledge browser public source gap endpoint failed");
  }

  const wikipediaGroundingAudit = await request("/api/knowledge-browser/wikipedia-grounding-audit");
  if (
    wikipediaGroundingAudit.status !== 200 ||
    wikipediaGroundingAudit.data.educationOnly !== true ||
    wikipediaGroundingAudit.data.productionReady !== false ||
    wikipediaGroundingAudit.data.approvalStatus !== "not_approved" ||
    wikipediaGroundingAudit.data.learnerFacingRelease !== false ||
    wikipediaGroundingAudit.data.auditStatus !== "wikipedia_grounding_ready_for_reviewer_not_release" ||
    wikipediaGroundingAudit.data.auditMode !== "public_wikipedia_research_layer_grounding_audit" ||
    wikipediaGroundingAudit.data.wikipediaDocuments !== 96 ||
    wikipediaGroundingAudit.data.wikipediaDocumentsFromPublicGap !== 96 ||
    wikipediaGroundingAudit.data.publicCorpusDocuments < 1100 ||
    wikipediaGroundingAudit.data.recentHarvestArticlesAttempted !== 20 ||
    wikipediaGroundingAudit.data.recentHarvestArticlesStored !== 6 ||
    wikipediaGroundingAudit.data.modules !== 12 ||
    wikipediaGroundingAudit.data.modulesWithWikipediaGrounding !== 12 ||
    wikipediaGroundingAudit.data.modulesWithTwoWikipediaGroundingDocs !== 12 ||
    wikipediaGroundingAudit.data.modulesWithWikipediaSamples !== 12 ||
    !Array.isArray(wikipediaGroundingAudit.data.wikipediaThinModules) ||
    wikipediaGroundingAudit.data.wikipediaThinModules.length !== 0 ||
    wikipediaGroundingAudit.data.highRiskLessonsWithAtLeastThreeWikipediaRefs !== 12 ||
    wikipediaGroundingAudit.data.highRiskWikipediaRefCount < 48 ||
    wikipediaGroundingAudit.data.highRiskLearnerCitationApprovedLessons !== 0 ||
    wikipediaGroundingAudit.data.learnerCitationApprovedModules !== 0 ||
    wikipediaGroundingAudit.data.writeAllowedNow !== false ||
    wikipediaGroundingAudit.data.manualAuthorizationRequired !== true ||
    !Array.isArray(wikipediaGroundingAudit.data.moduleRows) ||
    wikipediaGroundingAudit.data.moduleRows.length !== 12 ||
    !wikipediaGroundingAudit.data.moduleRows.every((row) =>
      row.wikipediaEvidenceDocs >= 2 &&
      Array.isArray(row.wikipediaSamples) &&
      row.wikipediaSamples.length >= 1 &&
      row.wikipediaSamples.every((sample) =>
        sample.documentId &&
        sample.name &&
        /^https:\/\/en\.wikipedia\.org\/wiki\//.test(sample.url || "") &&
        sample.excerptPolicy === "attribution_and_share_alike_required") &&
      row.learnerCitationApproved === false &&
      row.learnerFacingRelease === false &&
      row.nextGate === "human_source_fit_public_grounding_originality_and_separate_release_approval") ||
    !Array.isArray(wikipediaGroundingAudit.data.highRiskLessonRows) ||
    wikipediaGroundingAudit.data.highRiskLessonRows.length !== 12 ||
    !wikipediaGroundingAudit.data.highRiskLessonRows.every((row) =>
      row.wikipediaRefCount >= 3 &&
      row.publicContextRefCount >= 2 &&
      row.publicGroundingStatus === "mapped_for_reviewer_not_release_approved" &&
      row.learnerCitationApproved === false &&
      row.learnerFacingRelease === false &&
      row.approvalStatus === "not_approved" &&
      row.releaseBlocker === true) ||
    !Array.isArray(wikipediaGroundingAudit.data.wikipediaDocSamples) ||
    wikipediaGroundingAudit.data.wikipediaDocSamples.length < 8 ||
    !wikipediaGroundingAudit.data.wikipediaDocSamples.every((sample) =>
      sample.id &&
      sample.sourceId &&
      sample.name &&
      sample.excerptPolicy === "attribution_and_share_alike_required" &&
      sample.learnerFacingApproved === false) ||
    !/wikipedia\/public grounding availability for reviewer work/i.test(wikipediaGroundingAudit.data.completionRule || "") ||
    !/cc by-sa\/share-alike/i.test(wikipediaGroundingAudit.data.boundary || "") ||
    !/stock recommendations/i.test(wikipediaGroundingAudit.data.boundary || "") ||
    !/live signals/i.test(wikipediaGroundingAudit.data.boundary || "") ||
    !/real-money guidance/i.test(wikipediaGroundingAudit.data.boundary || "")
  ) {
    throw new Error("knowledge browser Wikipedia grounding audit endpoint failed");
  }

  const publicSourceAbsorptionMap = await request("/api/knowledge-browser/public-source-absorption-map");
  if (
    publicSourceAbsorptionMap.status !== 200 ||
    publicSourceAbsorptionMap.data.educationOnly !== true ||
    publicSourceAbsorptionMap.data.productionReady !== false ||
    publicSourceAbsorptionMap.data.approvalStatus !== "not_approved" ||
    publicSourceAbsorptionMap.data.learnerFacingRelease !== false ||
    publicSourceAbsorptionMap.data.auditStatus !== "public_sources_mapped_to_knowledge_nodes_release_blocked" ||
    publicSourceAbsorptionMap.data.auditMode !== "reverse_public_source_to_knowledge_node_absorption_map" ||
    publicSourceAbsorptionMap.data.corpusDocuments !== 1494 ||
    publicSourceAbsorptionMap.data.publicCorpusDocuments !== 1196 ||
    publicSourceAbsorptionMap.data.wikipediaDocuments !== 96 ||
    publicSourceAbsorptionMap.data.officialLikeDocuments !== 202 ||
    publicSourceAbsorptionMap.data.mappedPublicDocuments !== 1196 ||
    publicSourceAbsorptionMap.data.unmappedPublicDocuments !== 0 ||
    publicSourceAbsorptionMap.data.mappedWikipediaDocuments !== 96 ||
    publicSourceAbsorptionMap.data.unmappedWikipediaDocuments !== 0 ||
    publicSourceAbsorptionMap.data.mappedOfficialLikeDocuments !== 202 ||
    publicSourceAbsorptionMap.data.unmappedOfficialLikeDocuments !== 0 ||
    publicSourceAbsorptionMap.data.totalPublicDocumentNodeMatches < 9000 ||
    publicSourceAbsorptionMap.data.modulesWithPublicSourceMapping !== 12 ||
    publicSourceAbsorptionMap.data.modulesWithWikipediaMapping < 10 ||
    publicSourceAbsorptionMap.data.learnerCitationApprovedDocuments !== 0 ||
    publicSourceAbsorptionMap.data.writeAllowedNow !== false ||
    publicSourceAbsorptionMap.data.manualAuthorizationRequired !== true ||
    !Array.isArray(publicSourceAbsorptionMap.data.moduleRows) ||
    publicSourceAbsorptionMap.data.moduleRows.length !== 12 ||
    !Array.isArray(publicSourceAbsorptionMap.data.wikipediaRows) ||
    publicSourceAbsorptionMap.data.wikipediaRows.length < 10 ||
    !Array.isArray(publicSourceAbsorptionMap.data.officialLikeRows) ||
    publicSourceAbsorptionMap.data.officialLikeRows.length < 10 ||
    !Array.isArray(publicSourceAbsorptionMap.data.topMappedPublicRows) ||
    publicSourceAbsorptionMap.data.topMappedPublicRows.length < 10 ||
    !/reviewer-facing education-only/i.test(publicSourceAbsorptionMap.data.boundary || "") ||
    !/does not approve copied text/i.test(publicSourceAbsorptionMap.data.boundary || "") ||
    !/learner-facing citations/i.test(publicSourceAbsorptionMap.data.completionRule || "")
  ) {
    throw new Error("knowledge browser public source absorption map endpoint failed");
  }

  const publicSourceCoverageLedger = await request("/api/knowledge-browser/public-source-coverage-ledger");
  if (
    publicSourceCoverageLedger.status !== 200 ||
    publicSourceCoverageLedger.data.educationOnly !== true ||
    publicSourceCoverageLedger.data.productionReady !== false ||
    publicSourceCoverageLedger.data.approvalStatus !== "not_approved" ||
    publicSourceCoverageLedger.data.learnerFacingRelease !== false ||
    publicSourceCoverageLedger.data.ledgerStatus !== "public_source_coverage_ledger_ready_release_blocked" ||
    publicSourceCoverageLedger.data.ledgerMode !== "public_wikipedia_official_source_absorption_and_source_fit_queue" ||
    publicSourceCoverageLedger.data.publicCorpusDocuments !== 1196 ||
    publicSourceCoverageLedger.data.wikipediaDocuments !== 96 ||
    publicSourceCoverageLedger.data.officialLikeDocuments !== 202 ||
    publicSourceCoverageLedger.data.mappedPublicDocuments !== 1196 ||
    publicSourceCoverageLedger.data.unmappedPublicDocuments !== 0 ||
    publicSourceCoverageLedger.data.mappedWikipediaDocuments !== 96 ||
    publicSourceCoverageLedger.data.unmappedWikipediaDocuments !== 0 ||
    publicSourceCoverageLedger.data.mappedOfficialLikeDocuments !== 202 ||
    publicSourceCoverageLedger.data.unmappedOfficialLikeDocuments !== 0 ||
    publicSourceCoverageLedger.data.totalPublicDocumentNodeMatches !== 9568 ||
    publicSourceCoverageLedger.data.modules !== 12 ||
    publicSourceCoverageLedger.data.publicReferenceReadyModules !== 12 ||
    publicSourceCoverageLedger.data.modulesWithWikipediaGrounding !== 12 ||
    publicSourceCoverageLedger.data.nodes !== 360 ||
    publicSourceCoverageLedger.data.moduleGroundedNodes !== 360 ||
    publicSourceCoverageLedger.data.directPublicReadyNodes !== 103 ||
    publicSourceCoverageLedger.data.directWikipediaReadyNodes !== 84 ||
    publicSourceCoverageLedger.data.directOfficialReadyNodes !== 83 ||
    publicSourceCoverageLedger.data.directTriangulatedNodes !== 87 ||
    publicSourceCoverageLedger.data.candidateTargetNodes !== 273 ||
    publicSourceCoverageLedger.data.sourceFitCandidates !== 1638 ||
    publicSourceCoverageLedger.data.wikipediaCandidates !== 1122 ||
    publicSourceCoverageLedger.data.officialCandidates !== 243 ||
    publicSourceCoverageLedger.data.sourceFitReviewRows !== 1638 ||
    publicSourceCoverageLedger.data.readySourceFitReviewRows !== 0 ||
    publicSourceCoverageLedger.data.blockedSourceFitReviewRows !== 1638 ||
    publicSourceCoverageLedger.data.rowsWithUrl !== 1638 ||
    publicSourceCoverageLedger.data.realHumanInputEntries !== 0 ||
    publicSourceCoverageLedger.data.learnerCitationApprovedDocuments !== 0 ||
    publicSourceCoverageLedger.data.learnerCitationApprovedNodes !== 0 ||
    publicSourceCoverageLedger.data.learnerCitationApprovedCandidates !== 0 ||
    publicSourceCoverageLedger.data.learnerCitationApprovedRows !== 0 ||
    publicSourceCoverageLedger.data.writeAllowedNow !== false ||
    publicSourceCoverageLedger.data.manualAuthorizationRequired !== true ||
    !Array.isArray(publicSourceCoverageLedger.data.moduleRows) ||
    publicSourceCoverageLedger.data.moduleRows.length !== 12 ||
    publicSourceCoverageLedger.data.moduleRows.reduce((sum, row) => sum + (row.sourceFitCandidateRows || 0), 0) !== 1638 ||
    !publicSourceCoverageLedger.data.moduleRows.every((row) =>
      row.status === "public_layer_mapped_source_fit_blocked_on_real_review" &&
      row.realHumanInputEntries === 0 &&
      row.learnerCitationApprovedRows === 0) ||
    !Array.isArray(publicSourceCoverageLedger.data.wikipediaDocSamples) ||
    publicSourceCoverageLedger.data.wikipediaDocSamples.length < 10 ||
    !Array.isArray(publicSourceCoverageLedger.data.nodeSpecificPublicGapSamples) ||
    publicSourceCoverageLedger.data.nodeSpecificPublicGapSamples.length < 10 ||
    !Array.isArray(publicSourceCoverageLedger.data.commands) ||
    !publicSourceCoverageLedger.data.commands.some((command) =>
      /check:public-source-coverage-ledger/.test(command)) ||
    !/reviewer-facing education-only/i.test(publicSourceCoverageLedger.data.boundary || "") ||
    !/does not approve copied text/i.test(publicSourceCoverageLedger.data.boundary || "") ||
    !/real-money guidance/i.test(publicSourceCoverageLedger.data.boundary || "") ||
    !/does not approve learner-facing citations/i.test(publicSourceCoverageLedger.data.completionRule || "")
  ) {
    throw new Error("knowledge browser public source coverage ledger endpoint failed");
  }

  const knowledgeNodeSourceTriangulationAudit = await request("/api/knowledge-browser/knowledge-node-source-triangulation-audit");
  if (
    knowledgeNodeSourceTriangulationAudit.status !== 200 ||
    knowledgeNodeSourceTriangulationAudit.data.educationOnly !== true ||
    knowledgeNodeSourceTriangulationAudit.data.productionReady !== false ||
    knowledgeNodeSourceTriangulationAudit.data.approvalStatus !== "not_approved" ||
    knowledgeNodeSourceTriangulationAudit.data.learnerFacingRelease !== false ||
    knowledgeNodeSourceTriangulationAudit.data.auditStatus !== "node_source_triangulation_ready_for_reviewer_release_blocked" ||
    knowledgeNodeSourceTriangulationAudit.data.auditMode !== "local_private_plus_public_wikipedia_node_triangulation" ||
    knowledgeNodeSourceTriangulationAudit.data.nodes !== 360 ||
    knowledgeNodeSourceTriangulationAudit.data.modules !== 12 ||
    knowledgeNodeSourceTriangulationAudit.data.localReadyNodes !== 360 ||
    knowledgeNodeSourceTriangulationAudit.data.directPublicReadyNodes < 100 ||
    knowledgeNodeSourceTriangulationAudit.data.directWikipediaReadyNodes < 80 ||
    knowledgeNodeSourceTriangulationAudit.data.directOfficialReadyNodes < 70 ||
    knowledgeNodeSourceTriangulationAudit.data.directTriangulatedNodes < 80 ||
    knowledgeNodeSourceTriangulationAudit.data.moduleGroundedNodes !== 360 ||
    knowledgeNodeSourceTriangulationAudit.data.attentionNodes !== 0 ||
    knowledgeNodeSourceTriangulationAudit.data.learnerCitationApprovedNodes !== 0 ||
    knowledgeNodeSourceTriangulationAudit.data.writeAllowedNow !== false ||
    knowledgeNodeSourceTriangulationAudit.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeNodeSourceTriangulationAudit.data.moduleRows) ||
    knowledgeNodeSourceTriangulationAudit.data.moduleRows.length !== 12 ||
    !Array.isArray(knowledgeNodeSourceTriangulationAudit.data.directTriangulatedSamples) ||
    knowledgeNodeSourceTriangulationAudit.data.directTriangulatedSamples.length < 6 ||
    !Array.isArray(knowledgeNodeSourceTriangulationAudit.data.nodeSpecificPublicGapSamples) ||
    knowledgeNodeSourceTriangulationAudit.data.nodeSpecificPublicGapSamples.length < 6 ||
    !/reviewer-facing education-only/i.test(knowledgeNodeSourceTriangulationAudit.data.boundary || "") ||
    !/module-level grounding/i.test(knowledgeNodeSourceTriangulationAudit.data.completionRule || "") ||
    !/learner-facing citations/i.test(knowledgeNodeSourceTriangulationAudit.data.boundary || "")
  ) {
    throw new Error("knowledge browser node source triangulation audit endpoint failed");
  }

  const knowledgeNodePublicSourceFitCandidatePack = await request("/api/knowledge-browser/knowledge-node-public-source-fit-candidate-pack");
  if (
    knowledgeNodePublicSourceFitCandidatePack.status !== 200 ||
    knowledgeNodePublicSourceFitCandidatePack.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitCandidatePack.data.productionReady !== false ||
    knowledgeNodePublicSourceFitCandidatePack.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitCandidatePack.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitCandidatePack.data.packStatus !== "node_public_source_fit_candidate_pack_ready_for_reviewer_release_blocked" ||
    knowledgeNodePublicSourceFitCandidatePack.data.packMode !== "promote_module_public_grounding_to_node_specific_source_fit_candidates" ||
    knowledgeNodePublicSourceFitCandidatePack.data.nodes !== 360 ||
    knowledgeNodePublicSourceFitCandidatePack.data.directTriangulatedNodes < 80 ||
    knowledgeNodePublicSourceFitCandidatePack.data.candidateTargetNodes !== 273 ||
    knowledgeNodePublicSourceFitCandidatePack.data.readyCandidateRows !== 273 ||
    knowledgeNodePublicSourceFitCandidatePack.data.attentionCandidateRows !== 0 ||
    knowledgeNodePublicSourceFitCandidatePack.data.totalCandidates < 1600 ||
    knowledgeNodePublicSourceFitCandidatePack.data.wikipediaCandidates < 1000 ||
    knowledgeNodePublicSourceFitCandidatePack.data.officialCandidates < 200 ||
    knowledgeNodePublicSourceFitCandidatePack.data.learnerCitationApprovedCandidates !== 0 ||
    knowledgeNodePublicSourceFitCandidatePack.data.reviewerAcceptedCandidates !== 0 ||
    knowledgeNodePublicSourceFitCandidatePack.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitCandidatePack.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeNodePublicSourceFitCandidatePack.data.moduleRows) ||
    knowledgeNodePublicSourceFitCandidatePack.data.moduleRows.length < 10 ||
    !Array.isArray(knowledgeNodePublicSourceFitCandidatePack.data.sampleCandidateRows) ||
    knowledgeNodePublicSourceFitCandidatePack.data.sampleCandidateRows.length < 6 ||
    !/reviewer-facing education-only/i.test(knowledgeNodePublicSourceFitCandidatePack.data.boundary || "") ||
    !/does not accept sources/i.test(knowledgeNodePublicSourceFitCandidatePack.data.completionRule || "") ||
    !/learner-facing citations/i.test(knowledgeNodePublicSourceFitCandidatePack.data.boundary || "")
  ) {
    throw new Error("knowledge browser node public source-fit candidate pack endpoint failed");
  }

  const knowledgeNodePublicSourceFitReviewInputStarter = await request("/api/knowledge-browser/knowledge-node-public-source-fit-review-input-starter");
  if (
    knowledgeNodePublicSourceFitReviewInputStarter.status !== 200 ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.productionReady !== false ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.starterStatus !== "node_public_source_fit_review_input_starter_ready_blank" ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.candidateTargetNodes !== 273 ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.reviewRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.readyReviewRows !== 0 ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.blockedReviewRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.realHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.learnerCitationApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.copiedTextApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewInputStarter.data.manualAuthorizationRequired !== true ||
    !/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT\.json/.test(knowledgeNodePublicSourceFitReviewInputStarter.data.draftInputPath || "") ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewInputStarter.data.commands) ||
    !knowledgeNodePublicSourceFitReviewInputStarter.data.commands.some((item) => /validate:knowledge-node-public-source-fit-review-input/.test(item)) ||
    !/reviewer-facing education-only/i.test(knowledgeNodePublicSourceFitReviewInputStarter.data.boundary || "") ||
    !/real human reviewer/i.test(knowledgeNodePublicSourceFitReviewInputStarter.data.completionRule || "")
  ) {
    throw new Error("knowledge browser node public source-fit review input starter endpoint failed");
  }

  const knowledgeNodePublicSourceFitReviewInputValidation = await request("/api/knowledge-browser/knowledge-node-public-source-fit-review-input-validation");
  if (
    knowledgeNodePublicSourceFitReviewInputValidation.status !== 200 ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.productionReady !== false ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.validationStatus !== "blocked_missing_real_reviewer_source_fit_input" ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.inputRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.readyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.blockedRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.missingFieldRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.invalidDecisionRows !== 0 ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.forbiddenHitRows !== 0 ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.realHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.learnerCitationApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.copiedTextApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.fixtureReadyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.allowFixture !== false ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewInputValidation.data.blockedSamples) ||
    knowledgeNodePublicSourceFitReviewInputValidation.data.blockedSamples.length < 6 ||
    !/reviewer-facing education-only/i.test(knowledgeNodePublicSourceFitReviewInputValidation.data.boundary || "") ||
    !/fixtureOnly:false/i.test(knowledgeNodePublicSourceFitReviewInputValidation.data.completionRule || "")
  ) {
    throw new Error("knowledge browser node public source-fit review input validation endpoint failed");
  }

  const knowledgeNodePublicSourceFitReviewExecutionQueue = await request("/api/knowledge-browser/knowledge-node-public-source-fit-review-execution-queue");
  if (
    knowledgeNodePublicSourceFitReviewExecutionQueue.status !== 200 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.productionReady !== false ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.queueStatus !== "node_public_source_fit_review_execution_queue_ready_release_blocked" ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.queueMode !== "module_batch_review_for_public_source_fit_candidates" ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.batchSize !== 60 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.modules !== 12 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.candidateTargetNodes !== 273 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.reviewRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.validationStatus !== "blocked_missing_real_reviewer_source_fit_input" ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.readyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.blockedRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.missingFieldRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.forbiddenHitRows !== 0 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.realHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.learnerCitationApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.copiedTextApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.totalBatches !== 35 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.blockedBatches !== 35 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.readyBatches !== 0 ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.manualAuthorizationRequired !== true ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.upstreamReviewGateStatus !== "local_course_review_gate_dashboard_ready_release_blocked" ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewExecutionQueue.data.firstPriorityBatches) ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.firstPriorityBatches.length !== 6 ||
    !knowledgeNodePublicSourceFitReviewExecutionQueue.data.firstPriorityBatches.every((batch) =>
      /^node-public-source-fit-batch-/.test(batch.batchId || "") &&
      batch.status === "blocked_missing_real_reviewer_input" &&
      batch.owner === "real_reviewer") ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewExecutionQueue.data.moduleRows) ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.moduleRows.length !== 12 ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewExecutionQueue.data.batchRows) ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.batchRows.length < 6 ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewExecutionQueue.data.reviewerChecklist) ||
    knowledgeNodePublicSourceFitReviewExecutionQueue.data.reviewerChecklist.length < 5 ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewExecutionQueue.data.commands) ||
    !knowledgeNodePublicSourceFitReviewExecutionQueue.data.commands.some((item) =>
      /check:knowledge-node-public-source-fit-review-execution-queue/.test(item)) ||
    !/execution planning only/i.test(knowledgeNodePublicSourceFitReviewExecutionQueue.data.completionRule || "") ||
    !/all 1638 node public source-fit rows/i.test(knowledgeNodePublicSourceFitReviewExecutionQueue.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(knowledgeNodePublicSourceFitReviewExecutionQueue.data.boundary || "") ||
    !/does not approve sources/i.test(knowledgeNodePublicSourceFitReviewExecutionQueue.data.boundary || "")
  ) {
    throw new Error("knowledge browser node public source-fit review execution queue endpoint failed");
  }

  const knowledgeNodePublicSourceFitReviewBatchPackets = await request("/api/knowledge-browser/knowledge-node-public-source-fit-review-batch-packets");
  if (
    knowledgeNodePublicSourceFitReviewBatchPackets.status !== 200 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.productionReady !== false ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.packetStatus !== "node_public_source_fit_review_batch_packets_ready_release_blocked" ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.packetMode !== "fillable_batch_packets_for_node_public_source_fit_review" ||
    !/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_EXECUTION_QUEUE/.test(knowledgeNodePublicSourceFitReviewBatchPackets.data.sourceQueuePath || "") ||
    !/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT/.test(knowledgeNodePublicSourceFitReviewBatchPackets.data.sourceDraftInputPath || "") ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.modules !== 12 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.totalBatches !== 35 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.totalPackets !== 35 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.candidateTargetNodes !== 273 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.reviewRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.readyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.blockedRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.missingFieldRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.realHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.learnerCitationApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.copiedTextApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewBatchPackets.data.firstPriorityPackets) ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.firstPriorityPackets.length !== 6 ||
    !knowledgeNodePublicSourceFitReviewBatchPackets.data.firstPriorityPackets.every((packet) =>
      /^node-public-source-fit-batch-/.test(packet.packetId || "") &&
      packet.reviewRows > 0 &&
      /KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT/.test(packet.inputPath || "")) ||
    !knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacket ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacket.packetId !== knowledgeNodePublicSourceFitReviewBatchPackets.data.firstPriorityPackets[0].packetId ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacket.displayedRows !== 12 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacket.reviewRows <= knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacket.displayedRows ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacket.packetRows) ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacket.packetRows.length !== 12 ||
    !knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacket.packetRows.every((row) =>
      Number.isInteger(row.inputRowIndex) &&
      row.reviewId &&
      row.nodeId &&
      row.documentId &&
      row.name &&
      row.url &&
      row.reviewStatus === "blocked_missing_real_reviewer_input" &&
      row.fillableFields &&
      row.fillableFields.reviewerDecision === `/rows/${row.inputRowIndex}/reviewerDecision` &&
      row.fillableFields.sourceFitNotes === `/rows/${row.inputRowIndex}/sourceFitNotes` &&
      row.fixedFields &&
      row.fixedFields.learnerCitationApproved === false &&
      row.fixedFields.copiedTextApproved === false) ||
    !knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.workbenchStatus !== "selected_packet_review_workbench_ready_release_blocked" ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.workbenchMode !== "front_end_internal_browser_for_real_reviewer_packet_execution" ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.packetId !== knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacket.packetId ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.displayedRows !== 12 ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.learnerFacingRelease !== false ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.fixedFieldPolicy) ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.fixedFieldPolicy.length < 3 ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.fillableFieldPointers) ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.fillableFieldPointers.length !== 6 ||
    !knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.fillableFieldPointers.every((row) =>
      Number.isInteger(row.inputRowIndex) &&
      row.reviewId &&
      row.reviewerDecision === `/rows/${row.inputRowIndex}/reviewerDecision` &&
      row.sourceFitNotes === `/rows/${row.inputRowIndex}/sourceFitNotes`) ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.rowEvidencePreview) ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.rowEvidencePreview.length !== 6 ||
    !/does not create human judgments/i.test(knowledgeNodePublicSourceFitReviewBatchPackets.data.selectedPacketWorkbench.boundary || "") ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewBatchPackets.data.batchPackets) ||
    knowledgeNodePublicSourceFitReviewBatchPackets.data.batchPackets.length < 6 ||
    !knowledgeNodePublicSourceFitReviewBatchPackets.data.batchPackets.every((packet) =>
      packet.packetStatus === "blank_batch_packet_ready_for_real_reviewer" &&
      packet.owner === "real_reviewer" &&
      Array.isArray(packet.sampleRows) &&
      packet.sampleRows.length > 0 &&
      Array.isArray(packet.acceptanceChecks) &&
      packet.acceptanceChecks.length >= 4) ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewBatchPackets.data.commands) ||
    !knowledgeNodePublicSourceFitReviewBatchPackets.data.commands.some((item) =>
      /check:knowledge-node-public-source-fit-review-batch-packets/.test(item)) ||
    !/blank scaffolding only/i.test(knowledgeNodePublicSourceFitReviewBatchPackets.data.completionRule || "") ||
    !/do not create human judgments/i.test(knowledgeNodePublicSourceFitReviewBatchPackets.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(knowledgeNodePublicSourceFitReviewBatchPackets.data.boundary || "") ||
    !/learner-facing citations/i.test(knowledgeNodePublicSourceFitReviewBatchPackets.data.boundary || "")
  ) {
    throw new Error("knowledge browser node public source-fit review batch packets endpoint failed");
  }
  const knowledgeNodePublicSourceFitReviewBatchPacket002 = await request("/api/knowledge-browser/knowledge-node-public-source-fit-review-batch-packets?packetId=node-public-source-fit-batch-002-packet");
  if (
    knowledgeNodePublicSourceFitReviewBatchPacket002.status !== 200 ||
    knowledgeNodePublicSourceFitReviewBatchPacket002.data.selectedPacket?.packetId !== "node-public-source-fit-batch-002-packet" ||
    knowledgeNodePublicSourceFitReviewBatchPacket002.data.selectedPacket?.batchId !== "node-public-source-fit-batch-002" ||
    knowledgeNodePublicSourceFitReviewBatchPacket002.data.selectedPacket?.displayedRows !== 12 ||
    knowledgeNodePublicSourceFitReviewBatchPacket002.data.selectedPacketWorkbench?.packetId !== "node-public-source-fit-batch-002-packet" ||
    knowledgeNodePublicSourceFitReviewBatchPacket002.data.selectedPacketWorkbench?.batchId !== "node-public-source-fit-batch-002" ||
    knowledgeNodePublicSourceFitReviewBatchPacket002.data.selectedPacketWorkbench?.displayedRows !== 12 ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewBatchPacket002.data.selectedPacket?.packetRows) ||
    knowledgeNodePublicSourceFitReviewBatchPacket002.data.selectedPacket.packetRows.length !== 12 ||
    !knowledgeNodePublicSourceFitReviewBatchPacket002.data.selectedPacket.packetRows.every((row) =>
      row.fillableFields?.reviewerDecision === `/rows/${row.inputRowIndex}/reviewerDecision` &&
      row.fixedFields?.learnerCitationApproved === false &&
      row.fixedFields?.copiedTextApproved === false)
  ) {
    throw new Error("knowledge browser node public source-fit selected batch packet endpoint failed");
  }

  const knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate = await request("/api/knowledge-browser/knowledge-node-public-source-fit-review-packet-input-copy-template");
  if (
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.status !== 200 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.productionReady !== false ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.templateStatus !== "node_public_source_fit_packet_input_copy_template_ready_blank" ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.templateMode !== "first_blocked_packet_scoped_input_copy_for_real_reviewer" ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.inputStatus !== "packet_input_copy_template_ready_for_real_reviewer" ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.validationStatus !== "blocked_missing_real_reviewer_source_fit_input" ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.packetId !== "node-public-source-fit-batch-001-packet" ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.batchId !== "node-public-source-fit-batch-001" ||
    !/PACKET_001_INPUT_COPY_TEMPLATE/.test(knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.inputCopyPath || "") ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.targetNodes !== 10 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.reviewRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.readyReviewRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.blockedReviewRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.validationInputRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.validationReadyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.validationBlockedRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.validationMissingFieldRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.validationInvalidDecisionRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.validationForbiddenHitRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.realHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.learnerCitationApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.copiedTextApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.fillableFieldRows) ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.fillableFieldRows.length !== 12 ||
    !knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.fillableFieldRows.every((row) =>
      row.reviewId &&
      row.reviewerDecision === `/rows/${row.order - 1}/reviewerDecision` &&
      row.sourceFitNotes === `/rows/${row.order - 1}/sourceFitNotes`) ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.rowEvidencePreview) ||
    knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.rowEvidencePreview.length !== 8 ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.commands) ||
    !knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.commands.some((item) =>
      /validate:knowledge-node-public-source-fit-review-packet-input-copy-template/.test(item)) ||
    !/does not create human judgments/i.test(knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.boundary || "") ||
    !/real human reviewer decisions/i.test(knowledgeNodePublicSourceFitReviewPacketInputCopyTemplate.data.completionRule || "")
  ) {
    throw new Error("knowledge browser node public source-fit packet input copy template endpoint failed");
  }

  const knowledgeNodePublicSourceFitReviewPacketMergePreview = await request("/api/knowledge-browser/knowledge-node-public-source-fit-review-packet-merge-preview");
  if (
    knowledgeNodePublicSourceFitReviewPacketMergePreview.status !== 200 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.productionReady !== false ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.mergePreviewStatus !== "packet_merge_preview_blocked_missing_ready_packet_input" ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.mergePreviewMode !== "dry_run_packet_input_copy_to_full_source_fit_draft_mapping" ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.packetId !== "node-public-source-fit-batch-001-packet" ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.batchId !== "node-public-source-fit-batch-001" ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.packetRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.fullDraftRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.fullValidationRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.mappedRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.missingTargetRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.readyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.blockedRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.packetValidationStatus !== "blocked_missing_real_reviewer_source_fit_input" ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.packetReadyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.packetBlockedRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.packetMissingFieldRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.packetForbiddenHitRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.packetRealHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.fullDraftReadyRowsBeforeMerge !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.fullDraftBlockedRowsBeforeMerge !== 1638 ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.mergeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewPacketMergePreview.data.sampleMergeRows) ||
    knowledgeNodePublicSourceFitReviewPacketMergePreview.data.sampleMergeRows.length !== 12 ||
    !knowledgeNodePublicSourceFitReviewPacketMergePreview.data.sampleMergeRows.every((row) =>
      row.reviewId &&
      Number.isInteger(row.packetRowIndex) &&
      Number.isInteger(row.targetFullDraftRowIndex) &&
      row.mappedToFullDraft === true &&
      row.readyForMerge === false &&
      row.mergeBlockedReason === "packet_row_not_ready_for_merge") ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewPacketMergePreview.data.commands) ||
    !knowledgeNodePublicSourceFitReviewPacketMergePreview.data.commands.some((item) =>
      /check:knowledge-node-public-source-fit-review-packet-merge-preview/.test(item)) ||
    !/does not write the full source-fit draft/i.test(knowledgeNodePublicSourceFitReviewPacketMergePreview.data.boundary || "") ||
    !/real human input/i.test(knowledgeNodePublicSourceFitReviewPacketMergePreview.data.completionRule || "")
  ) {
    throw new Error("knowledge browser node public source-fit packet merge preview endpoint failed");
  }

  const knowledgeNodePublicSourceFitReviewPacketMergeApplyReport = await request("/api/knowledge-browser/knowledge-node-public-source-fit-review-packet-merge-apply-report");
  if (
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.status !== 200 ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.productionReady !== false ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.applyMode !== "dry_run" ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.applyStatus !== "blocked_no_ready_merge_rows" ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.packetId !== "node-public-source-fit-batch-001-packet" ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.batchId !== "node-public-source-fit-batch-001" ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.totalRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.readyToMergeRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.blockedRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.writtenRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.mergeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.manualAuthorizationRequired !== true ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.fullDraftRows !== 1638 ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.applyRows) ||
    knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.applyRows.length !== 12 ||
    !knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.applyRows.every((row) =>
      row.reviewId &&
      row.applyStatus === "blocked_not_ready" &&
      row.willWrite === false &&
      row.realHumanInput === false &&
      Array.isArray(row.missingFields) &&
      row.missingFields.length > 0) ||
    !/Fill packet input copy/i.test(knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.nextStep || "") ||
    !/dry-run mode writes no full draft changes/i.test(knowledgeNodePublicSourceFitReviewPacketMergeApplyReport.data.boundary || "")
  ) {
    throw new Error("knowledge browser node public source-fit packet merge apply report endpoint failed");
  }

  const knowledgeNodePublicSourceFitReviewPacket001Handoff = await request("/api/knowledge-browser/knowledge-node-public-source-fit-review-packet-001-handoff");
  if (
    knowledgeNodePublicSourceFitReviewPacket001Handoff.status !== 200 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.productionReady !== false ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.handoffStatus !== "node_public_source_fit_packet_001_handoff_ready_blocked_on_real_input" ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.handoffMode !== "single_packet_reviewer_execution_path" ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.packetId !== "node-public-source-fit-batch-001-packet" ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.reviewRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.targetNodes !== 10 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.packetReadyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.packetBlockedRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.packetMissingFieldRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.packetRealHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.mergeMappedRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.mergeReadyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.mergeBlockedRows !== 60 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.mergeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.mergeDryRunWrittenRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.progressReadyPackets !== 0 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.progressBlockedPackets !== 35 ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewPacket001Handoff.data.phaseRows) ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.phaseRows.length !== 6 ||
    !knowledgeNodePublicSourceFitReviewPacket001Handoff.data.phaseRows.every((row) =>
      row.id &&
      row.status &&
      row.command &&
      row.reviewerAction &&
      row.hardStop) ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewPacket001Handoff.data.hardStops) ||
    knowledgeNodePublicSourceFitReviewPacket001Handoff.data.hardStops.length < 5 ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewPacket001Handoff.data.commands) ||
    !knowledgeNodePublicSourceFitReviewPacket001Handoff.data.commands.some((item) =>
      /check:knowledge-node-public-source-fit-review-packet-001-handoff/.test(item)) ||
    !/does not fill packet rows/i.test(knowledgeNodePublicSourceFitReviewPacket001Handoff.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(knowledgeNodePublicSourceFitReviewPacket001Handoff.data.boundary || "")
  ) {
    throw new Error("knowledge browser node public source-fit packet 001 handoff endpoint failed");
  }

  const knowledgeNodePublicSourceFitReviewPacketHandoffIndex = await request("/api/knowledge-browser/knowledge-node-public-source-fit-review-packet-handoff-index");
  const packetHandoffIndexRows = knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.packetRows || [];
  const expectedGeneratedPacketNumbers = ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "023", "024", "025", "026", "027", "028", "029", "030", "031", "032", "033", "034", "035"];
  const firstGeneratedPacketRowsReady = expectedGeneratedPacketNumbers.every((packetNumber, index) => {
    const row = packetHandoffIndexRows[index];
    const expectedTemplateStatus = packetNumber === "001"
      ? "node_public_source_fit_packet_input_copy_template_ready_blank"
      : `node_public_source_fit_packet_${packetNumber}_input_copy_template_ready_blank`;
    return row?.packetId === `node-public-source-fit-batch-${packetNumber}-packet` &&
      row?.handoffStatus === `node_public_source_fit_packet_${packetNumber}_handoff_ready_blocked_on_real_input` &&
      row?.inputCopyTemplateStatus === expectedTemplateStatus &&
      new RegExp(`PACKET_${packetNumber}_HANDOFF`).test(row?.handoffPath || "") &&
      new RegExp(`PACKET_${packetNumber}_INPUT_COPY_TEMPLATE`).test(row?.inputCopyPath || "") &&
      row?.progressStatus === "blocked_missing_real_reviewer_input" &&
      row?.readyRows === 0 &&
      row?.blockedRows > 0;
  });
  if (
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.status !== 200 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.productionReady !== false ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.indexStatus !== "node_public_source_fit_packet_handoff_index_ready_release_blocked" ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.indexMode !== "all_packet_review_handoff_navigation" ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.totalPackets !== 35 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.packetsWithHandoff !== 35 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.packetsWithoutHandoff !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.packetsWithInputCopyTemplate !== 35 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.packetsWithoutInputCopyTemplate !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.readyPackets !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.blockedPackets !== 35 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.totalReviewRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.readyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.blockedRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.missingFieldRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.realHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.firstBlockedPacketId !== "node-public-source-fit-batch-001-packet" ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.firstHandoffPacketId !== "node-public-source-fit-batch-001-packet" ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.firstPriorityRows) ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.firstPriorityRows.length !== 8 ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.packetRows) ||
    knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.packetRows.length !== 35 ||
    firstGeneratedPacketRowsReady !== true ||
    !knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.packetRows.slice(35).every((row) =>
      row.handoffStatus === "handoff_not_generated" &&
      row.progressStatus === "blocked_missing_real_reviewer_input" &&
      row.readyRows === 0 &&
      row.blockedRows > 0) ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.commands) ||
    !knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.commands.some((item) =>
      /check:knowledge-node-public-source-fit-review-packet-handoff-index/.test(item)) ||
    !/all 35 source-fit packets/i.test(knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(knowledgeNodePublicSourceFitReviewPacketHandoffIndex.data.boundary || "")
  ) {
    throw new Error("knowledge browser node public source-fit packet handoff index endpoint failed");
  }

  const knowledgeNodePublicSourceFitRealReviewerLaunchDashboard = await request("/api/knowledge-browser/knowledge-node-public-source-fit-real-reviewer-launch-dashboard");
  if (
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.status !== 200 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.productionReady !== false ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.launchStatus !== "source_fit_real_reviewer_launch_ready_blocked_on_real_input" ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.launchMode !== "first_packet_real_reviewer_execution_start" ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.reviewerCanStartNow !== true ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.packetHandoffCoverage !== "35/35" ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.packetHandoffsReady !== 35 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.totalPackets !== 35 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.packetsWithInputCopyTemplate !== 35 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.readyPackets !== 0 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.blockedPackets !== 35 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.totalReviewRows !== 1638 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.readyRows !== 0 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.blockedRows !== 1638 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.missingFieldRows !== 1638 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.realHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.startPacket?.packetId !== "node-public-source-fit-batch-001-packet" ||
    !/PACKET_001_INPUT_COPY_TEMPLATE/.test(knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.startPacket?.inputCopyPath || "") ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.startPacketReviewRows !== 60 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.startPacketReadyRows !== 0 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.startPacketBlockedRows !== 60 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.startPacket?.mergeMappedRows !== 60 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.startPacket?.mergeMissingTargetRows !== 0 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.startPacket?.mergeAllowedNow !== false ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.startPacket?.dryRunWrittenRows !== 0 ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.fieldPolicyRows) ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.fieldPolicyRows.length !== 6 ||
    !Array.isArray(knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.dayOneChecklist) ||
    knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.dayOneChecklist.length !== 8 ||
    !Array.isArray(knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.commands) ||
    !knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.commands.some((item) =>
      /validate:knowledge-node-public-source-fit-review-packet-input-copy-template/.test(item)) ||
    !knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.commands.some((item) =>
      /check:knowledge-node-public-source-fit-review-packet-handoff-index/.test(item)) ||
    !/all 60 rows/i.test(knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.boundary || "") ||
    !/all 35 source-fit packet handoffs/i.test(knowledgeNodePublicSourceFitRealReviewerLaunchDashboard.data.boundary || "")
  ) {
    throw new Error("knowledge browser node public source-fit real reviewer launch dashboard endpoint failed");
  }

  const knowledgeNodePublicSourceFitPacket001ReviewerWorkbench = await request("/api/knowledge-browser/knowledge-node-public-source-fit-packet-001-reviewer-workbench");
  const packet001WorkbenchRows = knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.rows || [];
  const packet001WorkbenchNodeRows = knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.nodeRows || [];
  if (
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.status !== 200 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.productionReady !== false ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.workbenchStatus !== "packet_001_reviewer_workbench_ready_blocked_on_real_input" ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.workbenchMode !== "readonly_packet_row_browser_for_real_source_fit_review" ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.packetId !== "node-public-source-fit-batch-001-packet" ||
    !/PACKET_001_INPUT_COPY_TEMPLATE/.test(knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.inputCopyPath || "") ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.nodeCount !== 10 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.reviewRows !== 60 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.readyRows !== 0 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.blockedRows !== 60 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.missingFieldRows !== 60 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.invalidDecisionRows !== 0 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.forbiddenHitRows !== 0 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.realHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.learnerCitationApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.copiedTextApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.mergeMappedRows !== 60 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.mergeMissingTargetRows !== 0 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.dryRunWrittenRows !== 0 ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.manualAuthorizationRequired !== true ||
    !Array.isArray(packet001WorkbenchNodeRows) ||
    packet001WorkbenchNodeRows.length !== 10 ||
    !packet001WorkbenchNodeRows.every((row) =>
      row.candidateRows === 6 &&
      row.readyRows === 0 &&
      row.blockedRows === 6 &&
      row.reviewStatus === "blocked_missing_real_reviewer_input") ||
    !Array.isArray(packet001WorkbenchRows) ||
    packet001WorkbenchRows.length !== 60 ||
    !packet001WorkbenchRows.every((row, index) =>
      row.rowIndex === index &&
      row.reviewId &&
      row.nodeId &&
      row.documentId &&
      row.sourceName &&
      row.url &&
      row.validationStatus === "blocked_missing_or_invalid_reviewer_input" &&
      row.reviewStatus === "blocked_missing_real_reviewer_input" &&
      row.realHumanInput === false &&
      row.learnerCitationApproved === false &&
      row.copiedTextApproved === false &&
      row.willWrite === false) ||
    !Array.isArray(knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.commands) ||
    !knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.commands.some((item) =>
      /check:knowledge-node-public-source-fit-packet-001-reviewer-workbench/.test(item)) ||
    !/readonly browser/i.test(knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(knowledgeNodePublicSourceFitPacket001ReviewerWorkbench.data.boundary || "")
  ) {
    throw new Error("knowledge browser node public source-fit packet 001 reviewer workbench endpoint failed");
  }

  const knowledgeNodePublicSourceFitReviewerWorkbenchIndex = await request("/api/knowledge-browser/knowledge-node-public-source-fit-reviewer-workbench-index");
  const reviewerWorkbenchIndexPacketRows = knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.packetRows || [];
  const reviewerWorkbenchIndexModuleRows = knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.moduleRows || [];
  if (
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.status !== 200 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.productionReady !== false ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.workbenchIndexStatus !== "source_fit_reviewer_workbench_index_ready_all_packets_blocked_on_real_input" ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.workbenchIndexMode !== "all_packet_readonly_review_navigation" ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.totalPackets !== 35 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.packetsWithHandoff !== 35 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.packetsWithInputCopyTemplate !== 35 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.packetsWithValidation !== 35 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.packetsWithDetailedRowBrowser !== 1 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.modules !== 12 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.totalReviewRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.readyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.blockedRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.missingFieldRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.realHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.learnerCitationApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.copiedTextApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.firstBlockedPacketId !== "node-public-source-fit-batch-001-packet" ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.manualAuthorizationRequired !== true ||
    !Array.isArray(reviewerWorkbenchIndexPacketRows) ||
    reviewerWorkbenchIndexPacketRows.length !== 35 ||
    !reviewerWorkbenchIndexPacketRows.every((row, index) =>
      row.packetNumber === String(index + 1).padStart(3, "0") &&
      row.packetId === `node-public-source-fit-batch-${String(index + 1).padStart(3, "0")}-packet` &&
      row.readyRows === 0 &&
      row.blockedRows === row.reviewRows &&
      row.missingFieldRows === row.reviewRows &&
      row.realHumanInputEntries === 0 &&
      row.reviewStatus === "blocked_missing_real_reviewer_input") ||
    reviewerWorkbenchIndexPacketRows[0]?.hasDetailedRowBrowser !== true ||
    !reviewerWorkbenchIndexPacketRows.slice(1).every((row) => row.hasDetailedRowBrowser === false) ||
    !Array.isArray(reviewerWorkbenchIndexModuleRows) ||
    reviewerWorkbenchIndexModuleRows.length !== 12 ||
    reviewerWorkbenchIndexModuleRows.reduce((sum, row) => sum + (row.packets || 0), 0) !== 35 ||
    reviewerWorkbenchIndexModuleRows.reduce((sum, row) => sum + (row.reviewRows || 0), 0) !== 1638 ||
    !reviewerWorkbenchIndexModuleRows.every((row) =>
      row.readyRows === 0 &&
      row.blockedRows === row.reviewRows &&
      row.realHumanInputEntries === 0 &&
      row.reviewStatus === "blocked_missing_real_reviewer_input") ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.commands) ||
    !knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.commands.some((item) =>
      /check:knowledge-node-public-source-fit-reviewer-workbench-index/.test(item)) ||
    !/readonly all-packet navigation/i.test(knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(knowledgeNodePublicSourceFitReviewerWorkbenchIndex.data.boundary || "")
  ) {
    throw new Error("knowledge browser node public source-fit reviewer workbench index endpoint failed");
  }

  const knowledgeNodePublicSourceFitReviewerRowBrowser = await request("/api/knowledge-browser/knowledge-node-public-source-fit-reviewer-row-browser");
  const reviewerRowBrowserRows = knowledgeNodePublicSourceFitReviewerRowBrowser.data.rows || [];
  const reviewerRowBrowserPacketRows = knowledgeNodePublicSourceFitReviewerRowBrowser.data.packetRows || [];
  const reviewerRowBrowserModuleRows = knowledgeNodePublicSourceFitReviewerRowBrowser.data.moduleRows || [];
  if (
    knowledgeNodePublicSourceFitReviewerRowBrowser.status !== 200 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.productionReady !== false ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.rowBrowserStatus !== "source_fit_reviewer_row_browser_ready_all_rows_blocked_on_real_input" ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.rowBrowserMode !== "all_packet_readonly_row_level_review_navigation" ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.totalPackets !== 35 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.modules !== 12 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.totalReviewRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.readyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.blockedRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.missingFieldRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.realHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.learnerCitationApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.copiedTextApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.rowsWithUrl !== 1638 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.wikipediaRows < 1000 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.officialRows < 200 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.openResearchRows < 200 ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewerRowBrowser.data.manualAuthorizationRequired !== true ||
    !Array.isArray(reviewerRowBrowserPacketRows) ||
    reviewerRowBrowserPacketRows.length !== 35 ||
    !reviewerRowBrowserPacketRows.every((row, index) =>
      row.packetNumber === String(index + 1).padStart(3, "0") &&
      row.readyRows === 0 &&
      row.blockedRows === row.reviewRows &&
      row.reviewStatus === "blocked_missing_real_reviewer_input") ||
    !Array.isArray(reviewerRowBrowserModuleRows) ||
    reviewerRowBrowserModuleRows.length !== 12 ||
    reviewerRowBrowserModuleRows.reduce((sum, row) => sum + (row.reviewRows || 0), 0) !== 1638 ||
    !reviewerRowBrowserModuleRows.every((row) =>
      row.readyRows === 0 &&
      row.blockedRows === row.reviewRows &&
      row.reviewStatus === "blocked_missing_real_reviewer_input") ||
    !Array.isArray(reviewerRowBrowserRows) ||
    reviewerRowBrowserRows.length !== 1638 ||
    !reviewerRowBrowserRows.every((row, index) =>
      row.globalRowIndex === index &&
      row.packetNumber &&
      row.reviewId &&
      row.nodeId &&
      row.documentId &&
      row.sourceName &&
      /^https?:\/\//.test(row.url || "") &&
      row.editableFieldPaths?.reviewerDecision?.startsWith("/rows/") &&
      row.editableFieldPaths?.sourceFitNotes?.startsWith("/rows/") &&
      row.editableFieldPaths?.citationUse?.startsWith("/rows/") &&
      row.editableFieldPaths?.reviewerName?.startsWith("/rows/") &&
      row.editableFieldPaths?.reviewedAt?.startsWith("/rows/") &&
      row.validationStatus === "blocked_missing_or_invalid_reviewer_input" &&
      row.reviewStatus === "blocked_missing_real_reviewer_input" &&
      row.realHumanInput === false &&
      row.learnerCitationApproved === false &&
      row.copiedTextApproved === false) ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewerRowBrowser.data.commands) ||
    !knowledgeNodePublicSourceFitReviewerRowBrowser.data.commands.some((item) =>
      /check:knowledge-node-public-source-fit-reviewer-row-browser/.test(item)) ||
    !/readonly all-row navigation/i.test(knowledgeNodePublicSourceFitReviewerRowBrowser.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(knowledgeNodePublicSourceFitReviewerRowBrowser.data.boundary || "")
  ) {
    throw new Error("knowledge browser node public source-fit reviewer row browser endpoint failed");
  }

  const packet001ReviewerRowBrowser = await request("/api/knowledge-browser/knowledge-node-public-source-fit-reviewer-row-browser?packet=001&limit=7");
  if (
    packet001ReviewerRowBrowser.status !== 200 ||
    packet001ReviewerRowBrowser.data.educationOnly !== true ||
    packet001ReviewerRowBrowser.data.productionReady !== false ||
    packet001ReviewerRowBrowser.data.rowQuery?.packet !== "001" ||
    packet001ReviewerRowBrowser.data.rowQuery?.limit !== 7 ||
    packet001ReviewerRowBrowser.data.rowQuery?.offset !== 0 ||
    packet001ReviewerRowBrowser.data.rowQuery?.returnedRows !== 7 ||
    packet001ReviewerRowBrowser.data.rowQuery?.totalFilteredRows !== 60 ||
    packet001ReviewerRowBrowser.data.rowQuery?.hasMoreRows !== true ||
    !Array.isArray(packet001ReviewerRowBrowser.data.rows) ||
    packet001ReviewerRowBrowser.data.rows.length !== 7 ||
    !packet001ReviewerRowBrowser.data.rows.every((row) =>
      row.packetNumber === "001" &&
      row.packetId === "node-public-source-fit-batch-001-packet" &&
      row.reviewStatus === "blocked_missing_real_reviewer_input" &&
      row.realHumanInput === false)
  ) {
    throw new Error("knowledge browser node public source-fit reviewer row browser packet pagination failed");
  }

  const wikipediaReviewerRowBrowser = await request("/api/knowledge-browser/knowledge-node-public-source-fit-reviewer-row-browser?family=Wikipedia&limit=5");
  if (
    wikipediaReviewerRowBrowser.status !== 200 ||
    wikipediaReviewerRowBrowser.data.rowQuery?.family !== "wikipedia" ||
    wikipediaReviewerRowBrowser.data.rowQuery?.limit !== 5 ||
    wikipediaReviewerRowBrowser.data.rowQuery?.returnedRows !== 5 ||
    wikipediaReviewerRowBrowser.data.rowQuery?.totalFilteredRows < 1000 ||
    !Array.isArray(wikipediaReviewerRowBrowser.data.rows) ||
    wikipediaReviewerRowBrowser.data.rows.length !== 5 ||
    !wikipediaReviewerRowBrowser.data.rows.every((row) =>
      row.family === "Wikipedia" &&
      row.validationStatus === "blocked_missing_or_invalid_reviewer_input" &&
      row.learnerCitationApproved === false)
  ) {
    throw new Error("knowledge browser node public source-fit reviewer row browser family filter failed");
  }

  const statusOffsetReviewerRowBrowser = await request("/api/knowledge-browser/knowledge-node-public-source-fit-reviewer-row-browser?status=blocked_missing_or_invalid_reviewer_input&offset=5&limit=3");
  if (
    statusOffsetReviewerRowBrowser.status !== 200 ||
    statusOffsetReviewerRowBrowser.data.rowQuery?.status !== "blocked_missing_or_invalid_reviewer_input" ||
    statusOffsetReviewerRowBrowser.data.rowQuery?.offset !== 5 ||
    statusOffsetReviewerRowBrowser.data.rowQuery?.limit !== 3 ||
    statusOffsetReviewerRowBrowser.data.rowQuery?.returnedRows !== 3 ||
    statusOffsetReviewerRowBrowser.data.rowQuery?.totalFilteredRows !== 1638 ||
    !Array.isArray(statusOffsetReviewerRowBrowser.data.rows) ||
    statusOffsetReviewerRowBrowser.data.rows[0]?.globalRowIndex !== 5 ||
    !statusOffsetReviewerRowBrowser.data.rows.every((row) =>
      row.validationStatus === "blocked_missing_or_invalid_reviewer_input" &&
      row.realHumanInput === false)
  ) {
    throw new Error("knowledge browser node public source-fit reviewer row browser status pagination failed");
  }

  const textReviewerRowBrowser = await request("/api/knowledge-browser/knowledge-node-public-source-fit-reviewer-row-browser?q=Candlestick&limit=6");
  if (
    textReviewerRowBrowser.status !== 200 ||
    textReviewerRowBrowser.data.rowQuery?.q !== "candlestick" ||
    textReviewerRowBrowser.data.rowQuery?.returnedRows !== 6 ||
    textReviewerRowBrowser.data.rowQuery?.totalFilteredRows < 10 ||
    !Array.isArray(textReviewerRowBrowser.data.rows) ||
    textReviewerRowBrowser.data.rows.length !== 6 ||
    !textReviewerRowBrowser.data.rows.every((row) =>
      `${row.reviewId} ${row.nodeId} ${row.documentId} ${row.sourceName} ${row.url} ${row.family} ${row.module} ${row.title} ${row.topic}`
        .toLowerCase()
        .includes("candlestick") &&
      row.copiedTextApproved === false)
  ) {
    throw new Error("knowledge browser node public source-fit reviewer row browser text filter failed");
  }

  const reviewerRowDetail = await request("/api/knowledge-browser/knowledge-node-public-source-fit-reviewer-row-detail?reviewId=knv2_0003%3A%3Acorpus_1584");
  if (
    reviewerRowDetail.status !== 200 ||
    reviewerRowDetail.data.educationOnly !== true ||
    reviewerRowDetail.data.productionReady !== false ||
    reviewerRowDetail.data.approvalStatus !== "not_approved" ||
    reviewerRowDetail.data.learnerFacingRelease !== false ||
    reviewerRowDetail.data.detailStatus !== "source_fit_reviewer_row_detail_ready_blocked_on_real_input" ||
    reviewerRowDetail.data.detailMode !== "single_row_readonly_source_fit_review_context" ||
    reviewerRowDetail.data.reviewId !== "knv2_0003::corpus_1584" ||
    reviewerRowDetail.data.row?.reviewId !== "knv2_0003::corpus_1584" ||
    reviewerRowDetail.data.row?.packetNumber !== "001" ||
    reviewerRowDetail.data.row?.nodeId !== "knv2_0003" ||
    !/^https?:\/\//.test(reviewerRowDetail.data.row?.url || "") ||
    reviewerRowDetail.data.editableFieldPaths?.reviewerDecision !== "/rows/0/reviewerDecision" ||
    !Array.isArray(reviewerRowDetail.data.missingFields) ||
    reviewerRowDetail.data.missingFields.length !== 5 ||
    reviewerRowDetail.data.packetRow?.packetNumber !== "001" ||
    reviewerRowDetail.data.moduleRow?.module !== "K线与价格行为" ||
    !Array.isArray(reviewerRowDetail.data.sameNodeRows) ||
    reviewerRowDetail.data.sameNodeRows.length !== 6 ||
    !reviewerRowDetail.data.sameNodeRows.every((row) => row.nodeId === "knv2_0003") ||
    !Array.isArray(reviewerRowDetail.data.nearbyPacketRows) ||
    reviewerRowDetail.data.nearbyPacketRows.length < 4 ||
    reviewerRowDetail.data.writeAllowedNow !== false ||
    reviewerRowDetail.data.manualAuthorizationRequired !== true ||
    !/single row remains blocked/i.test(reviewerRowDetail.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(reviewerRowDetail.data.boundary || "")
  ) {
    throw new Error("knowledge browser node public source-fit reviewer row detail endpoint failed");
  }

  const missingReviewerRowDetail = await request("/api/knowledge-browser/knowledge-node-public-source-fit-reviewer-row-detail");
  if (
    missingReviewerRowDetail.status !== 400 ||
    missingReviewerRowDetail.data.educationOnly !== true ||
    missingReviewerRowDetail.data.productionReady !== false ||
    missingReviewerRowDetail.data.detailStatus !== "source_fit_reviewer_row_detail_missing_review_id" ||
    !/reviewId is required/i.test(missingReviewerRowDetail.data.error || "")
  ) {
    throw new Error("knowledge browser node public source-fit reviewer row detail missing reviewId guard failed");
  }

  const unknownReviewerRowDetail = await request("/api/knowledge-browser/knowledge-node-public-source-fit-reviewer-row-detail?reviewId=missing-review-id");
  if (
    unknownReviewerRowDetail.status !== 404 ||
    unknownReviewerRowDetail.data.educationOnly !== true ||
    unknownReviewerRowDetail.data.productionReady !== false ||
    unknownReviewerRowDetail.data.detailStatus !== "source_fit_reviewer_row_detail_not_found" ||
    unknownReviewerRowDetail.data.reviewId !== "missing-review-id" ||
    !/reviewId not found/i.test(unknownReviewerRowDetail.data.error || "")
  ) {
    throw new Error("knowledge browser node public source-fit reviewer row detail unknown reviewId guard failed");
  }

  const knowledgeNodePublicSourceFitReviewProgressMatrix = await request("/api/knowledge-browser/knowledge-node-public-source-fit-review-progress-matrix");
  if (
    knowledgeNodePublicSourceFitReviewProgressMatrix.status !== 200 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.educationOnly !== true ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.productionReady !== false ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.approvalStatus !== "not_approved" ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.learnerFacingRelease !== false ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.matrixStatus !== "node_public_source_fit_review_progress_matrix_ready_release_blocked" ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.matrixMode !== "batch_and_module_progress_from_real_review_validation" ||
    !/BATCH_PACKETS/.test(knowledgeNodePublicSourceFitReviewProgressMatrix.data.sourcePacketsPath || "") ||
    !/INPUT_VALIDATION/.test(knowledgeNodePublicSourceFitReviewProgressMatrix.data.sourceValidationPath || "") ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.modules !== 12 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.totalPackets !== 35 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.totalReviewRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.validationStatus !== "blocked_missing_real_reviewer_source_fit_input" ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.readyRows !== 0 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.blockedRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.missingFieldRows !== 1638 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.invalidDecisionRows !== 0 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.forbiddenHitRows !== 0 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.realHumanInputEntries !== 0 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.learnerCitationApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.copiedTextApprovedRows !== 0 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.readyPackets !== 0 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.blockedPackets !== 35 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.readyModules !== 0 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.blockedModules !== 12 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.overallProgressPercent !== 0 ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.firstBlockedPacketId !== "node-public-source-fit-batch-001-packet" ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.writeAllowedNow !== false ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.manualAuthorizationRequired !== true ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewProgressMatrix.data.firstPriorityBlockedPackets) ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.firstPriorityBlockedPackets.length !== 6 ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewProgressMatrix.data.moduleRows) ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.moduleRows.length !== 12 ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewProgressMatrix.data.packetRows) ||
    knowledgeNodePublicSourceFitReviewProgressMatrix.data.packetRows.length < 6 ||
    !knowledgeNodePublicSourceFitReviewProgressMatrix.data.packetRows.every((row) =>
      row.packetId &&
      row.validationRows === row.reviewRows &&
      row.readyRows === 0 &&
      row.blockedRows === row.reviewRows &&
      row.progressStatus === "blocked_missing_real_reviewer_input") ||
    !Array.isArray(knowledgeNodePublicSourceFitReviewProgressMatrix.data.commands) ||
    !knowledgeNodePublicSourceFitReviewProgressMatrix.data.commands.some((item) =>
      /check:knowledge-node-public-source-fit-review-progress-matrix/.test(item)) ||
    !/validation output only/i.test(knowledgeNodePublicSourceFitReviewProgressMatrix.data.completionRule || "") ||
    !/does not infer missing reviewer decisions/i.test(knowledgeNodePublicSourceFitReviewProgressMatrix.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(knowledgeNodePublicSourceFitReviewProgressMatrix.data.boundary || "") ||
    !/learner-facing citations/i.test(knowledgeNodePublicSourceFitReviewProgressMatrix.data.boundary || "")
  ) {
    throw new Error("knowledge browser node public source-fit review progress matrix endpoint failed");
  }

  const lowExtractionVisualReview = await request("/api/knowledge-browser/low-extraction-visual-review");
  if (
    lowExtractionVisualReview.status !== 200 ||
    lowExtractionVisualReview.data.educationOnly !== true ||
    lowExtractionVisualReview.data.productionReady !== false ||
    lowExtractionVisualReview.data.approvalStatus !== "not_approved" ||
    lowExtractionVisualReview.data.learnerFacingRelease !== false ||
    lowExtractionVisualReview.data.packetStatus !== "visual_review_packet_ready" ||
    lowExtractionVisualReview.data.lowExtractionDocs !== 5 ||
    lowExtractionVisualReview.data.totalPages < 20 ||
    lowExtractionVisualReview.data.previewPages !== lowExtractionVisualReview.data.totalPages ||
    !Array.isArray(lowExtractionVisualReview.data.cards) ||
    lowExtractionVisualReview.data.cards.length !== 5 ||
    !lowExtractionVisualReview.data.cards.every((card) =>
      card.visualReviewStatus === "preview_generated_manual_ocr_or_visual_review_required" &&
      card.firstPreviewPath &&
      Array.isArray(card.reviewerChecklist) &&
      card.reviewerChecklist.length >= 4)
  ) {
    throw new Error("knowledge browser low extraction visual review endpoint failed");
  }

  const lowExtractionHighResReview = await request("/api/knowledge-browser/low-extraction-high-res-review");
  if (
    lowExtractionHighResReview.status !== 200 ||
    lowExtractionHighResReview.data.educationOnly !== true ||
    lowExtractionHighResReview.data.productionReady !== false ||
    lowExtractionHighResReview.data.approvalStatus !== "not_approved" ||
    lowExtractionHighResReview.data.learnerFacingRelease !== false ||
    lowExtractionHighResReview.data.packetStatus !== "high_res_visual_review_packet_ready" ||
    lowExtractionHighResReview.data.screenshotScale < 1.2 ||
    lowExtractionHighResReview.data.lowExtractionDocs !== 5 ||
    lowExtractionHighResReview.data.totalPages !== 22 ||
    lowExtractionHighResReview.data.highResPreviewPages !== 22 ||
    lowExtractionHighResReview.data.manualTranscriptionHighResPages !== 19 ||
    lowExtractionHighResReview.data.sourceReplacementHighResPages !== 3 ||
    lowExtractionHighResReview.data.minHighResPreviewBytes <= 1000 ||
    !Array.isArray(lowExtractionHighResReview.data.documentRows) ||
    lowExtractionHighResReview.data.documentRows.length !== 5 ||
    !Array.isArray(lowExtractionHighResReview.data.pageRows) ||
    lowExtractionHighResReview.data.pageRows.length < 8 ||
    !lowExtractionHighResReview.data.pageRows.every((row) =>
      row.highResPreviewPath &&
      row.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/") &&
      row.highResPreviewBytes > 1000 &&
      row.width > 450 &&
      row.height > 250 &&
      row.transcriptionStatus === "not_started" &&
      ["manual_transcription_evidence_only", "source_replacement_decision_evidence_only"].includes(row.reviewerUse) &&
      row.nextGate) ||
    !/reviewer-only visual evidence/i.test(lowExtractionHighResReview.data.boundary || "") ||
    !/do not perform ocr/i.test(lowExtractionHighResReview.data.boundary || "") ||
    !/approve learner-facing release/i.test(lowExtractionHighResReview.data.boundary || "")
  ) {
    throw new Error("knowledge browser low extraction high-res review endpoint failed");
  }

  const highResTranscriptionCandidates = await request("/api/knowledge-browser/local-course-high-res-transcription-candidates");
  if (
    highResTranscriptionCandidates.status !== 200 ||
    highResTranscriptionCandidates.data.educationOnly !== true ||
    highResTranscriptionCandidates.data.productionReady !== false ||
    highResTranscriptionCandidates.data.approvalStatus !== "not_approved" ||
    highResTranscriptionCandidates.data.learnerFacingRelease !== false ||
    highResTranscriptionCandidates.data.indexStatus !== "machine_assisted_candidate_index_ready_for_human_review" ||
    highResTranscriptionCandidates.data.batchCount !== 5 ||
    highResTranscriptionCandidates.data.candidatePages !== 19 ||
    highResTranscriptionCandidates.data.acceptedForP0OverlayPages !== 0 ||
    highResTranscriptionCandidates.data.blockedUntilHumanReviewedPages !== 19 ||
    !Array.isArray(highResTranscriptionCandidates.data.topRiskTermFlags) ||
    highResTranscriptionCandidates.data.topRiskTermFlags.length < 8 ||
    !Array.isArray(highResTranscriptionCandidates.data.documentIds) ||
    !highResTranscriptionCandidates.data.documentIds.includes("corpus_1313") ||
    !highResTranscriptionCandidates.data.documentIds.includes("corpus_1580") ||
    !Array.isArray(highResTranscriptionCandidates.data.candidatePagesList) ||
    highResTranscriptionCandidates.data.candidatePagesList.length !== 8 ||
    !highResTranscriptionCandidates.data.candidatePagesList.every((page) =>
      page.candidateStatus === "machine_assisted_visual_candidate_needs_human_review" &&
      page.acceptedForP0Overlay === false &&
      page.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/") &&
      Array.isArray(page.riskTermFlags) &&
      page.riskTermFlags.length >= 2 &&
      page.nextGate === "human_review_before_p0_overlay_apply") ||
    !/reviewer-only working material/i.test(highResTranscriptionCandidates.data.boundary || "") ||
    !/machine-assisted reviewer work queue/i.test(highResTranscriptionCandidates.data.completionRule || "") ||
    !/approve learner-facing release/i.test(highResTranscriptionCandidates.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course high-res transcription candidates endpoint failed");
  }

  const p0CandidateReviewAssistMap = await request("/api/knowledge-browser/local-course-p0-candidate-review-assist-map");
  if (
    p0CandidateReviewAssistMap.status !== 200 ||
    p0CandidateReviewAssistMap.data.educationOnly !== true ||
    p0CandidateReviewAssistMap.data.productionReady !== false ||
    p0CandidateReviewAssistMap.data.approvalStatus !== "not_approved" ||
    p0CandidateReviewAssistMap.data.learnerFacingRelease !== false ||
    p0CandidateReviewAssistMap.data.assistMapStatus !== "review_assist_map_ready_not_applied" ||
    p0CandidateReviewAssistMap.data.totalP0Tasks !== 22 ||
    p0CandidateReviewAssistMap.data.manualTranscriptionTasks !== 19 ||
    p0CandidateReviewAssistMap.data.sourceReplacementTasks !== 3 ||
    p0CandidateReviewAssistMap.data.manualTasksWithCandidate !== 19 ||
    p0CandidateReviewAssistMap.data.manualTasksMissingCandidate !== 0 ||
    p0CandidateReviewAssistMap.data.sourceReplacementTasksWithoutCandidate !== 3 ||
    p0CandidateReviewAssistMap.data.acceptedForP0OverlayTasks !== 0 ||
    p0CandidateReviewAssistMap.data.blockedUntilHumanReviewedTasks !== 22 ||
    p0CandidateReviewAssistMap.data.candidatePagesIndexed !== 19 ||
    !Array.isArray(p0CandidateReviewAssistMap.data.topRiskTermFlags) ||
    p0CandidateReviewAssistMap.data.topRiskTermFlags.length < 8 ||
    !Array.isArray(p0CandidateReviewAssistMap.data.taskRows) ||
    p0CandidateReviewAssistMap.data.taskRows.length !== 8 ||
    !p0CandidateReviewAssistMap.data.taskRows.every((row) =>
      row.category === "manual_transcription" &&
      row.matchStatus === "candidate_available_for_human_review" &&
      row.acceptedForP0Overlay === false &&
      row.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/") &&
      Array.isArray(row.riskTermFlags) &&
      row.riskTermFlags.length >= 2 &&
      row.nextGate === "human_verify_candidate_then_fill_p0_review_input") ||
    !/reviewer-only working material/i.test(p0CandidateReviewAssistMap.data.boundary || "") ||
    !/reviewer-assist lookup/i.test(p0CandidateReviewAssistMap.data.completionRule || "") ||
    !/fill reviewer fields/i.test(p0CandidateReviewAssistMap.data.boundary || "") ||
    !/approve learner-facing release/i.test(p0CandidateReviewAssistMap.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 candidate review assist map endpoint failed");
  }

  const p0ReviewInputDryRunSample = await request("/api/knowledge-browser/local-course-p0-review-input-dry-run-sample");
  if (
    p0ReviewInputDryRunSample.status !== 200 ||
    p0ReviewInputDryRunSample.data.educationOnly !== true ||
    p0ReviewInputDryRunSample.data.productionReady !== false ||
    p0ReviewInputDryRunSample.data.approvalStatus !== "not_approved" ||
    p0ReviewInputDryRunSample.data.learnerFacingRelease !== false ||
    p0ReviewInputDryRunSample.data.fixtureOnly !== true ||
    p0ReviewInputDryRunSample.data.templateStatus !== "candidate_review_dry_run_fixture" ||
    p0ReviewInputDryRunSample.data.totalEntries !== 22 ||
    p0ReviewInputDryRunSample.data.filledEntries !== 2 ||
    p0ReviewInputDryRunSample.data.readyForValidationEntries !== 2 ||
    p0ReviewInputDryRunSample.data.validationReadyEntries !== 2 ||
    p0ReviewInputDryRunSample.data.validationBlockedEntries !== 20 ||
    p0ReviewInputDryRunSample.data.forbiddenHitEntries !== 0 ||
    p0ReviewInputDryRunSample.data.applyMode !== "dry_run" ||
    p0ReviewInputDryRunSample.data.readyToApplyEntries !== 2 ||
    p0ReviewInputDryRunSample.data.applyBlockedEntries !== 20 ||
    p0ReviewInputDryRunSample.data.writtenEntries !== 0 ||
    !Array.isArray(p0ReviewInputDryRunSample.data.sampleRows) ||
    p0ReviewInputDryRunSample.data.sampleRows.length !== 2 ||
    !p0ReviewInputDryRunSample.data.sampleRows.every((row) =>
      row.inputStatus === "candidate_review_fixture_ready" &&
      row.matchStatus === "candidate_available_for_human_review" &&
      row.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/") &&
      /not a human transcription/i.test(row.fixtureOnlyReason || "")) ||
    !/fixture for pipeline validation only/i.test(p0ReviewInputDryRunSample.data.boundary || "") ||
    !/must not be written/i.test(p0ReviewInputDryRunSample.data.boundary || "") ||
    !/does not approve learner-facing release/i.test(p0ReviewInputDryRunSample.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 review input dry-run sample endpoint failed");
  }

  const p0HumanReviewNoteTemplate = await request("/api/knowledge-browser/local-course-p0-human-review-note-template");
  if (
    p0HumanReviewNoteTemplate.status !== 200 ||
    p0HumanReviewNoteTemplate.data.educationOnly !== true ||
    p0HumanReviewNoteTemplate.data.productionReady !== false ||
    p0HumanReviewNoteTemplate.data.approvalStatus !== "not_approved" ||
    p0HumanReviewNoteTemplate.data.learnerFacingRelease !== false ||
    p0HumanReviewNoteTemplate.data.templateStatus !== "blank_human_review_note_template_ready" ||
    p0HumanReviewNoteTemplate.data.totalP0Tasks !== 22 ||
    p0HumanReviewNoteTemplate.data.manualReviewCards !== 19 ||
    p0HumanReviewNoteTemplate.data.sourceReplacementReviewCards !== 3 ||
    p0HumanReviewNoteTemplate.data.filledNoteCards !== 0 ||
    p0HumanReviewNoteTemplate.data.readyForValidationCards !== 0 ||
    p0HumanReviewNoteTemplate.data.acceptedForOverlayCards !== 0 ||
    p0HumanReviewNoteTemplate.data.manualCardsWithCandidate !== 19 ||
    p0HumanReviewNoteTemplate.data.manualCardsMissingCandidate !== 0 ||
    !Array.isArray(p0HumanReviewNoteTemplate.data.requiredManualFields) ||
    !p0HumanReviewNoteTemplate.data.requiredManualFields.includes("riskRewriteNotes") ||
    !Array.isArray(p0HumanReviewNoteTemplate.data.requiredReplacementFields) ||
    !p0HumanReviewNoteTemplate.data.requiredReplacementFields.includes("replacementDecision") ||
    !Array.isArray(p0HumanReviewNoteTemplate.data.noteCards) ||
    p0HumanReviewNoteTemplate.data.noteCards.length !== 8 ||
    !p0HumanReviewNoteTemplate.data.noteCards.every((card) =>
      card.category === "manual_transcription" &&
      card.noteStatus === "blank_human_reviewer_note" &&
      card.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/") &&
      card.requiredFieldCount >= 10 &&
      Array.isArray(card.riskRewriteChecklist) &&
      card.riskRewriteChecklist.length >= 2 &&
      card.nextGate === "human_fill_review_input_then_validate_apply_dry_run") ||
    !/blank reviewer scaffolding/i.test(p0HumanReviewNoteTemplate.data.boundary || "") ||
    !/does not perform OCR/i.test(p0HumanReviewNoteTemplate.data.boundary || "") ||
    !/approve learner-facing release/i.test(p0HumanReviewNoteTemplate.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 human review note template endpoint failed");
  }

  const p0HumanFillPack01 = await request("/api/knowledge-browser/local-course-p0-human-fill-pack-01");
  if (
    p0HumanFillPack01.status !== 200 ||
    p0HumanFillPack01.data.educationOnly !== true ||
    p0HumanFillPack01.data.productionReady !== false ||
    p0HumanFillPack01.data.approvalStatus !== "not_approved" ||
    p0HumanFillPack01.data.learnerFacingRelease !== false ||
    p0HumanFillPack01.data.packId !== "local_course_p0_human_fill_pack_01" ||
    p0HumanFillPack01.data.packStatus !== "blank_human_fill_pack_ready" ||
    p0HumanFillPack01.data.totalPackCards !== 4 ||
    p0HumanFillPack01.data.manualFillCards !== 4 ||
    p0HumanFillPack01.data.filledCards !== 0 ||
    p0HumanFillPack01.data.readyForValidationCards !== 0 ||
    p0HumanFillPack01.data.acceptedForOverlayCards !== 0 ||
    !Array.isArray(p0HumanFillPack01.data.targetTaskIds) ||
    p0HumanFillPack01.data.targetTaskIds.length !== 4 ||
    !Array.isArray(p0HumanFillPack01.data.targetDocumentIds) ||
    !p0HumanFillPack01.data.targetDocumentIds.includes("corpus_1580") ||
    !Array.isArray(p0HumanFillPack01.data.targetPageNumbers) ||
    ![1, 2, 3, 4].every((page) => p0HumanFillPack01.data.targetPageNumbers.includes(page)) ||
    !Array.isArray(p0HumanFillPack01.data.packCards) ||
    p0HumanFillPack01.data.packCards.length !== 4 ||
    !p0HumanFillPack01.data.packCards.every((card) =>
      card.category === "manual_transcription" &&
      card.documentId === "corpus_1580" &&
      card.fillStatus === "blank_ready_for_human_fill" &&
      card.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/") &&
      card.requiredFieldCount >= 10 &&
      Array.isArray(card.qualityLintRules) &&
      card.qualityLintRules.some((rule) => /not copied from the machine candidate/i.test(rule)) &&
      card.nextGate === "human_fill_pack_then_validate_p0_review_input_copy") ||
    !/blank reviewer work material/i.test(p0HumanFillPack01.data.boundary || "") ||
    !/does not perform OCR/i.test(p0HumanFillPack01.data.boundary || "") ||
    !/approve learner-facing release/i.test(p0HumanFillPack01.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 human fill pack 01 endpoint failed");
  }

  const p0HumanFillPack01InputCopy = await request("/api/knowledge-browser/local-course-p0-human-fill-pack-01-input-copy");
  if (
    p0HumanFillPack01InputCopy.status !== 200 ||
    p0HumanFillPack01InputCopy.data.educationOnly !== true ||
    p0HumanFillPack01InputCopy.data.productionReady !== false ||
    p0HumanFillPack01InputCopy.data.approvalStatus !== "not_approved" ||
    p0HumanFillPack01InputCopy.data.learnerFacingRelease !== false ||
    p0HumanFillPack01InputCopy.data.fixtureOnly !== false ||
    p0HumanFillPack01InputCopy.data.templateStatus !== "pack_01_input_copy_blank" ||
    p0HumanFillPack01InputCopy.data.packId !== "local_course_p0_human_fill_pack_01" ||
    p0HumanFillPack01InputCopy.data.totalEntries !== 4 ||
    p0HumanFillPack01InputCopy.data.manualTranscriptionEntries !== 4 ||
    p0HumanFillPack01InputCopy.data.sourceReplacementEntries !== 0 ||
    p0HumanFillPack01InputCopy.data.filledEntries !== 0 ||
    p0HumanFillPack01InputCopy.data.readyForValidationEntries !== 0 ||
    p0HumanFillPack01InputCopy.data.validationReadyEntries !== 0 ||
    p0HumanFillPack01InputCopy.data.validationBlockedEntries !== 4 ||
    p0HumanFillPack01InputCopy.data.forbiddenHitEntries !== 0 ||
    !Array.isArray(p0HumanFillPack01InputCopy.data.inputEntries) ||
    p0HumanFillPack01InputCopy.data.inputEntries.length !== 4 ||
    !p0HumanFillPack01InputCopy.data.inputEntries.every((entry) =>
      entry.category === "manual_transcription" &&
      entry.documentId === "corpus_1580" &&
      entry.inputStatus === "human_fill_copy_blank" &&
      entry.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/") &&
      Array.isArray(entry.riskTermFlags) &&
      entry.riskTermFlags.length >= 4 &&
      Array.isArray(entry.missingFields) &&
      entry.missingFields.includes("humanTranscription") &&
      entry.nextGate === "validate_pack_01_input_then_apply_dry_run_only") ||
    !/blank reviewer input material/i.test(p0HumanFillPack01InputCopy.data.boundary || "") ||
    !/does not perform OCR/i.test(p0HumanFillPack01InputCopy.data.boundary || "") ||
    !/approve learner-facing release/i.test(p0HumanFillPack01InputCopy.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 human fill pack 01 input copy endpoint failed");
  }

  const p0HumanReviewBundle = await request("/api/knowledge-browser/local-course-p0-human-review-bundle");
  if (
    p0HumanReviewBundle.status !== 200 ||
    p0HumanReviewBundle.data.educationOnly !== true ||
    p0HumanReviewBundle.data.productionReady !== false ||
    p0HumanReviewBundle.data.approvalStatus !== "not_approved" ||
    p0HumanReviewBundle.data.learnerFacingRelease !== false ||
    p0HumanReviewBundle.data.bundleStatus !== "p0_human_review_bundle_ready_not_applied" ||
    p0HumanReviewBundle.data.manualPackCount !== 5 ||
    p0HumanReviewBundle.data.sourceReplacementPackCount !== 1 ||
    p0HumanReviewBundle.data.totalPackRows !== 6 ||
    p0HumanReviewBundle.data.manualTranscriptionEntries !== 19 ||
    p0HumanReviewBundle.data.sourceReplacementEntries !== 3 ||
    p0HumanReviewBundle.data.totalReviewEntries !== 22 ||
    p0HumanReviewBundle.data.filledEntries !== 0 ||
    p0HumanReviewBundle.data.validationReadyEntries !== 0 ||
    p0HumanReviewBundle.data.validationBlockedEntries !== 22 ||
    p0HumanReviewBundle.data.acceptedForOverlayEntries !== 0 ||
    p0HumanReviewBundle.data.positiveFixtureReadyEntries !== 22 ||
    p0HumanReviewBundle.data.fixtureOnlyReadyEntries !== 22 ||
    p0HumanReviewBundle.data.fixtureWrittenEntries !== 0 ||
    p0HumanReviewBundle.data.realHumanInputEntries !== 0 ||
    p0HumanReviewBundle.data.writeAllowedNow !== false ||
    p0HumanReviewBundle.data.approvalGatePassed !== false ||
    p0HumanReviewBundle.data.humanApprovalRequired !== true ||
    p0HumanReviewBundle.data.realReviewerInputRequired !== true ||
    !Array.isArray(p0HumanReviewBundle.data.packRows) ||
    p0HumanReviewBundle.data.packRows.length !== 6 ||
    !p0HumanReviewBundle.data.packRows.filter((row) => row.category === "manual_transcription").every((row) =>
      row.packStatus === "blank_human_fill_pack_ready" &&
      row.totalInputEntries >= 3 &&
      row.validation?.readyEntries === 0 &&
      row.validation?.blockedEntries === row.totalInputEntries &&
      row.positiveFixture?.fixtureOnly === true) ||
    !p0HumanReviewBundle.data.packRows.some((row) =>
      row.category === "source_replacement" &&
      row.packStatus === "blank_source_replacement_review_pack_ready" &&
      row.totalInputEntries === 3 &&
      row.validation?.blockedEntries === 3 &&
      row.positiveFixture?.fixtureOnly === true) ||
    !/does not prove human review completion/i.test(p0HumanReviewBundle.data.completionRule || "") ||
    !/does not perform OCR/i.test(p0HumanReviewBundle.data.boundary || "") ||
    !/approve learner-facing release/i.test(p0HumanReviewBundle.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 human review bundle endpoint failed");
  }

  const p0HumanReviewBundleInputCopy = await request("/api/knowledge-browser/local-course-p0-human-review-bundle-input-copy");
  if (
    p0HumanReviewBundleInputCopy.status !== 200 ||
    p0HumanReviewBundleInputCopy.data.educationOnly !== true ||
    p0HumanReviewBundleInputCopy.data.productionReady !== false ||
    p0HumanReviewBundleInputCopy.data.approvalStatus !== "not_approved" ||
    p0HumanReviewBundleInputCopy.data.learnerFacingRelease !== false ||
    p0HumanReviewBundleInputCopy.data.fixtureOnly !== false ||
    p0HumanReviewBundleInputCopy.data.templateStatus !== "p0_human_review_bundle_input_copy_blank" ||
    p0HumanReviewBundleInputCopy.data.validationStatus !== "blocked_missing_reviewer_input" ||
    p0HumanReviewBundleInputCopy.data.totalEntries !== 22 ||
    p0HumanReviewBundleInputCopy.data.manualTranscriptionEntries !== 19 ||
    p0HumanReviewBundleInputCopy.data.sourceReplacementEntries !== 3 ||
    p0HumanReviewBundleInputCopy.data.filledEntries !== 0 ||
    p0HumanReviewBundleInputCopy.data.readyForValidationEntries !== 0 ||
    p0HumanReviewBundleInputCopy.data.validationReadyEntries !== 0 ||
    p0HumanReviewBundleInputCopy.data.validationBlockedEntries !== 22 ||
    p0HumanReviewBundleInputCopy.data.forbiddenHitEntries !== 0 ||
    !Array.isArray(p0HumanReviewBundleInputCopy.data.sourceTemplatePaths) ||
    p0HumanReviewBundleInputCopy.data.sourceTemplatePaths.length !== 6 ||
    !Array.isArray(p0HumanReviewBundleInputCopy.data.inputEntries) ||
    p0HumanReviewBundleInputCopy.data.inputEntries.length !== 22 ||
    !p0HumanReviewBundleInputCopy.data.inputEntries.every((entry) =>
      entry.bundleInputStatus === "blank_ready_for_real_reviewer_fill" &&
      ["manual_transcription", "source_replacement"].includes(entry.category) &&
      Array.isArray(entry.missingFields) &&
      entry.missingFields.includes("reviewerName") &&
      entry.missingFields.includes("reviewedAt")) ||
    !/does not contain real reviewer input/i.test(p0HumanReviewBundleInputCopy.data.completionRule || "") ||
    !/does not write overlay changes/i.test(p0HumanReviewBundleInputCopy.data.boundary || "") ||
    !/dry-run gate/i.test(p0HumanReviewBundleInputCopy.data.validationBoundary || "")
  ) {
    throw new Error("knowledge browser local course P0 human review bundle input copy endpoint failed");
  }

  const p0HumanReviewBundlePositiveFixture = await request("/api/knowledge-browser/local-course-p0-human-review-bundle-positive-fixture");
  if (
    p0HumanReviewBundlePositiveFixture.status !== 200 ||
    p0HumanReviewBundlePositiveFixture.data.educationOnly !== true ||
    p0HumanReviewBundlePositiveFixture.data.productionReady !== false ||
    p0HumanReviewBundlePositiveFixture.data.approvalStatus !== "not_approved" ||
    p0HumanReviewBundlePositiveFixture.data.learnerFacingRelease !== false ||
    p0HumanReviewBundlePositiveFixture.data.fixtureOnly !== true ||
    p0HumanReviewBundlePositiveFixture.data.templateStatus !== "p0_human_review_bundle_positive_fixture_ready" ||
    p0HumanReviewBundlePositiveFixture.data.validationStatus !== "ready_for_overlay_apply" ||
    p0HumanReviewBundlePositiveFixture.data.fixtureValidationAllowed !== true ||
    p0HumanReviewBundlePositiveFixture.data.totalEntries !== 22 ||
    p0HumanReviewBundlePositiveFixture.data.manualTranscriptionEntries !== 19 ||
    p0HumanReviewBundlePositiveFixture.data.sourceReplacementEntries !== 3 ||
    p0HumanReviewBundlePositiveFixture.data.filledEntries !== 22 ||
    p0HumanReviewBundlePositiveFixture.data.readyForValidationEntries !== 22 ||
    p0HumanReviewBundlePositiveFixture.data.validationReadyEntries !== 22 ||
    p0HumanReviewBundlePositiveFixture.data.validationBlockedEntries !== 0 ||
    p0HumanReviewBundlePositiveFixture.data.forbiddenHitEntries !== 0 ||
    !Array.isArray(p0HumanReviewBundlePositiveFixture.data.sourceFixturePaths) ||
    p0HumanReviewBundlePositiveFixture.data.sourceFixturePaths.length !== 6 ||
    !Array.isArray(p0HumanReviewBundlePositiveFixture.data.sampleEntries) ||
    p0HumanReviewBundlePositiveFixture.data.sampleEntries.length < 4 ||
    !p0HumanReviewBundlePositiveFixture.data.sampleEntries.every((entry) =>
      entry.bundleInputStatus === "positive_fixture_ready_for_validator_only" &&
      ["manual_transcription", "source_replacement"].includes(entry.category) &&
      /fixture/i.test(entry.reviewerName || "")) ||
    !/not real human review evidence/i.test(p0HumanReviewBundlePositiveFixture.data.completionRule || "") ||
    !/does not authorize overlay writes/i.test(p0HumanReviewBundlePositiveFixture.data.completionRule || "") ||
    !/validator test material only/i.test(p0HumanReviewBundlePositiveFixture.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 human review bundle positive fixture endpoint failed");
  }

  const p0HumanReviewRealReviewerHandoff = await request("/api/knowledge-browser/local-course-p0-human-review-real-reviewer-handoff");
  if (
    p0HumanReviewRealReviewerHandoff.status !== 200 ||
    p0HumanReviewRealReviewerHandoff.data.educationOnly !== true ||
    p0HumanReviewRealReviewerHandoff.data.productionReady !== false ||
    p0HumanReviewRealReviewerHandoff.data.approvalStatus !== "not_approved" ||
    p0HumanReviewRealReviewerHandoff.data.learnerFacingRelease !== false ||
    p0HumanReviewRealReviewerHandoff.data.handoffStatus !== "p0_real_reviewer_handoff_ready_write_blocked" ||
    p0HumanReviewRealReviewerHandoff.data.handoffMode !== "unified_22_entry_real_reviewer_fill_only" ||
    p0HumanReviewRealReviewerHandoff.data.totalReviewEntries !== 22 ||
    p0HumanReviewRealReviewerHandoff.data.manualTranscriptionEntries !== 19 ||
    p0HumanReviewRealReviewerHandoff.data.sourceReplacementEntries !== 3 ||
    p0HumanReviewRealReviewerHandoff.data.blankInputReadyEntries !== 0 ||
    p0HumanReviewRealReviewerHandoff.data.blankInputBlockedEntries !== 22 ||
    p0HumanReviewRealReviewerHandoff.data.positiveFixtureReadyEntries !== 22 ||
    p0HumanReviewRealReviewerHandoff.data.positiveFixtureBlockedEntries !== 0 ||
    p0HumanReviewRealReviewerHandoff.data.positiveFixtureOnly !== true ||
    p0HumanReviewRealReviewerHandoff.data.realHumanInputEntries !== 0 ||
    p0HumanReviewRealReviewerHandoff.data.writeAllowedNow !== false ||
    p0HumanReviewRealReviewerHandoff.data.manualAuthorizationRequired !== true ||
    !Array.isArray(p0HumanReviewRealReviewerHandoff.data.fileRows) ||
    p0HumanReviewRealReviewerHandoff.data.fileRows.length < 5 ||
    !Array.isArray(p0HumanReviewRealReviewerHandoff.data.commandRows) ||
    p0HumanReviewRealReviewerHandoff.data.commandRows.length < 6 ||
    !/does not complete real human review/i.test(p0HumanReviewRealReviewerHandoff.data.completionRule || "") ||
    !/does not authorize overlay writes/i.test(p0HumanReviewRealReviewerHandoff.data.completionRule || "") ||
    !/reviewer-facing operations scaffolding only/i.test(p0HumanReviewRealReviewerHandoff.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 human review real reviewer handoff endpoint failed");
  }

  const p0RealReviewerInputStarter = await request("/api/knowledge-browser/local-course-p0-real-reviewer-input-starter");
  if (
    p0RealReviewerInputStarter.status !== 200 ||
    p0RealReviewerInputStarter.data.educationOnly !== true ||
    p0RealReviewerInputStarter.data.productionReady !== false ||
    p0RealReviewerInputStarter.data.approvalStatus !== "not_approved" ||
    p0RealReviewerInputStarter.data.learnerFacingRelease !== false ||
    p0RealReviewerInputStarter.data.starterStatus !== "real_reviewer_input_starter_ready_waiting_for_human_fill" ||
    p0RealReviewerInputStarter.data.starterMode !== "reviewer_owned_blank_copy_plus_blocked_validation" ||
    p0RealReviewerInputStarter.data.draftInputPath !== "docs/reviewer-inputs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_REAL_INPUT_DRAFT.json" ||
    p0RealReviewerInputStarter.data.totalEntries !== 22 ||
    p0RealReviewerInputStarter.data.manualTranscriptionEntries !== 19 ||
    p0RealReviewerInputStarter.data.sourceReplacementEntries !== 3 ||
    p0RealReviewerInputStarter.data.filledEntries !== 0 ||
    p0RealReviewerInputStarter.data.readyForValidationEntries !== 0 ||
    p0RealReviewerInputStarter.data.validationStatus !== "blocked_missing_reviewer_input" ||
    p0RealReviewerInputStarter.data.validationReadyEntries !== 0 ||
    p0RealReviewerInputStarter.data.validationBlockedEntries !== 22 ||
    p0RealReviewerInputStarter.data.realHumanInputEntries !== 0 ||
    p0RealReviewerInputStarter.data.writeAllowedNow !== false ||
    p0RealReviewerInputStarter.data.manualAuthorizationRequired !== true ||
    p0RealReviewerInputStarter.data.reviewerOwnedCopy !== true ||
    p0RealReviewerInputStarter.data.fixtureOnly !== false ||
    !Array.isArray(p0RealReviewerInputStarter.data.reviewerSteps) ||
    p0RealReviewerInputStarter.data.reviewerSteps.length < 6 ||
    !Array.isArray(p0RealReviewerInputStarter.data.commands) ||
    p0RealReviewerInputStarter.data.commands.length < 3 ||
    !Array.isArray(p0RealReviewerInputStarter.data.sampleRows) ||
    p0RealReviewerInputStarter.data.sampleRows.length < 4 ||
    !p0RealReviewerInputStarter.data.sampleRows.every((row) =>
      row.validationStatus === "blocked_missing_reviewer_input" &&
      row.missingFields.includes("reviewerName") &&
      row.missingFields.includes("reviewedAt")) ||
    !/does not complete human review/i.test(p0RealReviewerInputStarter.data.completionRule || "") ||
    !/does not authorize overlay writes/i.test(p0RealReviewerInputStarter.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(p0RealReviewerInputStarter.data.boundary || "") ||
    !/does not create real reviewer judgment/i.test(p0RealReviewerInputStarter.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 real reviewer input starter endpoint failed");
  }

  const p0RealReviewerTaskBoard = await request("/api/knowledge-browser/local-course-p0-real-reviewer-task-board");
  if (
    p0RealReviewerTaskBoard.status !== 200 ||
    p0RealReviewerTaskBoard.data.educationOnly !== true ||
    p0RealReviewerTaskBoard.data.productionReady !== false ||
    p0RealReviewerTaskBoard.data.approvalStatus !== "not_approved" ||
    p0RealReviewerTaskBoard.data.learnerFacingRelease !== false ||
    p0RealReviewerTaskBoard.data.boardStatus !== "p0_real_reviewer_task_board_ready_all_tasks_blocked" ||
    p0RealReviewerTaskBoard.data.boardMode !== "reviewer_execution_board_for_blank_owned_copy" ||
    p0RealReviewerTaskBoard.data.totalTasks !== 22 ||
    p0RealReviewerTaskBoard.data.manualTranscriptionTasks !== 19 ||
    p0RealReviewerTaskBoard.data.sourceReplacementTasks !== 3 ||
    p0RealReviewerTaskBoard.data.readyTasks !== 0 ||
    p0RealReviewerTaskBoard.data.blockedTasks !== 22 ||
    p0RealReviewerTaskBoard.data.rowsMissingReviewerIdentity !== 22 ||
    p0RealReviewerTaskBoard.data.realHumanInputEntries !== 0 ||
    p0RealReviewerTaskBoard.data.writeAllowedNow !== false ||
    p0RealReviewerTaskBoard.data.manualAuthorizationRequired !== true ||
    p0RealReviewerTaskBoard.data.groupedCounts?.byCategory?.manual_transcription !== 19 ||
    p0RealReviewerTaskBoard.data.groupedCounts?.byCategory?.source_replacement !== 3 ||
    !Array.isArray(p0RealReviewerTaskBoard.data.taskRows) ||
    p0RealReviewerTaskBoard.data.taskRows.length < 8 ||
    !p0RealReviewerTaskBoard.data.taskRows.every((row) =>
      row.validationStatus === "blocked_missing_reviewer_input" &&
      row.readyForOverlayApply === false &&
      row.missingFields.includes("reviewerName") &&
      row.missingFields.includes("reviewedAt") &&
      row.highResPreviewUrl) ||
    !p0RealReviewerTaskBoard.data.taskRows.some((row) =>
      row.category === "manual_transcription" &&
      row.missingFields.includes("humanTranscription") &&
      row.candidateSummary) ||
    !Array.isArray(p0RealReviewerTaskBoard.data.commands) ||
    p0RealReviewerTaskBoard.data.commands.length < 4 ||
    !/does not complete human review/i.test(p0RealReviewerTaskBoard.data.completionRule || "") ||
    !/does not authorize overlay writes/i.test(p0RealReviewerTaskBoard.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(p0RealReviewerTaskBoard.data.boundary || "") ||
    !/does not create reviewer judgment/i.test(p0RealReviewerTaskBoard.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 real reviewer task board endpoint failed");
  }

  const p0RealReviewerEvidencePacket = await request("/api/knowledge-browser/local-course-p0-real-reviewer-evidence-packet");
  if (
    p0RealReviewerEvidencePacket.status !== 200 ||
    p0RealReviewerEvidencePacket.data.educationOnly !== true ||
    p0RealReviewerEvidencePacket.data.productionReady !== false ||
    p0RealReviewerEvidencePacket.data.approvalStatus !== "not_approved" ||
    p0RealReviewerEvidencePacket.data.learnerFacingRelease !== false ||
    p0RealReviewerEvidencePacket.data.packetStatus !== "p0_real_reviewer_evidence_packet_ready_not_reviewed" ||
    p0RealReviewerEvidencePacket.data.packetMode !== "public_grounding_suggestions_for_p0_reviewer_tasks" ||
    p0RealReviewerEvidencePacket.data.totalTasks !== 22 ||
    p0RealReviewerEvidencePacket.data.tasksWithSuggestedRefs !== 22 ||
    p0RealReviewerEvidencePacket.data.tasksWithWikipediaRefs !== 22 ||
    p0RealReviewerEvidencePacket.data.tasksWithPublicContextRefs !== 22 ||
    p0RealReviewerEvidencePacket.data.totalSuggestedRefs < 66 ||
    p0RealReviewerEvidencePacket.data.learnerCitationApprovedTasks !== 0 ||
    p0RealReviewerEvidencePacket.data.realHumanInputEntries !== 0 ||
    p0RealReviewerEvidencePacket.data.writeAllowedNow !== false ||
    p0RealReviewerEvidencePacket.data.manualAuthorizationRequired !== true ||
    !Array.isArray(p0RealReviewerEvidencePacket.data.taskRows) ||
    p0RealReviewerEvidencePacket.data.taskRows.length < 8 ||
    !p0RealReviewerEvidencePacket.data.taskRows.every((row) =>
      row.suggestedRefCount >= 3 &&
      row.wikipediaRefCount >= 1 &&
      row.publicContextRefCount >= 1 &&
      row.learnerCitationApproved === false &&
      row.nextGate === "real_reviewer_source_fit_note_then_validation" &&
      Array.isArray(row.suggestedPublicRefs) &&
      row.suggestedPublicRefs.length >= 3) ||
    !p0RealReviewerEvidencePacket.data.taskRows.every((row) =>
      row.suggestedPublicRefs.some((ref) => ref.tier === "share_alike" || ref.family === "Wikipedia") &&
      row.suggestedPublicRefs.some((ref) => ref.tier !== "share_alike" && ref.family !== "Wikipedia")) ||
    !/does not fill sourceFitNote/i.test(p0RealReviewerEvidencePacket.data.completionRule || "") ||
    !/does not approve learner-facing citations/i.test(p0RealReviewerEvidencePacket.data.completionRule || "") ||
    !/does not authorize overlay writes/i.test(p0RealReviewerEvidencePacket.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(p0RealReviewerEvidencePacket.data.boundary || "") ||
    !/do not prove a setup, signal, future outcome, strategy edge, real-money action/i.test(p0RealReviewerEvidencePacket.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 real reviewer evidence packet endpoint failed");
  }

  const p0RealReviewerSourceFitWorksheet = await request("/api/knowledge-browser/local-course-p0-real-reviewer-source-fit-worksheet");
  if (
    p0RealReviewerSourceFitWorksheet.status !== 200 ||
    p0RealReviewerSourceFitWorksheet.data.educationOnly !== true ||
    p0RealReviewerSourceFitWorksheet.data.productionReady !== false ||
    p0RealReviewerSourceFitWorksheet.data.approvalStatus !== "not_approved" ||
    p0RealReviewerSourceFitWorksheet.data.learnerFacingRelease !== false ||
    p0RealReviewerSourceFitWorksheet.data.worksheetStatus !== "p0_real_reviewer_source_fit_worksheet_ready_blank" ||
    p0RealReviewerSourceFitWorksheet.data.worksheetMode !== "blank_human_source_fit_cards_with_public_ref_suggestions" ||
    p0RealReviewerSourceFitWorksheet.data.totalCards !== 22 ||
    p0RealReviewerSourceFitWorksheet.data.manualTranscriptionCards !== 19 ||
    p0RealReviewerSourceFitWorksheet.data.sourceReplacementCards !== 3 ||
    p0RealReviewerSourceFitWorksheet.data.totalBlankFields !== 176 ||
    p0RealReviewerSourceFitWorksheet.data.cardsWithSuggestedRefs !== 22 ||
    p0RealReviewerSourceFitWorksheet.data.cardsWithWikipediaRefs !== 22 ||
    p0RealReviewerSourceFitWorksheet.data.cardsWithPublicContextRefs !== 22 ||
    p0RealReviewerSourceFitWorksheet.data.reviewerFilledCards !== 0 ||
    p0RealReviewerSourceFitWorksheet.data.generatedDecisions !== 0 ||
    p0RealReviewerSourceFitWorksheet.data.learnerCitationApprovedCards !== 0 ||
    p0RealReviewerSourceFitWorksheet.data.realHumanInputEntries !== 0 ||
    p0RealReviewerSourceFitWorksheet.data.writeAllowedNow !== false ||
    p0RealReviewerSourceFitWorksheet.data.manualAuthorizationRequired !== true ||
    !Array.isArray(p0RealReviewerSourceFitWorksheet.data.cards) ||
    p0RealReviewerSourceFitWorksheet.data.cards.length < 8 ||
    !p0RealReviewerSourceFitWorksheet.data.cards.every((card) =>
      card.readyForOverlayApply === false &&
      card.reviewerFilled === false &&
      card.generatedDecision === "" &&
      card.learnerCitationApproved === false &&
      card.nextGate === "human_fill_source_fit_worksheet_then_validate_reviewer_input_copy" &&
      Array.isArray(card.blankFields) &&
      card.blankFields.includes("sourceFitNote") &&
      card.blankFields.includes("publicReferenceNotes") &&
      Array.isArray(card.unsafeAutofillFields) &&
      card.unsafeAutofillFields.includes("sourceFitNote") &&
      Array.isArray(card.suggestedPublicRefs) &&
      card.suggestedPublicRefs.length >= 3) ||
    !p0RealReviewerSourceFitWorksheet.data.cards.every((card) =>
      card.suggestedPublicRefs.some((ref) => ref.tier === "share_alike" || ref.family === "Wikipedia") &&
      card.suggestedPublicRefs.some((ref) => ref.tier !== "share_alike" && ref.family !== "Wikipedia")) ||
    !/does not fill sourceFitNote/i.test(p0RealReviewerSourceFitWorksheet.data.completionRule || "") ||
    !/does not generate reviewer decisions/i.test(p0RealReviewerSourceFitWorksheet.data.completionRule || "") ||
    !/does not authorize overlay writes/i.test(p0RealReviewerSourceFitWorksheet.data.completionRule || "") ||
    !/keeps all source-fit and public-reference judgment blank/i.test(p0RealReviewerSourceFitWorksheet.data.boundary || "") ||
    !/do not prove a setup, signal, future outcome, strategy edge, real-money action/i.test(p0RealReviewerSourceFitWorksheet.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 real reviewer source-fit worksheet endpoint failed");
  }

  const p0RealReviewerSourceFitInputGuide = await request("/api/knowledge-browser/local-course-p0-real-reviewer-source-fit-input-guide");
  if (
    p0RealReviewerSourceFitInputGuide.status !== 200 ||
    p0RealReviewerSourceFitInputGuide.data.educationOnly !== true ||
    p0RealReviewerSourceFitInputGuide.data.productionReady !== false ||
    p0RealReviewerSourceFitInputGuide.data.approvalStatus !== "not_approved" ||
    p0RealReviewerSourceFitInputGuide.data.learnerFacingRelease !== false ||
    p0RealReviewerSourceFitInputGuide.data.guideStatus !== "p0_real_reviewer_source_fit_input_guide_ready_blank" ||
    p0RealReviewerSourceFitInputGuide.data.guideMode !== "maps_source_fit_cards_to_reviewer_owned_draft_input_fields" ||
    p0RealReviewerSourceFitInputGuide.data.sourceDraftInput !== "docs/reviewer-inputs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_REAL_INPUT_DRAFT.json" ||
    p0RealReviewerSourceFitInputGuide.data.totalGuideRows !== 22 ||
    p0RealReviewerSourceFitInputGuide.data.manualTranscriptionRows !== 19 ||
    p0RealReviewerSourceFitInputGuide.data.sourceReplacementRows !== 3 ||
    p0RealReviewerSourceFitInputGuide.data.rowsWithSourceFitFieldPath !== 22 ||
    p0RealReviewerSourceFitInputGuide.data.rowsWithPublicReferenceNotesFieldPath !== 22 ||
    p0RealReviewerSourceFitInputGuide.data.rowsWithSuggestedRefs !== 22 ||
    p0RealReviewerSourceFitInputGuide.data.rowsWithWikipediaRefs !== 22 ||
    p0RealReviewerSourceFitInputGuide.data.rowsWithPublicContextRefs !== 22 ||
    p0RealReviewerSourceFitInputGuide.data.reviewerFilledRows !== 0 ||
    p0RealReviewerSourceFitInputGuide.data.generatedDecisions !== 0 ||
    p0RealReviewerSourceFitInputGuide.data.learnerCitationApprovedRows !== 0 ||
    p0RealReviewerSourceFitInputGuide.data.realHumanInputEntries !== 0 ||
    p0RealReviewerSourceFitInputGuide.data.writeAllowedNow !== false ||
    p0RealReviewerSourceFitInputGuide.data.manualAuthorizationRequired !== true ||
    !Array.isArray(p0RealReviewerSourceFitInputGuide.data.guideRows) ||
    p0RealReviewerSourceFitInputGuide.data.guideRows.length < 8 ||
    !p0RealReviewerSourceFitInputGuide.data.guideRows.every((row) =>
      /^\/inputEntries\/\d+$/.test(row.jsonPointer || "") &&
      Array.isArray(row.requiredFieldPaths) &&
      row.requiredFieldPaths.length >= 8 &&
      row.sourceFitFieldPath &&
      row.publicReferenceNotesFieldPath &&
      row.suggestedRefCount >= 3 &&
      row.wikipediaRefCount >= 1 &&
      row.publicContextRefCount >= 1 &&
      Array.isArray(row.unsafeAutofillFields) &&
      row.unsafeAutofillFields.includes("sourceFitNote") &&
      row.reviewerFilled === false &&
      row.generatedDecision === "" &&
      row.learnerCitationApproved === false &&
      row.nextGate === "fill_draft_input_copy_then_validate_and_lint") ||
    !/does not fill sourceFitNote/i.test(p0RealReviewerSourceFitInputGuide.data.completionRule || "") ||
    !/does not generate reviewer decisions/i.test(p0RealReviewerSourceFitInputGuide.data.completionRule || "") ||
    !/does not authorize overlay writes/i.test(p0RealReviewerSourceFitInputGuide.data.completionRule || "") ||
    !/shows where humans should write/i.test(p0RealReviewerSourceFitInputGuide.data.boundary || "") ||
    !/keeps all judgment blank/i.test(p0RealReviewerSourceFitInputGuide.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 real reviewer source-fit input guide endpoint failed");
  }

  const p0RealReviewerSourceFitInputValidation = await request("/api/knowledge-browser/local-course-p0-real-reviewer-source-fit-input-validation");
  if (
    p0RealReviewerSourceFitInputValidation.status !== 200 ||
    p0RealReviewerSourceFitInputValidation.data.educationOnly !== true ||
    p0RealReviewerSourceFitInputValidation.data.productionReady !== false ||
    p0RealReviewerSourceFitInputValidation.data.approvalStatus !== "not_approved" ||
    p0RealReviewerSourceFitInputValidation.data.learnerFacingRelease !== false ||
    p0RealReviewerSourceFitInputValidation.data.validationStatus !== "blocked_missing_reviewer_input" ||
    p0RealReviewerSourceFitInputValidation.data.validationMode !== "source_fit_and_public_reference_notes_gate" ||
    p0RealReviewerSourceFitInputValidation.data.totalRows !== 22 ||
    p0RealReviewerSourceFitInputValidation.data.readyRows !== 0 ||
    p0RealReviewerSourceFitInputValidation.data.blockedRows !== 22 ||
    p0RealReviewerSourceFitInputValidation.data.missingFieldRows !== 22 ||
    p0RealReviewerSourceFitInputValidation.data.forbiddenHitRows !== 0 ||
    p0RealReviewerSourceFitInputValidation.data.fixtureOnly !== false ||
    p0RealReviewerSourceFitInputValidation.data.fixtureReadyRows !== 0 ||
    p0RealReviewerSourceFitInputValidation.data.realHumanInputEntries !== 0 ||
    p0RealReviewerSourceFitInputValidation.data.generatedDecisions !== 0 ||
    p0RealReviewerSourceFitInputValidation.data.learnerCitationApprovedRows !== 0 ||
    p0RealReviewerSourceFitInputValidation.data.writeAllowedNow !== false ||
    p0RealReviewerSourceFitInputValidation.data.manualAuthorizationRequired !== true ||
    !Array.isArray(p0RealReviewerSourceFitInputValidation.data.allowedDecisionValues) ||
    p0RealReviewerSourceFitInputValidation.data.allowedDecisionValues.length !== 4 ||
    !Array.isArray(p0RealReviewerSourceFitInputValidation.data.validationRows) ||
    p0RealReviewerSourceFitInputValidation.data.validationRows.length < 8 ||
    !p0RealReviewerSourceFitInputValidation.data.validationRows.every((row) =>
      row.validationStatus === "blocked_missing_reviewer_input" &&
      row.readyForSourceFitGate === false &&
      Array.isArray(row.missingFields) &&
      row.missingFields.length >= 2 &&
      row.missingFields.some((field) => /sourceFitNote|publicReferenceNotes/.test(field)) &&
      Array.isArray(row.forbiddenHits) &&
      row.forbiddenHits.length === 0 &&
      row.nextGate === "fill_source_fit_notes_then_revalidate") ||
    !/does not generate reviewer decisions/i.test(p0RealReviewerSourceFitInputValidation.data.completionRule || "") ||
    !/approve learner-facing citations/i.test(p0RealReviewerSourceFitInputValidation.data.completionRule || "") ||
    !/authorize overlay writes/i.test(p0RealReviewerSourceFitInputValidation.data.completionRule || "") ||
    !/validates source-fit note shape/i.test(p0RealReviewerSourceFitInputValidation.data.boundary || "") ||
    !/write authorization/i.test(p0RealReviewerSourceFitInputValidation.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 real reviewer source-fit input validation endpoint failed");
  }

  const p0RealReviewerSourceFitHandoff = await request("/api/knowledge-browser/local-course-p0-real-reviewer-source-fit-handoff");
  const sourceFitHandoffPhaseIds = [
    "inspect_p0_task_board",
    "review_public_evidence_packet",
    "fill_source_fit_worksheet",
    "map_notes_to_draft_input",
    "validate_real_source_fit_input",
    "compare_positive_fixture_control",
    "check_write_authorization_preview",
  ];
  if (
    p0RealReviewerSourceFitHandoff.status !== 200 ||
    p0RealReviewerSourceFitHandoff.data.educationOnly !== true ||
    p0RealReviewerSourceFitHandoff.data.productionReady !== false ||
    p0RealReviewerSourceFitHandoff.data.approvalStatus !== "not_approved" ||
    p0RealReviewerSourceFitHandoff.data.learnerFacingRelease !== false ||
    p0RealReviewerSourceFitHandoff.data.handoffStatus !== "p0_real_reviewer_source_fit_handoff_ready_blocked_on_real_input" ||
    p0RealReviewerSourceFitHandoff.data.handoffMode !== "single_entrypoint_for_real_source_fit_review_execution" ||
    p0RealReviewerSourceFitHandoff.data.totalP0Tasks !== 22 ||
    p0RealReviewerSourceFitHandoff.data.totalSourceFitCards !== 22 ||
    p0RealReviewerSourceFitHandoff.data.totalGuideRows !== 22 ||
    p0RealReviewerSourceFitHandoff.data.sourceFitRealReadyRows !== 0 ||
    p0RealReviewerSourceFitHandoff.data.sourceFitRealBlockedRows !== 22 ||
    p0RealReviewerSourceFitHandoff.data.sourceFitFixtureReadyRows !== 22 ||
    p0RealReviewerSourceFitHandoff.data.writeAllowedNow !== false ||
    p0RealReviewerSourceFitHandoff.data.realHumanInputEntries !== 0 ||
    p0RealReviewerSourceFitHandoff.data.manualAuthorizationRequired !== true ||
    p0RealReviewerSourceFitHandoff.data.fixtureOnlyInputsRejectedForWrite !== true ||
    !Array.isArray(p0RealReviewerSourceFitHandoff.data.phaseRows) ||
    p0RealReviewerSourceFitHandoff.data.phaseRows.length !== 7 ||
    !sourceFitHandoffPhaseIds.every((id) => p0RealReviewerSourceFitHandoff.data.phaseRows.some((row) => row.id === id)) ||
    !p0RealReviewerSourceFitHandoff.data.phaseRows.every((row) =>
      row.command &&
      row.reviewerAction &&
      row.hardStop) ||
    !Array.isArray(p0RealReviewerSourceFitHandoff.data.hardStops) ||
    p0RealReviewerSourceFitHandoff.data.hardStops.length < 5 ||
    !p0RealReviewerSourceFitHandoff.data.hardStops.some((item) => /fixture-only/i.test(item)) ||
    !p0RealReviewerSourceFitHandoff.data.hardStops.some((item) => /sourceFitRealReadyRows is 0/i.test(item)) ||
    !p0RealReviewerSourceFitHandoff.data.hardStops.some((item) => /setup, signal, future outcome, strategy edge, or real-money action/i.test(item)) ||
    !/does not fill notes/i.test(p0RealReviewerSourceFitHandoff.data.completionRule || "") ||
    !/does not authorize overlay writes/i.test(p0RealReviewerSourceFitHandoff.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(p0RealReviewerSourceFitHandoff.data.boundary || "") ||
    !/does not infer missing private content/i.test(p0RealReviewerSourceFitHandoff.data.boundary || "") ||
    !/stock recommendations/i.test(p0RealReviewerSourceFitHandoff.data.boundary || "") ||
    !/live signals/i.test(p0RealReviewerSourceFitHandoff.data.boundary || "") ||
    !/real-money guidance/i.test(p0RealReviewerSourceFitHandoff.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 real reviewer source-fit handoff endpoint failed");
  }

  const p0ReviewOperatorIndex = await request("/api/knowledge-browser/local-course-p0-review-operator-index");
  if (
    p0ReviewOperatorIndex.status !== 200 ||
    p0ReviewOperatorIndex.data.educationOnly !== true ||
    p0ReviewOperatorIndex.data.productionReady !== false ||
    p0ReviewOperatorIndex.data.approvalStatus !== "not_approved" ||
    p0ReviewOperatorIndex.data.learnerFacingRelease !== false ||
    p0ReviewOperatorIndex.data.indexStatus !== "p0_review_operator_index_ready_not_applied" ||
    p0ReviewOperatorIndex.data.totalP0Tasks !== 22 ||
    p0ReviewOperatorIndex.data.manualTranscriptionTasks !== 19 ||
    p0ReviewOperatorIndex.data.sourceReplacementTasks !== 3 ||
    p0ReviewOperatorIndex.data.manualPackCount !== 5 ||
    p0ReviewOperatorIndex.data.manualPackCards !== 19 ||
    p0ReviewOperatorIndex.data.sourceReplacementPackEntries !== 3 ||
    p0ReviewOperatorIndex.data.totalReviewPackEntries !== 22 ||
    p0ReviewOperatorIndex.data.reviewPackCoverageComplete !== true ||
    p0ReviewOperatorIndex.data.overlayStatus !== "p0_review_not_started" ||
    p0ReviewOperatorIndex.data.overlayReadyForValidationTasks !== 0 ||
    p0ReviewOperatorIndex.data.overlayAcceptedForNextGateTasks !== 0 ||
    p0ReviewOperatorIndex.data.blankInputReadyEntries !== 0 ||
    p0ReviewOperatorIndex.data.blankInputBlockedEntries !== 22 ||
    p0ReviewOperatorIndex.data.positiveFixtureReadyToApplyEntries !== 22 ||
    p0ReviewOperatorIndex.data.positiveFixtureWrittenEntries !== 0 ||
    p0ReviewOperatorIndex.data.sourceReplacementTargetsWithDirectReplacementCandidates !== 0 ||
    p0ReviewOperatorIndex.data.sourceReplacementApprovedReplacements !== 0 ||
    !Array.isArray(p0ReviewOperatorIndex.data.packRows) ||
    p0ReviewOperatorIndex.data.packRows.length !== 6 ||
    !p0ReviewOperatorIndex.data.packRows.some((row) =>
      row.packNumber === "source_replacement" &&
      row.category === "source_replacement" &&
      row.totalEntries === 3 &&
      row.validationBlockedEntries === 3 &&
      row.positiveFixtureWrittenEntries === 0) ||
    !p0ReviewOperatorIndex.data.packRows.filter((row) => row.category === "manual_transcription").every((row) =>
      row.packStatus === "blank_human_fill_pack_ready" &&
      row.filledEntries === 0 &&
      row.validationReadyEntries === 0 &&
      row.positiveFixtureWrittenEntries === 0) ||
    !/reviewer-only operational material/i.test(p0ReviewOperatorIndex.data.boundary || "") ||
    !/does not write overlay changes/i.test(p0ReviewOperatorIndex.data.boundary || "") ||
    !/proves P0 review coverage, not P0 completion/i.test(p0ReviewOperatorIndex.data.completionRule || "")
  ) {
    throw new Error("knowledge browser local course P0 review operator index endpoint failed");
  }

  const p0WriteAuthorizationPreview = await request("/api/knowledge-browser/local-course-p0-write-authorization-preview");
  if (
    p0WriteAuthorizationPreview.status !== 200 ||
    p0WriteAuthorizationPreview.data.educationOnly !== true ||
    p0WriteAuthorizationPreview.data.productionReady !== false ||
    p0WriteAuthorizationPreview.data.approvalStatus !== "not_approved" ||
    p0WriteAuthorizationPreview.data.learnerFacingRelease !== false ||
    p0WriteAuthorizationPreview.data.previewStatus !== "write_authorization_preview_ready_manual_required" ||
    p0WriteAuthorizationPreview.data.writeAllowedNow !== false ||
    p0WriteAuthorizationPreview.data.manualAuthorizationRequired !== true ||
    p0WriteAuthorizationPreview.data.machineCheckedGatesPassed !== true ||
    p0WriteAuthorizationPreview.data.realReviewerInputRequired !== true ||
    p0WriteAuthorizationPreview.data.fixtureOnlyInputsRejectedForWrite !== true ||
    p0WriteAuthorizationPreview.data.totalP0Tasks !== 22 ||
    p0WriteAuthorizationPreview.data.totalReviewPackEntries !== 22 ||
    p0WriteAuthorizationPreview.data.blankValidationReadyEntries !== 0 ||
    p0WriteAuthorizationPreview.data.blankValidationBlockedEntries !== 22 ||
    p0WriteAuthorizationPreview.data.blankLintReadyEntries !== 0 ||
    p0WriteAuthorizationPreview.data.blankLintBlockedEntries !== 22 ||
    p0WriteAuthorizationPreview.data.fixtureReadyToApplyEntries !== 22 ||
    p0WriteAuthorizationPreview.data.fixtureOnlyReadyEntries !== 22 ||
    p0WriteAuthorizationPreview.data.fixtureWrittenEntries !== 0 ||
    p0WriteAuthorizationPreview.data.sourceFitValidationStatus !== "blocked_missing_reviewer_input" ||
    p0WriteAuthorizationPreview.data.sourceFitReadyRows !== 0 ||
    p0WriteAuthorizationPreview.data.sourceFitBlockedRows !== 22 ||
    p0WriteAuthorizationPreview.data.sourceFitMissingFieldRows !== 22 ||
    p0WriteAuthorizationPreview.data.sourceFitForbiddenHitRows !== 0 ||
    p0WriteAuthorizationPreview.data.sourceFitFixtureValidationStatus !== "ready_for_source_fit_gate" ||
    p0WriteAuthorizationPreview.data.sourceFitFixtureReadyRows !== 22 ||
    p0WriteAuthorizationPreview.data.sourceFitFixtureRealHumanInputEntries !== 0 ||
    p0WriteAuthorizationPreview.data.highRiskRealReviewerValidationStatus !== "blocked_missing_real_reviewer_overlay_input" ||
    p0WriteAuthorizationPreview.data.highRiskReadyLessons !== 0 ||
    p0WriteAuthorizationPreview.data.highRiskBlockedLessons !== 12 ||
    p0WriteAuthorizationPreview.data.highRiskReadyReviewerNotes !== 0 ||
    p0WriteAuthorizationPreview.data.highRiskBlockedReviewerNotes !== 72 ||
    p0WriteAuthorizationPreview.data.highRiskReadyDirectSourceDecisions !== 0 ||
    p0WriteAuthorizationPreview.data.highRiskBlockedDirectSourceDecisions !== 5 ||
    p0WriteAuthorizationPreview.data.highRiskMissingFieldRows < 89 ||
    p0WriteAuthorizationPreview.data.highRiskForbiddenHitRows !== 0 ||
    p0WriteAuthorizationPreview.data.highRiskRealHumanInputEntries !== 0 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitValidationStatus !== "blocked_missing_real_reviewer_source_fit_input" ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitInputRows !== 1638 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitReadyRows !== 0 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitBlockedRows !== 1638 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitMissingFieldRows !== 1638 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitForbiddenHitRows !== 0 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitRealHumanInputEntries !== 0 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitLearnerCitationApprovedRows !== 0 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitCopiedTextApprovedRows !== 0 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitProgressMatrixStatus !== "node_public_source_fit_review_progress_matrix_ready_release_blocked" ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitProgressValidationStatus !== "blocked_missing_real_reviewer_source_fit_input" ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitProgressTotalPackets !== 35 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitReadyPackets !== 0 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitBlockedPackets !== 35 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitReadyModules !== 0 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitBlockedModules !== 12 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitOverallProgressPercent !== 0 ||
    p0WriteAuthorizationPreview.data.nodePublicSourceFitFirstBlockedPacketId !== "node-public-source-fit-batch-001-packet" ||
    p0WriteAuthorizationPreview.data.overlayStatus !== "p0_review_not_started" ||
    p0WriteAuthorizationPreview.data.overlayReadyForValidationTasks !== 0 ||
    p0WriteAuthorizationPreview.data.overlayAcceptedForNextGateTasks !== 0 ||
    p0WriteAuthorizationPreview.data.readinessStatus !== "blocked_for_learner_facing_absorption" ||
    !Array.isArray(p0WriteAuthorizationPreview.data.gates) ||
    p0WriteAuthorizationPreview.data.gates.length < 9 ||
    !p0WriteAuthorizationPreview.data.gates.some((gate) =>
      gate.id === "no_real_reviewer_input_copy" &&
      gate.status === "manual_required" &&
      gate.blocksWrite === true) ||
    !p0WriteAuthorizationPreview.data.gates.some((gate) =>
      gate.id === "fixture_ready_entries_not_authorizable" &&
      gate.status === "blocked" &&
      gate.blocksWrite === true) ||
    !p0WriteAuthorizationPreview.data.gates.some((gate) =>
      gate.id === "source_fit_real_input_blocked" &&
      gate.status === "pass") ||
    !p0WriteAuthorizationPreview.data.gates.some((gate) =>
      gate.id === "source_fit_fixture_not_authorizable" &&
      gate.status === "blocked" &&
      gate.blocksWrite === true) ||
    !p0WriteAuthorizationPreview.data.gates.some((gate) =>
      gate.id === "high_risk_real_reviewer_overlay_blocked" &&
      gate.status === "pass" &&
      gate.blocksWrite === true &&
      /0\/72/.test(gate.evidence || "")) ||
    !p0WriteAuthorizationPreview.data.gates.some((gate) =>
      gate.id === "node_public_source_fit_review_input_blocked" &&
      gate.status === "pass" &&
      gate.blocksWrite === true &&
      /0\/1638/.test(gate.evidence || "")) ||
    !p0WriteAuthorizationPreview.data.gates.some((gate) =>
      gate.id === "node_public_source_fit_progress_matrix_blocked" &&
      gate.status === "pass" &&
      gate.blocksWrite === true &&
      /0\/35/.test(gate.evidence || "")) ||
    !Array.isArray(p0WriteAuthorizationPreview.data.requiredWritePreconditions) ||
    !p0WriteAuthorizationPreview.data.requiredWritePreconditions.some((item) => /explicit human approval/i.test(item)) ||
    !p0WriteAuthorizationPreview.data.requiredWritePreconditions.some((item) =>
      /High-risk real reviewer overlay validation/i.test(item)) ||
    !p0WriteAuthorizationPreview.data.requiredWritePreconditions.some((item) =>
      /Node public source-fit review input validation/i.test(item)) ||
    !p0WriteAuthorizationPreview.data.requiredWritePreconditions.some((item) =>
      /Node public source-fit progress matrix/i.test(item)) ||
    !/not write authorization/i.test(p0WriteAuthorizationPreview.data.completionRule || "") ||
    !/does not write overlay changes/i.test(p0WriteAuthorizationPreview.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 write authorization preview endpoint failed");
  }

  const p0ReviewInputNegativeCases = await request("/api/knowledge-browser/local-course-p0-review-input-negative-cases");
  if (
    p0ReviewInputNegativeCases.status !== 200 ||
    p0ReviewInputNegativeCases.data.educationOnly !== true ||
    p0ReviewInputNegativeCases.data.productionReady !== false ||
    p0ReviewInputNegativeCases.data.approvalStatus !== "not_approved" ||
    p0ReviewInputNegativeCases.data.learnerFacingRelease !== false ||
    p0ReviewInputNegativeCases.data.reportStatus !== "p0_review_input_negative_cases_ready" ||
    p0ReviewInputNegativeCases.data.totalNegativeCases < 5 ||
    p0ReviewInputNegativeCases.data.manualBadLintStatus !== "blocked_quality_lint" ||
    p0ReviewInputNegativeCases.data.manualBadCandidateCopyIssueEntries < 4 ||
    p0ReviewInputNegativeCases.data.manualBadForbiddenHitEntries < 4 ||
    p0ReviewInputNegativeCases.data.sourceBadLintStatus !== "blocked_quality_lint" ||
    p0ReviewInputNegativeCases.data.sourceBadDirectCandidateMisuseEntries < 3 ||
    p0ReviewInputNegativeCases.data.sourceBadInvalidDecisionEntries !== 0 ||
    p0ReviewInputNegativeCases.data.writeAllowedNow !== false ||
    p0ReviewInputNegativeCases.data.fixtureOnlyReadyEntries !== 22 ||
    p0ReviewInputNegativeCases.data.fixtureWrittenEntries !== 0 ||
    p0ReviewInputNegativeCases.data.overlayStatus !== "p0_review_not_started" ||
    !Array.isArray(p0ReviewInputNegativeCases.data.negativeCases) ||
    p0ReviewInputNegativeCases.data.negativeCases.length < 5 ||
    !p0ReviewInputNegativeCases.data.negativeCases.some((item) =>
      item.id === "manual_candidate_copy_and_forbidden_claims" &&
      item.observedStatus === "blocked_quality_lint") ||
    !p0ReviewInputNegativeCases.data.negativeCases.some((item) =>
      item.id === "source_neighbor_candidate_misuse" &&
      item.observedStatus === "blocked_quality_lint") ||
    !/bad reviewer input is blocked/i.test(p0ReviewInputNegativeCases.data.completionRule || "") ||
    !/do(?:es)? not write overlay changes/i.test(p0ReviewInputNegativeCases.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course P0 review input negative cases endpoint failed");
  }

  const lowExtractionTranscriptionOverlay = await request("/api/knowledge-browser/low-extraction-transcription-overlay");
  if (
    lowExtractionTranscriptionOverlay.status !== 200 ||
    lowExtractionTranscriptionOverlay.data.educationOnly !== true ||
    lowExtractionTranscriptionOverlay.data.productionReady !== false ||
    lowExtractionTranscriptionOverlay.data.approvalStatus !== "not_approved" ||
    lowExtractionTranscriptionOverlay.data.learnerFacingRelease !== false ||
    lowExtractionTranscriptionOverlay.data.overlayStatus !== "manual_transcription_not_started" ||
    lowExtractionTranscriptionOverlay.data.lowExtractionDocs !== 5 ||
    lowExtractionTranscriptionOverlay.data.transcriptionPages !== 22 ||
    lowExtractionTranscriptionOverlay.data.pagesNotStarted !== 22 ||
    lowExtractionTranscriptionOverlay.data.pagesTranscribed !== 0 ||
    lowExtractionTranscriptionOverlay.data.pagesUnusable !== 0 ||
    lowExtractionTranscriptionOverlay.data.pagesNeedSourceReplacement !== 0 ||
    lowExtractionTranscriptionOverlay.data.publicSourceGroundingNeededPages !== 22 ||
    !Array.isArray(lowExtractionTranscriptionOverlay.data.documentRows) ||
    lowExtractionTranscriptionOverlay.data.documentRows.length !== 5 ||
    !Array.isArray(lowExtractionTranscriptionOverlay.data.pageEntries) ||
    lowExtractionTranscriptionOverlay.data.pageEntries.length < 8 ||
    !lowExtractionTranscriptionOverlay.data.pageEntries.every((entry) =>
      entry.transcriptionStatus === "not_started" &&
      entry.visualDecision === "pending" &&
      entry.previewPath)
  ) {
    throw new Error("knowledge browser low extraction transcription overlay endpoint failed");
  }

  const lowExtractionTranscriptIntake = await request("/api/knowledge-browser/low-extraction-transcript-intake");
  if (
    lowExtractionTranscriptIntake.status !== 200 ||
    lowExtractionTranscriptIntake.data.educationOnly !== true ||
    lowExtractionTranscriptIntake.data.productionReady !== false ||
    lowExtractionTranscriptIntake.data.approvalStatus !== "not_approved" ||
    lowExtractionTranscriptIntake.data.learnerFacingRelease !== false ||
    lowExtractionTranscriptIntake.data.intakeStatus !== "waiting_for_human_transcription" ||
    lowExtractionTranscriptIntake.data.lowExtractionDocs !== 5 ||
    lowExtractionTranscriptIntake.data.totalPages !== 22 ||
    lowExtractionTranscriptIntake.data.manualTranscriptionCandidatePages !== 19 ||
    lowExtractionTranscriptIntake.data.blankPreviewPages !== 3 ||
    lowExtractionTranscriptIntake.data.acceptedTranscriptPages !== 0 ||
    lowExtractionTranscriptIntake.data.sourceReplacementCandidatePages !== 3 ||
    !Array.isArray(lowExtractionTranscriptIntake.data.documentRows) ||
    lowExtractionTranscriptIntake.data.documentRows.length !== 5 ||
    !Array.isArray(lowExtractionTranscriptIntake.data.pageRows) ||
    lowExtractionTranscriptIntake.data.pageRows.length < 8 ||
    !lowExtractionTranscriptIntake.data.pageRows.every((row) => row.intakeStatus && row.nextGate && row.previewPath)
  ) {
    throw new Error("knowledge browser low extraction transcript intake endpoint failed");
  }

  const lowExtractionManualTranscriptionPack = await request("/api/knowledge-browser/low-extraction-manual-transcription-pack");
  if (
    lowExtractionManualTranscriptionPack.status !== 200 ||
    lowExtractionManualTranscriptionPack.data.educationOnly !== true ||
    lowExtractionManualTranscriptionPack.data.productionReady !== false ||
    lowExtractionManualTranscriptionPack.data.approvalStatus !== "not_approved" ||
    lowExtractionManualTranscriptionPack.data.learnerFacingRelease !== false ||
    lowExtractionManualTranscriptionPack.data.packStatus !== "manual_transcription_ready" ||
    lowExtractionManualTranscriptionPack.data.manualTranscriptionPages !== 19 ||
    lowExtractionManualTranscriptionPack.data.manualTranscriptionDocuments !== 2 ||
    lowExtractionManualTranscriptionPack.data.acceptedTranscriptPages !== 0 ||
    !Array.isArray(lowExtractionManualTranscriptionPack.data.transcriptionCards) ||
    lowExtractionManualTranscriptionPack.data.transcriptionCards.length < 8 ||
    !lowExtractionManualTranscriptionPack.data.transcriptionCards.every((card) =>
      card.intakeStatus === "manual_transcription_candidate" &&
      card.humanTranscription === "" &&
      card.humanSummary === "" &&
      card.nextGate === "human_transcription_then_source_fit_public_grounding_originality_review" &&
      card.previewPath)
  ) {
    throw new Error("knowledge browser low extraction manual transcription pack endpoint failed");
  }

  const lowExtractionSourceReplacementPack = await request("/api/knowledge-browser/low-extraction-source-replacement-pack");
  if (
    lowExtractionSourceReplacementPack.status !== 200 ||
    lowExtractionSourceReplacementPack.data.educationOnly !== true ||
    lowExtractionSourceReplacementPack.data.productionReady !== false ||
    lowExtractionSourceReplacementPack.data.approvalStatus !== "not_approved" ||
    lowExtractionSourceReplacementPack.data.learnerFacingRelease !== false ||
    lowExtractionSourceReplacementPack.data.packStatus !== "source_replacement_required" ||
    lowExtractionSourceReplacementPack.data.replacementCandidates !== 3 ||
    lowExtractionSourceReplacementPack.data.replacementDocuments !== 3 ||
    lowExtractionSourceReplacementPack.data.blankPreviewPages !== 3 ||
    lowExtractionSourceReplacementPack.data.acceptedTranscriptPages !== 0 ||
    !Array.isArray(lowExtractionSourceReplacementPack.data.replacementCards) ||
    lowExtractionSourceReplacementPack.data.replacementCards.length !== 3 ||
    !lowExtractionSourceReplacementPack.data.replacementCards.every((card) =>
      card.intakeStatus === "blank_preview_needs_source_replacement" &&
      card.replacementStatus === "source_replacement_required" &&
      card.nextGate === "replace_or_reexport_source_pdf_before_absorption" &&
      card.previewPath)
  ) {
    throw new Error("knowledge browser low extraction source replacement pack endpoint failed");
  }

  const localCourseAbsorptionReadiness = await request("/api/knowledge-browser/local-course-absorption-readiness");
  if (
    localCourseAbsorptionReadiness.status !== 200 ||
    localCourseAbsorptionReadiness.data.educationOnly !== true ||
    localCourseAbsorptionReadiness.data.productionReady !== false ||
    localCourseAbsorptionReadiness.data.approvalStatus !== "not_approved" ||
    localCourseAbsorptionReadiness.data.learnerFacingRelease !== false ||
    localCourseAbsorptionReadiness.data.readinessStatus !== "blocked_for_learner_facing_absorption" ||
    localCourseAbsorptionReadiness.data.importedUniquePdfFiles !== 298 ||
    localCourseAbsorptionReadiness.data.uniquePdfFiles !== 298 ||
    localCourseAbsorptionReadiness.data.publicReferenceReadyModules !== 12 ||
    localCourseAbsorptionReadiness.data.modules !== 12 ||
    localCourseAbsorptionReadiness.data.manualTranscriptionPages !== 19 ||
    localCourseAbsorptionReadiness.data.sourceReplacementCandidates !== 3 ||
    localCourseAbsorptionReadiness.data.openBlockers < 4 ||
    !Array.isArray(localCourseAbsorptionReadiness.data.phaseRows) ||
    localCourseAbsorptionReadiness.data.phaseRows.length < 6 ||
    !Array.isArray(localCourseAbsorptionReadiness.data.blockers) ||
    localCourseAbsorptionReadiness.data.blockers.length < 4 ||
    !localCourseAbsorptionReadiness.data.blockers.some((item) => item.id === "manual_transcription_pages" && item.count === 19) ||
    !localCourseAbsorptionReadiness.data.blockers.some((item) => item.id === "blank_source_replacement_pages" && item.count === 3) ||
    !/research-layer ingestion/i.test(localCourseAbsorptionReadiness.data.boundary || "") ||
    !/learner-facing course release/i.test(localCourseAbsorptionReadiness.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course absorption readiness endpoint failed");
  }

  const localCourseModuleAbsorptionSelfAudit = await request("/api/knowledge-browser/local-course-module-absorption-self-audit");
  if (
    localCourseModuleAbsorptionSelfAudit.status !== 200 ||
    localCourseModuleAbsorptionSelfAudit.data.educationOnly !== true ||
    localCourseModuleAbsorptionSelfAudit.data.productionReady !== false ||
    localCourseModuleAbsorptionSelfAudit.data.approvalStatus !== "not_approved" ||
    localCourseModuleAbsorptionSelfAudit.data.learnerFacingRelease !== false ||
    localCourseModuleAbsorptionSelfAudit.data.auditStatus !== "module_research_layer_absorbed_release_blocked" ||
    localCourseModuleAbsorptionSelfAudit.data.courseUsabilityStatus !== "usable_for_internal_reviewer_navigation_not_learner_release" ||
    localCourseModuleAbsorptionSelfAudit.data.modules !== 12 ||
    localCourseModuleAbsorptionSelfAudit.data.researchLayerReadyModules !== 12 ||
    localCourseModuleAbsorptionSelfAudit.data.localResearchReadyModules !== 12 ||
    localCourseModuleAbsorptionSelfAudit.data.publicReferenceReadyModules !== 12 ||
    localCourseModuleAbsorptionSelfAudit.data.rewriteDraftReadyModules !== 12 ||
    localCourseModuleAbsorptionSelfAudit.data.importedUniquePdfFiles !== 298 ||
    localCourseModuleAbsorptionSelfAudit.data.uniquePdfFiles !== 298 ||
    localCourseModuleAbsorptionSelfAudit.data.matchedKnowledgeNodes !== 360 ||
    localCourseModuleAbsorptionSelfAudit.data.readyForRewriteReviewNodes !== 360 ||
    localCourseModuleAbsorptionSelfAudit.data.rewriteDrafts !== 120 ||
    localCourseModuleAbsorptionSelfAudit.data.rewriteCandidatesReadyForSeparateReview !== 120 ||
    localCourseModuleAbsorptionSelfAudit.data.manualTranscriptionPages !== 19 ||
    localCourseModuleAbsorptionSelfAudit.data.sourceReplacementCandidates !== 3 ||
    localCourseModuleAbsorptionSelfAudit.data.p0ReviewEntries !== 22 ||
    localCourseModuleAbsorptionSelfAudit.data.p0ValidationBlockedEntries !== 22 ||
    localCourseModuleAbsorptionSelfAudit.data.realHumanInputEntries !== 0 ||
    localCourseModuleAbsorptionSelfAudit.data.highRiskLessonCount !== 12 ||
    localCourseModuleAbsorptionSelfAudit.data.highRiskLessonsWithPublicGrounding !== 12 ||
    localCourseModuleAbsorptionSelfAudit.data.highRiskReleaseBlockingLessons !== 12 ||
    localCourseModuleAbsorptionSelfAudit.data.highRiskCodexSelfReviewNotes !== 72 ||
    localCourseModuleAbsorptionSelfAudit.data.directSourceCandidateResolutions !== 5 ||
    localCourseModuleAbsorptionSelfAudit.data.writeAllowedNow !== false ||
    localCourseModuleAbsorptionSelfAudit.data.manualAuthorizationRequired !== true ||
    !Array.isArray(localCourseModuleAbsorptionSelfAudit.data.releaseBlockers) ||
    localCourseModuleAbsorptionSelfAudit.data.releaseBlockers.length < 5 ||
    !Array.isArray(localCourseModuleAbsorptionSelfAudit.data.moduleRows) ||
    localCourseModuleAbsorptionSelfAudit.data.moduleRows.length !== 12 ||
    !localCourseModuleAbsorptionSelfAudit.data.moduleRows.every((row) =>
      row.researchLayerStatus === "research_layer_absorbed_pending_review" &&
      row.releaseGateStatus === "blocked_pending_human_review_and_separate_approval" &&
      row.readyForRewriteReview === row.learnerFacingNodes &&
      row.wikipediaEvidenceDocs >= 2 &&
      row.rewriteDrafts >= 10) ||
    !/reviewer-facing education-only/i.test(localCourseModuleAbsorptionSelfAudit.data.boundary || "") ||
    !/does not approve learner-facing release/i.test(localCourseModuleAbsorptionSelfAudit.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course module absorption self-audit endpoint failed");
  }

  const localCourseModuleReviewDossier = await request("/api/knowledge-browser/local-course-module-review-dossier");
  if (
    localCourseModuleReviewDossier.status !== 200 ||
    localCourseModuleReviewDossier.data.educationOnly !== true ||
    localCourseModuleReviewDossier.data.productionReady !== false ||
    localCourseModuleReviewDossier.data.approvalStatus !== "not_approved" ||
    localCourseModuleReviewDossier.data.learnerFacingRelease !== false ||
    localCourseModuleReviewDossier.data.dossierStatus !== "module_review_dossier_ready_for_internal_navigation_release_blocked" ||
    localCourseModuleReviewDossier.data.dossierMode !== "module_browser_packet_for_local_course_absorption_review" ||
    localCourseModuleReviewDossier.data.modules !== 12 ||
    localCourseModuleReviewDossier.data.researchLayerReadyModules !== 12 ||
    localCourseModuleReviewDossier.data.rowsWithCoursePath !== 12 ||
    localCourseModuleReviewDossier.data.rowsWithPublicEvidenceSamples !== 12 ||
    localCourseModuleReviewDossier.data.rowsWithEntryNodes !== 12 ||
    localCourseModuleReviewDossier.data.rowsWithHighRiskBlockers !== 4 ||
    localCourseModuleReviewDossier.data.highRiskPreviewRows !== 12 ||
    localCourseModuleReviewDossier.data.highRiskPreviewReleaseBlockers !== 12 ||
    localCourseModuleReviewDossier.data.highRiskPreviewLearnerCitationApproved !== 0 ||
    localCourseModuleReviewDossier.data.learnerReleaseReadyModules !== 0 ||
    localCourseModuleReviewDossier.data.localCourseDocuments !== 298 ||
    localCourseModuleReviewDossier.data.matchedKnowledgeNodes !== 360 ||
    localCourseModuleReviewDossier.data.readyForRewriteReviewNodes !== 360 ||
    localCourseModuleReviewDossier.data.publicCorpusDocuments < 1000 ||
    localCourseModuleReviewDossier.data.wikipediaDocuments < 90 ||
    localCourseModuleReviewDossier.data.officialLikeDocuments < 200 ||
    localCourseModuleReviewDossier.data.curriculumPaths !== 12 ||
    localCourseModuleReviewDossier.data.totalPathLessons !== 360 ||
    localCourseModuleReviewDossier.data.p0SourceFitHandoffStatus !== "p0_real_reviewer_source_fit_handoff_ready_blocked_on_real_input" ||
    localCourseModuleReviewDossier.data.p0SourceFitRealReadyRows !== 0 ||
    localCourseModuleReviewDossier.data.p0SourceFitRealBlockedRows !== 22 ||
    localCourseModuleReviewDossier.data.p0SourceFitFixtureReadyRows !== 22 ||
    localCourseModuleReviewDossier.data.writeAuthorizationStatus !== "write_authorization_preview_ready_manual_required" ||
    localCourseModuleReviewDossier.data.writeAllowedNow !== false ||
    localCourseModuleReviewDossier.data.realHumanInputEntries !== 0 ||
    localCourseModuleReviewDossier.data.manualAuthorizationRequired !== true ||
    !Array.isArray(localCourseModuleReviewDossier.data.globalReleaseBlockers) ||
    localCourseModuleReviewDossier.data.globalReleaseBlockers.length < 5 ||
    !Array.isArray(localCourseModuleReviewDossier.data.moduleRows) ||
    localCourseModuleReviewDossier.data.moduleRows.length !== 12 ||
    !localCourseModuleReviewDossier.data.moduleRows.every((row) =>
      row.browserModuleId &&
      Array.isArray(row.topics) &&
      row.topics.length > 0 &&
      Array.isArray(row.entryNodeIds) &&
      row.entryNodeIds.length > 0 &&
      row.readyForRewriteReview === row.learnerFacingNodes &&
      row.coursePath?.pathId &&
      row.coursePath?.lessonCount === 30 &&
      row.coursePath?.unitCount === 3 &&
      Array.isArray(row.publicEvidenceSamples) &&
      row.publicEvidenceSamples.length >= 3 &&
      row.publicEvidenceSamples.every((sample) =>
        sample.name &&
        sample.url &&
        sample.family &&
        sample.excerptPolicy) &&
      row.wikipediaEvidenceDocs >= 2 &&
      row.learnerReleaseReady === false &&
      /^module_review_ready_/.test(row.reviewStatus || "") &&
      /review/i.test(row.nextReviewerAction || "") &&
      Array.isArray(row.highRiskLessonPreview) &&
      (row.highRiskReleaseBlockers === 0 || row.highRiskLessonPreview.length > 0) &&
      row.highRiskLessonPreview.every((lesson) =>
        lesson.lessonId &&
        lesson.nodeId &&
        lesson.topic &&
        lesson.publicGroundingStatus === "mapped_for_reviewer_not_release_approved" &&
        lesson.wikipediaRefCount >= 3 &&
        lesson.publicContextRefCount >= 2 &&
        lesson.learnerCitationApproved === false &&
        lesson.learnerFacingRelease === false &&
        lesson.approvalStatus === "not_approved" &&
        lesson.releaseBlocker === true &&
        Array.isArray(lesson.firstWikipediaRefs) &&
        lesson.firstWikipediaRefs.length >= 2 &&
        lesson.firstWikipediaRefs.every((ref) => ref.name && ref.url && ref.excerptPolicy) &&
        /human_public_grounding_review/i.test(lesson.nextGate || "")) &&
      /Reviewer-facing module dossier only/i.test(row.boundary || "")) ||
    !/module-level internal navigation readiness/i.test(localCourseModuleReviewDossier.data.completionRule || "") ||
    !/reviewer-facing education-only/i.test(localCourseModuleReviewDossier.data.boundary || "") ||
    !/public\/Wikipedia grounding candidates/i.test(localCourseModuleReviewDossier.data.boundary || "") ||
    !/does not make private PDFs public citations/i.test(localCourseModuleReviewDossier.data.boundary || "") ||
    !/stock recommendations/i.test(localCourseModuleReviewDossier.data.boundary || "") ||
    !/live signals/i.test(localCourseModuleReviewDossier.data.boundary || "") ||
    !/real-money guidance/i.test(localCourseModuleReviewDossier.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course module review dossier endpoint failed");
  }

  const localCourseReviewGateDashboard = await request("/api/knowledge-browser/local-course-review-gate-dashboard");
  if (
    localCourseReviewGateDashboard.status !== 200 ||
    localCourseReviewGateDashboard.data.educationOnly !== true ||
    localCourseReviewGateDashboard.data.productionReady !== false ||
    localCourseReviewGateDashboard.data.approvalStatus !== "not_approved" ||
    localCourseReviewGateDashboard.data.learnerFacingRelease !== false ||
    localCourseReviewGateDashboard.data.dashboardStatus !== "local_course_review_gate_dashboard_ready_release_blocked" ||
    localCourseReviewGateDashboard.data.dashboardMode !== "single_screen_internal_review_gate_for_local_course_absorption" ||
    localCourseReviewGateDashboard.data.localCourseDocuments !== 298 ||
    localCourseReviewGateDashboard.data.currentUniquePdfHashes !== 298 ||
    localCourseReviewGateDashboard.data.corpusDocsForCurrentUniqueHashes !== 298 ||
    localCourseReviewGateDashboard.data.modules !== 12 ||
    localCourseReviewGateDashboard.data.researchLayerReadyModules !== 12 ||
    localCourseReviewGateDashboard.data.publicReferenceReadyModules !== 12 ||
    localCourseReviewGateDashboard.data.modulesWithWikipediaGrounding !== 12 ||
    localCourseReviewGateDashboard.data.rewriteReadyNodes !== 360 ||
    localCourseReviewGateDashboard.data.matchedKnowledgeNodes !== 360 ||
    localCourseReviewGateDashboard.data.rewriteDrafts !== 120 ||
    localCourseReviewGateDashboard.data.highRiskLessons !== 12 ||
    localCourseReviewGateDashboard.data.highRiskLessonsWithPublicGrounding !== 12 ||
    localCourseReviewGateDashboard.data.highRiskLessonsWithAtLeastThreeWikipediaRefs !== 12 ||
    localCourseReviewGateDashboard.data.highRiskReleaseBlockingLessons !== 12 ||
    localCourseReviewGateDashboard.data.codexSelfReviewNotes !== 72 ||
    localCourseReviewGateDashboard.data.expectedSelfReviewNotes !== 72 ||
    localCourseReviewGateDashboard.data.highRiskRealReviewerValidationStatus !== "blocked_missing_real_reviewer_overlay_input" ||
    localCourseReviewGateDashboard.data.highRiskRealReviewerReadyLessons !== 0 ||
    localCourseReviewGateDashboard.data.highRiskRealReviewerBlockedLessons !== 12 ||
    localCourseReviewGateDashboard.data.highRiskRealReviewerNotesReady !== 0 ||
    localCourseReviewGateDashboard.data.highRiskRealReviewerNotesBlocked !== 72 ||
    localCourseReviewGateDashboard.data.highRiskDirectSourceDecisionsReady !== 0 ||
    localCourseReviewGateDashboard.data.highRiskDirectSourceDecisionsBlocked !== 5 ||
    localCourseReviewGateDashboard.data.realHumanInputEntries !== 0 ||
    localCourseReviewGateDashboard.data.p0Tasks !== 22 ||
    localCourseReviewGateDashboard.data.p0ReadyTasks !== 0 ||
    localCourseReviewGateDashboard.data.p0BlockedTasks !== 22 ||
    localCourseReviewGateDashboard.data.manualTranscriptionTasks !== 19 ||
    localCourseReviewGateDashboard.data.sourceReplacementTasks !== 3 ||
    localCourseReviewGateDashboard.data.sourceFitReadyRows !== 0 ||
    localCourseReviewGateDashboard.data.sourceFitBlockedRows !== 22 ||
    localCourseReviewGateDashboard.data.sourceFitFixtureReadyRows !== 22 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitValidationStatus !== "blocked_missing_real_reviewer_source_fit_input" ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitInputRows !== 1638 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitReadyRows !== 0 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitBlockedRows !== 1638 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitMissingFieldRows !== 1638 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitForbiddenHitRows !== 0 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitRealHumanInputEntries !== 0 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitLearnerCitationApprovedRows !== 0 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitCopiedTextApprovedRows !== 0 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitProgressMatrixStatus !== "node_public_source_fit_review_progress_matrix_ready_release_blocked" ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitProgressValidationStatus !== "blocked_missing_real_reviewer_source_fit_input" ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitProgressTotalPackets !== 35 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitReadyPackets !== 0 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitBlockedPackets !== 35 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitReadyModules !== 0 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitBlockedModules !== 12 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitOverallProgressPercent !== 0 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitProgressReadyRows !== 0 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitProgressBlockedRows !== 1638 ||
    localCourseReviewGateDashboard.data.nodePublicSourceFitFirstBlockedPacketId !== "node-public-source-fit-batch-001-packet" ||
    localCourseReviewGateDashboard.data.learnerCitationApprovedLessons !== 0 ||
    localCourseReviewGateDashboard.data.learnerReleaseReadyModules !== 0 ||
    localCourseReviewGateDashboard.data.writeAllowedNow !== false ||
    localCourseReviewGateDashboard.data.manualAuthorizationRequired !== true ||
    localCourseReviewGateDashboard.data.releaseBlockerCount < 5 ||
    !Array.isArray(localCourseReviewGateDashboard.data.summaryGates) ||
    localCourseReviewGateDashboard.data.summaryGates.length !== 10 ||
    !localCourseReviewGateDashboard.data.summaryGates.every((gate) =>
      gate.id &&
      gate.status &&
      gate.evidence &&
      gate.nextGate &&
      gate.learnerReleaseGatePassed === false) ||
    !localCourseReviewGateDashboard.data.summaryGates.some((gate) =>
      gate.id === "high_risk_self_review" &&
      /Codex self-review notes/i.test(gate.evidence || "")) ||
    !localCourseReviewGateDashboard.data.summaryGates.some((gate) =>
      gate.id === "high_risk_real_reviewer_overlay" &&
      /0\/72 real notes ready\/blocked/i.test(gate.evidence || "") &&
      /0\/5 direct-source decisions ready\/blocked/i.test(gate.evidence || "")) ||
    !localCourseReviewGateDashboard.data.summaryGates.some((gate) =>
      gate.id === "p0_real_reviewer_tasks" &&
      /0 real inputs/i.test(gate.evidence || "")) ||
    !localCourseReviewGateDashboard.data.summaryGates.some((gate) =>
      gate.id === "node_public_source_fit_review_input" &&
      /0\/1638 node public source-fit rows ready\/blocked/i.test(gate.evidence || "") &&
      /0 real inputs/i.test(gate.evidence || "")) ||
    !localCourseReviewGateDashboard.data.summaryGates.some((gate) =>
      gate.id === "node_public_source_fit_progress_matrix" &&
      /0\/35 packets ready\/blocked/i.test(gate.evidence || "") &&
      /0\/12 modules ready\/blocked/i.test(gate.evidence || "") &&
      /node-public-source-fit-batch-001-packet/i.test(gate.evidence || "")) ||
    !localCourseReviewGateDashboard.data.summaryGates.some((gate) =>
      gate.id === "write_authorization" &&
      /writeAllowedNow:false/i.test(gate.evidence || "")) ||
    !Array.isArray(localCourseReviewGateDashboard.data.moduleGateRows) ||
    localCourseReviewGateDashboard.data.moduleGateRows.length !== 12 ||
    !localCourseReviewGateDashboard.data.moduleGateRows.every((row) =>
      row.moduleId &&
      row.module &&
      row.coursePathId &&
      row.readyForRewriteReview === row.learnerFacingNodes &&
      row.localResearchReady === true &&
      row.publicReferenceReady === true &&
      row.wikipediaGroundingReady === true &&
      row.learnerCitationApproved === false &&
      row.learnerReleaseReady === false &&
      /^blocked_pending_/.test(row.reviewGateStatus || "") &&
      Array.isArray(row.samplePublicRefs) &&
      row.samplePublicRefs.length >= 2) ||
    !Array.isArray(localCourseReviewGateDashboard.data.highRiskLessonRows) ||
    localCourseReviewGateDashboard.data.highRiskLessonRows.length !== 12 ||
    !localCourseReviewGateDashboard.data.highRiskLessonRows.every((lesson) =>
      lesson.lessonId &&
      lesson.nodeId &&
      lesson.module &&
      lesson.topic &&
      lesson.wikipediaRefCount >= 3 &&
      lesson.publicContextRefCount >= 2 &&
      lesson.selfReviewStatus === "codex_self_review_complete_not_human_approved" &&
      lesson.learnerCitationApproved === false &&
      lesson.learnerFacingRelease === false &&
      lesson.releaseBlocker === true &&
      /human_public_grounding_review/i.test(lesson.nextGate || "")) ||
    !Array.isArray(localCourseReviewGateDashboard.data.nextActionRows) ||
    localCourseReviewGateDashboard.data.nextActionRows.length !== 10 ||
    !localCourseReviewGateDashboard.data.nextActionRows.some((row) => row.owner === "real_reviewer") ||
    !localCourseReviewGateDashboard.data.nextActionRows.some((row) =>
      /validate:local-course-high-risk-real-reviewer-overlay-input/.test(row.command || "")) ||
    !localCourseReviewGateDashboard.data.nextActionRows.some((row) =>
      /validate:local-course-p0-real-reviewer-source-fit-input/.test(row.command || "")) ||
    !localCourseReviewGateDashboard.data.nextActionRows.some((row) =>
      /validate:knowledge-node-public-source-fit-review-input/.test(row.command || "")) ||
    !localCourseReviewGateDashboard.data.nextActionRows.some((row) =>
      /check:knowledge-node-public-source-fit-review-progress-matrix/.test(row.command || "")) ||
    !/internal review-gate visibility/i.test(localCourseReviewGateDashboard.data.completionRule || "") ||
    !/does not prove learner-facing course readiness/i.test(localCourseReviewGateDashboard.data.completionRule || "") ||
    !/Reviewer-facing education-only/i.test(localCourseReviewGateDashboard.data.boundary || "") ||
    !/does not publish private PDFs/i.test(localCourseReviewGateDashboard.data.boundary || "") ||
    !/stock recommendations/i.test(localCourseReviewGateDashboard.data.boundary || "") ||
    !/live signals/i.test(localCourseReviewGateDashboard.data.boundary || "") ||
    !/real-money guidance/i.test(localCourseReviewGateDashboard.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course review gate dashboard endpoint failed");
  }

  const localCourseAbsorptionQueue = await request("/api/knowledge-browser/local-course-absorption-queue");
  if (
    localCourseAbsorptionQueue.status !== 200 ||
    localCourseAbsorptionQueue.data.educationOnly !== true ||
    localCourseAbsorptionQueue.data.productionReady !== false ||
    localCourseAbsorptionQueue.data.approvalStatus !== "not_approved" ||
    localCourseAbsorptionQueue.data.learnerFacingRelease !== false ||
    localCourseAbsorptionQueue.data.queueStatus !== "open_absorption_blocker_queue" ||
    localCourseAbsorptionQueue.data.readinessStatus !== "blocked_for_learner_facing_absorption" ||
    localCourseAbsorptionQueue.data.totalTasks !== 144 ||
    localCourseAbsorptionQueue.data.openTasks !== 144 ||
    localCourseAbsorptionQueue.data.byCategory?.manual_transcription !== 19 ||
    localCourseAbsorptionQueue.data.byCategory?.source_replacement !== 3 ||
    localCourseAbsorptionQueue.data.byCategory?.risky_language_review !== 2 ||
    localCourseAbsorptionQueue.data.byCategory?.reviewer_refinement !== 120 ||
    localCourseAbsorptionQueue.data.byPriority?.P0 !== 22 ||
    localCourseAbsorptionQueue.data.byPriority?.P1 !== 2 ||
    localCourseAbsorptionQueue.data.byPriority?.P2 !== 120 ||
    !Array.isArray(localCourseAbsorptionQueue.data.firstP0Tasks) ||
    localCourseAbsorptionQueue.data.firstP0Tasks.length !== 12 ||
    !Array.isArray(localCourseAbsorptionQueue.data.queueItems) ||
    localCourseAbsorptionQueue.data.queueItems.length < 16 ||
    !localCourseAbsorptionQueue.data.queueItems.every((item) =>
      item.status === "open" &&
      item.approvalStatus === "not_approved" &&
      item.learnerFacingRelease === false &&
      item.nextGate)
  ) {
    throw new Error("knowledge browser local course absorption operator queue endpoint failed");
  }

  const localCourseAbsorptionP0Workbench = await request("/api/knowledge-browser/local-course-absorption-p0-workbench");
  if (
    localCourseAbsorptionP0Workbench.status !== 200 ||
    localCourseAbsorptionP0Workbench.data.educationOnly !== true ||
    localCourseAbsorptionP0Workbench.data.productionReady !== false ||
    localCourseAbsorptionP0Workbench.data.approvalStatus !== "not_approved" ||
    localCourseAbsorptionP0Workbench.data.learnerFacingRelease !== false ||
    localCourseAbsorptionP0Workbench.data.workbenchStatus !== "p0_execution_ready" ||
    localCourseAbsorptionP0Workbench.data.totalP0Tasks !== 22 ||
    localCourseAbsorptionP0Workbench.data.manualTranscriptionTasks !== 19 ||
    localCourseAbsorptionP0Workbench.data.sourceReplacementTasks !== 3 ||
    localCourseAbsorptionP0Workbench.data.completedTasks !== 0 ||
    localCourseAbsorptionP0Workbench.data.openTasks !== 22 ||
    !Array.isArray(localCourseAbsorptionP0Workbench.data.workbenchTasks) ||
    localCourseAbsorptionP0Workbench.data.workbenchTasks.length < 8 ||
    !localCourseAbsorptionP0Workbench.data.workbenchTasks.every((item) =>
      item.status === "open" &&
      item.priority === "P0" &&
      item.approvalStatus === "not_approved" &&
      item.learnerFacingRelease === false &&
      item.previewPath &&
      item.previewUrl?.startsWith("/docs/local-course-low-extraction-previews/") &&
      Array.isArray(item.fieldSchema) &&
      item.fieldSchema.length >= 5 &&
      item.nextGate)
  ) {
    throw new Error("knowledge browser local course absorption P0 workbench endpoint failed");
  }

  const localCourseAbsorptionP0ReviewOverlay = await request("/api/knowledge-browser/local-course-absorption-p0-review-overlay");
  if (
    localCourseAbsorptionP0ReviewOverlay.status !== 200 ||
    localCourseAbsorptionP0ReviewOverlay.data.educationOnly !== true ||
    localCourseAbsorptionP0ReviewOverlay.data.productionReady !== false ||
    localCourseAbsorptionP0ReviewOverlay.data.approvalStatus !== "not_approved" ||
    localCourseAbsorptionP0ReviewOverlay.data.learnerFacingRelease !== false ||
    localCourseAbsorptionP0ReviewOverlay.data.overlayStatus !== "p0_review_not_started" ||
    localCourseAbsorptionP0ReviewOverlay.data.totalP0Tasks !== 22 ||
    localCourseAbsorptionP0ReviewOverlay.data.manualTranscriptionTasks !== 19 ||
    localCourseAbsorptionP0ReviewOverlay.data.sourceReplacementTasks !== 3 ||
    localCourseAbsorptionP0ReviewOverlay.data.notStartedTasks !== 22 ||
    localCourseAbsorptionP0ReviewOverlay.data.readyForValidationTasks !== 0 ||
    localCourseAbsorptionP0ReviewOverlay.data.acceptedForNextGateTasks !== 0 ||
    localCourseAbsorptionP0ReviewOverlay.data.blockedTasks !== 22 ||
    !Array.isArray(localCourseAbsorptionP0ReviewOverlay.data.reviewEntries) ||
    localCourseAbsorptionP0ReviewOverlay.data.reviewEntries.length < 8 ||
    !localCourseAbsorptionP0ReviewOverlay.data.reviewEntries.every((entry) =>
      entry.reviewStatus === "not_started" &&
      entry.validationStatus === "not_ready" &&
      entry.fieldCompletion?.requiredFieldsFilled === 0 &&
      entry.nextGate &&
      entry.previewUrl?.startsWith("/docs/local-course-low-extraction-previews/"))
  ) {
    throw new Error("knowledge browser local course absorption P0 review overlay endpoint failed");
  }

  const localCourseSourceReplacementDecisions = await request("/api/knowledge-browser/local-course-source-replacement-decisions");
  if (
    localCourseSourceReplacementDecisions.status !== 200 ||
    localCourseSourceReplacementDecisions.data.educationOnly !== true ||
    localCourseSourceReplacementDecisions.data.productionReady !== false ||
    localCourseSourceReplacementDecisions.data.approvalStatus !== "not_approved" ||
    localCourseSourceReplacementDecisions.data.learnerFacingRelease !== false ||
    localCourseSourceReplacementDecisions.data.worksheetStatus !== "source_replacement_decision_not_started" ||
    localCourseSourceReplacementDecisions.data.replacementTargets !== 3 ||
    localCourseSourceReplacementDecisions.data.targetsWithCandidates !== 3 ||
    localCourseSourceReplacementDecisions.data.targetsWithDirectReplacementCandidates !== 0 ||
    localCourseSourceReplacementDecisions.data.notStartedDecisions !== 3 ||
    localCourseSourceReplacementDecisions.data.readyDecisions !== 0 ||
    localCourseSourceReplacementDecisions.data.approvedReplacements !== 0 ||
    !Array.isArray(localCourseSourceReplacementDecisions.data.allowedDecisions) ||
    !localCourseSourceReplacementDecisions.data.allowedDecisions.includes("locate_external_original") ||
    !localCourseSourceReplacementDecisions.data.allowedDecisions.includes("use_neighbor_as_context_only") ||
    !Array.isArray(localCourseSourceReplacementDecisions.data.decisionRows) ||
    localCourseSourceReplacementDecisions.data.decisionRows.length !== 3 ||
    !localCourseSourceReplacementDecisions.data.decisionRows.every((row) =>
      row.decisionStatus === "not_started" &&
      row.validationStatus === "not_ready" &&
      row.directReplacementCandidateCount === 0 &&
      row.fieldCompletion?.requiredFieldsFilled === 0 &&
      Array.isArray(row.topCandidates) &&
      row.topCandidates.length >= 3 &&
      row.topCandidates.every((candidate) => candidate.reviewerUse?.includes("candidate_only")) &&
      row.nextGate === "source_replacement_decision_then_reexport_or_unrecoverable_review") ||
    !/reviewer-only control layer/i.test(localCourseSourceReplacementDecisions.data.boundary || "") ||
    !/does not replace files/i.test(localCourseSourceReplacementDecisions.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course source replacement decisions endpoint failed");
  }

  const localCourseRewriteIntake = await request("/api/knowledge-browser/local-course-rewrite-intake?limit=20");
  if (
    localCourseRewriteIntake.status !== 200 ||
    localCourseRewriteIntake.data.educationOnly !== true ||
    localCourseRewriteIntake.data.productionReady !== false ||
    localCourseRewriteIntake.data.total < 100 ||
    !Array.isArray(localCourseRewriteIntake.data.rewriteIntake) ||
    localCourseRewriteIntake.data.rewriteIntake.length !== 20 ||
    !localCourseRewriteIntake.data.rewriteIntake.every((item) =>
      Array.isArray(item.localCourseEvidence) &&
      item.localCourseEvidence.length >= 2 &&
      /structural_draft/i.test(JSON.stringify(item)) &&
      /Do not copy local PDF wording/i.test(JSON.stringify(item)))
  ) {
    throw new Error("knowledge browser local course rewrite intake endpoint failed");
  }

  const localCourseRewriteBatch = await request("/api/knowledge-browser/local-course-rewrite-batch-01?limit=6");
  if (
    localCourseRewriteBatch.status !== 200 ||
    localCourseRewriteBatch.data.educationOnly !== true ||
    localCourseRewriteBatch.data.productionReady !== false ||
    localCourseRewriteBatch.data.approvalStatus !== "not_approved" ||
    localCourseRewriteBatch.data.learnerFacingRelease !== false ||
    localCourseRewriteBatch.data.drafts < 24 ||
    localCourseRewriteBatch.data.modules < 12 ||
    !Array.isArray(localCourseRewriteBatch.data.draftItems) ||
    localCourseRewriteBatch.data.draftItems.length !== 6 ||
    !localCourseRewriteBatch.data.draftItems.every((item) =>
      item.status === "codex_local_course_assisted_draft" &&
      item.nextGate === "separate_reviewer_source_fit_and_originality_review" &&
      Array.isArray(item.localCourseEvidence) &&
      item.localCourseEvidence.length >= 2)
  ) {
    throw new Error("knowledge browser local course rewrite batch endpoint failed");
  }

  const localCourseRewriteBatches = await request("/api/knowledge-browser/local-course-rewrite-batches");
  if (
    localCourseRewriteBatches.status !== 200 ||
    localCourseRewriteBatches.data.educationOnly !== true ||
    localCourseRewriteBatches.data.productionReady !== false ||
    localCourseRewriteBatches.data.approvalStatus !== "not_approved" ||
    localCourseRewriteBatches.data.learnerFacingRelease !== false ||
    localCourseRewriteBatches.data.totalRewriteIntake < 120 ||
    localCourseRewriteBatches.data.totalDrafts < 120 ||
    !Array.isArray(localCourseRewriteBatches.data.batches) ||
    localCourseRewriteBatches.data.batches.length < 5 ||
    Object.keys(localCourseRewriteBatches.data.moduleCounts || {}).length < 12
  ) {
    throw new Error("knowledge browser local course rewrite batches endpoint failed");
  }

  const localCourseRewriteReview = await request("/api/knowledge-browser/local-course-rewrite-review");
  if (
    localCourseRewriteReview.status !== 200 ||
    localCourseRewriteReview.data.educationOnly !== true ||
    localCourseRewriteReview.data.productionReady !== false ||
    localCourseRewriteReview.data.approvalStatus !== "not_approved" ||
    localCourseRewriteReview.data.learnerFacingRelease !== false ||
    localCourseRewriteReview.data.draftsReviewed < 120 ||
    localCourseRewriteReview.data.readyForSeparateReviewCandidates < 120 ||
    localCourseRewriteReview.data.copyRiskIssues !== 0 ||
    localCourseRewriteReview.data.safetyIssues !== 0 ||
    localCourseRewriteReview.data.structureIssues !== 0 ||
    localCourseRewriteReview.data.maxSourceOverlap > 0.18
  ) {
    throw new Error("knowledge browser local course rewrite review endpoint failed");
  }

  const localCourseRefinementPacket = await request("/api/knowledge-browser/local-course-refinement-packet?limit=12");
  if (
    localCourseRefinementPacket.status !== 200 ||
    localCourseRefinementPacket.data.educationOnly !== true ||
    localCourseRefinementPacket.data.productionReady !== false ||
    localCourseRefinementPacket.data.approvalStatus !== "not_approved" ||
    localCourseRefinementPacket.data.learnerFacingRelease !== false ||
    localCourseRefinementPacket.data.packetStatus !== "ready_for_reviewer_refinement" ||
    localCourseRefinementPacket.data.candidateCards < 120 ||
    localCourseRefinementPacket.data.batches < 5 ||
    localCourseRefinementPacket.data.modules < 12 ||
    localCourseRefinementPacket.data.copyRiskIssues !== 0 ||
    localCourseRefinementPacket.data.safetyIssues !== 0 ||
    localCourseRefinementPacket.data.structureIssues !== 0 ||
    localCourseRefinementPacket.data.maxSourceOverlap > 0.18 ||
    localCourseRefinementPacket.data.highRiskOverlay?.lessonCount !== 12 ||
    localCourseRefinementPacket.data.highRiskOverlay?.reviewerNoteCount !== 72 ||
    !Array.isArray(localCourseRefinementPacket.data.directSourceCandidateResolutions) ||
    localCourseRefinementPacket.data.directSourceCandidateResolutions.length < 5 ||
    !Array.isArray(localCourseRefinementPacket.data.candidateCardsList) ||
    localCourseRefinementPacket.data.candidateCardsList.length !== 12
  ) {
    throw new Error("knowledge browser local course refinement packet endpoint failed");
  }

  const localCourseHighRiskSelfReviewOverlay = await request("/api/knowledge-browser/local-course-high-risk-self-review-overlay");
  if (
    localCourseHighRiskSelfReviewOverlay.status !== 200 ||
    localCourseHighRiskSelfReviewOverlay.data.educationOnly !== true ||
    localCourseHighRiskSelfReviewOverlay.data.productionReady !== false ||
    localCourseHighRiskSelfReviewOverlay.data.approvalStatus !== "not_approved" ||
    localCourseHighRiskSelfReviewOverlay.data.learnerFacingRelease !== false ||
    localCourseHighRiskSelfReviewOverlay.data.overlayStatus !== "codex_self_review_complete_not_approved" ||
    localCourseHighRiskSelfReviewOverlay.data.reviewerType !== "codex_self_review" ||
    localCourseHighRiskSelfReviewOverlay.data.lessonCount !== 12 ||
    localCourseHighRiskSelfReviewOverlay.data.reviewerNotesReviewed !== 72 ||
    localCourseHighRiskSelfReviewOverlay.data.expectedReviewerNotes !== 72 ||
    localCourseHighRiskSelfReviewOverlay.data.releaseBlockingNotes < 36 ||
    localCourseHighRiskSelfReviewOverlay.data.releaseReadyNotes !== 0 ||
    localCourseHighRiskSelfReviewOverlay.data.directSourceCandidateResolutionsReviewed !== 5 ||
    localCourseHighRiskSelfReviewOverlay.data.directSourceCandidatesApprovedForLearnerCitation !== 0 ||
    localCourseHighRiskSelfReviewOverlay.data.writeAllowedNow !== false ||
    localCourseHighRiskSelfReviewOverlay.data.approvalGatePassed !== false ||
    localCourseHighRiskSelfReviewOverlay.data.humanApprovalRequired !== true ||
    localCourseHighRiskSelfReviewOverlay.data.publicGroundingRequired !== true ||
    localCourseHighRiskSelfReviewOverlay.data.dimensionCounts?.source_fit !== 12 ||
    localCourseHighRiskSelfReviewOverlay.data.dimensionCounts?.release_gate !== 12 ||
    !Array.isArray(localCourseHighRiskSelfReviewOverlay.data.lessons) ||
    localCourseHighRiskSelfReviewOverlay.data.lessons.length !== 12 ||
    !localCourseHighRiskSelfReviewOverlay.data.lessons.every((lesson) =>
      lesson.selfReviewStatus === "codex_self_review_complete_not_approved" &&
      lesson.reviewerNotesReviewed === 6 &&
      lesson.releaseReadyNotes === 0) ||
    !Array.isArray(localCourseHighRiskSelfReviewOverlay.data.directSourceSelfReview) ||
    localCourseHighRiskSelfReviewOverlay.data.directSourceSelfReview.length !== 5 ||
    !localCourseHighRiskSelfReviewOverlay.data.directSourceSelfReview.every((row) =>
      row.selfReviewDecision === "keep_reviewer_only_background" &&
      row.releaseBlocker === true) ||
    !/Codex self-review scaffolding/i.test(localCourseHighRiskSelfReviewOverlay.data.completionRule || "") ||
    !/does not approve learner-facing release/i.test(localCourseHighRiskSelfReviewOverlay.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course high-risk self-review overlay endpoint failed");
  }

  const localCourseHighRiskPublicGroundingMatrix = await request("/api/knowledge-browser/local-course-high-risk-public-grounding-matrix");
  if (
    localCourseHighRiskPublicGroundingMatrix.status !== 200 ||
    localCourseHighRiskPublicGroundingMatrix.data.educationOnly !== true ||
    localCourseHighRiskPublicGroundingMatrix.data.productionReady !== false ||
    localCourseHighRiskPublicGroundingMatrix.data.approvalStatus !== "not_approved" ||
    localCourseHighRiskPublicGroundingMatrix.data.learnerFacingRelease !== false ||
    localCourseHighRiskPublicGroundingMatrix.data.matrixStatus !== "high_risk_public_grounding_mapped_not_approved" ||
    localCourseHighRiskPublicGroundingMatrix.data.lessonCount !== 12 ||
    localCourseHighRiskPublicGroundingMatrix.data.lessonsWithPublicGrounding !== 12 ||
    localCourseHighRiskPublicGroundingMatrix.data.lessonsMissingPublicGrounding !== 0 ||
    localCourseHighRiskPublicGroundingMatrix.data.lessonsWithAtLeastThreeWikipediaRefs !== 12 ||
    localCourseHighRiskPublicGroundingMatrix.data.totalWikipediaRefs < 36 ||
    localCourseHighRiskPublicGroundingMatrix.data.totalPublicContextRefs < 8 ||
    localCourseHighRiskPublicGroundingMatrix.data.directSourceCandidateResolutionsMapped !== 5 ||
    localCourseHighRiskPublicGroundingMatrix.data.directSourceCandidatesApprovedForLearnerCitation !== 0 ||
    localCourseHighRiskPublicGroundingMatrix.data.releaseReadyLessons !== 0 ||
    localCourseHighRiskPublicGroundingMatrix.data.learnerCitationApprovedLessons !== 0 ||
    localCourseHighRiskPublicGroundingMatrix.data.releaseBlockingLessons !== 12 ||
    localCourseHighRiskPublicGroundingMatrix.data.humanApprovalRequired !== true ||
    localCourseHighRiskPublicGroundingMatrix.data.writeAllowedNow !== false ||
    localCourseHighRiskPublicGroundingMatrix.data.approvalGatePassed !== false ||
    localCourseHighRiskPublicGroundingMatrix.data.modulesCovered !== 4 ||
    !Array.isArray(localCourseHighRiskPublicGroundingMatrix.data.lessonRows) ||
    localCourseHighRiskPublicGroundingMatrix.data.lessonRows.length !== 12 ||
    !localCourseHighRiskPublicGroundingMatrix.data.lessonRows.every((row) =>
      row.publicGroundingStatus === "mapped_for_reviewer_not_release_approved" &&
      Array.isArray(row.wikipediaRefs) &&
      row.wikipediaRefs.length >= 3 &&
      row.learnerCitationApproved === false &&
      row.releaseBlocker === true) ||
    !Array.isArray(localCourseHighRiskPublicGroundingMatrix.data.directSourceRows) ||
    localCourseHighRiskPublicGroundingMatrix.data.directSourceRows.length !== 5 ||
    !localCourseHighRiskPublicGroundingMatrix.data.directSourceRows.every((row) =>
      row.selfReviewDecision === "keep_reviewer_only_background" &&
      row.publicReplacementRefCount >= 3 &&
      row.learnerCitationApproved === false &&
      row.releaseBlocker === true) ||
    !/maps high-risk lessons to public\/Wikipedia grounding/i.test(localCourseHighRiskPublicGroundingMatrix.data.completionRule || "") ||
    !/do not approve learner-facing release/i.test(localCourseHighRiskPublicGroundingMatrix.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course high-risk public grounding matrix endpoint failed");
  }

  const localCourseHighRiskRealReviewerOverlayStarter = await request("/api/knowledge-browser/local-course-high-risk-real-reviewer-overlay-starter");
  if (
    localCourseHighRiskRealReviewerOverlayStarter.status !== 200 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.educationOnly !== true ||
    localCourseHighRiskRealReviewerOverlayStarter.data.productionReady !== false ||
    localCourseHighRiskRealReviewerOverlayStarter.data.approvalStatus !== "not_approved" ||
    localCourseHighRiskRealReviewerOverlayStarter.data.learnerFacingRelease !== false ||
    localCourseHighRiskRealReviewerOverlayStarter.data.starterStatus !== "high_risk_real_reviewer_overlay_starter_ready_blank" ||
    localCourseHighRiskRealReviewerOverlayStarter.data.starterMode !== "blank_real_reviewer_overlay_draft_for_12_high_risk_lessons" ||
    localCourseHighRiskRealReviewerOverlayStarter.data.draftStatus !== "blank_waiting_real_reviewer" ||
    localCourseHighRiskRealReviewerOverlayStarter.data.draftMode !== "human_owned_edit_copy_do_not_use_fixtures" ||
    !/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT\.json$/.test(localCourseHighRiskRealReviewerOverlayStarter.data.draftInputPath || "") ||
    localCourseHighRiskRealReviewerOverlayStarter.data.lessonCount !== 12 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.directSourceDecisionCount !== 5 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.expectedReviewerNotes !== 72 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.totalReviewerNotes !== 72 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.blankReviewerNotes !== 72 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.readyReviewerNotes !== 0 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.blankDirectSourceDecisions !== 5 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.readyDirectSourceDecisions !== 0 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.codexSelfReviewNotes !== 72 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.realHumanInputEntries !== 0 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.writeAllowedNow !== false ||
    localCourseHighRiskRealReviewerOverlayStarter.data.manualAuthorizationRequired !== true ||
    !Array.isArray(localCourseHighRiskRealReviewerOverlayStarter.data.allowedNoteDecisionValues) ||
    localCourseHighRiskRealReviewerOverlayStarter.data.allowedNoteDecisionValues.length !== 5 ||
    !Array.isArray(localCourseHighRiskRealReviewerOverlayStarter.data.allowedDirectSourceDecisionValues) ||
    localCourseHighRiskRealReviewerOverlayStarter.data.allowedDirectSourceDecisionValues.length !== 4 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.validationSummary?.validationStatus !== "blocked_missing_real_reviewer_overlay_input" ||
    localCourseHighRiskRealReviewerOverlayStarter.data.validationSummary?.blockedReviewerNotes !== 72 ||
    localCourseHighRiskRealReviewerOverlayStarter.data.validationSummary?.blockedDirectSourceDecisions !== 5 ||
    !Array.isArray(localCourseHighRiskRealReviewerOverlayStarter.data.lessonRows) ||
    localCourseHighRiskRealReviewerOverlayStarter.data.lessonRows.length !== 12 ||
    !localCourseHighRiskRealReviewerOverlayStarter.data.lessonRows.every((row) =>
      row.candidateId &&
      row.nodeId &&
      row.lessonId &&
      row.module &&
      row.topic &&
      row.publicGroundingStatus === "mapped_for_reviewer_not_release_approved" &&
      row.wikipediaRefCount >= 3 &&
      row.publicContextRefCount >= 2 &&
      row.selectedPublicRefCount >= 5 &&
      row.codexSelfReviewNotes === 6 &&
      row.realReviewerNotesRequired === 6 &&
      row.realReviewerNotesReady === 0 &&
      row.releaseBlocker === true &&
      row.learnerFacingRelease === false &&
      row.approvalStatus === "not_approved" &&
      /fill_6_real_reviewer_notes/i.test(row.nextGate || "") &&
      Array.isArray(row.publicRefSamples) &&
      row.publicRefSamples.length >= 3) ||
    !Array.isArray(localCourseHighRiskRealReviewerOverlayStarter.data.directSourceDecisionRows) ||
    localCourseHighRiskRealReviewerOverlayStarter.data.directSourceDecisionRows.length !== 5 ||
    !localCourseHighRiskRealReviewerOverlayStarter.data.directSourceDecisionRows.every((row) =>
      row.id &&
      row.sourceResolutionId &&
      row.candidateId &&
      row.module &&
      row.topic &&
      row.privateOrDirectCandidateSource &&
      row.publicReplacementRefCount >= 3 &&
      row.learnerCitationApproved === false &&
      row.learnerFacingRelease === false &&
      row.approvalStatus === "not_approved" &&
      row.decisionStatus === "blank_waiting_real_reviewer" &&
      row.readyForApprovalGate === false &&
      row.releaseBlocker === true &&
      /real_reviewer_resolves_direct_source_candidate/i.test(row.nextGate || "")) ||
    !/blank reviewer-owned draft/i.test(localCourseHighRiskRealReviewerOverlayStarter.data.completionRule || "") ||
    !/does not complete human review/i.test(localCourseHighRiskRealReviewerOverlayStarter.data.completionRule || "") ||
    !/Reviewer-facing education-only/i.test(localCourseHighRiskRealReviewerOverlayStarter.data.boundary || "") ||
    !/must not copy generated self-review into real notes/i.test(localCourseHighRiskRealReviewerOverlayStarter.data.boundary || "") ||
    !/approve learner-facing citations/i.test(localCourseHighRiskRealReviewerOverlayStarter.data.boundary || "") ||
    !/stock recommendations/i.test(localCourseHighRiskRealReviewerOverlayStarter.data.boundary || "") ||
    !/live signals/i.test(localCourseHighRiskRealReviewerOverlayStarter.data.boundary || "") ||
    !/real-money guidance/i.test(localCourseHighRiskRealReviewerOverlayStarter.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course high-risk real reviewer overlay starter endpoint failed");
  }

  const localCourseHighRiskRealReviewerOverlayInputValidation = await request("/api/knowledge-browser/local-course-high-risk-real-reviewer-overlay-input-validation");
  if (
    localCourseHighRiskRealReviewerOverlayInputValidation.status !== 200 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.educationOnly !== true ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.productionReady !== false ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.approvalStatus !== "not_approved" ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.learnerFacingRelease !== false ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.validationStatus !== "blocked_missing_real_reviewer_overlay_input" ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.validationMode !== "high_risk_real_reviewer_overlay_notes_and_direct_source_gate" ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.fixtureOnly !== false ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.lessonCount !== 12 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.readyLessons !== 0 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.blockedLessons !== 12 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.totalReviewerNotes !== 72 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.readyReviewerNotes !== 0 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.blockedReviewerNotes !== 72 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.directSourceDecisionCount !== 5 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.readyDirectSourceDecisions !== 0 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.blockedDirectSourceDecisions !== 5 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.missingFieldRows < 89 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.forbiddenHitRows !== 0 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.realHumanInputEntries !== 0 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.generatedDecisions !== 0 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.learnerCitationApprovedLessons !== 0 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.learnerCitationApprovedDirectSources !== 0 ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.writeAllowedNow !== false ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.manualAuthorizationRequired !== true ||
    !Array.isArray(localCourseHighRiskRealReviewerOverlayInputValidation.data.allowedNoteDecisionValues) ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.allowedNoteDecisionValues.length !== 5 ||
    !Array.isArray(localCourseHighRiskRealReviewerOverlayInputValidation.data.allowedDirectSourceDecisionValues) ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.allowedDirectSourceDecisionValues.length !== 4 ||
    !Array.isArray(localCourseHighRiskRealReviewerOverlayInputValidation.data.lessonValidationRows) ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.lessonValidationRows.length !== 12 ||
    !localCourseHighRiskRealReviewerOverlayInputValidation.data.lessonValidationRows.every((row) =>
      row.candidateId &&
      row.nodeId &&
      row.lessonId &&
      row.module &&
      row.topic &&
      row.validationStatus === "blocked_missing_real_reviewer_input" &&
      row.realReviewerNotesReady === 0 &&
      row.realReviewerNotesRequired === 6 &&
      row.releaseBlocker === true &&
      row.learnerFacingRelease === false &&
      row.approvalStatus === "not_approved" &&
      row.nextGate === "fill_6_real_reviewer_notes_then_revalidate") ||
    !Array.isArray(localCourseHighRiskRealReviewerOverlayInputValidation.data.noteValidationRows) ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.noteValidationRows.length !== 12 ||
    !localCourseHighRiskRealReviewerOverlayInputValidation.data.noteValidationRows.every((row) =>
      row.id &&
      row.sourceNoteId &&
      row.candidateId &&
      row.lessonId &&
      row.validationStatus === "blocked_missing_real_reviewer_input" &&
      row.readyForApprovalGate === false &&
      Array.isArray(row.missingFields) &&
      row.missingFields.length >= 5 &&
      Array.isArray(row.forbiddenHits) &&
      row.forbiddenHits.length === 0 &&
      row.nextGate === "fill_real_reviewer_note_then_revalidate") ||
    !Array.isArray(localCourseHighRiskRealReviewerOverlayInputValidation.data.directSourceValidationRows) ||
    localCourseHighRiskRealReviewerOverlayInputValidation.data.directSourceValidationRows.length !== 5 ||
    !localCourseHighRiskRealReviewerOverlayInputValidation.data.directSourceValidationRows.every((row) =>
      row.id &&
      row.sourceResolutionId &&
      row.candidateId &&
      row.module &&
      row.topic &&
      row.validationStatus === "blocked_missing_real_reviewer_input" &&
      row.readyForApprovalGate === false &&
      row.learnerCitationApproved === false &&
      row.releaseBlocker === true &&
      row.nextGate === "fill_direct_source_decision_then_revalidate") ||
    !/real reviewer-owned high-risk overlay input/i.test(localCourseHighRiskRealReviewerOverlayInputValidation.data.completionRule || "") ||
    !/does not generate reviewer notes/i.test(localCourseHighRiskRealReviewerOverlayInputValidation.data.completionRule || "") ||
    !/High-risk real reviewer overlay input validation/i.test(localCourseHighRiskRealReviewerOverlayInputValidation.data.boundary || "") ||
    !/no setup\/no signal\/no future outcome\/no strategy edge\/no real-money action/i.test(localCourseHighRiskRealReviewerOverlayInputValidation.data.boundary || "") ||
    !/stock recommendations/i.test(localCourseHighRiskRealReviewerOverlayInputValidation.data.boundary || "") ||
    !/live signals/i.test(localCourseHighRiskRealReviewerOverlayInputValidation.data.boundary || "") ||
    !/real-money guidance/i.test(localCourseHighRiskRealReviewerOverlayInputValidation.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course high-risk real reviewer overlay input validation endpoint failed");
  }

  const localCourseHighRiskReviewCockpit = await request("/api/knowledge-browser/local-course-high-risk-review-cockpit");
  if (
    localCourseHighRiskReviewCockpit.status !== 200 ||
    localCourseHighRiskReviewCockpit.data.educationOnly !== true ||
    localCourseHighRiskReviewCockpit.data.productionReady !== false ||
    localCourseHighRiskReviewCockpit.data.approvalStatus !== "not_approved" ||
    localCourseHighRiskReviewCockpit.data.learnerFacingRelease !== false ||
    localCourseHighRiskReviewCockpit.data.cockpitStatus !== "high_risk_review_cockpit_ready_blocked_on_real_input" ||
    localCourseHighRiskReviewCockpit.data.cockpitMode !== "codex_self_review_public_grounding_real_reviewer_queue" ||
    localCourseHighRiskReviewCockpit.data.lessonCount !== 12 ||
    localCourseHighRiskReviewCockpit.data.modules !== 4 ||
    localCourseHighRiskReviewCockpit.data.lessonsWithCodexSelfReview !== 12 ||
    localCourseHighRiskReviewCockpit.data.lessonsWithPublicGrounding !== 12 ||
    localCourseHighRiskReviewCockpit.data.lessonsMissingPublicGrounding !== 0 ||
    localCourseHighRiskReviewCockpit.data.expectedReviewerNotes !== 72 ||
    localCourseHighRiskReviewCockpit.data.codexSelfReviewNotes !== 72 ||
    localCourseHighRiskReviewCockpit.data.readyReviewerNotes !== 0 ||
    localCourseHighRiskReviewCockpit.data.blockedReviewerNotes !== 72 ||
    localCourseHighRiskReviewCockpit.data.directSourceDecisionCount !== 5 ||
    localCourseHighRiskReviewCockpit.data.readyDirectSourceDecisions !== 0 ||
    localCourseHighRiskReviewCockpit.data.blockedDirectSourceDecisions !== 5 ||
    localCourseHighRiskReviewCockpit.data.readyLessons !== 0 ||
    localCourseHighRiskReviewCockpit.data.blockedLessons !== 12 ||
    localCourseHighRiskReviewCockpit.data.realHumanInputEntries !== 0 ||
    localCourseHighRiskReviewCockpit.data.learnerCitationApprovedLessons !== 0 ||
    localCourseHighRiskReviewCockpit.data.learnerCitationApprovedDirectSources !== 0 ||
    localCourseHighRiskReviewCockpit.data.writeAllowedNow !== false ||
    localCourseHighRiskReviewCockpit.data.manualAuthorizationRequired !== true ||
    localCourseHighRiskReviewCockpit.data.approvalGatePassed !== false ||
    !Array.isArray(localCourseHighRiskReviewCockpit.data.moduleRows) ||
    localCourseHighRiskReviewCockpit.data.moduleRows.length !== 4 ||
    localCourseHighRiskReviewCockpit.data.moduleRows.reduce((sum, row) => sum + (row.requiredReviewerNotes || 0), 0) !== 72 ||
    !localCourseHighRiskReviewCockpit.data.moduleRows.every((row) =>
      row.status === "blocked_missing_real_reviewer_input" &&
      row.readyReviewerNotes === 0 &&
      row.blockedReviewerNotes === row.requiredReviewerNotes) ||
    !Array.isArray(localCourseHighRiskReviewCockpit.data.lessonRows) ||
    localCourseHighRiskReviewCockpit.data.lessonRows.length !== 12 ||
    !localCourseHighRiskReviewCockpit.data.lessonRows.every((row) =>
      row.candidateId &&
      row.nodeId &&
      row.lessonId &&
      row.codexSelfReviewNotes === 6 &&
      row.publicGroundingStatus === "mapped_for_reviewer_not_release_approved" &&
      row.wikipediaRefCount >= 3 &&
      row.realReviewerNotesReady === 0 &&
      row.realReviewerNotesRequired === 6 &&
      row.blockedReviewerNotes === 6 &&
      row.releaseBlocker === true &&
      row.learnerFacingRelease === false &&
      row.approvalStatus === "not_approved" &&
      Array.isArray(row.publicRefSamples) &&
      row.publicRefSamples.length >= 3) ||
    !Array.isArray(localCourseHighRiskReviewCockpit.data.directSourceRows) ||
    localCourseHighRiskReviewCockpit.data.directSourceRows.length !== 5 ||
    !localCourseHighRiskReviewCockpit.data.directSourceRows.every((row) =>
      row.sourceResolutionId &&
      row.codexSelfReviewDecision === "keep_reviewer_only_background" &&
      row.publicReplacementRefCount >= 3 &&
      row.validationStatus === "blocked_missing_real_reviewer_input" &&
      row.learnerCitationApproved === false &&
      row.releaseBlocker === true) ||
    !Array.isArray(localCourseHighRiskReviewCockpit.data.reviewerQueue) ||
    localCourseHighRiskReviewCockpit.data.reviewerQueue.length !== 17 ||
    !localCourseHighRiskReviewCockpit.data.commands.some((command) =>
      /check:local-course-high-risk-review-cockpit/.test(command)) ||
    !/does not complete human review/i.test(localCourseHighRiskReviewCockpit.data.completionRule || "") ||
    !/Reviewer-facing education-only/i.test(localCourseHighRiskReviewCockpit.data.boundary || "") ||
    !/does not generate real reviewer notes/i.test(localCourseHighRiskReviewCockpit.data.boundary || "") ||
    !/stock recommendations/i.test(localCourseHighRiskReviewCockpit.data.boundary || "") ||
    !/live signals/i.test(localCourseHighRiskReviewCockpit.data.boundary || "") ||
    !/real-money guidance/i.test(localCourseHighRiskReviewCockpit.data.boundary || "")
  ) {
    throw new Error("knowledge browser local course high-risk review cockpit endpoint failed");
  }

  const knowledgeCurriculum = await request("/api/knowledge-browser/curriculum");
  if (
    knowledgeCurriculum.status !== 200 ||
    knowledgeCurriculum.data.educationOnly !== true ||
    !Array.isArray(knowledgeCurriculum.data.paths) ||
    knowledgeCurriculum.data.paths.length < 12 ||
    !knowledgeCurriculum.data.paths.every((path) => path.boundary)
  ) {
    throw new Error("knowledge browser curriculum list endpoint failed");
  }

  const knowledgePathDetail = await request(`/api/knowledge-browser/curriculum/${encodeURIComponent(knowledgeCurriculum.data.paths[0].id)}`);
  if (
    knowledgePathDetail.status !== 200 ||
    knowledgePathDetail.data.path?.productionReady !== false ||
    !Array.isArray(knowledgePathDetail.data.path?.units) ||
    knowledgePathDetail.data.path.units.length < 1
  ) {
    throw new Error("knowledge browser curriculum detail endpoint failed");
  }

  await request("/api/auth/logout", { method: "POST", body: {} });
  if (jar.has("tg_session")) throw new Error("logout did not clear cookie");

  console.log("verify-api passed");
} finally {
  if (server.exitCode == null) {
    server.kill();
    await Promise.race([
      once(server, "exit"),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  }
}
