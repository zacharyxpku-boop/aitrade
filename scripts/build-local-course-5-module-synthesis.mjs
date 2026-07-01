import fs from "node:fs";

const intakePath = "docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json";
const containerPath = "docs/LOCAL_COURSE_5_CONTAINER_INDEX.json";
const visualPath = "docs/LOCAL_COURSE_5_VISUAL_SEMANTIC_MAP.json";
const outputJson = "docs/LOCAL_COURSE_5_MODULE_SYNTHESIS.json";
const outputMd = "docs/LOCAL_COURSE_5_MODULE_SYNTHESIS.md";

const boundary = "Course 5 module synthesis is private reviewer-facing education research only. It turns local supplemental documents into module candidates for later paraphrased teaching design. It is not learner-facing, not publication-cleared, and does not provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.";

const moduleLabels = {
  price_action_foundations: "Price Action Foundations",
  trends_and_channels: "Trends And Channels",
  trading_ranges: "Trading Ranges",
  reversals: "Reversals",
  breakouts_and_pullbacks: "Breakouts And Pullbacks",
  bar_by_bar_reading: "Bar-By-Bar Reading",
  chart_pattern_encyclopedia: "Chart Pattern Encyclopedia",
  trade_management: "Trade Management",
  risk_management: "Risk Management",
  psychology_and_discipline: "Psychology And Discipline",
  course_slides_alignment: "Course 1-4 Slide Alignment",
  terminology_glossary: "Terminology And Glossary",
  unclassified_supplement: "Unclassified Supplement",
};

const visualTagToModule = {
  chart_pattern_encyclopedia: "chart_pattern_encyclopedia",
  course_slide_visual: "course_slides_alignment",
  trend_visual: "trends_and_channels",
  range_visual: "trading_ranges",
  reversal_visual: "reversals",
  bar_by_bar_visual: "bar_by_bar_reading",
  setup_visual: "trade_management",
  glossary_visual: "terminology_glossary",
  unclassified_visual_review_sample: "unclassified_supplement",
};

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

function emptyModule(moduleId) {
  return {
    moduleId,
    moduleLabel: moduleLabels[moduleId] || moduleId,
    sourceDocumentRows: 0,
    textAbsorbedRows: 0,
    followupRows: 0,
    extractedChars: 0,
    knowledgeNodeCandidateRows: 0,
    containerRows: 0,
    containerEntries: 0,
    imageEntries: 0,
    visualSourceRows: 0,
    visualSampleRows: 0,
    highDensityVisualSamples: 0,
    courseAlignment: new Set(),
    sourceSamples: [],
    containerSamples: [],
    visualSamples: [],
  };
}

function addSample(list, sample, max = 8) {
  if (list.length < max && !list.some((item) => item.relativePath === sample.relativePath)) {
    list.push(sample);
  }
}

const intake = readJson(intakePath);
const containerIndex = readJson(containerPath);
const visualMap = readJson(visualPath);
assertBoundary("intake", intake);
assertBoundary("containerIndex", containerIndex);
assertBoundary("visualMap", visualMap);

const modules = new Map();
for (const moduleId of Object.keys(moduleLabels)) modules.set(moduleId, emptyModule(moduleId));

for (const row of intake.rows || []) {
  if (row.duplicateOf) continue;
  for (const moduleId of row.moduleTags || ["unclassified_supplement"]) {
    const module = modules.get(moduleId) || emptyModule(moduleId);
    modules.set(moduleId, module);
    module.sourceDocumentRows += 1;
    module.extractedChars += row.charCount || 0;
    module.knowledgeNodeCandidateRows += row.knowledgeNodeCandidateCount || 0;
    if (row.absorptionStatus === "absorbed_private_research_text") module.textAbsorbedRows += 1;
    else module.followupRows += 1;
    for (const course of row.courseAlignment || []) module.courseAlignment.add(course);
    addSample(module.sourceSamples, {
      relativePath: row.relativePath,
      textExtraction: row.textExtraction,
      extractionBucket: row.extractionBucket,
      charCount: row.charCount || 0,
    });
  }
}

for (const row of containerIndex.rows || []) {
  for (const moduleId of row.moduleTags || ["unclassified_supplement"]) {
    const module = modules.get(moduleId) || emptyModule(moduleId);
    modules.set(moduleId, module);
    module.containerRows += 1;
    module.containerEntries += row.entryCount || 0;
    module.imageEntries += row.imageEntryCount || 0;
    addSample(module.containerSamples, {
      relativePath: row.relativePath,
      extension: row.extension,
      entryCount: row.entryCount || 0,
      imageEntryCount: row.imageEntryCount || 0,
      indexedStatus: row.indexedStatus,
    }, 6);
  }
}

for (const row of visualMap.rows || []) {
  const moduleIds = [...new Set((row.semanticTags || []).map((tag) => visualTagToModule[tag] || "unclassified_supplement"))];
  for (const moduleId of moduleIds) {
    const module = modules.get(moduleId) || emptyModule(moduleId);
    modules.set(moduleId, module);
    module.visualSourceRows += 1;
    module.visualSampleRows += row.sampleCount || 0;
    module.highDensityVisualSamples += (row.sampleRows || []).filter((sample) => (sample.visualDensity || 0) >= 0.12).length;
    addSample(module.visualSamples, {
      relativePath: row.relativePath,
      pageCount: row.pageCount,
      sampleCount: row.sampleCount,
      semanticTags: row.semanticTags,
      ocrStatus: row.ocrStatus,
    }, 6);
  }
}

const moduleRows = [...modules.values()]
  .map((row, index) => {
    const hasText = row.textAbsorbedRows > 0;
    const hasVisual = row.visualSampleRows > 0 || row.imageEntries > 0;
    const hasFollowup = row.followupRows > 0 || row.imageEntries > 0 || row.visualSampleRows > 0;
    const teachingCandidateStatus = hasText && hasVisual
      ? "module_candidate_text_and_visual_evidence_ready_review_required"
      : hasText
        ? "module_candidate_text_ready_visual_gap_or_not_needed_review_required"
        : hasVisual
          ? "module_candidate_visual_indexed_text_or_ocr_gap_review_required"
          : "module_candidate_sparse_attention_required";
    return {
      order: index + 1,
      moduleId: row.moduleId,
      moduleLabel: row.moduleLabel,
      sourceDocumentRows: row.sourceDocumentRows,
      textAbsorbedRows: row.textAbsorbedRows,
      followupRows: row.followupRows,
      extractedChars: row.extractedChars,
      knowledgeNodeCandidateRows: row.knowledgeNodeCandidateRows,
      containerRows: row.containerRows,
      containerEntries: row.containerEntries,
      imageEntries: row.imageEntries,
      visualSourceRows: row.visualSourceRows,
      visualSampleRows: row.visualSampleRows,
      highDensityVisualSamples: row.highDensityVisualSamples,
      courseAlignment: [...row.courseAlignment].sort(),
      teachingCandidateStatus,
      reviewStatus: "needs_reviewer_distillation_public_grounding_and_originality_check",
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      productionReady: false,
      writeAllowedNow: false,
      nextGate: hasFollowup
        ? "resolve_ocr_or_visual_semantic_review_then_distill_into_teaching_module"
        : "distill_text_evidence_into_teaching_module_candidate_then_public_grounding",
      sourceSamples: row.sourceSamples,
      containerSamples: row.containerSamples,
      visualSamples: row.visualSamples,
    };
  })
  .sort((left, right) =>
    right.sourceDocumentRows - left.sourceDocumentRows ||
    right.visualSampleRows - left.visualSampleRows ||
    left.moduleId.localeCompare(right.moduleId));

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  synthesisStatus: "course_5_module_synthesis_ready_private_research_release_blocked",
  synthesisMode: "course_5_supplemental_documents_to_teaching_module_candidates",
  sourceIntake: intakePath,
  sourceContainerIndex: containerPath,
  sourceVisualSemanticMap: visualPath,
  totalFiles: intake.totalFiles,
  uniquePrimaryRows: intake.uniquePrimaryRows,
  textAbsorbedRows: intake.textAbsorbedRows,
  followupRequiredRows: intake.followupRequiredRows,
  totalExtractedChars: intake.totalExtractedChars,
  knowledgeNodeCandidateRows: intake.knowledgeNodeCandidateRows,
  containerRows: containerIndex.containerRows,
  totalContainerEntries: containerIndex.totalContainerEntries,
  totalImageEntries: containerIndex.totalImageEntries,
  visualSourceRows: visualMap.sourceRows,
  visualSampleRows: visualMap.sampleRows,
  ocrEngineAvailable: visualMap.ocrEngineAvailable,
  modules: moduleRows.length,
  modulesWithText: moduleRows.filter((row) => row.textAbsorbedRows > 0).length,
  modulesWithVisuals: moduleRows.filter((row) => row.visualSampleRows > 0 || row.imageEntries > 0).length,
  modulesWithFollowup: moduleRows.filter((row) => row.followupRows > 0 || row.imageEntries > 0 || row.visualSampleRows > 0).length,
  learnerReadyModules: 0,
  moduleRows,
  priorityRows: moduleRows
    .filter((row) => row.followupRows > 0 || row.visualSampleRows > 0 || row.imageEntries > 0)
    .slice(0, 8)
    .map((row) => ({
      moduleId: row.moduleId,
      moduleLabel: row.moduleLabel,
      followupRows: row.followupRows,
      visualSampleRows: row.visualSampleRows,
      imageEntries: row.imageEntries,
      nextGate: row.nextGate,
    })),
  commands: [
    "npm.cmd run build:local-course-5-module-synthesis",
    "npm.cmd run check:local-course-5-module-synthesis",
    "npm.cmd run verify",
  ],
  completionRule: "Course 5 becomes a teaching-module candidate layer when every inventoried document, EPUB/ZIP container, and visual sample is mapped into module rows with text/visual evidence counts, source samples, remaining follow-up gates, and release-blocked review status. It is still not learner-facing until reviewer distillation, public grounding, originality checks, and explicit approval are complete.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course 5 Module Synthesis",
  "",
  `- Synthesis status: ${artifact.synthesisStatus}`,
  `- Modules: ${artifact.modules}`,
  `- Modules with text: ${artifact.modulesWithText}`,
  `- Modules with visuals: ${artifact.modulesWithVisuals}`,
  `- Text absorbed rows: ${artifact.textAbsorbedRows}/${artifact.uniquePrimaryRows}`,
  `- Follow-up required rows: ${artifact.followupRequiredRows}`,
  `- Extracted chars: ${artifact.totalExtractedChars}`,
  `- Container entries: ${artifact.totalContainerEntries}`,
  `- Image entries: ${artifact.totalImageEntries}`,
  `- Visual samples: ${artifact.visualSampleRows}`,
  `- OCR engine available: ${artifact.ocrEngineAvailable}`,
  `- Learner-ready modules: ${artifact.learnerReadyModules}`,
  `- Write allowed now: ${artifact.writeAllowedNow}`,
  "",
  "## Module Rows",
  "",
  "| Module | Docs | Text | Follow-up | Chars | Candidates | Containers | Images | Visual samples | Status |",
  "|---|---:|---:|---:|---:|---:|---:|---:|---:|---|",
  ...moduleRows.map((row) => `| ${row.moduleLabel} | ${row.sourceDocumentRows} | ${row.textAbsorbedRows} | ${row.followupRows} | ${row.extractedChars} | ${row.knowledgeNodeCandidateRows} | ${row.containerRows} | ${row.imageEntries} | ${row.visualSampleRows} | ${row.teachingCandidateStatus} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: artifact.educationOnly,
  productionReady: artifact.productionReady,
  learnerFacingRelease: artifact.learnerFacingRelease,
  approvalStatus: artifact.approvalStatus,
  writeAllowedNow: artifact.writeAllowedNow,
  synthesisStatus: artifact.synthesisStatus,
  modules: artifact.modules,
  modulesWithText: artifact.modulesWithText,
  modulesWithVisuals: artifact.modulesWithVisuals,
  textAbsorbedRows: artifact.textAbsorbedRows,
  followupRequiredRows: artifact.followupRequiredRows,
  learnerReadyModules: artifact.learnerReadyModules,
}, null, 2));
