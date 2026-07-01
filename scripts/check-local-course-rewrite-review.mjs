import fs from "node:fs";
import path from "node:path";

const indexPath = "docs/LOCAL_COURSE_REWRITE_BATCH_INDEX.json";
const corpusDir = "data/corpus";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function compactText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，。、“”‘’：；（）()《》「」『』,.:"';!?[\]{}<>]/g, "");
}

function grams(text, size = 8) {
  const clean = compactText(text);
  const out = new Set();
  for (let index = 0; index <= clean.length - size; index += 1) {
    out.add(clean.slice(index, index + size));
  }
  return out;
}

function overlapRate(draftText, sourceText) {
  const draftGrams = grams(draftText, 8);
  if (!draftGrams.size) return 0;
  const source = compactText(sourceText);
  let overlap = 0;
  for (const gram of draftGrams) {
    if (source.includes(gram)) overlap += 1;
  }
  return overlap / draftGrams.size;
}

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

function readCorpusDoc(documentId) {
  const file = path.join(corpusDir, `${documentId}.json`);
  if (!fs.existsSync(file)) return null;
  return readJson(file);
}

function draftText(item) {
  return [
    item.rewrittenIntro,
    item.conceptTeaching,
    item.localCourseSynthesis,
    item.observationPractice,
  ].filter(Boolean).join("\n");
}

const index = readJson(indexPath);
const rows = [];
const copyRiskIssues = [];
const safetyIssues = [];
const structureIssues = [];

for (const batchRef of index.batches || []) {
  const batch = readJson(batchRef.json);
  for (const item of batch.draftItems || []) {
    const text = JSON.stringify(item);
    const forbiddenHits = hardForbidden.filter((phrase) => text.includes(phrase));
    if (forbiddenHits.length) {
      safetyIssues.push({ id: item.id, nodeId: item.nodeId, forbiddenHits });
    }
    if (
      item.educationOnly !== true ||
      item.productionReady !== false ||
      item.learnerFacingRelease !== false ||
      item.approvalStatus !== "not_approved" ||
      item.status !== "codex_local_course_assisted_draft"
    ) {
      structureIssues.push({ id: item.id, nodeId: item.nodeId, reason: "release or status boundary drift" });
    }
    if (!Array.isArray(item.localCourseEvidence) || item.localCourseEvidence.length < 2) {
      structureIssues.push({ id: item.id, nodeId: item.nodeId, reason: "insufficient local course evidence" });
    }

    const evidenceDocs = (item.localCourseEvidence || [])
      .slice(0, 3)
      .map((evidence) => readCorpusDoc(evidence.documentId))
      .filter(Boolean);
    const localText = draftText(item);
    const overlapScores = evidenceDocs.map((doc) => ({
      documentId: doc.id,
      sourceRelativePath: doc.sourceRelativePath,
      overlapRate: Number(overlapRate(localText, doc.text || "").toFixed(4)),
    }));
    const maxOverlap = Math.max(0, ...overlapScores.map((score) => score.overlapRate));
    if (maxOverlap > 0.18) {
      copyRiskIssues.push({ id: item.id, nodeId: item.nodeId, maxOverlap, overlapScores });
    }
    const sourceFitScore =
      Math.min(40, (item.localCourseEvidence || []).length * 12) +
      (item.sourceMode === "local_private_course_reviewer_background_plus_green_source_boundary" ? 20 : 0) +
      (/不复用 PDF 原句|不复制 PDF/.test(`${item.conceptTeaching || ""} ${(item.reviewerNotes || []).join(" ")}`) ? 20 : 0) +
      (/structural_draft|not_approved|review/.test(text) ? 20 : 0);
    rows.push({
      id: item.id,
      batchId: item.batchId,
      nodeId: item.nodeId,
      lessonId: item.lessonId,
      module: item.module,
      topic: item.topic,
      localEvidenceCount: (item.localCourseEvidence || []).length,
      maxSourceOverlap: maxOverlap,
      sourceFitScore,
      originalityStatus: maxOverlap <= 0.18 ? "originality_pass_auto_screen" : "copy_risk_review_required",
      sourceFitStatus: sourceFitScore >= 80 ? "ready_for_separate_source_fit_review" : "source_fit_rework_required",
      approvalStatus: "not_approved",
      learnerFacingRelease: false,
      nextGate: "separate_reviewer_source_fit_and_originality_review",
      overlapScores,
    });
  }
}

const readyCandidates = rows.filter((row) =>
  row.originalityStatus === "originality_pass_auto_screen" &&
  row.sourceFitStatus === "ready_for_separate_source_fit_review"
);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  batches: index.batches?.length || 0,
  draftsReviewed: rows.length,
  readyForSeparateReviewCandidates: readyCandidates.length,
  copyRiskIssues: copyRiskIssues.length,
  safetyIssues: safetyIssues.length,
  structureIssues: structureIssues.length,
  maxSourceOverlap: Number(Math.max(0, ...rows.map((row) => row.maxSourceOverlap)).toFixed(4)),
  moduleCounts: rows.reduce((counts, row) => {
    counts[row.module] = (counts[row.module] || 0) + 1;
    return counts;
  }, {}),
  rows,
  issueSamples: {
    copyRiskIssues: copyRiskIssues.slice(0, 10),
    safetyIssues: safetyIssues.slice(0, 10),
    structureIssues: structureIssues.slice(0, 10),
  },
  boundary: "Automated originality/source-fit screen for internal review only. Passing this screen does not approve learner-facing release and does not convert local private course PDFs into public citations.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/LOCAL_COURSE_REWRITE_REVIEW_REPORT.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync("docs/LOCAL_COURSE_REWRITE_REVIEW_REPORT.md", [
  "# Local Course Rewrite Review Report",
  "",
  "Automated originality and source-fit screen for local-course-assisted rewrite drafts.",
  "",
  `- Drafts reviewed: ${report.draftsReviewed}`,
  `- Ready for separate review candidates: ${report.readyForSeparateReviewCandidates}`,
  `- Copy-risk issues: ${report.copyRiskIssues}`,
  `- Safety issues: ${report.safetyIssues}`,
  `- Structure issues: ${report.structureIssues}`,
  `- Max source overlap: ${report.maxSourceOverlap}`,
  `- Approval status: ${report.approvalStatus}`,
  `- Learner-facing release: ${report.learnerFacingRelease}`,
  "",
  "## Module Counts",
  "",
  ...Object.entries(report.moduleCounts).map(([module, count]) => `- ${module}: ${count}`),
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n"), "utf8");

if (rows.length < 120) fail(`expected at least 120 drafts reviewed, got ${rows.length}`);
if (readyCandidates.length < 120) fail(`expected 120 ready candidates, got ${readyCandidates.length}`);
if (copyRiskIssues.length) fail(`copy risk issues detected: ${copyRiskIssues.length}`);
if (safetyIssues.length) fail(`safety issues detected: ${safetyIssues.length}`);
if (structureIssues.length) fail(`structure issues detected: ${structureIssues.length}`);

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  draftsReviewed: report.draftsReviewed,
  readyForSeparateReviewCandidates: report.readyForSeparateReviewCandidates,
  copyRiskIssues: report.copyRiskIssues,
  safetyIssues: report.safetyIssues,
  structureIssues: report.structureIssues,
  maxSourceOverlap: report.maxSourceOverlap,
  outputJson: "docs/LOCAL_COURSE_REWRITE_REVIEW_REPORT.json",
  outputMd: "docs/LOCAL_COURSE_REWRITE_REVIEW_REPORT.md",
}, null, 2));
