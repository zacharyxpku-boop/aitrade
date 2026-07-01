import fs from "node:fs/promises";

const worksheetPath = "docs/FIRST_REVIEWER_WORKSHEET.json";
const dryRunPacketPath = "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.json";
const outputMd = "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

async function exists(path) {
  return fs.access(path).then(() => true, () => false);
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function flattenLessons(worksheet) {
  return (worksheet.batchWorksheets || []).flatMap((batch) => (batch.lessons || []).map((lesson) => ({
    ...lesson,
    batchId: batch.batchId,
  })));
}

function roleForFamily(family, lesson) {
  const moduleText = `${lesson.module || ""} ${lesson.topic || ""}`.toLowerCase();
  if (family === "Project Gutenberg" || family === "Internet Archive") {
    return {
      role: "historical_context",
      confidence: "medium",
      reviewerDecision: "Use only for historical language, terminology evolution, and observation framing; remove any buy/sell or profit wording.",
    };
  }
  if (family === "BLS" || family === "BEA") {
    return {
      role: "macro_data_context",
      confidence: moduleText.includes("macro") ? "high" : "medium",
      reviewerDecision: "Use for data-definition and release-reading boundaries; do not use as chart-pattern proof.",
    };
  }
  if (family === "Treasury" || family === "Federal Reserve") {
    return {
      role: "macro_rates_context",
      confidence: "medium",
      reviewerDecision: "Use for macro/rates context or data-boundary notes; do not convert into directional market claims.",
    };
  }
  if (family === "SEC") {
    return {
      role: "filing_or_data_boundary",
      confidence: "medium",
      reviewerDecision: "Use for filing/data-access/disclosure-literacy boundaries; direct prose support needs human confirmation.",
    };
  }
  if (family === "Investor.gov") {
    return {
      role: "investor_protection_boundary",
      confidence: "medium",
      reviewerDecision: "Use for investor-protection, glossary, and fraud-warning boundaries; do not use to define chart structures.",
    };
  }
  if (family === "CFTC") {
    return {
      role: "fraud_or_market_boundary",
      confidence: "medium",
      reviewerDecision: "Use for commodity, fraud, system-risk, or market-oversight boundaries; do not use as chart-pattern authority unless source title directly fits.",
    };
  }
  if (family === "nist.gov") {
    return {
      role: "technical_data_integrity_boundary",
      confidence: "medium",
      reviewerDecision: "Use for data-integrity or technical boundary notes only.",
    };
  }
  return {
    role: "metadata_only_until_confirmed",
    confidence: "low",
    reviewerDecision: "Keep as metadata or source-boundary context until a human confirms direct lesson fit.",
  };
}

function directFitCandidate(source, lesson) {
  const text = `${source.name || ""} ${source.relevanceSignal || ""} ${lesson.topic || ""} ${lesson.module || ""}`.toLowerCase();
  if (/filing|edgar|developer|xbrl|data/.test(text) && source.family === "SEC") return true;
  if (/cpi|ppi|gdp|employment|bea|bls|release/.test(text) && (source.family === "BLS" || source.family === "BEA")) return true;
  if (/fraud|phony|ai trading bot|advisory|scam/.test(text) && (source.family === "CFTC" || source.family === "Investor.gov")) return true;
  if (/historical|classic|gutenberg|archive/.test(text) && (source.family === "Project Gutenberg" || source.family === "Internet Archive")) return true;
  return false;
}

function buildLessonRow(lesson) {
  const refs = lesson.sourceRefsToInspect || [];
  const familyRows = (lesson.sourceFamilies || []).map((family) => {
    const sourceRefs = refs.filter((ref) => ref.family === family);
    const role = roleForFamily(family, lesson);
    const hasDirectCandidate = sourceRefs.some((source) => directFitCandidate(source, lesson));
    return {
      family,
      suggestedRole: hasDirectCandidate ? "direct_candidate_needs_human_confirmation" : role.role,
      confidence: hasDirectCandidate ? "medium" : role.confidence,
      sourceRefsToInspect: sourceRefs.map((source) => ({
        sourceId: source.sourceId,
        name: source.name,
        url: source.url,
        sourceUseTier: source.sourceUseTier,
        reliabilityGrade: source.reliabilityGrade,
        relevanceSignal: source.relevanceSignal,
      })),
      reviewerDecision: hasDirectCandidate
        ? "Inspect source title and metadata. If it directly supports the lesson topic, keep as direct evidence; otherwise downgrade to boundary-only context."
        : role.reviewerDecision,
    };
  });
  return {
    lessonId: lesson.lessonId,
    batchId: lesson.batchId,
    module: lesson.module,
    topic: lesson.topic,
    riskLevel: lesson.riskLevel,
    currentGrade: lesson.currentGrade,
    mustRemainStructuralDraft: lesson.mustRemainStructuralDraft,
    firstDecision: lesson.riskLevel === "high"
      ? "Resolve source role before any prose rewrite."
      : "Use the high-risk decision in the same batch as context, then confirm roles.",
    sourceFamilyRoles: familyRows,
    humanDecisionRequired: true,
    allowedNextStatus: "not_started_or_ready_for_separate_human_approval_review_only_after_real_notes",
  };
}

function renderMarkdown(report) {
  const lines = [
    "# First Reviewer Source Role Decision Table",
    "",
    "This table pre-sorts source-family roles for the first reviewer batches.",
    "It is a reviewer aid only; every source role still needs human confirmation before notes or rewrites.",
    "",
    "## Summary",
    "",
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson rows: ${report.lessonRows.length}`,
    `- Source-family decisions: ${report.sourceFamilyDecisions}`,
    `- High-risk lessons: ${report.highRiskLessons}`,
    `- Direct candidates needing confirmation: ${report.directCandidatesNeedingConfirmation}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Role Legend",
    "",
    ...report.roleLegend.map((row) => `- ${row.role}: ${row.meaning}`),
    "",
    "## Decision Rows",
    "",
    "| Batch | Lesson | Risk | Family | Suggested role | Confidence | Reviewer decision |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const lesson of report.lessonRows) {
    for (const family of lesson.sourceFamilyRoles) {
      lines.push(`| ${lesson.batchId} | ${lesson.lessonId} | ${lesson.riskLevel} | ${family.family} | ${family.suggestedRole} | ${family.confidence} | ${family.reviewerDecision.replaceAll("|", "/")} |`);
    }
  }
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(report.boundary);
  lines.push("");
  return lines.join("\n");
}

const [worksheet, dryRunPacket, realStatusOverlayPresent] = await Promise.all([
  readJson(worksheetPath),
  readJson(dryRunPacketPath),
  exists(realStatusPath),
]);

assertEnvelope(worksheet, "first reviewer worksheet");
assertEnvelope(dryRunPacket, "first reviewer dry-run packet");
if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; source-role table must not run against real status notes`);
if (worksheet.worksheetLessons !== 12) fail("source-role table must cover 12 first-reviewer lessons");
if (worksheet.highRiskLessons !== 2) fail("source-role table must keep two high-risk lessons visible");
if (dryRunPacket.realStatusOverlayPresent !== false || dryRunPacket.realReadyBatches !== 0) fail("dry-run packet must keep real status absent and ready batches at 0");

const lessons = flattenLessons(worksheet);
if (lessons.length !== 12) fail("flattened first reviewer lessons must equal 12");
const lessonRows = lessons.map(buildLessonRow);
for (const lesson of lessonRows) {
  if (lesson.currentGrade !== "structural_draft") fail(`${lesson.lessonId} must stay structural_draft`);
  if (lesson.mustRemainStructuralDraft !== true) fail(`${lesson.lessonId} must keep mustRemainStructuralDraft`);
  for (const family of lesson.sourceFamilyRoles) {
    for (const source of family.sourceRefsToInspect) {
      if (!String(source.sourceUseTier || "").startsWith("green_")) fail(`${lesson.lessonId} has non-green source ${source.sourceId}`);
    }
  }
}

const directCandidates = lessonRows.flatMap((lesson) => lesson.sourceFamilyRoles).filter((row) => row.suggestedRole === "direct_candidate_needs_human_confirmation").length;
const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  targetBatches: worksheet.targetBatches,
  sourceWorksheet: worksheetPath,
  sourceDryRunPacket: dryRunPacketPath,
  realStatusPath,
  realStatusOverlayPresent,
  highRiskLessons: worksheet.highRiskLessons,
  sourceFamilyDecisions: lessonRows.reduce((sum, lesson) => sum + lesson.sourceFamilyRoles.length, 0),
  directCandidatesNeedingConfirmation: directCandidates,
  roleLegend: [
    { role: "direct_candidate_needs_human_confirmation", meaning: "Potentially direct evidence, but a human must confirm source-topic fit before use." },
    { role: "filing_or_data_boundary", meaning: "SEC filing/data/disclosure literacy boundary, not copied prose." },
    { role: "investor_protection_boundary", meaning: "Investor-protection or fraud-warning boundary, not chart authority." },
    { role: "fraud_or_market_boundary", meaning: "CFTC fraud/system/market-risk boundary, not trading advice." },
    { role: "macro_data_context", meaning: "BLS/BEA macro data definition or release-reading context." },
    { role: "macro_rates_context", meaning: "Rates/macro context without directional claims." },
    { role: "historical_context", meaning: "Public-domain historical language only, with advice/profit wording removed." },
    { role: "metadata_only_until_confirmed", meaning: "Metadata or boundary-only until human confirmation." },
  ],
  lessonRows,
  boundary: "This source-role table is reviewer-facing scaffolding only. It does not approve sources, create real reviewer notes, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  targetBatches: report.targetBatches,
  lessonRows: report.lessonRows.length,
  sourceFamilyDecisions: report.sourceFamilyDecisions,
  highRiskLessons: report.highRiskLessons,
  directCandidatesNeedingConfirmation: report.directCandidatesNeedingConfirmation,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  outputJson,
  outputMd,
}, null, 2));
