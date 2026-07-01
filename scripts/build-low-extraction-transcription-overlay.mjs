import fs from "node:fs";

const visualPacketPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_VISUAL_REVIEW_PACKET.json";
const outputJsonPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_TRANSCRIPTION_OVERLAY.json";
const outputMdPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_TRANSCRIPTION_OVERLAY.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function pageChecklist() {
  return [
    {
      id: "preview_visible",
      label: "Reviewer opened the preview image and confirmed whether visible source text exists.",
      required: true,
      status: "not_started",
    },
    {
      id: "transcription_quality",
      label: "If visible text exists, reviewer transcribed/OCRed it into reviewer-only notes and checked obvious errors.",
      required: true,
      status: "not_started",
    },
    {
      id: "source_boundary",
      label: "Reviewer marked the page as private-course background only; no direct learner-facing quotation.",
      required: true,
      status: "not_started",
    },
    {
      id: "release_gate",
      label: "Reviewer kept learnerFacingRelease false and approvalStatus not_approved.",
      required: true,
      status: "not_started",
    },
  ];
}

const visualPacket = readJson(visualPacketPath);
if (visualPacket.educationOnly !== true) fail("visual packet must keep educationOnly true");
if (visualPacket.productionReady !== false) fail("visual packet productionReady drift");
if (visualPacket.approvalStatus !== "not_approved") fail("visual packet approval drift");
if (visualPacket.packetStatus !== "visual_review_packet_ready") fail("visual packet is not ready");

const pageEntries = [];
for (const card of visualPacket.cards || []) {
  for (const page of card.previewPages || []) {
    pageEntries.push({
      id: `${card.id}_page_${String(page.pageNumber).padStart(2, "0")}`,
      documentId: card.id,
      sourceId: card.sourceId,
      sourceRelativePath: card.sourceRelativePath,
      sourceModule: card.sourceModule,
      pageNumber: page.pageNumber,
      previewPath: page.previewPath,
      previewBytes: page.previewBytes,
      educationOnly: true,
      productionReady: false,
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      transcriptionStatus: "not_started",
      visualDecision: "pending",
      reviewerTranscription: "",
      reviewerSummary: "",
      unusableReason: "",
      replacementSourceNeeded: false,
      publicSourceGroundingNeeded: true,
      checklist: pageChecklist(),
    });
  }
}

const documentRows = (visualPacket.cards || []).map((card) => {
  const entries = pageEntries.filter((entry) => entry.documentId === card.id);
  return {
    documentId: card.id,
    sourceId: card.sourceId,
    sourceRelativePath: card.sourceRelativePath,
    sourceModule: card.sourceModule,
    pageCount: card.pageCount,
    pageEntries: entries.length,
    transcriptionStatus: "not_started",
    pagesNotStarted: entries.length,
    pagesTranscribed: 0,
    pagesUnusable: 0,
    pagesNeedSourceReplacement: 0,
  };
});

const overlay = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  overlayStatus: "manual_transcription_not_started",
  sourcePacket: visualPacketPath,
  lowExtractionDocs: visualPacket.lowExtractionDocs,
  totalPages: visualPacket.totalPages,
  previewPages: visualPacket.previewPages,
  transcriptionPages: pageEntries.length,
  pagesNotStarted: pageEntries.length,
  pagesTranscribed: 0,
  pagesUnusable: 0,
  pagesNeedSourceReplacement: 0,
  publicSourceGroundingNeededPages: pageEntries.length,
  documentRows,
  pageEntries,
  allowedPageStatuses: ["not_started", "transcribed_pending_review", "unusable", "needs_source_replacement"],
  boundary: "Manual transcription overlay for low-extraction private local course PDFs. Fields start blank; generated prompts are not human notes. No page may become learner-facing until transcription, source-fit review, public-source grounding, originality review, and separate approval are complete.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(overlay, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Low-Extraction Transcription Overlay",
  "",
  "Blank manual transcription status overlay for the low-extraction visual review packet.",
  "",
  `- Overlay status: ${overlay.overlayStatus}`,
  `- Low-extraction docs: ${overlay.lowExtractionDocs}`,
  `- Total pages: ${overlay.totalPages}`,
  `- Transcription page entries: ${overlay.transcriptionPages}`,
  `- Pages not started: ${overlay.pagesNotStarted}`,
  `- Pages transcribed: ${overlay.pagesTranscribed}`,
  `- Pages unusable: ${overlay.pagesUnusable}`,
  `- Pages needing source replacement: ${overlay.pagesNeedSourceReplacement}`,
  `- Approval status: ${overlay.approvalStatus}`,
  `- Learner-facing release: ${overlay.learnerFacingRelease}`,
  "",
  "## Documents",
  "",
  "| Document | Pages | Status |",
  "| --- | ---: | --- |",
  ...documentRows.map((row) => `| ${row.sourceRelativePath} | ${row.pageEntries} | ${row.transcriptionStatus} |`),
  "",
  "## Boundary",
  "",
  overlay.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: overlay.educationOnly,
  productionReady: overlay.productionReady,
  learnerFacingRelease: overlay.learnerFacingRelease,
  approvalStatus: overlay.approvalStatus,
  overlayStatus: overlay.overlayStatus,
  lowExtractionDocs: overlay.lowExtractionDocs,
  transcriptionPages: overlay.transcriptionPages,
  pagesNotStarted: overlay.pagesNotStarted,
  pagesTranscribed: overlay.pagesTranscribed,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
