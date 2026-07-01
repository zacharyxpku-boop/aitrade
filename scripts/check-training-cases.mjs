import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { trainingCases, trainingCaseReport } = require("../education-training-cases.js");

function fail(message) { throw new Error(message); }

const FORBIDDEN = /推荐买入|推荐卖出|保证收益|胜率承诺|实盘信号|自动下单|接入券商|真实资金建议/;

if (trainingCaseReport.educationOnly !== true) fail("training-case report must keep educationOnly true");
if (trainingCaseReport.productionReady !== false) fail("training-case report must keep productionReady false");
if (trainingCases.length < 360) fail(`expected >=360 training cases, got ${trainingCases.length}`);

const text = JSON.stringify(trainingCases);
if (FORBIDDEN.test(text)) fail("training cases contain forbidden action language");

// The single most important compliance assertion: no fabricated market data.
for (const item of trainingCases) {
  if (item.chartData?.status !== "licensed_data_pending") fail(`case ${item.id} must keep chartData licensed_data_pending`);
  if (item.chartData.instrument !== null || item.chartData.timeframe !== null || item.chartData.dateRange !== null) {
    fail(`case ${item.id} must not carry concrete market data before licensing`);
  }
  // No OHLC arrays sneaking in anywhere.
  if (/\b(open|high|low|close)\b\s*[:=]\s*\d/i.test(JSON.stringify(item))) fail(`case ${item.id} appears to embed price values`);

  if (!item.nodeId || !item.module || !item.topic) fail(`case ${item.id} missing taxonomy linkage`);
  if (!Array.isArray(item.annotations) || item.annotations.length < 4) fail(`case ${item.id} needs >=4 annotation slots`);
  if (!item.annotations.some((slot) => slot.role === "invalidation")) fail(`case ${item.id} missing invalidation slot`);
  if (!item.rubricRef?.nodeId) fail(`case ${item.id} missing rubric linkage`);
  if (!Array.isArray(item.mistakeTraps) || item.mistakeTraps.length < 1) fail(`case ${item.id} needs misconception traps`);
  if (!/education|观察训练/.test(item.learnerBoundary || "")) fail(`case ${item.id} missing education boundary`);
  if (item.reviewStatus !== "case_skeleton") fail(`case ${item.id} must remain case_skeleton`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  cases: trainingCases.length,
  casesWithEvidence: trainingCaseReport.casesWithEvidence,
  modules: trainingCaseReport.modules,
  chartDataStatus: trainingCaseReport.chartDataStatus,
  fabricatedPriceData: 0,
}, null, 2));
