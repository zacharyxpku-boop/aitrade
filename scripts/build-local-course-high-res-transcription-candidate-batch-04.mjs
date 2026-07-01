import fs from "node:fs";

const highResPacketPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_HIGH_RES_REVIEW_PACKET.json";
const outputJsonPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_04.json";
const outputMdPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_04.md";

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
    pageNumber: 5,
    visibleTextExtract: [
      "The page continues K-line basics by naming the candle body, upper shadow, and lower shadow for yang/bullish-style candles.",
      "Visible notes describe a trading-day example and explain that a body is formed between open and close, while shadows extend toward high and low prices.",
      "The page introduces yin/bearish-style candles where close is below open, notes a red-body color convention, and describes market meaning in seller-pressure language.",
      "The page introduces star or doji-style candles where open and close are equal, including cross, T-shaped, and inverted T-shaped forms, then transitions into K-line classification.",
    ],
    educationOnlySummary: "This page can be rewritten as a neutral candlestick anatomy card: define body and shadows from OHLC values, explain that color conventions vary by platform, and convert bullish/bearish force claims into cautious chart-description vocabulary.",
    uncertainRegions: [
      "Some small labels in the embedded diagram need human confirmation before exact transcription.",
      "The red/green color convention should be generalized because market platforms and regions differ.",
    ],
    riskTermFlags: ["bearish_bullish_language", "ohlc_definition_language", "shadow_body_language", "market_meaning_language", "platform_color_convention"],
    rewriteAngles: [
      "candlestick_anatomy_not_signal",
      "ohlc_body_shadow_neutral_definitions",
      "color_convention_disclosure",
    ],
  },
  {
    documentId: "corpus_1580",
    pageNumber: 6,
    visibleTextExtract: [
      "The page classifies several yang-line and yin-line forms, including bare-head/bare-foot candles, lower-shadow candles, upper-and-lower-shadow candles, and star-line forms.",
      "Visible notes use formula-like OHLC conditions such as O=L and C=H, and examples with specific prices such as 0.5 yuan, 1.5 yuan, 1.2 yuan, and 0.2 yuan.",
      "The page repeatedly explains market meaning in force-comparison language: strong one-sided rise or fall, support tests, resistance, rebound, pressure, and buyer/seller struggle.",
      "The star-line section includes doji, T-line, inverted T-line, and one-price-line examples, describing balance, support, pressure, and low liquidity or halted-trading conditions.",
    ],
    educationOnlySummary: "This page can support a reviewer-only taxonomy draft: map named candlestick shapes to OHLC relationships and rewrite force-comparison statements as tentative visual interpretations that require public grounding and no action advice.",
    uncertainRegions: [
      "One yin-line formula appears visually ambiguous and should be checked against the source image by a reviewer.",
      "Specific price examples and halted-trading references should be removed or generalized unless the reviewer keeps them as non-advice illustrations.",
    ],
    riskTermFlags: ["kline_classification_language", "ohlc_formula_language", "specific_price_levels", "support_resistance_language", "force_comparison_language", "liquidity_condition_language"],
    rewriteAngles: [
      "shape_taxonomy_with_ohlc_conditions",
      "force_language_to_visual_interpretation",
      "remove_or_generalize_specific_price_examples",
    ],
  },
  {
    documentId: "corpus_1580",
    pageNumber: 7,
    visibleTextExtract: [
      "The page lists yang-line basic forms such as large yang lower-shadow, large yang upper-shadow, small yang, upper-shadow small-yang, lower-shadow small-yang, and yang iron-hammer forms.",
      "It then lists yin-line basic forms such as large yin, large yin lower-shadow, large yin upper-shadow, small yin, upper-shadow small-yin, and lower-shadow small-yin forms.",
      "Visible notes label some shapes as strong signals, warning signals, rebound possibilities, bottom-near hints, resistance, pressure, support, and trend continuation.",
      "The star-line section mentions cross, long-legged cross, T-line, inverted T-line, and one-price-line forms with warnings, support/resistance, shock/volatility, and liquidity language.",
    ],
    educationOnlySummary: "This page is high risk for learner-facing reuse because it attaches signal and forecast language to many candlestick names. It should be converted into a cautious vocabulary table, with all predictive wording removed or explicitly framed as unverified historical interpretation.",
    uncertainRegions: [
      "The embedded comparison chart is small and needs human verification before table-level transcription.",
      "Several handwritten annotations and subtitle fragments are not reliable enough for direct reuse.",
    ],
    riskTermFlags: ["signal_language", "warning_signal_language", "forecast_language", "support_resistance_language", "trend_continuation_language", "liquidity_condition_language"],
    rewriteAngles: [
      "pattern_names_as_vocabulary_only",
      "remove_signal_and_forecast_claims",
      "public_reference_cross_check_for_terms",
    ],
  },
  {
    documentId: "corpus_1580",
    pageNumber: 8,
    visibleTextExtract: [
      "The page gives study advice, saying learners should not memorize candlestick shapes mechanically and should analyze context such as market, time frame, and venue characteristics.",
      "It recommends the book Japanese Candlestick Charting Techniques, notes that beginners may find it hard to read, and suggests repeated review after some practical exposure.",
      "The page begins a homework section about converting K-line charts and line charts, with a requirement to complete the exercise by hand using ordinary paper if graph paper is unavailable.",
      "It shows a K-line force comparison table and lists selected yang-line types, including large yang lower-shadow, large yang upper-shadow, upper-shadow small-yang, and lower-shadow small-yang.",
    ],
    educationOnlySummary: "This page can become a learning-operations note rather than trading instruction: preserve the meta-learning idea of not rote-memorizing patterns, separate book/source recommendations for reviewer approval, and keep homework as a chart-literacy exercise.",
    uncertainRegions: [
      "Book citation details and copyright/source use need reviewer confirmation.",
      "The homework chart and force-comparison table need exact visual checking before any structured exercise is created.",
    ],
    riskTermFlags: ["study_advice_language", "source_recommendation_language", "copyright_review_required", "homework_instruction_language", "force_comparison_language"],
    rewriteAngles: [
      "meta_learning_not_pattern_prescription",
      "source_recommendation_requires_review",
      "chart_literacy_homework_without_trading_advice",
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
    id: `candidate_batch_04_page_${String(index + 1).padStart(2, "0")}`,
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
      "Cross-check candlestick terminology, source recommendations, and any market-meaning language against public references before learner-facing rewrite.",
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
  batchId: "local_course_high_res_transcription_candidate_batch_04",
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
  "# Local Course High-Resolution Transcription Candidate Batch 04",
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
