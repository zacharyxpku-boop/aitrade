import fs from "node:fs";

const requiredFiles = [
  "AGENTS.md",
  "README.md",
  "PRODUCT_MVP.md",
  "CUSTOMER_TRIAL_OPERATOR_RUNBOOK.md",
  "CODE_SIDE_COMPLETION_AUDIT.md",
  "COMMERCIAL_TRIAL_RELEASE_PACKET.md",
  "scripts/verify-api.mjs",
  "scripts/smoke-customer-trial-room.mjs",
  "server.js",
  "app.js",
  "index.html",
  "storage.js",
];

const requiredContent = [
  ["package.json", "\"verify\""],
  ["package.json", "\"smoke:trial-room\""],
  ["AGENTS.md", "productionReady:false"],
  ["AGENTS.md", "No stock recommendations"],
  ["AGENTS.md", "No broker integration"],
  ["README.md", "npm.cmd run verify"],
  ["README.md", "npm.cmd run smoke:trial-room"],
  ["README.md", "Important Boundaries"],
  ["CUSTOMER_TRIAL_OPERATOR_RUNBOOK.md", "Stop Conditions"],
  ["CUSTOMER_TRIAL_OPERATOR_RUNBOOK.md", "Buyer Review Script"],
  ["CODE_SIDE_COMPLETION_AUDIT.md", "Requirement Audit"],
  ["CODE_SIDE_COMPLETION_AUDIT.md", "Residual Non-Code Risks"],
  ["CODE_SIDE_COMPLETION_AUDIT.md", "Completion Boundary"],
  ["COMMERCIAL_TRIAL_RELEASE_PACKET.md", "Release Verdict"],
  ["COMMERCIAL_TRIAL_RELEASE_PACKET.md", "Stop Rule"],
  ["COMMERCIAL_TRIAL_RELEASE_PACKET.md", "shareProgressMd"],
  ["PRODUCT_MVP.md", "customer-trial-room"],
  ["PRODUCT_MVP.md", "smoke:trial-room"],
  ["PRODUCT_MVP.md", "Teaching Evolution Lab Slice"],
  ["PRODUCT_MVP.md", "semantic guardrail"],
  ["PRODUCT_MVP.md", "Strategy-like outputs are treated as teaching samples"],
  ["scripts/verify-api.mjs", "customer-trial-room-shares"],
  ["scripts/verify-api.mjs", "customer-trial-room-buyer-review"],
  ["scripts/verify-api.mjs", "commercial-prototype-scorecard"],
  ["scripts/verify-api.mjs", "teaching-evolution-lab"],
  ["scripts/verify-api.mjs", "semantic-intent-guardrail-v1"],
  ["scripts/verify-api.mjs", "backtest-anti-hallucination-v1"],
  ["scripts/smoke-customer-trial-room.mjs", "productionReady"],
  ["scripts/smoke-customer-trial-room.mjs", "customer-trial-room-shares"],
  ["scripts/smoke-customer-trial-room.mjs", "customer-trial-room-buyer-review"],
  ["scripts/smoke-customer-trial-room.mjs", "buyerReviewRollup"],
  ["scripts/smoke-customer-trial-room.mjs", "actionDone"],
  ["scripts/smoke-customer-trial-room.mjs", "shareProgressMd"],
  ["scripts/smoke-customer-trial-room.mjs", "customer_trial_room_feedback_recorded"],
  ["scripts/smoke-customer-trial-room.mjs", "pilot_success_action_updated"],
  ["scripts/verify-api.mjs", "linkedCustomerTrialRoomShare"],
  ["scripts/verify-api.mjs", "customer-trial-room-shares/export"],
  ["server.js", "schemaVersion: \"customer-trial-room-v1\""],
  ["server.js", "customer-trial-room-buyer-review"],
  ["server.js", "schemaVersion: \"teaching-evolution-lab-v1\""],
  ["server.js", "semanticIntentGuardrail"],
  ["server.js", "teachingEvolutionLab"],
  ["server.js", "strategyAsTeachingSample"],
  ["server.js", "customerTrialRoomBuyerReviewRollup"],
  ["server.js", "linkedCustomerTrialRoomShare"],
  ["server.js", "customerTrialRoomSharesMarkdown"],
  ["server.js", "productionReady: false"],
  ["app.js", "sendCustomerTrialRoom"],
  ["app.js", "viewCustomerTrialRoomBuyerReview"],
  ["app.js", "exportCustomerTrialRoomShareProgress"],
  ["app.js", "refreshTeachingEvolutionLab"],
  ["app.js", "nodes.refreshProductReadiness?.addEventListener"],
  ["app.js", "data-room-share-buyer-review"],
  ["app.js", "data-room-share-buyer-objection"],
  ["index.html", "exportTrialRoomProgressMd"],
  ["index.html", "sendTrialRoom"],
  ["index.html", "dashboardView"],
  ["index.html", "loginDemo"],
  ["index.html", "friendTrialIntro"],
  ["index.html", "AI 交易教育训练场，不荐股，不实盘"],
  ["index.html", "friendStartLogin"],
  ["index.html", "本地 demo / mock provider"],
  ["index.html", "data-view=\"trainer\""],
  ["index.html", "teachingEvolutionLabList"],
  ["index.html", "语义防跑偏与教学样本进化"],
  ["index.html", "教育试用检查"],
  ["index.html", "不荐股、不出实盘信号、不承诺收益、不接真实资金"],
  ["app.js", "refreshFriendProviderStatus"],
  ["app.js", "friendStartLogin"],
  ["app.js", "friendCheckProvider"],
  ["app.js", "submitFriendTrialFeedback"],
  ["styles.css", "friend-hero"],
  ["styles.css", "friend-feedback-panel"],
  ["styles.css", "hero-actions"],
  ["storage.js", "customerTrialRoomShares"],
];

const forbiddenContent = [
  ["server.js", "productionReady: true"],
  ["app.js", "productionReady: true"],
  ["AGENTS.md", "broker-ready"],
  ["README.md", "broker-ready"],
  ["CUSTOMER_TRIAL_OPERATOR_RUNBOOK.md", "broker-ready"],
  ["CODE_SIDE_COMPLETION_AUDIT.md", "broker-ready"],
  ["COMMERCIAL_TRIAL_RELEASE_PACKET.md", "broker-ready"],
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    failures.push(`missing file: ${file}`);
  }
}

for (const [file, text] of requiredContent) {
  if (!fs.existsSync(file)) {
    failures.push(`missing file for content check: ${file}`);
    continue;
  }
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes(text)) {
    failures.push(`missing content in ${file}: ${text}`);
  }
}

for (const [file, text] of forbiddenContent) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, "utf8");
  if (content.includes(text)) {
    failures.push(`forbidden content in ${file}: ${text}`);
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  files: requiredFiles.length,
  contentChecks: requiredContent.length,
  forbiddenChecks: forbiddenContent.length,
  productionReady: false,
  educationOnly: true,
}));
