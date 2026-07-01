import fs from "node:fs";

const auditPath = "docs/PUBLIC_SOURCE_GAP_AUDIT.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const audit = readJson(auditPath);
const rows = audit.moduleRows || [];

if (audit.educationOnly !== true) fail("public source gap audit must keep educationOnly:true");
if (audit.productionReady !== false) fail("public source gap audit must keep productionReady:false");
if (audit.learnerFacingRelease !== false) fail("public source gap audit must keep learnerFacingRelease:false");
if (audit.approvalStatus !== "not_approved") fail("public source gap audit must remain not_approved");
if (audit.publicCorpusDocuments < 1100) fail(`expected >=1100 public corpus docs, got ${audit.publicCorpusDocuments}`);
if (audit.wikipediaDocuments < 90) fail(`expected >=90 Wikipedia docs, got ${audit.wikipediaDocuments}`);
if (audit.officialLikeDocuments < 200) fail(`expected >=200 official-like docs, got ${audit.officialLikeDocuments}`);
if (audit.modules !== 12 || rows.length !== 12) fail(`expected 12 module rows, got ${audit.modules}/${rows.length}`);
if (audit.modulesWithPublicEvidence !== 12) fail(`all modules need public evidence, got ${audit.modulesWithPublicEvidence}`);
if (audit.modulesWithWikipediaEvidence !== 12) fail(`all modules need Wikipedia evidence, got ${audit.modulesWithWikipediaEvidence}`);
if (audit.modulesWithHostDiversity !== 12) fail(`all modules need host diversity, got ${audit.modulesWithHostDiversity}`);
if (audit.publicReferenceReadyModules !== 12) fail(`all modules need reviewer-ready public references, got ${audit.publicReferenceReadyModules}`);

for (const row of rows) {
  if (row.topPublicEvidenceDocs < 12) fail(`${row.module} has too few public evidence docs`);
  if (row.wikipediaEvidenceDocs < 1) fail(`${row.module} has no Wikipedia evidence`);
  if (!Array.isArray(row.wikipediaEvidenceSamples) || row.wikipediaEvidenceSamples.length < 1) {
    fail(`${row.module} lacks Wikipedia evidence samples`);
  }
  if (row.uniqueHosts < 2) fail(`${row.module} has too little host diversity`);
  if (!Array.isArray(row.evidenceSamples) || row.evidenceSamples.length < 8) fail(`${row.module} lacks evidence samples`);
  if (row.readinessStatus !== "public_reference_ready_for_reviewer") fail(`${row.module} public reference status drift`);
  if (!row.evidenceSamples.every((sample) => sample.documentId && sample.url && sample.tier && sample.excerptPolicy)) {
    fail(`${row.module} evidence samples missing source metadata`);
  }
}

if (!/Wikipedia and other public materials support taxonomy/i.test(audit.boundary || "")) {
  fail("public source gap audit boundary missing public-source reuse limits");
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: audit.educationOnly,
  productionReady: audit.productionReady,
  learnerFacingRelease: audit.learnerFacingRelease,
  approvalStatus: audit.approvalStatus,
  publicCorpusDocuments: audit.publicCorpusDocuments,
  wikipediaDocuments: audit.wikipediaDocuments,
  officialLikeDocuments: audit.officialLikeDocuments,
  modules: audit.modules,
  modulesWithPublicEvidence: audit.modulesWithPublicEvidence,
  modulesWithWikipediaEvidence: audit.modulesWithWikipediaEvidence,
  publicReferenceReadyModules: audit.publicReferenceReadyModules,
  wikipediaThinModules: audit.wikipediaThinModules.length,
}, null, 2));
