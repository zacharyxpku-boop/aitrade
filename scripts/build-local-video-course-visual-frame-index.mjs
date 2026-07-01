import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const inventoryPath = process.env.TRADEGYM_VIDEO_COURSE_SOURCE_INVENTORY_JSON || `docs/${artifactPrefix}_SOURCE_INVENTORY.json`;
const intakePath = process.env.TRADEGYM_VIDEO_COURSE_INTAKE_JSON || `docs/${artifactPrefix}_KNOWLEDGE_INTAKE.json`;
const semanticPath = process.env.TRADEGYM_VIDEO_COURSE_SEMANTIC_JSON || `docs/${artifactPrefix}_SEMANTIC_ABSORPTION_MAP.json`;
const outputJsonPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_FRAME_INDEX_JSON || `docs/${artifactPrefix}_VISUAL_FRAME_INDEX.json`;
const outputMdPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_FRAME_INDEX_MD || `docs/${artifactPrefix}_VISUAL_FRAME_INDEX.md`;
const frameRoot = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_FRAME_DIR || "docs/local-video-course-visual-frames";
const ffmpegPath = process.env.FFMPEG_PATH || "C:\\Users\\86136\\.local\\bin\\ffmpeg.exe";
const ffprobePath = process.env.FFPROBE_PATH || "C:\\Users\\86136\\.local\\bin\\ffprobe.exe";
const representativeIntakeIds = new Set([
  "local_video_course_intake_004",
  "local_video_course_intake_026",
  "local_video_course_intake_050",
]);

function fail(message) { throw new Error(message); }
function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function hasArg(name) { return process.argv.includes(name); }
function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function formatSeconds(seconds) {
  return String(Math.max(0, Math.round(seconds))).padStart(6, "0");
}
function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 16 });
}
function probeDuration(file) {
  if (!fs.existsSync(ffprobePath)) return 0;
  const result = run(ffprobePath, ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file]);
  return result.status === 0 ? Number.parseFloat(result.stdout.trim()) || 0 : 0;
}
function probeDimensions(file) {
  if (!fs.existsSync(ffprobePath)) return { width: 0, height: 0 };
  const result = run(ffprobePath, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=s=x:p=0", file]);
  if (result.status !== 0) return { width: 0, height: 0 };
  const [width, height] = result.stdout.trim().split("x").map((value) => Number.parseInt(value, 10));
  return { width: width || 0, height: height || 0 };
}
function imageAverageHash(file) {
  const result = spawnSync(ffmpegPath, ["-v", "error", "-i", file, "-vf", "scale=8:8,format=gray", "-f", "rawvideo", "-"], {
    encoding: "buffer",
    maxBuffer: 1024 * 128,
  });
  if (result.status !== 0 || !result.stdout || result.stdout.length < 64) return "";
  const bytes = Array.from(result.stdout.slice(0, 64));
  const avg = bytes.reduce((sum, value) => sum + value, 0) / bytes.length;
  let bits = "";
  for (const value of bytes) bits += value >= avg ? "1" : "0";
  let hex = "";
  for (let index = 0; index < bits.length; index += 4) {
    hex += Number.parseInt(bits.slice(index, index + 4), 2).toString(16);
  }
  return hex;
}
function hammingHex(left, right) {
  if (!left || !right || left.length !== right.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    const xor = Number.parseInt(left[index], 16) ^ Number.parseInt(right[index], 16);
    distance += xor.toString(2).replaceAll("0", "").length;
  }
  return distance;
}
function transcriptWindow(transcriptPath, timestamp) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return [];
  const transcript = readJson(transcriptPath);
  return (transcript.segments || [])
    .filter((segment) => segment.start <= timestamp + 45 && segment.end >= timestamp - 45)
    .slice(0, 3)
    .map((segment) => ({
      start: segment.start,
      end: segment.end,
      textPreview: `${segment.text || ""}`.slice(0, 120),
    }));
}
function inferVisualTags(row, semanticRow) {
  const haystack = [
    row.lessonCode,
    row.lessonTitle,
    ...(semanticRow?.moduleTags || []),
    ...(semanticRow?.conceptCandidates || []),
  ].join(" ").toLowerCase();
  const tags = [];
  const add = (condition, tag) => { if (condition && !tags.includes(tag)) tags.push(tag); };
  add(/candle|k-line|chart_reading|price_action|signal|setup|pullback|bar/.test(haystack), "candlestick_or_price_action_chart");
  add(/support|resistance/.test(haystack), "support_resistance_visual");
  add(/trend|channel|wedge|triangle/.test(haystack), "trendline_or_channel_visual");
  add(/range|breakout|gap|reversal|double|head|shoulder|rounded|climax|flag/.test(haystack), "pattern_or_structure_visual");
  add(/order|stop|risk|probability|scaling|management|profit|exit/.test(haystack), "risk_order_trade_management_visual");
  add(tags.length === 0, "general_lesson_visual");
  return tags;
}
function tryOcr(file) {
  const probe = run("tesseract", ["--version"]);
  if (probe.status !== 0) {
    return { ocrStatus: "ocr_engine_unavailable", ocrText: "", ocrEngine: "tesseract_not_found" };
  }
  const result = run("tesseract", [file, "stdout", "-l", "eng+chi_sim", "--psm", "6"]);
  if (result.status !== 0) {
    return { ocrStatus: "ocr_failed", ocrText: "", ocrEngine: "tesseract" };
  }
  return { ocrStatus: "ocr_completed", ocrText: result.stdout.trim().slice(0, 2000), ocrEngine: "tesseract" };
}

const inventory = readJson(inventoryPath);
const intake = readJson(intakePath);
const semantic = readJson(semanticPath);
if (inventory.educationOnly !== true || intake.educationOnly !== true || semantic.educationOnly !== true) fail("inputs must keep educationOnly:true");
if (inventory.productionReady !== false || intake.productionReady !== false || semantic.productionReady !== false) fail("inputs must keep productionReady:false");
if (inventory.learnerFacingRelease !== false || intake.learnerFacingRelease !== false || semantic.learnerFacingRelease !== false) fail("inputs must keep learnerFacingRelease:false");
if (!fs.existsSync(ffmpegPath)) fail(`missing ffmpeg at ${ffmpegPath}`);

const expectedVideoCount = intake.videoRows?.length || Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || "62", 10);
const intervalSeconds = Number.parseInt(argValue("--interval-seconds", "60"), 10) || 60;
const startIndex = Math.max(1, Number.parseInt(argValue("--start-index", "1"), 10) || 1);
const limit = Number.parseInt(argValue("--limit", "0"), 10) || 0;
const sampleOnly = hasArg("--sample");
const force = hasArg("--force");

let selectedRows = intake.videoRows || [];
if (sampleOnly) selectedRows = selectedRows.filter((row) => representativeIntakeIds.has(row.intakeId));
else selectedRows = selectedRows.slice(startIndex - 1, limit > 0 ? startIndex - 1 + limit : undefined);

ensureDir(frameRoot);
const frameRows = [];
const videoRows = [];

for (const row of selectedRows) {
  const semanticRow = semantic.semanticRows.find((item) => item.intakeId === row.intakeId);
  const sourcePath = path.join(intake.sourceRoot || inventory.sourceRoot, row.relativePath);
  const videoFrameDir = path.join(frameRoot, row.intakeId);
  ensureDir(videoFrameDir);
  const duration = probeDuration(sourcePath);
  const dimensions = probeDimensions(sourcePath);
  const timestamps = [];
  for (let second = 0; second <= Math.max(1, duration - 1); second += intervalSeconds) timestamps.push(second);
  if (timestamps.length === 0) timestamps.push(0);

  const keptHashes = [];
  let extracted = 0;
  let duplicate = 0;
  let failed = 0;
  for (let index = 0; index < timestamps.length; index += 1) {
    const timestamp = timestamps[index];
    const fileName = `frame_${String(index + 1).padStart(4, "0")}_t${formatSeconds(timestamp)}.jpg`;
    const outputPath = path.join(videoFrameDir, fileName);
    if (force && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    if (!fs.existsSync(outputPath)) {
      const result = run(ffmpegPath, ["-y", "-ss", String(timestamp), "-i", sourcePath, "-frames:v", "1", "-vf", "scale=960:-2", "-q:v", "4", outputPath]);
      if (result.status !== 0 || !fs.existsSync(outputPath)) {
        failed += 1;
        continue;
      }
    }
    const averageHash = imageAverageHash(outputPath);
    const similarToKept = keptHashes.some((hash) => hammingHex(hash, averageHash) <= 4);
    if (similarToKept && timestamps.length > 1) {
      duplicate += 1;
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      continue;
    }
    keptHashes.push(averageHash);
    const ocr = tryOcr(outputPath);
    extracted += 1;
    const visualTags = inferVisualTags(row, semanticRow);
    frameRows.push({
      frameId: `visual_${row.intakeId}_${String(index + 1).padStart(4, "0")}`,
      intakeId: row.intakeId,
      sourceId: row.sourceId,
      lessonCode: row.lessonCode,
      lessonTitle: row.lessonTitle,
      timestamp,
      imagePath: outputPath.replaceAll("\\", "/"),
      imageSha256: sha256File(outputPath),
      averageHash,
      sourceVideoSha256: row.sha256,
      sourceVideoRelativePath: row.relativePath,
      sourceVideoDimensions: dimensions,
      visualTags,
      visualTagSource: "lesson_module_heuristic_pending_human_visual_review",
      containsKlineChart: visualTags.includes("candlestick_or_price_action_chart"),
      containsTrendlineOrChannel: visualTags.includes("trendline_or_channel_visual"),
      containsSupportResistance: visualTags.includes("support_resistance_visual"),
      containsOrdersStopsRisk: visualTags.includes("risk_order_trade_management_visual"),
      transcriptWindow: transcriptWindow(semanticRow?.transcriptPath || "", timestamp),
      ocrStatus: ocr.ocrStatus,
      ocrEngine: ocr.ocrEngine,
      ocrTextPreview: ocr.ocrText.slice(0, 300),
      learnerFacingRelease: false,
      writeAllowedNow: false,
    });
  }
  videoRows.push({
    intakeId: row.intakeId,
    sourceId: row.sourceId,
    lessonCode: row.lessonCode,
    lessonTitle: row.lessonTitle,
    sampledFrameRows: extracted,
    duplicateFrameRows: duplicate,
    failedFrameRows: failed,
    visualCoverageStatus: extracted > 0 ? "visual_frames_indexed_private_review_only" : "blocked_no_visual_frame_extracted",
    ocrStatus: frameRows.some((frame) => frame.intakeId === row.intakeId && frame.ocrStatus === "ocr_completed")
      ? "ocr_completed_for_some_frames"
      : "ocr_engine_unavailable_or_no_text_captured",
    learnerFacingRelease: false,
    writeAllowedNow: false,
  });
}

const allVideoIds = new Set(videoRows.map((row) => row.intakeId));
const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  visualFrameIndexStatus: allVideoIds.size === expectedVideoCount && videoRows.every((row) => row.sampledFrameRows > 0)
    ? "local_video_course_visual_frame_index_complete_release_blocked"
    : "local_video_course_visual_frame_index_in_progress_release_blocked",
  visualFrameIndexMode: sampleOnly ? "representative_sample_ffmpeg_interval_dedup" : "ffmpeg_interval_dedup",
  sourceVideos: expectedVideoCount,
  indexedVideos: allVideoIds.size,
  frameRows: frameRows.length,
  videosWithFrames: videoRows.filter((row) => row.sampledFrameRows > 0).length,
  videosBlockedNoFrames: videoRows.filter((row) => row.sampledFrameRows === 0).length,
  intervalSeconds,
  ocrEngineAvailable: frameRows.some((row) => row.ocrStatus === "ocr_completed"),
  ocrBlockedRows: frameRows.filter((row) => row.ocrStatus !== "ocr_completed").length,
  learnerFacingReadyRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  frameRoot,
  videoRows,
  frames: frameRows,
  commands: [
    "npm.cmd run build:local-video-course-visual-frame-index",
    "npm.cmd run check:local-video-course-visual-frame-index",
    "npm.cmd run verify",
  ],
  boundary: "Local video course visual frame index is reviewer-facing education-only private research material. It indexes selected screenshots from private videos for controlled visual review; it does not publish copied course frames as learner-facing course material, approve citations, generate trading advice, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Video Course Visual Frame Index",
  "",
  `- Status: ${artifact.visualFrameIndexStatus}`,
  `- Indexed videos: ${artifact.indexedVideos}/${artifact.sourceVideos}`,
  `- Frame rows: ${artifact.frameRows}`,
  `- Videos with frames: ${artifact.videosWithFrames}`,
  `- Videos blocked no frames: ${artifact.videosBlockedNoFrames}`,
  `- OCR engine available: ${artifact.ocrEngineAvailable}`,
  `- OCR blocked rows: ${artifact.ocrBlockedRows}`,
  `- Write allowed now: ${artifact.writeAllowedNow}`,
  "",
  "## Video Rows",
  "",
  "| Intake | Lesson | Frames | Duplicates | Failed | OCR |",
  "| --- | --- | ---: | ---: | ---: | --- |",
  ...artifact.videoRows.map((row) => `| ${row.intakeId} | ${row.lessonCode} | ${row.sampledFrameRows} | ${row.duplicateFrameRows} | ${row.failedFrameRows} | ${row.ocrStatus} |`),
  "",
  "## Boundary",
  "",
  artifact.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  visualFrameIndexStatus: artifact.visualFrameIndexStatus,
  indexedVideos: artifact.indexedVideos,
  frameRows: artifact.frameRows,
  videosWithFrames: artifact.videosWithFrames,
  videosBlockedNoFrames: artifact.videosBlockedNoFrames,
  ocrEngineAvailable: artifact.ocrEngineAvailable,
  ocrBlockedRows: artifact.ocrBlockedRows,
  writeAllowedNow: artifact.writeAllowedNow,
}, null, 2));
