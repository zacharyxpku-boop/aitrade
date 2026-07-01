import fs from "node:fs";

const packetPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_VISUAL_REVIEW_PACKET.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const packet = readJson(packetPath);
const cards = packet.cards || [];

if (packet.educationOnly !== true) fail("visual review packet must keep educationOnly:true");
if (packet.productionReady !== false) fail("visual review packet must keep productionReady:false");
if (packet.learnerFacingRelease !== false) fail("visual review packet must keep learnerFacingRelease:false");
if (packet.approvalStatus !== "not_approved") fail("visual review packet must remain not_approved");
if (packet.packetStatus !== "visual_review_packet_ready") fail(`unexpected packetStatus: ${packet.packetStatus}`);
if (packet.lowExtractionDocs !== 5 || cards.length !== 5) fail(`expected 5 low-extraction cards, got ${packet.lowExtractionDocs}/${cards.length}`);
if (packet.totalPages < 20) fail(`expected at least 20 low-extraction PDF pages, got ${packet.totalPages}`);
if (packet.previewPages !== packet.totalPages) fail(`preview pages must cover every page, got ${packet.previewPages}/${packet.totalPages}`);

for (const card of cards) {
  if (card.educationOnly !== true || card.productionReady !== false) fail(`${card.id} boundary drift`);
  if (card.learnerFacingRelease !== false || card.approvalStatus !== "not_approved") fail(`${card.id} release gate drift`);
  if (card.visualReviewStatus !== "preview_generated_manual_ocr_or_visual_review_required") {
    fail(`${card.id} visual review status drift`);
  }
  if (!card.sourceLocalPath || !fs.existsSync(card.sourceLocalPath)) fail(`${card.id} source PDF missing`);
  if (!Array.isArray(card.previewPages) || card.previewPages.length !== card.pageCount) {
    fail(`${card.id} preview page count mismatch`);
  }
  if (!Array.isArray(card.reviewerChecklist) || card.reviewerChecklist.length < 4) fail(`${card.id} missing reviewer checklist`);
  for (const page of card.previewPages) {
    if (!page.previewPath || !fs.existsSync(page.previewPath)) fail(`${card.id} preview missing: ${page.previewPath}`);
    if ((page.previewBytes || 0) < 1000) fail(`${card.id} preview too small: ${page.previewPath}`);
  }
}

if (!/manual OCR\/visual review/i.test(packet.boundary || "")) fail("packet boundary must require manual OCR/visual review");

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
}, null, 2));
