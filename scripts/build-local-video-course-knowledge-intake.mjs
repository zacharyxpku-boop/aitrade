import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const intakeIdPrefix = process.env.TRADEGYM_VIDEO_COURSE_INTAKE_ID_PREFIX || "local_video_course_intake";
const inventoryPath = process.env.TRADEGYM_VIDEO_COURSE_SOURCE_INVENTORY_JSON || `docs/${artifactPrefix}_SOURCE_INVENTORY.json`;
const outputJsonPath = process.env.TRADEGYM_VIDEO_COURSE_INTAKE_JSON || `docs/${artifactPrefix}_KNOWLEDGE_INTAKE.json`;
const outputMdPath = process.env.TRADEGYM_VIDEO_COURSE_INTAKE_MD || `docs/${artifactPrefix}_KNOWLEDGE_INTAKE.md`;
const configuredExpectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || "0", 10);

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function classify(row) {
  const text = normalize(`${row.lessonTitle} ${row.fileName}`);
  if (/terminology|基本术语/.test(text)) return ["terminology", "foundations"];
  if (/chart basics|price action|图表基础|价格走势/.test(text)) return ["chart_reading_basics", "price_action_setups"];
  if (/forex basics|外汇基本知识/.test(text)) return ["forex_basics", "foundations"];
  if (/my setup|我的设置/.test(text)) return ["tool_setup", "foundations"];
  if (/program trading|交易计划/.test(text)) return ["trading_plan", "risk_management"];
  if (/personality|个性|successful traders/.test(text)) return ["trading_psychology", "process_discipline"];
  if (/starting out|起步/.test(text)) return ["foundations", "learning_path"];
  if (/candles|signal bars|蜡烛|信号/.test(text)) return ["chart_reading_basics", "price_action_setups"];
  if (/pullbacks|回调/.test(text)) return ["pullbacks", "price_action_setups"];
  if (/buying and selling pressure|买卖压力/.test(text)) return ["buying_selling_pressure", "market_structure"];
  if (/gaps|跳空/.test(text)) return ["gaps", "market_structure"];
  if (/market cycle|市场周期/.test(text)) return ["market_cycle", "market_structure"];
  if (/always in|始终参与交易/.test(text)) return ["always_in_market", "market_structure"];
  if (/trends|发展趋势/.test(text)) return ["trend_structure", "market_structure"];
  if (/breakouts|突破/.test(text)) return ["breakouts", "market_structure"];
  if (/channels|通道|渠道/.test(text)) return ["channels", "trend_structure"];
  if (/trading ranges|交易范围/.test(text)) return ["trading_ranges", "market_structure"];
  if (/support and resistance|支撑|阻力/.test(text)) return ["support_resistance", "market_structure"];
  if (/measured moves|测量/.test(text)) return ["measured_moves", "market_structure"];
  if (/major trend reversals|主要趋势反转/.test(text)) return ["major_trend_reversals", "reversals"];
  if (/reversals|逆转|反转/.test(text)) return ["reversals", "market_structure"];
  if (/final flags|旗形/.test(text)) return ["final_flags", "reversals"];
  if (/wedges|楔形/.test(text)) return ["wedges", "reversals"];
  if (/double tops|double bottoms/.test(text)) return ["double_tops_bottoms", "reversals"];
  if (/triangles|三角形/.test(text)) return ["triangles", "chart_patterns"];
  if (/head and shoulders|头部|肩部/.test(text)) return ["head_shoulders", "chart_patterns"];
  if (/rounded tops|rounded bottoms|圆顶|圆底/.test(text)) return ["rounded_tops_bottoms", "chart_patterns"];
  if (/climaxes|高潮/.test(text)) return ["climaxes", "market_structure"];
  if (/probability|equation|概率|方程/.test(text)) return ["probability", "risk_management"];
  if (/swing trading|scalping|波段|剥头皮/.test(text)) return ["trading_styles", "trade_management"];
  if (/orders|订单/.test(text)) return ["orders", "execution_concepts"];
  if (/protective stops|止损/.test(text)) return ["protective_stops", "risk_management"];
  if (/actual risk|实际风险/.test(text)) return ["risk_management", "position_risk"];
  if (/scaling in|扩大交易规模/.test(text)) return ["scaling_in", "trade_management"];
  if (/trade management|taking profits|获利|贸易管理/.test(text)) return ["trade_management", "exits"];
  if (/how to trade|如何进行交易/.test(text)) return ["trade_process", "foundations"];
  if (/trading the open|开盘交易/.test(text)) return ["session_open_trading", "trade_management"];
  if (/trading the middle of the day|日内交易/.test(text)) return ["intraday_session_management", "trade_management"];
  if (/losing when good trade goes bad/.test(text)) return ["mistake_review", "risk_management"];
  if (/losing because of mistakes|mistakes|错误/.test(text)) return ["mistake_review", "process_discipline"];
  return ["unclassified_video_course_topic"];
}

function priorityFor(row, modules) {
  if (modules.some((module) => ["risk_management", "orders", "execution_concepts", "protective_stops", "trade_management"].includes(module))) {
    return "p0_risk_execution_review";
  }
  if (modules.some((module) => ["reversals", "breakouts", "trading_ranges", "market_structure"].includes(module))) {
    return "p1_pattern_structure_review";
  }
  if (row.lessonNumber <= 8) return "p1_foundation_review";
  return "p2_standard_video_review";
}

const inventory = readJson(inventoryPath);
if (inventory.educationOnly !== true) fail("inventory must keep educationOnly:true");
if (inventory.productionReady !== false) fail("inventory must keep productionReady:false");
if (inventory.learnerFacingRelease !== false) fail("inventory must keep learnerFacingRelease:false");
if (inventory.inventoryStatus !== "local_video_course_source_inventory_complete_transcription_required") fail("inventory must be complete first");
const expectedVideoCount = configuredExpectedVideoCount || inventory.videoRows?.length || 62;
if (!Array.isArray(inventory.videoRows) || inventory.videoRows.length !== expectedVideoCount) fail(`expected ${expectedVideoCount} video rows`);

const intakeRows = inventory.videoRows.map((row, index) => {
  const moduleTags = classify(row);
  return {
    intakeId: `${intakeIdPrefix}_${String(index + 1).padStart(3, "0")}`,
    sourceId: row.sourceId,
    relativePath: row.relativePath,
    fileName: row.fileName,
    lessonCode: row.lessonCode,
    lessonNumber: row.lessonNumber,
    lessonPart: row.lessonPart,
    lessonTitle: row.lessonTitle,
    sha256: row.sha256,
    mb: row.mb,
    moduleTags,
    reviewPriority: priorityFor(row, moduleTags),
    sourceFileAbsorbedIntoKnowledgeManagement: true,
    semanticTranscriptAvailable: false,
    semanticKnowledgeExtractionComplete: false,
    mappedToKnowledgeModuleByTitle: moduleTags[0] !== "unclassified_video_course_topic",
    learnerFacingRelease: false,
    writeAllowedNow: false,
    nextGate: "create_verified_transcript_or_subtitle_then_distill_to_private_research_notes_and_public_grounding_review",
  };
});

const moduleMap = new Map();
for (const row of intakeRows) {
  for (const module of row.moduleTags) {
    const moduleRow = moduleMap.get(module) || {
      module,
      videos: 0,
      totalMb: 0,
      p0Rows: 0,
      transcriptBlockedRows: 0,
      sampleLessons: [],
    };
    moduleRow.videos += 1;
    moduleRow.totalMb += row.mb;
    if (row.reviewPriority.startsWith("p0")) moduleRow.p0Rows += 1;
    if (!row.semanticTranscriptAvailable) moduleRow.transcriptBlockedRows += 1;
    if (moduleRow.sampleLessons.length < 5) moduleRow.sampleLessons.push(`${row.lessonCode} ${row.lessonTitle}`);
    moduleMap.set(module, moduleRow);
  }
}

const moduleRows = [...moduleMap.values()]
  .map((row) => ({ ...row, totalMb: Number(row.totalMb.toFixed(2)) }))
  .sort((left, right) => right.videos - left.videos || left.module.localeCompare(right.module));

const p0Rows = intakeRows.filter((row) => row.reviewPriority.startsWith("p0"));
const transcriptBlockedRows = intakeRows.filter((row) => !row.semanticTranscriptAvailable);

const intake = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  intakeStatus: "local_video_course_sources_absorbed_into_management_transcripts_required",
  intakeMode: "video_course_source_to_knowledge_management_and_transcription_queue",
  sourceRoot: inventory.sourceRoot,
  sourceInventoryStatus: inventory.inventoryStatus,
  sourceFileAbsorptionComplete: true,
  semanticKnowledgeExtractionComplete: false,
  learnerReleaseReady: false,
  physicalVideoFiles: inventory.physicalVideoFiles,
  uniqueVideoHashes: inventory.uniqueVideoHashes,
  totalMb: inventory.totalMb,
  intakeRows: intakeRows.length,
  mappedTitleRows: intakeRows.filter((row) => row.mappedToKnowledgeModuleByTitle).length,
  unclassifiedRows: intakeRows.filter((row) => !row.mappedToKnowledgeModuleByTitle).length,
  p0ReviewRows: p0Rows.length,
  transcriptRequiredRows: transcriptBlockedRows.length,
  verifiedTranscriptRows: 0,
  moduleRows,
  videoRows: intakeRows,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  nextGate: "transcribe_or_import_subtitles_for_62_videos_then_run_semantic_distillation_and_reviewer_source_fit",
  commands: [
    "npm.cmd run build:local-video-course-source-inventory",
    "npm.cmd run check:local-video-course-source-inventory",
    "npm.cmd run build:local-video-course-knowledge-intake",
    "npm.cmd run check:local-video-course-knowledge-intake",
    "npm.cmd run verify",
  ],
  completionRule: `This intake is complete at the source-management layer when all ${expectedVideoCount} MP4 files are registered, title-mapped to knowledge modules, and queued for verified transcription. It is not complete at the semantic course-knowledge layer until transcripts or subtitles are reviewed and distilled.`,
  boundary: "Local video course knowledge intake is reviewer-facing education-only operations material. It manages private video source absorption and transcription queues; it does not publish copied course material, approve learner-facing citations, generate trading advice, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(intake, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Video Course Knowledge Intake",
  "",
  `- Intake status: ${intake.intakeStatus}`,
  `- Source file absorption complete: ${intake.sourceFileAbsorptionComplete}`,
  `- Semantic knowledge extraction complete: ${intake.semanticKnowledgeExtractionComplete}`,
  `- Physical video files: ${intake.physicalVideoFiles}`,
  `- Unique video hashes: ${intake.uniqueVideoHashes}`,
  `- Title-mapped rows: ${intake.mappedTitleRows}`,
  `- Unclassified rows: ${intake.unclassifiedRows}`,
  `- P0 review rows: ${intake.p0ReviewRows}`,
  `- Transcript required rows: ${intake.transcriptRequiredRows}`,
  `- Write allowed now: ${intake.writeAllowedNow}`,
  "",
  "## Module Rows",
  "",
  "| Module | Videos | P0 rows | Transcript-blocked rows | Total MB |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...intake.moduleRows.map((row) => `| ${row.module} | ${row.videos} | ${row.p0Rows} | ${row.transcriptBlockedRows} | ${row.totalMb} |`),
  "",
  "## Video Queue",
  "",
  "| ID | Lesson | Title | Modules | Priority | Next gate |",
  "| --- | --- | --- | --- | --- | --- |",
  ...intake.videoRows.map((row) => `| ${row.intakeId} | ${row.lessonCode} | ${row.lessonTitle.replace(/\|/g, "/")} | ${row.moduleTags.join(", ")} | ${row.reviewPriority} | ${row.nextGate} |`),
  "",
  "## Boundary",
  "",
  intake.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  intakeStatus: intake.intakeStatus,
  sourceFileAbsorptionComplete: intake.sourceFileAbsorptionComplete,
  semanticKnowledgeExtractionComplete: intake.semanticKnowledgeExtractionComplete,
  physicalVideoFiles: intake.physicalVideoFiles,
  uniqueVideoHashes: intake.uniqueVideoHashes,
  mappedTitleRows: intake.mappedTitleRows,
  unclassifiedRows: intake.unclassifiedRows,
  p0ReviewRows: intake.p0ReviewRows,
  transcriptRequiredRows: intake.transcriptRequiredRows,
  writeAllowedNow: intake.writeAllowedNow,
}, null, 2));
