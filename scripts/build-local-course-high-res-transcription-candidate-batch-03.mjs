import fs from "node:fs";

const highResPacketPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_HIGH_RES_REVIEW_PACKET.json";
const outputJsonPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_03.json";
const outputMdPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_03.md";

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
    pageNumber: 1,
    visibleTextExtract: [
      "The page begins a K-line course with source/provenance notes, including references to a comic finance K-line origin source and a historical futures/stock trading course source.",
      "Visible notes say the lecture content uses reference material and that copyright belongs to the source, with infringement contact/removal language.",
      "The K-line birth section introduces historical background, tracing rice-market trading in Tokugawa-era Japan and mentioning Honma Munehisa.",
      "The page notes early daily rice-price recording by merchants, expansion from Osaka rice trading to financial markets, and later development into candlestick charts.",
    ],
    educationOnlySummary: "This page can be rewritten as a provenance and historical-origin note for a K-line basics lesson: explain that candlestick charts emerged from historical rice-price recording and later became a market visualization tool, while keeping source attribution and copyright review separate.",
    uncertainRegions: [
      "Exact URL text in the source screenshot needs human confirmation.",
      "Some historical proper nouns and date ranges should be checked against public references before learner-facing use.",
    ],
    riskTermFlags: ["source_provenance_language", "copyright_language", "historical_origin_language", "market_visualization_language"],
    rewriteAngles: [
      "source_provenance_before_rewrite",
      "kline_origin_history_with_public_grounding",
      "candlestick_as_visualization_not_signal",
    ],
  },
  {
    documentId: "corpus_1580",
    pageNumber: 2,
    visibleTextExtract: [
      "The page summarizes Tokugawa-period background: Edo-era social structure, Osaka as an economic center, and rice as an important exchange medium.",
      "It describes a rice futures prototype: sellers delivering rice to storehouses and receiving rice tickets, and buyers using tickets as claims against rice.",
      "Visible notes mention historical significance, Osaka Dojima rice trading, and large transaction scale compared with Japan's rice production.",
      "The page introduces Honma Munehisa's life, family background, rice-growing environment, and early personal traits tied to studying rice trade and price fluctuation.",
    ],
    educationOnlySummary: "This page can support a public-grounded history module: learners understand why price-recording tools arose from rice-market logistics, paper claims, and repeated price fluctuation, without treating the story as a trading method.",
    uncertainRegions: [
      "Transaction-scale figures and historical dates require public-source verification.",
      "Some screenshot subtitle text is not reliable enough for exact transcription.",
    ],
    riskTermFlags: ["historical_market_language", "futures_origin_language", "transaction_scale_language", "public_grounding_required"],
    rewriteAngles: [
      "rice_market_logistics_to_price_recording",
      "historical_context_not_method_claim",
      "public_reference_verification_needed",
    ],
  },
  {
    documentId: "corpus_1580",
    pageNumber: 3,
    visibleTextExtract: [
      "The page continues Honma Munehisa's trading-method and innovation story, mentioning information relay, price observations, and chart-style recording.",
      "Visible notes describe communication between family estates and empty-handed workmen, discovery of price fluctuation patterns, and using graphical records to analyze changes.",
      "It references trading achievements and market influence, including winning-streak narratives and rice-price influence, which require careful review.",
      "The page mentions a main work attributed to Honma Munehisa, later development into Japanese candlestick charting, and classic forms such as morning star, evening star, and three crows.",
    ],
    educationOnlySummary: "This page can be rewritten as a cautious history-and-terminology bridge: introduce chart recording, pattern names, and folklore-like claims as background vocabulary, while avoiding success claims or implying that historical anecdotes validate a trading edge.",
    uncertainRegions: [
      "Winning-streak and wealth-scale claims need source validation or removal.",
      "Pattern-name translations should be checked against public references before use.",
    ],
    riskTermFlags: ["success_claim_language", "market_influence_language", "pattern_name_language", "historical_claim_review_required"],
    rewriteAngles: [
      "folklore_claims_to_cautious_history",
      "pattern_names_as_vocabulary",
      "avoid_success_validation_claims",
    ],
  },
  {
    documentId: "corpus_1580",
    pageNumber: 4,
    visibleTextExtract: [
      "The page introduces basic K-line principles with a visual analogy and OHLC-style composition.",
      "Visible notes describe a candlestick chart as containing open, high, low, close, and time elements.",
      "The page introduces bullish/yang candle construction using open price, highest price, lowest price, close price, and time period, with an example of a green body when close is above open.",
      "It transitions to K-line structure after defining the core components.",
    ],
    educationOnlySummary: "This page can become a clean foundational concept card: define OHLC and candle body/wicks as chart-reading vocabulary, then use neutral examples to teach what a candle records rather than what action to take.",
    uncertainRegions: [
      "Example prices are visible but should be checked if retained.",
      "The color convention should be generalized because platforms differ between markets.",
    ],
    riskTermFlags: ["ohlc_definition_language", "bullish_candle_language", "example_price_language", "platform_color_convention"],
    rewriteAngles: [
      "ohlc_foundation_card",
      "candle_records_information_not_advice",
      "color_convention_disclosure",
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
    id: `candidate_batch_03_page_${String(index + 1).padStart(2, "0")}`,
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
      "Cross-check historical and terminology claims against public references before learner-facing rewrite.",
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
  batchId: "local_course_high_res_transcription_candidate_batch_03",
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
  "# Local Course High-Resolution Transcription Candidate Batch 03",
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
