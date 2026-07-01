import fs from "node:fs";
import path from "node:path";

const manifestPath = "docs/LOCAL_INVESTMENT_COURSE_SOURCE_MANIFEST.json";
const reportPath = "docs/LOCAL_INVESTMENT_COURSE_HARVEST_REPORT.json";
const corpusDir = "data/corpus";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const manifest = readJson(manifestPath);
const report = readJson(reportPath);

if (manifest.educationOnly !== true || report.educationOnly !== true) fail("local course harvest must keep educationOnly true");
if (manifest.productionReady !== false || report.productionReady !== false) fail("local course harvest must keep productionReady false");
if (!manifest.root || !fs.existsSync(manifest.root)) fail("manifest root missing or unavailable");
if (!Array.isArray(manifest.files) || manifest.files.length < 300) fail(`expected at least 300 local PDFs, got ${manifest.files?.length || 0}`);
if (report.totalPdfFiles !== manifest.files.length) fail("report totalPdfFiles must match manifest");
if (!report.boundary || !/internal research layer/i.test(report.boundary)) fail("report missing internal research boundary");

const corpusFiles = fs.existsSync(corpusDir)
  ? fs.readdirSync(corpusDir).filter((file) => /^corpus_\d+\.json$/.test(file))
  : [];
const localDocs = corpusFiles
  .map((file) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(corpusDir, file), "utf8"));
    } catch {
      return null;
    }
  })
  .filter((doc) => doc?.tier === "local_private_course");

if (localDocs.length < report.importedThisRun) fail("local corpus docs fewer than latest importedThisRun count");

for (const doc of localDocs) {
  if (doc.educationOnly !== true) fail(`${doc.id} must keep educationOnly true`);
  if (doc.productionReady !== false) fail(`${doc.id} must keep productionReady false`);
  if (doc.learnerFacingAllowed !== false) fail(`${doc.id} must not be learner-facing`);
  if (!/^local-course:\/\//.test(doc.url || "")) fail(`${doc.id} must use local-course:// URL`);
  if (!doc.sourceLocalPath || !fs.existsSync(doc.sourceLocalPath)) fail(`${doc.id} missing existing local source path`);
  if (!doc.sha256 || doc.sha256.length !== 64) fail(`${doc.id} missing sha256`);
  if (!doc.boundary || !/not learner-facing/i.test(doc.boundary)) fail(`${doc.id} missing private-course boundary`);
  if (typeof doc.text !== "string") fail(`${doc.id} missing extracted text field`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  manifestPdfFiles: manifest.files.length,
  uniquePdfFiles: report.uniquePdfFiles,
  duplicatePdfFiles: report.duplicatePdfFiles,
  localPrivateCourseDocs: localDocs.length,
  pendingAfterLatestRun: report.pendingAfterRun,
  boundary: "Local PDFs are indexed only as private internal research material; learner-facing release remains blocked.",
}, null, 2));
