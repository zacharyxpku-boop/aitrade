import fs from "node:fs";

const intakePath = "docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json";
const teachingPath = "docs/LOCAL_COURSE_5_TEACHING_MODULE_DISTILLATION.json";
const retentionPath = "docs/LOCAL_COURSE_5_SOURCE_RETENTION_MANIFEST.json";
const deletionPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";

const outputJson = "docs/LOCAL_COURSE_5_SOURCE_TO_MODULE_COVERAGE_MATRIX.json";
const outputMd = "docs/LOCAL_COURSE_5_SOURCE_TO_MODULE_COVERAGE_MATRIX.md";
const outputHtml = "docs/local-course-5-source-to-module-coverage-matrix.html";

const boundary = "Course 5 source-to-module coverage matrix is private reviewer-facing education operations material. It maps each local source file to private teaching-module candidates, source evidence status, follow-up blockers, review gates, public grounding needs, and deletion-readiness impact. It does not perform OCR, generate reviewer conclusions, accept machine drafts as human review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowAbsorptionClass(row) {
  if (row.absorptionStatus === "duplicate_file_represented_by_primary_hash") return "duplicate_represented_by_primary_hash";
  if (row.absorptionStatus === "absorbed_private_research_text") return "text_absorbed_private_module_candidate";
  return "followup_required_visual_or_ocr_blocked";
}

function nextGate(row) {
  const klass = rowAbsorptionClass(row);
  if (klass === "duplicate_represented_by_primary_hash") return "confirm_duplicate_primary_then_keep_represented_by_primary_hash";
  if (klass === "text_absorbed_private_module_candidate") return "review_paraphrase_public_grounding_and_module_distillation";
  if (row.extension === ".zip") return "complete_zip_visual_reviewer_input_then_route_to_semantic_merge_preview";
  if (row.extension === ".pdf") return "complete_pdf_ocr_or_visual_reviewer_input_then_route_to_semantic_merge_preview";
  return "resolve_followup_evidence_then_recompute_module_and_deletion_readiness";
}

const intake = readJson(intakePath);
const teaching = readJson(teachingPath);
const retention = readJson(retentionPath);
const deletion = readJson(deletionPath);

for (const [name, artifact] of Object.entries({ intake, teaching, retention, deletion })) {
  assertBoundary(name, artifact);
}

const moduleById = new Map(teaching.moduleRows.map((row) => [row.moduleId, row]));
const retentionByRecordId = new Map(retention.retentionRows.map((row) => [row.recordId, row]));

const sourceRows = intake.rows.map((row, index) => {
  const klass = rowAbsorptionClass(row);
  const retentionRow = retentionByRecordId.get(row.recordId);
  const moduleIds = row.moduleTags || [];
  return {
    sourceRowNo: index + 1,
    recordId: row.recordId,
    relativePath: row.relativePath,
    extension: row.extension,
    sizeMb: row.sizeMb,
    sha256: row.sha256,
    duplicateOf: row.duplicateOf || null,
    moduleIds,
    moduleCount: moduleIds.length,
    courseAlignment: row.courseAlignment || [],
    absorptionStatus: row.absorptionStatus,
    absorptionClass: klass,
    extractionBucket: row.extractionBucket,
    charCount: row.charCount || 0,
    knowledgeNodeCandidateCount: row.knowledgeNodeCandidateCount || 0,
    retentionClass: retentionRow?.retentionClass || "",
    mustKeepOriginalForKnowledge: retentionRow?.mustKeepOriginalForKnowledge === true,
    privateModulePlanningAllowedNow: klass !== "duplicate_represented_by_primary_hash",
    learnerModuleMergeAllowedNow: false,
    publicGroundingRequired: true,
    reviewRequiredBeforeLearnerUse: true,
    acceptedForModuleDistillation: false,
    acceptedForDeletionReadiness: false,
    sourceFolderMayBeDeleted: false,
    nextGate: nextGate(row),
    educationOnly: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const moduleRows = [...moduleById.values()].map((module) => {
  const rows = sourceRows.filter((row) => row.moduleIds.includes(module.moduleId));
  return {
    moduleId: module.moduleId,
    moduleLabel: module.moduleLabel,
    sourceRows: rows.length,
    textAbsorbedRows: rows.filter((row) => row.absorptionClass === "text_absorbed_private_module_candidate").length,
    followupRows: rows.filter((row) => row.absorptionClass === "followup_required_visual_or_ocr_blocked").length,
    duplicateRows: rows.filter((row) => row.absorptionClass === "duplicate_represented_by_primary_hash").length,
    lessonSeedCount: module.lessonSeedCount,
    evidenceAnchors: Array.isArray(module.evidenceAnchors) ? module.evidenceAnchors.length : 0,
    moduleCoverageStatus: rows.some((row) => row.absorptionClass === "followup_required_visual_or_ocr_blocked")
      ? "private_module_candidate_has_unresolved_visual_or_ocr_sources"
      : "private_module_candidate_text_sources_absorbed_review_still_required",
    learnerReady: false,
    sourceFolderMayBeDeleted: false,
    nextGate: "review_source_rows_then_public_grounding_and_module_distillation",
    educationOnly: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const textAbsorbedRows = sourceRows.filter((row) => row.absorptionClass === "text_absorbed_private_module_candidate").length;
const followupRows = sourceRows.filter((row) => row.absorptionClass === "followup_required_visual_or_ocr_blocked").length;
const duplicateRows = sourceRows.filter((row) => row.absorptionClass === "duplicate_represented_by_primary_hash").length;

const matrix = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  matrixStatus: "course_5_source_to_module_coverage_matrix_ready_release_and_deletion_blocked",
  sourceRoot: intake.sourceRoot,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  sourceIntake: intakePath,
  sourceTeachingDistillation: teachingPath,
  sourceRetentionManifest: retentionPath,
  sourceDeletionReadiness: deletionPath,
  totalFiles: intake.totalFiles,
  sourceRows: sourceRows.length,
  uniquePrimaryRows: intake.uniquePrimaryRows,
  textAbsorbedRows,
  followupRequiredRows: followupRows,
  duplicateRows,
  totalExtractedChars: intake.totalExtractedChars,
  knowledgeNodeCandidateRows: intake.knowledgeNodeCandidateRows,
  modules: moduleRows.length,
  modulesWithSourceRows: moduleRows.filter((row) => row.sourceRows > 0).length,
  modulesWithFollowupBlockers: moduleRows.filter((row) => row.followupRows > 0).length,
  modulesLearnerReady: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  deletionReadinessStatus: deletion.readinessStatus,
  moduleRows,
  sourceRowsDetail: sourceRows,
  nextOperationalGates: [
    "Use this matrix as the row-level checklist for Course 5 source absorption.",
    "Resolve ZIP rows through real visual reviewer input and ZIP route maps.",
    "Resolve PDF rows through OCR or real visual reviewer input and PDF route maps.",
    "Only merge source rows into learner-facing modules after paraphrase review, public grounding, and release approval.",
    "Only recompute deletion readiness after every follow-up source row has accepted replacement evidence or documented future-loss acceptance.",
  ],
  commands: [
    "npm.cmd run build:local-course-5-source-to-module-coverage-matrix",
    "npm.cmd run check:local-course-5-source-to-module-coverage-matrix",
    "npm.cmd run verify",
  ],
  completionRule: "This coverage matrix is complete when all 134 Course 5 source files are represented exactly once, every source row is mapped to its private teaching-module candidates and current absorption class, and all learner release, module merge, and source deletion gates remain closed until real review and public grounding are accepted.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(matrix, null, 2)}\n`, "utf8");

fs.writeFileSync(outputMd, [
  "# Course 5 Source To Module Coverage Matrix",
  "",
  `- Matrix status: ${matrix.matrixStatus}`,
  `- Source rows: ${matrix.sourceRows}`,
  `- Text absorbed rows: ${matrix.textAbsorbedRows}`,
  `- Follow-up required rows: ${matrix.followupRequiredRows}`,
  `- Duplicate rows: ${matrix.duplicateRows}`,
  `- Modules: ${matrix.modules}`,
  `- Modules with follow-up blockers: ${matrix.modulesWithFollowupBlockers}`,
  `- Source folder may be deleted: ${matrix.sourceFolderMayBeDeleted}`,
  "",
  "## Module Coverage",
  "",
  "| Module | Sources | Text absorbed | Follow-up | Lesson seeds | Status |",
  "|---|---:|---:|---:|---:|---|",
  ...moduleRows.map((row) => `| ${row.moduleId} | ${row.sourceRows} | ${row.textAbsorbedRows} | ${row.followupRows} | ${row.lessonSeedCount} | ${row.moduleCoverageStatus} |`),
  "",
  "## First Source Rows",
  "",
  "| Source | Modules | Absorption class | Next gate |",
  "|---|---:|---|---|",
  ...sourceRows.slice(0, 30).map((row) => `| ${row.recordId} | ${row.moduleCount} | ${row.absorptionClass} | ${row.nextGate} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

const moduleHtml = moduleRows.map((row) => `
        <tr>
          <td>${htmlEscape(row.moduleId)}</td>
          <td>${row.sourceRows}</td>
          <td>${row.textAbsorbedRows}</td>
          <td>${row.followupRows}</td>
          <td>${row.lessonSeedCount}</td>
          <td>${htmlEscape(row.moduleCoverageStatus)}</td>
        </tr>`).join("");

fs.writeFileSync(outputHtml, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 Source To Module Coverage Matrix</title>
  <style>
    :root { font-family: Arial, Helvetica, sans-serif; background: #f8f7f2; color: #20211f; }
    body { margin: 0; }
    header { background: #fff; border-bottom: 1px solid #d9d9d2; padding: 18px 24px; }
    h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: 0; }
    .status { color: #5c625b; font-size: 13px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; padding: 18px 24px; }
    .metric { background: #fff; border: 1px solid #d5d8d0; border-radius: 8px; padding: 12px; }
    .metric b { display: block; font-size: 22px; margin-bottom: 5px; }
    .metric span { color: #5c625b; font-size: 12px; }
    main { padding: 0 24px 24px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d5d8d0; border-radius: 8px; overflow: hidden; }
    th, td { border-bottom: 1px solid #e3e5df; padding: 8px 10px; text-align: left; font-size: 13px; vertical-align: top; }
    th { background: #eef0eb; }
    footer { padding: 18px 24px 30px; color: #55584f; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <h1>Course 5 Source To Module Coverage Matrix</h1>
    <div class="status">${htmlEscape(matrix.matrixStatus)}</div>
  </header>
  <section class="metrics">
    <div class="metric"><b>${matrix.sourceRows}</b><span>source rows</span></div>
    <div class="metric"><b>${matrix.textAbsorbedRows}</b><span>text absorbed rows</span></div>
    <div class="metric"><b>${matrix.followupRequiredRows}</b><span>follow-up required rows</span></div>
    <div class="metric"><b>${matrix.modulesWithFollowupBlockers}</b><span>modules with blockers</span></div>
    <div class="metric"><b>${matrix.modulesLearnerReady}</b><span>learner-ready modules</span></div>
    <div class="metric"><b>${matrix.sourceFolderMayBeDeleted}</b><span>source folder may be deleted</span></div>
  </section>
  <main>
    <table>
      <thead><tr><th>Module</th><th>Sources</th><th>Text absorbed</th><th>Follow-up</th><th>Lesson seeds</th><th>Status</th></tr></thead>
      <tbody>${moduleHtml}</tbody>
    </table>
  </main>
  <footer>${htmlEscape(boundary)}</footer>
</body>
</html>
`, "utf8");

console.log(JSON.stringify({
  ok: true,
  matrixStatus: matrix.matrixStatus,
  sourceRows: matrix.sourceRows,
  textAbsorbedRows: matrix.textAbsorbedRows,
  followupRequiredRows: matrix.followupRequiredRows,
  duplicateRows: matrix.duplicateRows,
  modules: matrix.modules,
  modulesWithFollowupBlockers: matrix.modulesWithFollowupBlockers,
  sourceFolderMayBeDeleted: matrix.sourceFolderMayBeDeleted,
}, null, 2));
