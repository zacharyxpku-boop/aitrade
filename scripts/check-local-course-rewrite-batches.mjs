import fs from "node:fs";

const indexPath = "docs/LOCAL_COURSE_REWRITE_BATCH_INDEX.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const index = readJson(indexPath);
const hardForbidden = [
  "推荐买入",
  "推荐卖出",
  "保证收益",
  "胜率承诺",
  "实盘信号",
  "自动下单",
  "接入券商",
  "真实资金建议",
];

if (index.educationOnly !== true) fail("batch index must keep educationOnly true");
if (index.productionReady !== false) fail("batch index must keep productionReady false");
if (index.learnerFacingRelease !== false) fail("batch index must keep learnerFacingRelease false");
if (index.approvalStatus !== "not_approved") fail("batch index must remain not_approved");
if (index.totalRewriteIntake < 120) fail(`expected at least 120 rewrite intake rows, got ${index.totalRewriteIntake}`);
if (index.totalDrafts < 120) fail(`expected at least 120 generated drafts, got ${index.totalDrafts}`);
if (!Array.isArray(index.batches) || index.batches.length < 5) fail(`expected at least 5 batches, got ${index.batches?.length || 0}`);

const allItems = [];
for (const batchRef of index.batches) {
  const batch = readJson(batchRef.json);
  if (batch.educationOnly !== true) fail(`${batchRef.batchId} must keep educationOnly true`);
  if (batch.productionReady !== false) fail(`${batchRef.batchId} must keep productionReady false`);
  if (batch.learnerFacingRelease !== false) fail(`${batchRef.batchId} must keep learnerFacingRelease false`);
  if (batch.approvalStatus !== "not_approved") fail(`${batchRef.batchId} must remain not_approved`);
  if (batch.drafts < 24) fail(`${batchRef.batchId} should contain 24 drafts, got ${batch.drafts}`);
  if (batch.modules < 12) fail(`${batchRef.batchId} should cover 12 modules, got ${batch.modules}`);
  for (const item of batch.draftItems || []) {
    const text = JSON.stringify(item);
    const found = hardForbidden.filter((phrase) => text.includes(phrase));
    if (found.length) fail(`${item.id} contains forbidden phrase: ${found.join(", ")}`);
    if (item.educationOnly !== true) fail(`${item.id} must keep educationOnly true`);
    if (item.productionReady !== false) fail(`${item.id} must keep productionReady false`);
    if (item.learnerFacingRelease !== false) fail(`${item.id} must keep learnerFacingRelease false`);
    if (item.approvalStatus !== "not_approved") fail(`${item.id} must remain not_approved`);
    if (item.status !== "codex_local_course_assisted_draft") fail(`${item.id} unexpected status ${item.status}`);
    if (!Array.isArray(item.localCourseEvidence) || item.localCourseEvidence.length < 2) fail(`${item.id} missing local course evidence`);
    if ((item.rewrittenIntro || "").length < 70) fail(`${item.id} intro too thin`);
    if ((item.conceptTeaching || "").length < 70) fail(`${item.id} conceptTeaching too thin`);
    if ((item.localCourseSynthesis || "").length < 70) fail(`${item.id} localCourseSynthesis too thin`);
    if (!/不复用 PDF 原句|不复制 PDF/.test(`${item.conceptTeaching} ${(item.reviewerNotes || []).join(" ")}`)) {
      fail(`${item.id} missing no-copy PDF boundary`);
    }
    allItems.push(item);
  }
}

const nodeIds = new Set(allItems.map((item) => item.nodeId));
if (nodeIds.size !== allItems.length) fail(`duplicate node drafts detected: ${allItems.length - nodeIds.size}`);

const moduleCounts = allItems.reduce((counts, item) => {
  counts[item.module] = (counts[item.module] || 0) + 1;
  return counts;
}, {});
if (Object.keys(moduleCounts).length < 12) fail(`expected 12 module counts, got ${Object.keys(moduleCounts).length}`);
for (const [module, count] of Object.entries(moduleCounts)) {
  if (count < 10) fail(`module ${module} expected at least 10 drafts, got ${count}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  batches: index.batches.length,
  totalDrafts: allItems.length,
  uniqueNodeDrafts: nodeIds.size,
  modules: Object.keys(moduleCounts).length,
  sourceDocuments: index.sourceDocuments,
  sourceChunks: index.sourceChunks,
  outputJson: indexPath,
}, null, 2));
