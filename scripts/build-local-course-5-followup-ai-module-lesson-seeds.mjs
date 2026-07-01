import fs from 'node:fs';

const sourcePath = 'docs/LOCAL_COURSE_5_FOLLOWUP_AI_MODULE_KNOWLEDGE_MAP.json';
const outJson = 'docs/LOCAL_COURSE_5_FOLLOWUP_AI_MODULE_LESSON_SEEDS.json';
const outMd = 'docs/LOCAL_COURSE_5_FOLLOWUP_AI_MODULE_LESSON_SEEDS.md';

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

function fail(message) {
  throw new Error(message);
}

if (source.educationOnly !== true || source.productionReady !== false || source.learnerFacingRelease !== false || source.approvalStatus !== 'not_approved' || source.writeAllowedNow !== false) {
  fail('source map boundary drift');
}
if (source.internalAiAbsorptionComplete !== true || source.totalAiAbsorbedRows !== 386 || !Array.isArray(source.moduleRows) || source.moduleRows.length !== 11) {
  fail('source map is not complete enough for lesson seed generation');
}

const moduleLabels = {
  chart_pattern_encyclopedia: 'Chart Pattern Encyclopedia',
  trends_and_channels: 'Trends And Channels',
  reversals: 'Reversal Structures',
  terminology_glossary: 'Terminology Glossary',
  trading_ranges: 'Range Structure Literacy',
  bar_by_bar_reading: 'Bar By Bar Reading',
  course_slides_alignment: 'Course Slide Alignment',
  breakouts_and_pullbacks: 'Breakouts And Pullbacks',
  price_action_foundations: 'Price Action Foundations',
  unclassified_supplement: 'Unclassified Supplement Review',
  trade_management: 'Management Vocabulary Review'
};

const moduleIntents = {
  chart_pattern_encyclopedia: 'turn the large visual vocabulary set into rewritten pattern-recognition nodes with source pointers and originality review tasks',
  trends_and_channels: 'separate trend, channel, and transition examples into reusable structure-reading lessons',
  reversals: 'group reversal vocabulary and visible chart examples into comparison lessons that emphasize context and uncertainty',
  terminology_glossary: 'normalize translated terms, aliases, and visual labels into an internal glossary before learner-facing writing',
  trading_ranges: 'organize range-bound structure examples around support-resistance literacy, failed continuation, and contextual reading',
  bar_by_bar_reading: 'prepare sequential reading examples that focus on observation order rather than action instruction',
  course_slides_alignment: 'align supplemental slides to the existing course path and identify where each asset can support a lesson',
  breakouts_and_pullbacks: 'separate breakout, test, and pullback examples into non-prescriptive structure-literacy seeds',
  price_action_foundations: 'extract foundational observation concepts that can support beginner modules after rewrite and grounding',
  unclassified_supplement: 'triage supplemental chart pages that still need classification before they join stable modules',
  trade_management: 'capture management-related vocabulary as terminology evidence while keeping it away from prescriptive instruction'
};

const seedCounts = {
  chart_pattern_encyclopedia: 6,
  trends_and_channels: 4,
  reversals: 4,
  terminology_glossary: 4,
  trading_ranges: 3,
  bar_by_bar_reading: 3,
  course_slides_alignment: 3,
  breakouts_and_pullbacks: 3,
  price_action_foundations: 2,
  unclassified_supplement: 2,
  trade_management: 2
};

const typeCycle = [
  'module_overview_seed',
  'representative_evidence_cluster',
  'terminology_and_label_seed',
  'rewrite_and_grounding_seed',
  'comparison_path_seed',
  'quality_gate_seed'
];

const typeLearningUse = {
  module_overview_seed: 'define the module boundary, likely lesson role, and prerequisite relationship for private curriculum design',
  representative_evidence_cluster: 'collect representative source evidence that can anchor a future rewritten lesson example',
  terminology_and_label_seed: 'standardize terms, aliases, chart labels, and translation notes before lesson drafting',
  rewrite_and_grounding_seed: 'flag where original paraphrase, public grounding, and reviewer checks are needed before writing',
  comparison_path_seed: 'prepare contrast sets that help learners compare related structures without implying a live decision rule',
  quality_gate_seed: 'preserve release blockers, source-retention needs, and review tasks for the module steward'
};

function cleanConcepts(row, offset) {
  const concepts = Array.isArray(row.topCandidateConcepts) ? row.topCandidateConcepts : [];
  const rotated = concepts.slice(offset).concat(concepts.slice(0, offset));
  return rotated.slice(0, 6);
}

function representatives(row, offset) {
  const inputs = Array.isArray(row.representativeInputs) ? row.representativeInputs : [];
  if (!inputs.length) return [];
  const rotated = inputs.slice(offset).concat(inputs.slice(0, offset));
  return rotated.slice(0, Math.min(3, rotated.length)).map((input) => ({
    inputId: input.inputId,
    sampleImagePath: input.sampleImagePath,
    moduleDisposition: input.moduleDisposition,
    evidenceRole: input.moduleDisposition === 'supporting_evidence_only' ? 'context_support' : 'candidate_anchor'
  }));
}

function teachingPoint(row, seedType, index) {
  const label = moduleLabels[row.moduleId] || row.moduleId;
  const intent = moduleIntents[row.moduleId] || 'organize this evidence into private curriculum-ready knowledge nodes after review';
  const concepts = cleanConcepts(row, index).slice(0, 3).join(', ') || 'source evidence, visual review, rewrite queue';
  return `${label} seed ${index + 1} should ${intent}. It uses ${row.aiAbsorbedRows} AI-absorbed evidence rows and starts with ${concepts}. The future lesson should teach observation, vocabulary, and context framing only.`;
}

const lessonSeeds = [];
for (const row of source.moduleRows) {
  const count = seedCounts[row.moduleId] || 2;
  for (let index = 0; index < count; index += 1) {
    const seedType = typeCycle[index % typeCycle.length];
    lessonSeeds.push({
      seedId: `course5_followup_${row.moduleId}_seed_${String(index + 1).padStart(2, '0')}`,
      moduleId: row.moduleId,
      moduleLabel: moduleLabels[row.moduleId] || row.moduleId,
      seedType,
      learningUse: typeLearningUse[seedType],
      evidenceInputs: representatives(row, index),
      sourceEvidenceCount: row.aiAbsorbedRows,
      moduleCandidateRows: row.moduleCandidateRows,
      supportingEvidenceRows: row.supportingEvidenceRows,
      candidateConcepts: cleanConcepts(row, index),
      privateDraftTeachingPoint: teachingPoint(row, seedType, index),
      learnerSafetyBoundary: 'education-only structure recognition, vocabulary, historical-example reading, and private curriculum design; no prescriptive trade action or platform workflow',
      publicGroundingNeeded: true,
      originalRewriteNeeded: true,
      visualLabelCheckNeeded: true,
      realReviewerNeededBeforeLearnerUse: true,
      releaseStatus: 'internal_only_not_learner_ready',
      educationOnly: true,
      productionReady: false,
      learnerFacingRelease: false,
      writeAllowedNow: false,
      sourceFolderMayBeDeleted: false
    });
  }
}

const artifact = {
  generatedAt: '2026-06-26T00:00:00.000+08:00',
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: 'not_approved',
  writeAllowedNow: false,
  seedStatus: 'course_5_followup_ai_module_lesson_seeds_complete_internal_release_blocked',
  sourceMap: sourcePath,
  internalAiAbsorptionComplete: true,
  aiOnlyAbsorptionAcceptedForKnowledgeBase: true,
  sourceRows: source.totalAiAbsorbedRows,
  moduleRows: source.moduleRows.length,
  lessonSeedRows: lessonSeeds.length,
  learnerReadyModules: 0,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  moduleSeedSummary: source.moduleRows.map((row) => ({
    moduleId: row.moduleId,
    moduleLabel: moduleLabels[row.moduleId] || row.moduleId,
    aiAbsorbedRows: row.aiAbsorbedRows,
    lessonSeedRows: lessonSeeds.filter((seed) => seed.moduleId === row.moduleId).length,
    representativeInputRows: Array.isArray(row.representativeInputs) ? row.representativeInputs.length : 0,
    nextKnowledgeAction: 'use lesson seeds as private curriculum scaffolding, then perform public grounding, originality rewrite, and reviewer checks'
  })),
  lessonSeeds,
  completionRule: 'This artifact is complete when every Course 5 follow-up module from the AI knowledge map has private lesson seeds with representative evidence, candidate concepts, safety boundaries, and remaining review gates.',
  boundary: 'Private education knowledge-base sedimentation for Course 5 follow-up material. It turns the absorbed evidence into module-level lesson seeds, while keeping learner release, replacement of the source folder, and commercial readiness blocked.'
};

fs.writeFileSync(outJson, JSON.stringify(artifact, null, 2) + '\n');
const mdRows = artifact.moduleSeedSummary.map((row) => `| ${row.moduleId} | ${row.aiAbsorbedRows} | ${row.lessonSeedRows} | ${row.representativeInputRows} |`).join('\n');
fs.writeFileSync(outMd, `# Course 5 Follow-up AI Module Lesson Seeds\n\n- Status: ${artifact.seedStatus}\n- Source rows: ${artifact.sourceRows}\n- Modules: ${artifact.moduleRows}\n- Lesson seeds: ${artifact.lessonSeedRows}\n- Learner-ready modules: ${artifact.learnerReadyModules}\n- Source folder may be deleted: ${artifact.sourceFolderMayBeDeleted}\n\n| Module | AI rows | Lesson seeds | Representative inputs |\n|---|---:|---:|---:|\n${mdRows}\n\n${artifact.boundary}\n`);
console.log(JSON.stringify({ ok: true, seedStatus: artifact.seedStatus, sourceRows: artifact.sourceRows, moduleRows: artifact.moduleRows, lessonSeedRows: artifact.lessonSeedRows, learnerReadyModules: artifact.learnerReadyModules, sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted }, null, 2));
