import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const visualPacketPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_VISUAL_REVIEW_PACKET.json";
const transcriptIntakePath = "docs/LOCAL_COURSE_LOW_EXTRACTION_TRANSCRIPT_INTAKE.json";
const previewDir = "docs/local-course-low-extraction-high-res-previews";
const outputJsonPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_HIGH_RES_REVIEW_PACKET.json";
const outputMdPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_HIGH_RES_REVIEW_PACKET.md";
const screenshotScale = 1.35;

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function safeSlug(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function bufferFromScreenshotData(data) {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.from(data);
  return Buffer.from(Object.values(data || {}));
}

function pngSize(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    return { width: 0, height: 0 };
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const visualPacket = readJson(visualPacketPath);
const transcriptIntake = readJson(transcriptIntakePath);
if (visualPacket.educationOnly !== true || visualPacket.productionReady !== false) fail("visual packet boundary drift");
if (visualPacket.learnerFacingRelease !== false || visualPacket.approvalStatus !== "not_approved") fail("visual packet release gate drift");
if (transcriptIntake.educationOnly !== true || transcriptIntake.productionReady !== false) fail("transcript intake boundary drift");
if (transcriptIntake.learnerFacingRelease !== false || transcriptIntake.approvalStatus !== "not_approved") fail("transcript intake release gate drift");

const intakeByIdAndPage = new Map((transcriptIntake.pageRows || []).map((row) => [`${row.documentId}:${row.pageNumber}`, row]));
fs.mkdirSync(previewDir, { recursive: true });

const documentRows = [];
const pageRows = [];

for (const card of visualPacket.cards || []) {
  if (!card.sourceLocalPath || !fs.existsSync(card.sourceLocalPath)) fail(`missing source PDF for ${card.id}`);
  const pdfBytes = fs.readFileSync(card.sourceLocalPath);
  const parser = new PDFParse({ data: new Uint8Array(pdfBytes) });
  try {
    const screenshotResult = await parser.getScreenshot({ scale: screenshotScale });
    const pages = screenshotResult.pages || [];
    const cardDir = path.join(previewDir, safeSlug(card.id));
    fs.mkdirSync(cardDir, { recursive: true });
    const cardRows = [];
    for (let index = 0; index < pages.length; index += 1) {
      const pageNumber = index + 1;
      const lowResPage = (card.previewPages || []).find((item) => item.pageNumber === pageNumber) || {};
      const intakeRow = intakeByIdAndPage.get(`${card.id}:${pageNumber}`) || {};
      const png = bufferFromScreenshotData(pages[index].data);
      const size = pngSize(png);
      const highResPreviewPath = path.join(
        "docs",
        "local-course-low-extraction-high-res-previews",
        safeSlug(card.id),
        `page-${String(pageNumber).padStart(2, "0")}.png`,
      ).replace(/\\/g, "/");
      fs.writeFileSync(highResPreviewPath, png);
      const byteGrowth = lowResPage.previewBytes ? Number((png.length / lowResPage.previewBytes).toFixed(2)) : 0;
      const visualEvidenceStatus = intakeRow.intakeStatus === "blank_preview_needs_source_replacement"
        ? "still_source_replacement_required"
        : "high_res_preview_ready_for_manual_transcription";
      const row = {
        id: `${card.id}_page_${String(pageNumber).padStart(2, "0")}`,
        documentId: card.id,
        sourceId: card.sourceId,
        sourceRelativePath: card.sourceRelativePath,
        sourceModule: card.sourceModule,
        pageNumber,
        educationOnly: true,
        productionReady: false,
        learnerFacingRelease: false,
        approvalStatus: "not_approved",
        intakeStatus: intakeRow.intakeStatus || "unknown",
        visualEvidenceStatus,
        lowResPreviewPath: lowResPage.previewPath || "",
        lowResPreviewBytes: lowResPage.previewBytes || 0,
        highResPreviewPath,
        highResPreviewBytes: png.length,
        width: size.width,
        height: size.height,
        byteGrowth,
        transcriptionStatus: "not_started",
        reviewerUse: visualEvidenceStatus === "high_res_preview_ready_for_manual_transcription"
          ? "manual_transcription_evidence_only"
          : "source_replacement_decision_evidence_only",
        nextGate: visualEvidenceStatus === "high_res_preview_ready_for_manual_transcription"
          ? "manual_transcription_then_source_fit_public_grounding_originality_review"
          : "source_replacement_decision_then_rerun_visual_review",
      };
      cardRows.push(row);
      pageRows.push(row);
    }
    documentRows.push({
      id: card.id,
      sourceId: card.sourceId,
      sourceRelativePath: card.sourceRelativePath,
      sourceModule: card.sourceModule,
      educationOnly: true,
      productionReady: false,
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      pageCount: card.pageCount,
      highResPreviewPages: cardRows.length,
      manualTranscriptionPages: cardRows.filter((row) => row.visualEvidenceStatus === "high_res_preview_ready_for_manual_transcription").length,
      sourceReplacementPages: cardRows.filter((row) => row.visualEvidenceStatus === "still_source_replacement_required").length,
      totalHighResPreviewBytes: cardRows.reduce((sum, row) => sum + row.highResPreviewBytes, 0),
      maxByteGrowth: Math.max(0, ...cardRows.map((row) => row.byteGrowth || 0)),
    });
  } finally {
    await parser.destroy();
  }
}

const packet = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packetStatus: "high_res_visual_review_packet_ready",
  sourceVisualPacket: visualPacketPath,
  sourceTranscriptIntake: transcriptIntakePath,
  screenshotScale,
  lowExtractionDocs: documentRows.length,
  totalPages: pageRows.length,
  highResPreviewPages: pageRows.length,
  manualTranscriptionHighResPages: pageRows.filter((row) => row.visualEvidenceStatus === "high_res_preview_ready_for_manual_transcription").length,
  sourceReplacementHighResPages: pageRows.filter((row) => row.visualEvidenceStatus === "still_source_replacement_required").length,
  totalHighResPreviewBytes: pageRows.reduce((sum, row) => sum + row.highResPreviewBytes, 0),
  minHighResPreviewBytes: Math.min(...pageRows.map((row) => row.highResPreviewBytes)),
  maxHighResPreviewBytes: Math.max(...pageRows.map((row) => row.highResPreviewBytes)),
  documentRows,
  pageRows,
  completionRule: "High-resolution previews only improve reviewer evidence. Pages still need human transcription or explicit source replacement decisions before local course material can move into source-fit, public-grounding, originality review, and approval gates.",
  boundary: "High-resolution low-extraction previews are reviewer-only visual evidence. They do not perform OCR, infer missing content, replace source files, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Low-Extraction High-Resolution Review Packet",
  "",
  "Supplemental high-resolution preview packet for low-extraction local private course PDFs.",
  "",
  `- Packet status: ${packet.packetStatus}`,
  `- Screenshot scale: ${packet.screenshotScale}`,
  `- Low-extraction docs: ${packet.lowExtractionDocs}`,
  `- High-res preview pages: ${packet.highResPreviewPages}`,
  `- Manual transcription high-res pages: ${packet.manualTranscriptionHighResPages}`,
  `- Source replacement high-res pages: ${packet.sourceReplacementHighResPages}`,
  `- Approval status: ${packet.approvalStatus}`,
  "",
  "## Documents",
  "",
  "| Document | Pages | Manual transcription | Source replacement | Max byte growth |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...documentRows.map((row) => `| ${row.sourceRelativePath} | ${row.highResPreviewPages} | ${row.manualTranscriptionPages} | ${row.sourceReplacementPages} | ${row.maxByteGrowth}x |`),
  "",
  "## First Pages",
  "",
  "| Page | Intake | Evidence status | High-res preview | Size |",
  "| --- | --- | --- | --- | --- |",
  ...pageRows.slice(0, 12).map((row) => `| ${row.documentId} p${row.pageNumber} | ${row.intakeStatus} | ${row.visualEvidenceStatus} | ${row.highResPreviewPath} | ${row.width}x${row.height} |`),
  "",
  "## Completion Rule",
  "",
  packet.completionRule,
  "",
  "## Boundary",
  "",
  packet.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: packet.educationOnly,
  productionReady: packet.productionReady,
  learnerFacingRelease: packet.learnerFacingRelease,
  approvalStatus: packet.approvalStatus,
  packetStatus: packet.packetStatus,
  lowExtractionDocs: packet.lowExtractionDocs,
  highResPreviewPages: packet.highResPreviewPages,
  manualTranscriptionHighResPages: packet.manualTranscriptionHighResPages,
  sourceReplacementHighResPages: packet.sourceReplacementHighResPages,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
  previewDir,
}, null, 2));
