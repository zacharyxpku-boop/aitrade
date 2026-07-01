import fs from "node:fs";
import path from "node:path";

const outputJson = "docs/WIKIPEDIA_GROUNDING_AUDIT.json";
const outputMd = "docs/WIKIPEDIA_GROUNDING_AUDIT.md";
const corpusDir = "data/corpus";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function isWikipediaDoc(doc) {
  return doc?.sourceId?.startsWith("wikipedia:") ||
    /^Wikipedia:/i.test(doc?.name || "") ||
    /wikipedia\.org/i.test(doc?.url || "");
}

const publicGap = readJson("docs/PUBLIC_SOURCE_GAP_AUDIT.json");
const harvestReport = readJson("docs/WIKIPEDIA_HARVEST_REPORT.json");
const highRiskGrounding = readJson("docs/LOCAL_COURSE_HIGH_RISK_PUBLIC_GROUNDING_MATRIX.json");
if (publicGap.educationOnly !== true || harvestReport.educationOnly !== true || highRiskGrounding.educationOnly !== true) {
  fail("Wikipedia audit inputs must keep educationOnly:true");
}
if (publicGap.productionReady !== false || harvestReport.productionReady !== false || highRiskGrounding.productionReady !== false) {
  fail("Wikipedia audit inputs must keep productionReady:false");
}

const corpusDocs = fs.readdirSync(corpusDir)
  .filter((file) => /^corpus_\d+\.json$/.test(file))
  .map((file) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(corpusDir, file), "utf8"));
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const wikipediaDocs = corpusDocs.filter(isWikipediaDoc);
const wikipediaDocSamples = wikipediaDocs.slice(0, 12).map((doc) => ({
  id: doc.id,
  sourceId: doc.sourceId,
  name: doc.name,
  url: doc.url,
  tier: doc.tier,
  charCount: doc.charCount || 0,
  attribution: doc.attribution || "",
  licenseEvidence: doc.licenseEvidence || "",
  excerptPolicy: "attribution_and_share_alike_required",
  learnerFacingApproved: false,
}));

const moduleRows = (publicGap.moduleRows || []).map((row) => {
  const wikipediaSamples = (row.wikipediaEvidenceSamples || []).slice(0, 4).map((sample) => ({
    documentId: sample.documentId,
    sourceId: sample.sourceId,
    name: sample.name,
    url: sample.url,
    score: sample.score,
    matchedTerms: sample.matchedTerms || [],
    excerptPolicy: sample.excerptPolicy,
  }));
  return {
    moduleId: row.moduleId,
    module: row.module,
    learnerFacingNodes: row.learnerFacingNodes,
    wikipediaEvidenceDocs: row.wikipediaEvidenceDocs,
    wikipediaSamples,
    matchedPublicDocs: row.matchedPublicDocs,
    topPublicEvidenceDocs: row.topPublicEvidenceDocs,
    officialLikeEvidenceDocs: row.officialLikeEvidenceDocs,
    uniqueHosts: row.uniqueHosts,
    readinessStatus: row.readinessStatus,
    wikipediaGroundingReady: row.wikipediaEvidenceDocs >= 2 && wikipediaSamples.length >= 1,
    learnerCitationApproved: false,
    learnerFacingRelease: false,
    nextGate: "human_source_fit_public_grounding_originality_and_separate_release_approval",
    boundary: "Wikipedia refs support reviewer grounding, terminology, taxonomy, and source-boundary checks only; they do not approve copied text or learner-facing citation use.",
  };
});

const highRiskLessonRows = (highRiskGrounding.lessonRows || []).map((lesson) => ({
  lessonId: lesson.lessonId,
  nodeId: lesson.nodeId,
  module: lesson.module,
  topic: lesson.topic,
  wikipediaRefCount: (lesson.wikipediaRefs || []).length,
  publicContextRefCount: (lesson.publicContextRefs || []).length,
  publicGroundingStatus: lesson.publicGroundingStatus,
  learnerCitationApproved: lesson.learnerCitationApproved === true,
  learnerFacingRelease: lesson.learnerFacingRelease === true,
  approvalStatus: lesson.approvalStatus,
  releaseBlocker: lesson.releaseBlocker === true,
  firstWikipediaRefs: (lesson.wikipediaRefs || []).slice(0, 2).map((ref) => ({
    name: ref.name,
    url: ref.url,
    excerptPolicy: ref.excerptPolicy,
  })),
}));

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  auditStatus: "wikipedia_grounding_ready_for_reviewer_not_release",
  auditMode: "public_wikipedia_research_layer_grounding_audit",
  corpusDocuments: publicGap.corpusDocuments,
  publicCorpusDocuments: publicGap.publicCorpusDocuments,
  wikipediaDocuments: wikipediaDocs.length,
  wikipediaDocumentsFromPublicGap: publicGap.wikipediaDocuments,
  recentHarvestArticlesAttempted: harvestReport.articlesAttempted,
  recentHarvestArticlesStored: harvestReport.articlesStored,
  recentHarvestSkipped: harvestReport.skipped,
  modules: moduleRows.length,
  modulesWithWikipediaGrounding: moduleRows.filter((row) => row.wikipediaEvidenceDocs >= 1).length,
  modulesWithTwoWikipediaGroundingDocs: moduleRows.filter((row) => row.wikipediaEvidenceDocs >= 2).length,
  modulesWithWikipediaSamples: moduleRows.filter((row) => row.wikipediaSamples.length >= 1).length,
  wikipediaThinModules: moduleRows.filter((row) => row.wikipediaEvidenceDocs < 2).map((row) => row.module),
  moduleRows,
  highRiskLessonRows,
  highRiskLessonsWithAtLeastThreeWikipediaRefs: highRiskLessonRows.filter((row) => row.wikipediaRefCount >= 3).length,
  highRiskWikipediaRefCount: highRiskLessonRows.reduce((sum, row) => sum + row.wikipediaRefCount, 0),
  highRiskLearnerCitationApprovedLessons: highRiskLessonRows.filter((row) => row.learnerCitationApproved === true).length,
  wikipediaDocSamples,
  learnerCitationApprovedModules: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  commands: [
    "npm.cmd run check:wikipedia-grounding-audit",
    "npm.cmd run check:public-source-gap-audit",
    "npm.cmd run check:local-course-high-risk-public-grounding-matrix",
    "npm.cmd run check:local-course-module-review-dossier",
  ],
  completionRule: "This audit proves Wikipedia/public grounding availability for reviewer work. It does not approve learner-facing citations, does not permit copied Wikipedia text, and does not authorize lesson writes.",
  boundary: "Wikipedia grounding audit is reviewer-facing education-only governance. Wikipedia is CC BY-SA/share-alike research-layer reference material for terminology, taxonomy, and source-boundary review; it does not provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, learner-facing approval, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Wikipedia Grounding Audit",
  "",
  `- Audit status: ${audit.auditStatus}`,
  `- Wikipedia corpus docs: ${audit.wikipediaDocuments}`,
  `- Public-gap Wikipedia docs: ${audit.wikipediaDocumentsFromPublicGap}`,
  `- Modules with Wikipedia grounding: ${audit.modulesWithWikipediaGrounding}/${audit.modules}`,
  `- Modules with 2+ Wikipedia docs: ${audit.modulesWithTwoWikipediaGroundingDocs}/${audit.modules}`,
  `- High-risk lessons with 3+ Wikipedia refs: ${audit.highRiskLessonsWithAtLeastThreeWikipediaRefs}/${audit.highRiskLessonRows.length}`,
  `- High-risk Wikipedia refs: ${audit.highRiskWikipediaRefCount}`,
  `- Learner citation approved modules: ${audit.learnerCitationApprovedModules}`,
  `- Write allowed now: ${audit.writeAllowedNow}`,
  "",
  "## Module Rows",
  "",
  "| Module | Wikipedia docs | Samples | Public docs | Official-like | Status |",
  "|---|---:|---:|---:|---:|---|",
  ...moduleRows.map((row) => `| ${row.module} | ${row.wikipediaEvidenceDocs} | ${row.wikipediaSamples.length} | ${row.topPublicEvidenceDocs} | ${row.officialLikeEvidenceDocs} | ${row.readinessStatus} |`),
  "",
  "## Boundary",
  "",
  audit.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: audit.educationOnly,
  productionReady: audit.productionReady,
  learnerFacingRelease: audit.learnerFacingRelease,
  approvalStatus: audit.approvalStatus,
  auditStatus: audit.auditStatus,
  wikipediaDocuments: audit.wikipediaDocuments,
  modulesWithWikipediaGrounding: audit.modulesWithWikipediaGrounding,
  highRiskLessonsWithAtLeastThreeWikipediaRefs: audit.highRiskLessonsWithAtLeastThreeWikipediaRefs,
  writeAllowedNow: audit.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
