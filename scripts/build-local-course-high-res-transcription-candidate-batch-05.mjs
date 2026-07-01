import fs from "node:fs";

const highResPacketPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_HIGH_RES_REVIEW_PACKET.json";
const outputJsonPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_05.json";
const outputMdPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_05.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const seedCandidates = [
  {
    documentId: "corpus_1580",
    pageNumber: 9,
    visibleTextExtract: [
      "The page continues candlestick classification, listing yang-line, yin-line, and special star-line forms with market-meaning phrases.",
      "Visible notes include large-yang, small-yang, iron-hammer, large-yin with upper or lower shadow, small-yin with upper or lower shadow, doji, inverted T, one-price line, long-legged doji, and T-line examples.",
      "Several forms are described with strong trend, support, rebound, pressure, warning, limit-up or limit-down, and turning-point language.",
      "The page starts a K-line five-element drawing section and says chart drawing should show open, close, high, low, and time, but should not require a concrete trading strategy.",
    ],
    educationOnlySummary: "This page can be rewritten as a chart-literacy worksheet: classify candlestick shapes and require learners to identify OHLC and time elements, while removing signal, support, rebound, limit, and turning-point language from learner-facing explanations.",
    uncertainRegions: [
      "The embedded homework slide is small and should be checked manually before exact exercise transcription.",
      "Limit-up or limit-down wording may be market-specific and should be generalized or removed.",
    ],
    riskTermFlags: ["signal_language", "support_resistance_language", "rebound_language", "turning_point_language", "limit_move_language", "homework_instruction_language", "ohlc_drawing_language"],
    rewriteAngles: [
      "candlestick_classification_without_signal_claims",
      "ohlc_drawing_as_chart_literacy",
      "remove_market_specific_limit_language",
    ],
  },
  {
    documentId: "corpus_1580",
    pageNumber: 10,
    visibleTextExtract: [
      "The page includes a QR-code style note saying the corresponding review class should be requested from an assistant, then lists several practice examples.",
      "Examples mention A-coin, oil price, Ethereum, and BTC with specific open, high, low, close, time, and intraday movement values.",
      "Visible notes attach interpretations such as strong upper-shadow selling pressure, standard spindle-line formation, strong sideways or accumulation feature, and strong short-side force.",
      "The page begins a knowledge-summary table covering K-line origin, K-line components, and K-line classification, with difficulty stars and exam-focus notes.",
    ],
    educationOnlySummary: "This page should be split into a reviewer-only evidence card: practice examples may inform generic OHLC reading exercises, but coin/oil/BTC values and force interpretations need to be anonymized, public-grounded, or removed before any course use.",
    uncertainRegions: [
      "Several numerical example values are visually small and must not be treated as reliable transcription until human verified.",
      "The QR/contact prompt is not course knowledge and should not be learner-facing content.",
    ],
    riskTermFlags: ["qr_contact_language", "specific_asset_examples", "specific_price_levels", "selling_pressure_language", "force_comparison_language", "quiz_summary_language", "exam_focus_language"],
    rewriteAngles: [
      "anonymize_asset_examples",
      "practice_examples_without_market_prediction",
      "knowledge_summary_requires_public_grounding",
    ],
  },
  {
    documentId: "corpus_1580",
    pageNumber: 11,
    visibleTextExtract: [
      "The page continues the knowledge-summary table with K-line market meaning, K-line drawing logic, practical application, and recommended classic textbook sections.",
      "Visible notes describe yang lines as buyer-dominant, yin lines as seller-pressure, and star lines as turning-warning signals.",
      "The drawing-logic section mentions line-chart to K-line conversion, four-price mapping, and a mirror principle for judging the open-close relationship.",
      "The practical-application section discusses comparing long-short strength, combining daily and 15-minute charts, and misjudgment risks around doji and trend continuation or reversal.",
    ],
    educationOnlySummary: "This page can become a final-review checklist after heavy rewrite: keep OHLC mapping and study-plan structure, but convert buyer/seller dominance, turning-warning, multi-timeframe application, and reversal language into neutral risk-aware chart-reading notes.",
    uncertainRegions: [
      "The table is cropped at the top and should be matched with the previous page before final transcription.",
      "The recommended-textbook row needs citation and source-fit review before use.",
    ],
    riskTermFlags: ["market_meaning_language", "buyer_seller_dominance_language", "turning_warning_language", "multi_timeframe_language", "trend_reversal_language", "source_recommendation_language"],
    rewriteAngles: [
      "summary_table_as_reviewer_checklist",
      "neutralize_market_meaning_claims",
      "separate_textbook_recommendation_review",
    ],
  },
];

const highResPacket = readJson(highResPacketPath);
if (highResPacket.educationOnly !== true) fail("high-res packet must keep educationOnly:true");
if (highResPacket.productionReady !== false) fail("high-res packet must keep productionReady:false");
if (highResPacket.learnerFacingRelease !== false || highResPacket.approvalStatus !== "not_approved") {
  fail("high-res packet release gate drift");
}

const highResByKey = new Map((highResPacket.pageRows || []).map((row) => [`${row.documentId}:${row.pageNumber}`, row]));
const candidatePages = seedCandidates.map((candidate, index) => {
  const highRes = highResByKey.get(`${candidate.documentId}:${candidate.pageNumber}`);
  if (!highRes) fail(`missing high-res page ${candidate.documentId}:${candidate.pageNumber}`);
  if (highRes.visualEvidenceStatus !== "high_res_preview_ready_for_manual_transcription") {
    fail(`${candidate.documentId}:${candidate.pageNumber} is not a manual transcription high-res page`);
  }
  return {
    id: `candidate_batch_05_page_${String(index + 1).padStart(2, "0")}`,
    documentId: candidate.documentId,
    sourceId: highRes.sourceId,
    sourceRelativePath: highRes.sourceRelativePath,
    sourceModule: highRes.sourceModule,
    pageNumber: candidate.pageNumber,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    candidateStatus: "machine_assisted_visual_candidate_needs_human_review",
    acceptedForP0Overlay: false,
    highResPreviewPath: highRes.highResPreviewPath,
    highResPreviewBytes: highRes.highResPreviewBytes,
    visualEvidenceStatus: highRes.visualEvidenceStatus,
    visibleTextExtract: candidate.visibleTextExtract,
    educationOnlySummary: candidate.educationOnlySummary,
    uncertainRegions: candidate.uncertainRegions,
    riskTermFlags: candidate.riskTermFlags,
    rewriteAngles: candidate.rewriteAngles,
    requiredReviewerActions: [
      "Open the high-resolution preview and verify every visible-text extract.",
      "Cross-check candlestick terminology, textbook references, example-asset handling, and market-meaning language against public references before learner-facing rewrite.",
      "Rewrite source wording into original education-only explanations.",
      "Run P0 input validation, source-fit review, public grounding, originality review, and approval gates before learner-facing release.",
    ],
    nextGate: "human_review_before_p0_overlay_apply",
  };
});

const batch = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  batchStatus: "machine_assisted_transcription_candidates_ready_for_human_review",
  sourceHighResPacket: highResPacketPath,
  batchId: "local_course_high_res_transcription_candidate_batch_05",
  documentId: "corpus_1580",
  candidatePages: candidatePages.length,
  acceptedForP0OverlayPages: 0,
  blockedUntilHumanReviewedPages: candidatePages.length,
  riskTermFlagCounts: candidatePages.reduce((counts, page) => {
    for (const flag of page.riskTermFlags) counts[flag] = (counts[flag] || 0) + 1;
    return counts;
  }, {}),
  candidatePagesList: candidatePages,
  completionRule: "These machine-assisted visual candidates are not human transcriptions and cannot be applied to the P0 review overlay until a reviewer verifies text, resolves uncertain regions, checks public-source grounding, and confirms education-only rewriting boundaries.",
  boundary: "High-resolution transcription candidates are reviewer-only working notes. They do not perform accepted OCR, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course High-Resolution Transcription Candidate Batch 05",
  "",
  "Machine-assisted visual extraction candidates from high-resolution low-extraction previews.",
  "",
  `- Batch status: ${batch.batchStatus}`,
  `- Document: ${batch.documentId}`,
  `- Candidate pages: ${batch.candidatePages}`,
  `- Accepted for P0 overlay: ${batch.acceptedForP0OverlayPages}`,
  `- Blocked until human reviewed: ${batch.blockedUntilHumanReviewedPages}`,
  "",
  "## Candidate Pages",
  "",
  "| Page | Status | Risk flags | Summary |",
  "| ---: | --- | --- | --- |",
  ...candidatePages.map((page) => `| ${page.pageNumber} | ${page.candidateStatus} | ${page.riskTermFlags.join(", ")} | ${page.educationOnlySummary} |`),
  "",
  "## Completion Rule",
  "",
  batch.completionRule,
  "",
  "## Boundary",
  "",
  batch.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: batch.educationOnly,
  productionReady: batch.productionReady,
  learnerFacingRelease: batch.learnerFacingRelease,
  approvalStatus: batch.approvalStatus,
  batchStatus: batch.batchStatus,
  candidatePages: batch.candidatePages,
  acceptedForP0OverlayPages: batch.acceptedForP0OverlayPages,
  blockedUntilHumanReviewedPages: batch.blockedUntilHumanReviewedPages,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
