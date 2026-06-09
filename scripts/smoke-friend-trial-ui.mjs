import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const root = path.resolve(new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const port = process.env.SMOKE_UI_PORT || "4286";
const cdpPort = process.env.SMOKE_UI_CDP_PORT || "9227";
const dbPath = process.env.TRADEGYM_SQLITE_PATH || `./data/smoke-friend-trial-ui-${Date.now()}.sqlite`;
const base = `http://127.0.0.1:${port}`;
const tempFiles = [dbPath, `${dbPath}-shm`, `${dbPath}-wal`];
const browserProfile = path.join(root, `.edge-profile-friend-ui-smoke-${Date.now()}`);

let serverStdout = "";
let serverStderr = "";
let browserStdout = "";
let browserStderr = "";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rmTempFiles() {
  for (const file of tempFiles) fs.rmSync(path.resolve(root, file), { force: true });
}

function requestText(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      let data = "";
      response.on("data", (chunk) => { data += String(chunk); });
      response.on("end", () => resolve({ status: response.statusCode, text: data }));
    }).on("error", reject);
  });
}

async function requestJson(url) {
  const response = await requestText(url);
  return JSON.parse(response.text);
}

function findBrowser() {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  return candidates.find((item) => fs.existsSync(item));
}

function spawnServer() {
  return spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: { ...process.env, PORT: port, TRADEGYM_SQLITE_PATH: dbPath },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function spawnBrowser(browserPath) {
  fs.mkdirSync(browserProfile, { recursive: true });
  return spawn(browserPath, [
    "--headless=new",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${browserProfile}`,
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-sync",
    "--disable-extensions",
    `${base}/friend-trial`,
  ], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function stopProcess(child) {
  if (!child || child.exitCode != null || child.signalCode != null) return;
  child.kill("SIGKILL");
  await Promise.race([
    new Promise((resolve) => child.once("close", resolve)),
    delay(2000),
  ]);
}

async function cleanupTemp() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      rmTempFiles();
      fs.rmSync(browserProfile, { recursive: true, force: true });
      return;
    } catch {
      await delay(250);
    }
  }
  rmTempFiles();
  fs.rmSync(browserProfile, { recursive: true, force: true });
}

async function stopProfileProcesses() {
  if (process.platform !== "win32") return;
  await new Promise((resolve) => {
    const killer = spawn("wmic", [
      "process",
      "where",
      `CommandLine like '%${browserProfile.replace(/\\/g, "\\\\")}%'`,
      "call",
      "terminate",
    ], { stdio: "ignore" });
    killer.once("close", resolve);
    killer.once("error", resolve);
  });
}

async function waitForServer(server) {
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await requestText(`${base}/api/bootstrap`);
      if (response.status === 200) return;
    } catch {
      // Retry below.
    }
    if (server.exitCode != null) {
      throw new Error(`server exited: ${server.exitCode}\nstdout:\n${serverStdout}\nstderr:\n${serverStderr}`);
    }
    await delay(150);
  }
  throw new Error(`server did not start on ${base}\nstdout:\n${serverStdout}\nstderr:\n${serverStderr}`);
}

async function waitForBrowser(browser) {
  for (let i = 0; i < 80; i += 1) {
    try {
      const targets = await requestJson(`http://127.0.0.1:${cdpPort}/json`);
      if (targets.some((item) => item.type === "page")) return;
    } catch {
      // Retry below.
    }
    if (browser.exitCode != null) {
      throw new Error(`browser exited: ${browser.exitCode}\nstdout:\n${browserStdout}\nstderr:\n${browserStderr}`);
    }
    await delay(150);
  }
  throw new Error(`browser CDP did not start on ${cdpPort}\nstdout:\n${browserStdout}\nstderr:\n${browserStderr}`);
}

async function connectPage() {
  const targets = await requestJson(`http://127.0.0.1:${cdpPort}/json`);
  const target = targets.find((item) => item.type === "page" && item.url.includes("/friend-trial"))
    || targets.find((item) => item.type === "page");
  if (!target) throw new Error("No browser page target found");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  };
  return {
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        id += 1;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      ws.close();
    },
  };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || JSON.stringify(result.exceptionDetails));
  }
  return result.result.value;
}

async function runViewport(name, width, height, mobile = false) {
  const cdp = await connectPage();
  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: mobile ? 2 : 1,
      mobile,
    });
    await cdp.send("Page.navigate", { url: `${base}/friend-trial?smoke=${name}-${Date.now()}` });
    await delay(1800);
    const result = await evaluate(cdp, String.raw`(async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const click = (selector) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error("missing " + selector);
        element.scrollIntoView({ block: "center" });
        element.click();
      };
      const setValue = (selector, value) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error("missing " + selector);
        element.value = value;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      };
      const overflow = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const waitFor = async (predicate, label) => {
        for (let i = 0; i < 50; i += 1) {
          if (predicate()) return true;
          await sleep(120);
        }
        throw new Error("timeout waiting for " + label);
      };
      const state = [];
      let providerLabelSeen = false;
      let boundaryCopySeen = false;
      const snapshot = (label) => state.push({
        label,
        overflow: overflow(),
        todayDone: document.querySelector("#todayDone")?.textContent || "",
        selected: [...document.querySelectorAll("#options .option-btn")].map((item) => item.getAttribute("aria-pressed")),
        hasReview: Boolean(document.querySelector(".coach-review-sheet")),
      });

      snapshot("initial");
      providerLabelSeen = document.body.innerText.includes("本地 demo AI") || document.body.innerText.includes("mock provider");
      boundaryCopySeen = document.body.innerText.includes("不荐股")
        && document.body.innerText.includes("不实盘")
        && document.body.innerText.includes("不承诺收益");
      click("#friendStartLogin");
      await waitFor(() => document.body.innerText.includes("K 线训练"), "training view");
      const trainerSourceCard = document.querySelector("#scenarioSourceTrustCard");
      const trainerSourceText = trainerSourceCard?.innerText || "";
      const professionalReadingMap = document.querySelector(".professional-reading-map");
      const professionalReadingText = professionalReadingMap?.innerText || "";
      const professionalReadingOk = Boolean(professionalReadingMap)
        && professionalReadingMap.querySelectorAll(".professional-reading-grid article").length === 4
        && professionalReadingText.includes("D1 / H4")
        && professionalReadingText.includes("H1 /")
        && /M15|15m/i.test(professionalReadingText);
      const trainerSourceOk = Boolean(trainerSourceCard)
        && trainerSourceCard.querySelectorAll(".source-trust-grid article").length >= 3
        && trainerSourceText.includes("行情K线")
        && trainerSourceText.includes("AI批改")
        && /demo|mock|internal-demo|演示|本地演示/i.test(trainerSourceText);
      snapshot("afterStart");

      click("[data-quick-start-answer]");
      await waitFor(() => [...document.querySelectorAll("#options .option-btn")].some((item) => item.getAttribute("aria-pressed") === "true"), "quick answer option");
      snapshot("afterQuick");

      click("#submitBtn");
      await waitFor(() => document.querySelector("#feedbackPanel")?.innerText.includes("AI 教练批改单"), "coach review sheet");
      snapshot("afterSubmit");

      click('[data-training-result-action="replay"]');
      await waitFor(() => document.body.innerText.includes("回测误区") || document.body.innerText.includes("样本太少"), "replay/backtest view");
      snapshot("afterReplay");
      const replayText = document.body.innerText;
      const replaySourceCard = document.querySelector("#replaySourceTrustCard");
      const replaySourceText = replaySourceCard?.innerText || "";
      const replaySourceOk = Boolean(replaySourceCard)
        && replaySourceCard.querySelectorAll(".source-trust-grid article").length >= 3
        && replaySourceText.includes("行情K线")
        && replaySourceText.includes("新闻/情绪")
        && replaySourceText.includes("AI批改");

      click('.nav-item[data-view="coach"]');
      await waitFor(() => document.body.innerText.includes("AI复盘") || document.body.innerText.includes("AI 复盘"), "coach view");
      snapshot("afterCoach");

      click('.nav-item[data-view="community"]');
      await waitFor(() => Boolean(document.querySelector("#friendSubmitFeedback")), "feedback form");
      setValue("#friendFeedbackConfusing", "节奏清楚，但希望每一步更像课程。");
      setValue("#friendFeedbackHelpful", "AI复盘能指出我忽略了新闻背景。");
      setValue("#friendFeedbackContinue", "想继续练多周期和消息面案例。");
      click("#friendSubmitFeedback");
      await waitFor(() => {
        const text = document.querySelector("#friendFeedbackStatus")?.innerText || "";
        return Boolean(document.querySelector("#friendFeedbackStatus .feedback-next-card"))
          || text.includes("已提交")
          || text.includes("下一步训练")
          || text.includes("反馈后的下一步");
      }, "feedback confirmation");
      const feedbackConfirmed = Boolean(document.querySelector("#friendFeedbackStatus .feedback-next-card"));
      snapshot("afterFeedback");

      click('.nav-item[data-view="curriculum"]');
      await waitFor(() => document.body.dataset.currentView === "curriculum" || document.querySelector("#curriculumView")?.classList.contains("is-active"), "curriculum view");
      snapshot("afterCurriculum");
      const curriculumText = document.body.innerText;

      const finalText = document.body.innerText;
      const forbidden = ["朋友试用", "推荐买入", "推荐卖出", "保证收益", "连接券商", "自动下单"].filter((word) => finalText.includes(word));
      const backendEnglish = [
        "Mark next knowledge reviewed",
        "Practice package drill",
        "Open metric drill",
        "Open context drill",
        "Open source drill",
        "Learning path",
        "Preview",
        "Available course package",
        "Enrolled learning product",
        "Teacher assigned",
        "Login and refresh packages",
      ].filter((word) => curriculumText.includes(word));
      return {
        name: "${name}",
        width: innerWidth,
        height: innerHeight,
        overflow: overflow(),
        hasProviderLabel: providerLabelSeen,
        hasReplayContext: replayText.includes("新闻") || replayText.includes("情绪"),
        professionalReadingOk,
        trainerSourceOk,
        replaySourceOk,
        hasBoundaryCopy: boundaryCopySeen,
        hasFeedbackConfirmation: feedbackConfirmed,
        curriculumHasLearningCopy: curriculumText.includes("课程路径") || curriculumText.includes("学习路径"),
        todayDone: document.querySelector("#todayDone")?.textContent || "",
        states: state,
        forbidden,
        backendEnglish,
      };
    })()`);
    if (result.overflow > 2) throw new Error(`${name} horizontal overflow ${result.overflow}px`);
    if (!result.hasProviderLabel) throw new Error(`${name} missing demo/mock provider label`);
    if (!result.hasReplayContext) throw new Error(`${name} missing news/sentiment context in replay`);
    if (!result.professionalReadingOk) throw new Error(`${name} missing professional multi-timeframe reading map`);
    if (!result.trainerSourceOk) throw new Error(`${name} missing trainer source transparency card`);
    if (!result.replaySourceOk) throw new Error(`${name} missing replay source transparency card`);
    if (!result.hasBoundaryCopy) throw new Error(`${name} missing education-only boundary copy`);
    if (!result.hasFeedbackConfirmation) throw new Error(`${name} feedback confirmation missing`);
    if (!result.curriculumHasLearningCopy) throw new Error(`${name} missing curriculum learning copy`);
    if (result.forbidden.length) throw new Error(`${name} forbidden visible words: ${result.forbidden.join(", ")}`);
    if (result.backendEnglish.length) throw new Error(`${name} backend English in curriculum: ${result.backendEnglish.join(", ")}`);
    return result;
  } finally {
    cdp.close();
  }
}

rmTempFiles();

const browserPath = findBrowser();
if (!browserPath) {
  console.error(`No Edge or Chrome executable found on ${os.platform()}`);
  process.exit(1);
}

const server = spawnServer();
server.stdout.on("data", (chunk) => { serverStdout += String(chunk); });
server.stderr.on("data", (chunk) => { serverStderr += String(chunk); });

let browser;
try {
  await waitForServer(server);
  browser = spawnBrowser(browserPath);
  browser.stdout.on("data", (chunk) => { browserStdout += String(chunk); });
  browser.stderr.on("data", (chunk) => { browserStderr += String(chunk); });
  await waitForBrowser(browser);
  const desktop = await runViewport("desktop", 1366, 768, false);
  const mobile = await runViewport("mobile", 390, 844, true);
  console.log(JSON.stringify({
    ok: true,
    productionReady: false,
    route: "/friend-trial",
    desktop: {
      overflow: desktop.overflow,
      providerLabel: desktop.hasProviderLabel,
      replayContext: desktop.hasReplayContext,
      feedback: desktop.hasFeedbackConfirmation,
    },
    mobile: {
      overflow: mobile.overflow,
      providerLabel: mobile.hasProviderLabel,
      replayContext: mobile.hasReplayContext,
      feedback: mobile.hasFeedbackConfirmation,
    },
  }));
} catch (error) {
  console.error(error.message);
  if (serverStdout) console.error(`server stdout:\n${serverStdout}`);
  if (serverStderr) console.error(`server stderr:\n${serverStderr}`);
  if (browserStdout) console.error(`browser stdout:\n${browserStdout}`);
  if (browserStderr) console.error(`browser stderr:\n${browserStderr}`);
  process.exitCode = 1;
} finally {
  await stopProcess(browser);
  await stopProfileProcesses();
  await stopProcess(server);
  await cleanupTemp();
}
