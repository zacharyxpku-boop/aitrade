import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const sourceQualityPath = "docs/LOCAL_COURSE_SOURCE_QUALITY_AUDIT.json";
const corpusDir = "data/corpus";
const previewDir = "docs/local-course-low-extraction-previews";
const outputJsonPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_VISUAL_REVIEW_PACKET.json";
const outputMdPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_VISUAL_REVIEW_PACKET.md";

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

async function inspectPdf(doc, item) {
  const pdfBytes = fs.readFileSync(doc.sourceLocalPath);
  const parser = new PDFParse({ data: new Uint8Array(pdfBytes) });
  try {
    const info = await parser.getInfo();
    const textResult = await parser.getText();
    const screenshotResult = await parser.getScreenshot({ scale: 0.45 });
    const previewPages = [];
    const pages = screenshotResult.pages || [];
    const cardDir = path.join(previewDir, safeSlug(item.id));
    fs.mkdirSync(cardDir, { recursive: true });
    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const png = bufferFromScreenshotData(page.data);
      const previewRelativePath = path.join("docs", "local-course-low-extraction-previews", safeSlug(item.id), `page-${String(index + 1).padStart(2, "0")}.png`).replace(/\\/g, "/");
      fs.writeFileSync(previewRelativePath, png);
      previewPages.push({
        pageNumber: index + 1,
        previewPath: previewRelativePath,
        previewBytes: png.length,
      });
    }
    return {
      id: item.id,
      sourceId: item.sourceId,
      sourceRelativePath: item.sourceRelativePath,
      sourceLocalPath: doc.sourceLocalPath,
      sourceModule: item.sourceModule,
      educationOnly: true,
      productionReady: false,
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      charCount: item.charCount,
      textExtraction: item.textExtraction,
      parserTextChars: (textResult.text || "").trim().length,
      pageCount: info.total || previewPages.length,
      previewPageCount: previewPages.length,
      previewPages,
      pdfInfo: {
        pdfFormatVersion: info.info?.PDFFormatVersion || "",
        language: info.info?.Language || "",
        producer: info.info?.Producer || "",
        creationDate: info.info?.CreationDate || "",
        modDate: info.info?.ModDate || "",
      },
      visualReviewStatus: "preview_generated_manual_ocr_or_visual_review_required",
      reviewerChecklist: [
        "Open every preview page and confirm whether visible text exists.",
        "If visible text exists, transcribe or OCR it into reviewer-only notes before using the source for lesson rewrite.",
        "If the preview is blank or corrupted, mark the source as unusable for lesson evidence until the original PDF is replaced.",
        "Keep learnerFacingRelease:false and approvalStatus:not_approved until text is reviewed, rewritten, and grounded in public sources.",
      ],
      boundary: "Machine text extraction is insufficient. Preview pages are reviewer-only visual evidence; they do not approve learner-facing reuse, copied text, trading advice, signals, broker workflows, auto-trading, performance claims, or real-money guidance.",
    };
  } finally {
    await parser.destroy();
  }
}

const sourceQuality = readJson(sourceQualityPath);
if (sourceQuality.educationOnly !== true) fail("source quality audit must be education-only");
if (sourceQuality.productionReady !== false) fail("source quality audit productionReady drift");

fs.mkdirSync(previewDir, { recursive: true });

const cards = [];
for (const item of sourceQuality.lowExtractionList || []) {
  const doc = readJson(path.join(corpusDir, `${item.id}.json`));
  if (!doc.sourceLocalPath || !fs.existsSync(doc.sourceLocalPath)) fail(`missing source PDF for ${item.id}`);
  cards.push(await inspectPdf(doc, item));
}

const packet = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packetStatus: "visual_review_packet_ready",
  lowExtractionDocs: cards.length,
  totalPages: cards.reduce((sum, card) => sum + card.pageCount, 0),
  previewPages: cards.reduce((sum, card) => sum + card.previewPageCount, 0),
  cards,
  boundary: "Low-extraction visual review packet for private local course PDFs. It supports manual OCR/visual review only and does not approve learner-facing reuse, copied text, trading advice, signals, broker workflows, auto-trading, performance claims, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Low-Extraction Visual Review Packet",
  "",
  "Reviewer-only packet for local course PDFs whose machine text extraction is too low for course evidence.",
  "",
  `- Low-extraction docs: ${packet.lowExtractionDocs}`,
  `- Total pages: ${packet.totalPages}`,
  `- Preview pages: ${packet.previewPages}`,
  `- Packet status: ${packet.packetStatus}`,
  `- Approval status: ${packet.approvalStatus}`,
  `- Learner-facing release: ${packet.learnerFacingRelease}`,
  "",
  "## Review Cards",
  "",
  ...cards.map((card) => [
    `### ${card.id}`,
    "",
    `- Source: ${card.sourceRelativePath}`,
    `- Pages: ${card.pageCount}`,
    `- Parser text chars: ${card.parserTextChars}`,
    `- Preview pages: ${card.previewPageCount}`,
    `- Status: ${card.visualReviewStatus}`,
    `- First preview: ${card.previewPages[0]?.previewPath || "missing"}`,
    "",
  ].join("\n")),
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
  totalPages: packet.totalPages,
  previewPages: packet.previewPages,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
  previewDir,
}, null, 2));
