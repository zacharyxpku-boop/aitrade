import fs from "node:fs";

const intakePath = "docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json";
const deletionPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";
const cockpitPath = "docs/LOCAL_COURSE_5_ABSORPTION_COCKPIT.json";
const outputJson = "docs/LOCAL_COURSE_5_SOURCE_RETENTION_MANIFEST.json";
const outputMd = "docs/LOCAL_COURSE_5_SOURCE_RETENTION_MANIFEST.md";

const boundary = "Course 5 source retention manifest is private reviewer-facing education operations material. It classifies local supplemental source files by retention need after source intake, text absorption, visual/OCR review batching, and deletion-readiness checks. It does not delete files, approve folder deletion, approve learner-facing release, accept machine drafts as human review, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

function classifyRow(row, followupIds, primaryByHash) {
  if (row.duplicateOf) {
    const primary = primaryByHash.get(row.sha256);
    return {
      retentionClass: "duplicate_represented_by_primary_hash",
      mustKeepOriginalForKnowledge: false,
      mayRemoveAfterSeparateUserConfirmation: true,
      reason: `Duplicate file represented by primary record ${primary?.recordId || row.duplicateOf}; knowledge retention depends on the primary hash record, not this duplicate path.`,
      nextGate: "optional_user_cleanup_duplicate_only_after_manual_path_check",
    };
  }

  if (followupIds.has(row.recordId)) {
    const isZip = row.extension === ".zip";
    const isLarge = row.extractionBucket === "large_file_deferred_for_dedicated_visual_or_ocr_pass";
    const nextGate = isZip
      ? "complete_zip_image_package_semantic_review_or_accept_documented_future_loss"
      : isLarge
        ? "split_or_ocr_large_pdf_then_review_chart_semantics"
        : "complete_scanned_pdf_ocr_or_manual_visual_semantic_review";
    return {
      retentionClass: "must_retain_source_until_visual_or_ocr_resolved",
      mustKeepOriginalForKnowledge: true,
      mayRemoveAfterSeparateUserConfirmation: false,
      reason: `Source row remains in the Course 5 follow-up queue with extraction bucket ${row.extractionBucket || "unknown"}; current knowledge artifacts cannot replace its original visual/OCR content.`,
      nextGate,
    };
  }

  if (row.absorptionStatus === "absorbed_private_research_text" && (row.charCount || 0) > 0) {
    return {
      retentionClass: "text_absorbed_private_research_cold_storage_candidate",
      mustKeepOriginalForKnowledge: false,
      mayRemoveAfterSeparateUserConfirmation: true,
      reason: "Text was extracted into private research artifacts and is covered by module candidate intake, but original source should still be cold-stored until public grounding, originality, and review gates finish.",
      nextGate: "eligible_for_cold_storage_not_irreversible_deletion",
    };
  }

  return {
    retentionClass: "retain_until_manual_record_audit",
    mustKeepOriginalForKnowledge: true,
    mayRemoveAfterSeparateUserConfirmation: false,
    reason: `Unexpected or thin absorption state ${row.absorptionStatus || "unknown"}; retain until the row is manually audited.`,
    nextGate: "manual_record_audit",
  };
}

const intake = readJson(intakePath);
const deletion = readJson(deletionPath);
const cockpit = readJson(cockpitPath);
for (const [name, artifact] of Object.entries({ intake, deletion, cockpit })) {
  assertBoundary(name, artifact);
}

const rows = intake.rows || [];
const followupIds = new Set((intake.followupQueue || []).map((row) => row.recordId));
const primaryByHash = new Map(rows.filter((row) => !row.duplicateOf).map((row) => [row.sha256, row]));

const retentionRows = rows.map((row) => {
  const classification = classifyRow(row, followupIds, primaryByHash);
  return {
    retentionId: `${row.sha256}:${row.relativePath}`,
    recordId: row.recordId,
    relativePath: row.relativePath,
    extension: row.extension,
    sizeMb: row.sizeMb,
    bytes: row.bytes,
    sha256: row.sha256,
    duplicateOf: row.duplicateOf || null,
    moduleTags: row.moduleTags || [],
    courseAlignment: row.courseAlignment || [],
    absorptionStatus: row.absorptionStatus,
    extractionBucket: row.extractionBucket || null,
    charCount: row.charCount || 0,
    knowledgeNodeCandidateCount: row.knowledgeNodeCandidateCount || 0,
    sourceLocalPath: row.sourceLocalPath,
    ...classification,
  };
});

const classCounts = retentionRows.reduce((acc, row) => {
  acc[row.retentionClass] = (acc[row.retentionClass] || 0) + 1;
  return acc;
}, {});

const bytesByClass = retentionRows.reduce((acc, row) => {
  acc[row.retentionClass] = (acc[row.retentionClass] || 0) + row.bytes;
  return acc;
}, {});

const manifest = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  manifestStatus: "course_5_source_retention_manifest_ready_folder_deletion_blocked",
  sourceRoot: intake.sourceRoot,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  totalFiles: intake.totalFiles,
  uniquePrimaryRows: intake.uniquePrimaryRows,
  duplicateRows: classCounts.duplicate_represented_by_primary_hash || 0,
  textAbsorbedColdStorageCandidateRows: classCounts.text_absorbed_private_research_cold_storage_candidate || 0,
  mustRetainSourceRows: classCounts.must_retain_source_until_visual_or_ocr_resolved || 0,
  manualAuditRows: classCounts.retain_until_manual_record_audit || 0,
  followupRequiredRows: intake.followupRequiredRows,
  visualOcrReviewerCards: cockpit.visualOcrReviewerCards,
  visualOcrReadyRows: cockpit.visualOcrReadyRows,
  visualOcrBlockedRows: cockpit.visualOcrBlockedRows,
  ocrEngineAvailable: deletion.visualEvidence?.ocrEngineAvailable === true,
  totalBytes: retentionRows.reduce((sum, row) => sum + row.bytes, 0),
  bytesByClass,
  classCounts,
  coldStorageGuidance: [
    "Do not delete the Course 5 folder while mustRetainSourceRows is above zero.",
    "Duplicate rows may be considered for cleanup only after manual path confirmation and separate user approval.",
    "Text-absorbed rows are cold-storage candidates, not irreversible deletion candidates, because learner release and originality gates remain blocked.",
    "ZIP image packages and scanned/large PDFs must remain available until OCR, visual semantic review, or an explicit documented future-loss acceptance is completed.",
  ],
  blockerSummary: {
    blockingFollowupRows: deletion.blockerEvidence?.blockingFollowupRows || intake.followupRequiredRows,
    pdfFollowupRows: deletion.blockerEvidence?.pdfFollowupRows || 0,
    zipFollowupRows: deletion.blockerEvidence?.zipFollowupRows || 0,
    currentBlockingReason: deletion.completionGate?.currentBlockingReason || deletion.reason,
  },
  retentionRows,
  commands: [
    "npm.cmd run build:local-course-5-source-retention-manifest",
    "npm.cmd run check:local-course-5-source-retention-manifest",
    "npm.cmd run verify",
  ],
  completionRule: "This manifest is complete when all 134 Course 5 source files have a file-level retention class, all 49 follow-up rows remain must-retain blockers, duplicate rows are separated from knowledge-critical originals, and folder deletion remains blocked until visual/OCR review and explicit approval gates pass.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const topRetained = retentionRows
  .filter((row) => row.mustKeepOriginalForKnowledge)
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 20);

fs.writeFileSync(outputMd, [
  "# Course 5 Source Retention Manifest",
  "",
  `- Manifest status: ${manifest.manifestStatus}`,
  `- Source root: ${manifest.sourceRoot}`,
  `- Total files: ${manifest.totalFiles}`,
  `- Unique primary rows: ${manifest.uniquePrimaryRows}`,
  `- Duplicate rows: ${manifest.duplicateRows}`,
  `- Text-absorbed cold-storage candidate rows: ${manifest.textAbsorbedColdStorageCandidateRows}`,
  `- Must-retain source rows: ${manifest.mustRetainSourceRows}`,
  `- Manual audit rows: ${manifest.manualAuditRows}`,
  `- Source folder may be deleted: ${manifest.sourceFolderMayBeDeleted}`,
  "",
  "## Retention Classes",
  "",
  "| Class | Rows | Approx GB | Meaning |",
  "|---|---:|---:|---|",
  ...Object.entries(manifest.classCounts).map(([klass, count]) => {
    const gb = ((manifest.bytesByClass[klass] || 0) / 1024 / 1024 / 1024).toFixed(3);
    return `| ${klass} | ${count} | ${gb} | ${klass === "must_retain_source_until_visual_or_ocr_resolved" ? "Original still needed for visual/OCR semantic absorption." : klass === "text_absorbed_private_research_cold_storage_candidate" ? "Text has been extracted; cold-storage candidate only." : klass === "duplicate_represented_by_primary_hash" ? "Duplicate path represented by a primary hash record." : "Needs manual audit."} |`;
  }),
  "",
  "## Largest Must-Retain Rows",
  "",
  "| Size MB | Extension | Module Tags | Relative Path | Next Gate |",
  "|---:|---|---|---|---|",
  ...topRetained.map((row) => `| ${row.sizeMb} | ${row.extension} | ${(row.moduleTags || []).join(", ")} | ${row.relativePath} | ${row.nextGate} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  manifestStatus: manifest.manifestStatus,
  totalFiles: manifest.totalFiles,
  duplicateRows: manifest.duplicateRows,
  textAbsorbedColdStorageCandidateRows: manifest.textAbsorbedColdStorageCandidateRows,
  mustRetainSourceRows: manifest.mustRetainSourceRows,
  followupRequiredRows: manifest.followupRequiredRows,
  visualOcrBlockedRows: manifest.visualOcrBlockedRows,
  sourceFolderMayBeDeleted: manifest.sourceFolderMayBeDeleted,
}, null, 2));
