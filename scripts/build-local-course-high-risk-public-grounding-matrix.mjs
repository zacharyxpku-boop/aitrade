import fs from "node:fs";

const publicGapPath = "docs/PUBLIC_SOURCE_GAP_AUDIT.json";
const selfReviewPath = "docs/LOCAL_COURSE_HIGH_RISK_SELF_REVIEW_OVERLAY.json";
const outputJsonPath = "docs/LOCAL_COURSE_HIGH_RISK_PUBLIC_GROUNDING_MATRIX.json";
const outputMdPath = "docs/LOCAL_COURSE_HIGH_RISK_PUBLIC_GROUNDING_MATRIX.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function assertBoundary(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (record.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

function sourceRef(source, role) {
  return {
    documentId: source.documentId,
    sourceId: source.sourceId,
    name: source.name,
    url: source.url,
    tier: source.tier,
    family: source.family || (String(source.sourceId || "").startsWith("wikipedia:") ? "Wikipedia" : "Public/Open"),
    score: source.score,
    matchedTerms: source.matchedTerms || [],
    excerptPolicy: source.excerptPolicy,
    groundingRole: role,
  };
}

function uniqueByUrl(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.url || row.sourceId || row.documentId;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const publicGap = readJson(publicGapPath);
const selfReview = readJson(selfReviewPath);
assertBoundary(publicGap, "public source gap audit");
assertBoundary(selfReview, "high-risk self-review overlay");
if (publicGap.publicReferenceReadyModules !== 12) fail("public source gap audit must have 12 ready modules");
if (selfReview.overlayStatus !== "codex_self_review_complete_not_approved") fail("self-review overlay must be complete before grounding matrix");

const moduleByName = new Map((publicGap.moduleRows || []).map((row) => [row.module, row]));
const lessonRows = (selfReview.lessons || []).map((lesson) => {
  const moduleRow = moduleByName.get(lesson.module);
  if (!moduleRow) fail(`missing public source module row for ${lesson.module}`);
  const wikipediaRefs = uniqueByUrl((moduleRow.wikipediaEvidenceSamples || [])
    .map((source) => sourceRef(source, "terminology_taxonomy_and_boundary_reference")))
    .slice(0, 4);
  if (wikipediaRefs.length < 3) fail(`module ${lesson.module} must have at least 3 Wikipedia refs`);
  const openRefs = uniqueByUrl((moduleRow.evidenceSamples || [])
    .filter((source) => (source.family || "") !== "Wikipedia")
    .map((source) => sourceRef(source, "open_research_or_public_context_reference")))
    .slice(0, 2);
  const fallbackPublicRefs = uniqueByUrl((moduleRow.evidenceSamples || [])
    .map((source) => sourceRef(source, "public_context_reference")))
    .filter((source) => !wikipediaRefs.some((wiki) => wiki.url === source.url))
    .slice(0, 2);
  const publicContextRefs = openRefs.length ? openRefs : fallbackPublicRefs;
  return {
    candidateId: lesson.candidateId,
    nodeId: lesson.nodeId,
    lessonId: lesson.lessonId,
    module: lesson.module,
    topic: lesson.topic,
    sourceSelfReviewStatus: lesson.selfReviewStatus,
    publicGroundingStatus: "mapped_for_reviewer_not_release_approved",
    publicModuleReadinessStatus: moduleRow.readinessStatus,
    matchedPublicDocs: moduleRow.matchedPublicDocs,
    wikipediaEvidenceDocs: moduleRow.wikipediaEvidenceDocs,
    officialLikeEvidenceDocs: moduleRow.officialLikeEvidenceDocs,
    uniqueHosts: moduleRow.uniqueHosts,
    wikipediaRefs,
    publicContextRefs,
    selectedPublicRefCount: wikipediaRefs.length + publicContextRefs.length,
    shareAlikeAttributionRequiredRefs: wikipediaRefs.filter((ref) => ref.tier === "share_alike").length,
    publicGroundingMapped: true,
    learnerCitationApproved: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    releaseBlocker: true,
    humanApprovalRequired: true,
    rewriteGuidance: "Use public refs to support terminology, taxonomy, and source-boundary review only. Rewrite the lesson in original education language; do not copy Wikipedia or private PDF wording.",
    claimBoundary: "Public sources can ground vocabulary and conceptual boundaries. They do not prove a setup, signal, future outcome, strategy edge, or real-money action.",
    nextGate: "human_public_grounding_review_then_originality_and_release_gate",
  };
});

const directSourceRows = (selfReview.directSourceSelfReview || []).map((row) => {
  const lesson = lessonRows.find((item) => item.candidateId === row.candidateId);
  return {
    id: row.id,
    candidateId: row.candidateId,
    module: row.module,
    topic: row.topic,
    privateOrDirectCandidateSource: row.candidateSource,
    selfReviewDecision: row.selfReviewDecision,
    publicReplacementRefs: lesson ? lesson.wikipediaRefs.slice(0, 3) : [],
    learnerCitationApproved: false,
    releaseBlocker: true,
    action: "Keep the direct/private candidate source as reviewer-only background. Use public refs only for terminology and boundary grounding before a human release decision.",
  };
});

const lessonsWithPublicGrounding = lessonRows.filter((row) => row.publicGroundingMapped && row.wikipediaRefs.length >= 3).length;
const totalWikipediaRefs = lessonRows.reduce((sum, row) => sum + row.wikipediaRefs.length, 0);
const totalPublicContextRefs = lessonRows.reduce((sum, row) => sum + row.publicContextRefs.length, 0);

const matrix = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  matrixStatus: "high_risk_public_grounding_mapped_not_approved",
  sourcePublicGapAudit: publicGapPath,
  sourceSelfReviewOverlay: selfReviewPath,
  lessonCount: lessonRows.length,
  lessonsWithPublicGrounding,
  lessonsMissingPublicGrounding: lessonRows.length - lessonsWithPublicGrounding,
  lessonsWithAtLeastThreeWikipediaRefs: lessonRows.filter((row) => row.wikipediaRefs.length >= 3).length,
  totalWikipediaRefs,
  totalPublicContextRefs,
  directSourceCandidateResolutionsMapped: directSourceRows.length,
  directSourceCandidatesApprovedForLearnerCitation: 0,
  publicGroundingMappedNotes: lessonRows.length,
  releaseReadyLessons: 0,
  learnerCitationApprovedLessons: 0,
  releaseBlockingLessons: lessonRows.length,
  humanApprovalRequired: true,
  writeAllowedNow: false,
  approvalGatePassed: false,
  modulesCovered: [...new Set(lessonRows.map((row) => row.module))].length,
  moduleRows: [...new Set(lessonRows.map((row) => row.module))].map((module) => {
    const rows = lessonRows.filter((row) => row.module === module);
    return {
      module,
      lessons: rows.length,
      publicModuleReadinessStatus: rows[0]?.publicModuleReadinessStatus,
      wikipediaEvidenceDocs: rows[0]?.wikipediaEvidenceDocs || 0,
      officialLikeEvidenceDocs: rows[0]?.officialLikeEvidenceDocs || 0,
      selectedWikipediaRefs: rows.reduce((sum, row) => sum + row.wikipediaRefs.length, 0),
    };
  }),
  lessonRows,
  directSourceRows,
  completionRule: "This matrix maps high-risk lessons to public/Wikipedia grounding for reviewer use. It clears the mapping task, not the release gate: every lesson still needs human public-grounding review, originality review, and separate approval before learner-facing use.",
  boundary: "High-risk public grounding matrix is internal reviewer evidence planning only. Wikipedia and public sources support terminology, taxonomy, attribution-aware references, and original education rewrites; they do not approve learner-facing release, make private PDFs public citations, provide stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

writeJson(outputJsonPath, matrix);
fs.writeFileSync(outputMdPath, [
  "# Local Course High-Risk Public Grounding Matrix",
  "",
  "Lesson-level public/Wikipedia grounding for the 12 high-risk local-course-assisted rewrite lessons.",
  "",
  `- Matrix status: ${matrix.matrixStatus}`,
  `- Lessons: ${matrix.lessonCount}`,
  `- Lessons with public grounding: ${matrix.lessonsWithPublicGrounding}`,
  `- Lessons missing public grounding: ${matrix.lessonsMissingPublicGrounding}`,
  `- Lessons with >=3 Wikipedia refs: ${matrix.lessonsWithAtLeastThreeWikipediaRefs}`,
  `- Total Wikipedia refs selected: ${matrix.totalWikipediaRefs}`,
  `- Total public context refs selected: ${matrix.totalPublicContextRefs}`,
  `- Direct source resolutions mapped: ${matrix.directSourceCandidateResolutionsMapped}`,
  `- Release-ready lessons: ${matrix.releaseReadyLessons}`,
  `- Learner citation approved lessons: ${matrix.learnerCitationApprovedLessons}`,
  `- Write allowed now: ${matrix.writeAllowedNow}`,
  "",
  "## Lesson Rows",
  "",
  "| Candidate | Module | Topic | Wiki refs | Public refs | Release |",
  "| --- | --- | --- | ---: | ---: | --- |",
  ...lessonRows.map((row) => `| ${row.candidateId} | ${row.module} | ${row.topic} | ${row.wikipediaRefs.length} | ${row.publicContextRefs.length} | blocked |`),
  "",
  "## Module Coverage",
  "",
  "| Module | Lessons | Wikipedia docs in audit | Official-like docs |",
  "| --- | ---: | ---: | ---: |",
  ...matrix.moduleRows.map((row) => `| ${row.module} | ${row.lessons} | ${row.wikipediaEvidenceDocs} | ${row.officialLikeEvidenceDocs} |`),
  "",
  "## Completion Rule",
  "",
  matrix.completionRule,
  "",
  "## Boundary",
  "",
  matrix.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: matrix.educationOnly,
  productionReady: matrix.productionReady,
  learnerFacingRelease: matrix.learnerFacingRelease,
  approvalStatus: matrix.approvalStatus,
  matrixStatus: matrix.matrixStatus,
  lessonCount: matrix.lessonCount,
  lessonsWithPublicGrounding: matrix.lessonsWithPublicGrounding,
  lessonsWithAtLeastThreeWikipediaRefs: matrix.lessonsWithAtLeastThreeWikipediaRefs,
  totalWikipediaRefs: matrix.totalWikipediaRefs,
  directSourceCandidateResolutionsMapped: matrix.directSourceCandidateResolutionsMapped,
  releaseReadyLessons: matrix.releaseReadyLessons,
  writeAllowedNow: matrix.writeAllowedNow,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
