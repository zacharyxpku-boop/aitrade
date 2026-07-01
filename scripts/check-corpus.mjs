import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { corpusDocuments, corpusChunks, corpusIndexReport } = require("../education-corpus-index.js");

function fail(message) {
  throw new Error(message);
}

const ALLOWED_TIERS = new Set(["public_domain", "open_access", "share_alike", "permissive", "local_private_course"]);

if (corpusIndexReport.educationOnly !== true) fail("corpus index must keep educationOnly true");
if (corpusIndexReport.productionReady !== false) fail("corpus index must keep productionReady false");
if (corpusDocuments.length < 1) fail("corpus is empty; run npm.cmd run harvest:corpus first");

const restricted = corpusDocuments.filter((doc) => !ALLOWED_TIERS.has(doc.tier));
if (restricted.length > 0) {
  fail(`corpus contains ${restricted.length} documents outside allowed license tiers: ${restricted.slice(0, 3).map((doc) => doc.url).join(", ")}`);
}

for (const doc of corpusDocuments) {
  if (!doc.sha256 || doc.sha256.length !== 64) fail(`corpus doc ${doc.id} missing sha256 provenance hash`);
  if (!doc.url || !/^(https?:\/\/|local-course:\/\/)/.test(doc.url)) fail(`corpus doc ${doc.id} missing source url`);
  if (doc.tier === "local_private_course" && !doc.sourceLocalPath) fail(`corpus doc ${doc.id} missing local course source path`);
  if (!doc.fetchedAt) fail(`corpus doc ${doc.id} missing fetch timestamp`);
  if (!doc.tier) fail(`corpus doc ${doc.id} missing license tier`);
  if (!doc.boundary || !/research/i.test(doc.boundary)) fail(`corpus doc ${doc.id} missing research-layer boundary`);
  if (typeof doc.text !== "string") fail(`corpus doc ${doc.id} missing text field`);
}

const substantialDocs = corpusDocuments.filter((doc) => (doc.text || "").length >= 500);
for (const doc of substantialDocs) {
  const chunks = corpusChunks.filter((chunk) => chunk.documentId === doc.id);
  if (chunks.length < 1) fail(`corpus doc ${doc.id} has ${doc.text.length} chars but no chunks`);
}

for (const chunk of corpusChunks) {
  if (chunk.charCount > 900) fail(`corpus chunk ${chunk.id} too long: ${chunk.charCount}`);
  if (!ALLOWED_TIERS.has(chunk.tier)) fail(`corpus chunk ${chunk.id} has disallowed tier ${chunk.tier}`);
  if (!chunk.boundary) fail(`corpus chunk ${chunk.id} missing boundary`);
}

const domainCoverage = corpusIndexReport.chunks
  ? corpusIndexReport.chunksWithDomain / corpusIndexReport.chunks
  : 0;

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  documents: corpusDocuments.length,
  documentsByTier: corpusIndexReport.documentsByTier,
  chunks: corpusChunks.length,
  chunksWithDomain: corpusIndexReport.chunksWithDomain,
  qualityTierCounts: corpusIndexReport.qualityTierCounts,
  retrievalPoolChunks: corpusIndexReport.retrievalPoolChunks,
  domainCoverageRate: Number(domainCoverage.toFixed(4)),
  restrictedTierDocuments: 0,
  domainCounts: corpusIndexReport.domainCounts,
}, null, 2));
