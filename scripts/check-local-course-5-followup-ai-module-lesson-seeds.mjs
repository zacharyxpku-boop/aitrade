import fs from 'node:fs';

function fail(message) {
  throw new Error(message);
}

const sourcePath = 'docs/LOCAL_COURSE_5_FOLLOWUP_AI_MODULE_KNOWLEDGE_MAP.json';
const artifactPath = 'docs/LOCAL_COURSE_5_FOLLOWUP_AI_MODULE_LESSON_SEEDS.json';
const mdPath = 'docs/LOCAL_COURSE_5_FOLLOWUP_AI_MODULE_LESSON_SEEDS.md';
const forbiddenPhrases = [
  'buy signal',
  'sell signal',
  'must buy',
  'must sell',
  'recommended buy',
  'recommended sell',
  'guaranteed return',
  'win rate',
  'profit target',
  'stop loss instruction',
  'real money',
  'broker',
  'auto trading',
  'approved for release',
  'learner-facing approved',
  'delete source'
];

if (!fs.existsSync(sourcePath)) fail('missing source map');
if (!fs.existsSync(artifactPath)) fail('missing lesson seeds artifact');
if (!fs.existsSync(mdPath)) fail('missing lesson seeds md');

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

if (source.totalAiAbsorbedRows !== 386 || !Array.isArray(source.moduleRows) || source.moduleRows.length !== 11) fail('source map is not complete');
if (artifact.educationOnly !== true || artifact.productionReady !== false || artifact.learnerFacingRelease !== false || artifact.approvalStatus !== 'not_approved' || artifact.writeAllowedNow !== false) fail('artifact boundary drift');
if (artifact.seedStatus !== 'course_5_followup_ai_module_lesson_seeds_complete_internal_release_blocked') fail('seed status drift');
if (artifact.internalAiAbsorptionComplete !== true || artifact.aiOnlyAbsorptionAcceptedForKnowledgeBase !== true) fail('AI absorption flags missing');
if (artifact.sourceRows !== 386 || artifact.moduleRows !== 11) fail('coverage counts drift');
if (artifact.lessonSeedRows !== 36) fail('expected 36 lesson seeds');
if (artifact.learnerReadyModules !== 0 || artifact.sourceFolderMayBeDeleted !== false || artifact.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail('release or deletion gate drift');
if (!Array.isArray(artifact.lessonSeeds) || artifact.lessonSeeds.length !== artifact.lessonSeedRows) fail('lesson seed row mismatch');
if (!Array.isArray(artifact.moduleSeedSummary) || artifact.moduleSeedSummary.length !== 11) fail('module seed summary mismatch');

const sourceModules = new Map(source.moduleRows.map((row) => [row.moduleId, row]));
const seedModules = new Map();
for (const seed of artifact.lessonSeeds) {
  if (!sourceModules.has(seed.moduleId)) fail(`unknown module ${seed.moduleId}`);
  seedModules.set(seed.moduleId, (seedModules.get(seed.moduleId) || 0) + 1);
  for (const field of ['seedId', 'moduleId', 'moduleLabel', 'seedType', 'learningUse', 'privateDraftTeachingPoint', 'learnerSafetyBoundary', 'releaseStatus']) {
    if (!seed[field] || typeof seed[field] !== 'string') fail(`missing ${field} on ${seed.seedId || 'unknown seed'}`);
  }
  if (!Array.isArray(seed.evidenceInputs) || seed.evidenceInputs.length < 1) fail(`missing evidence inputs on ${seed.seedId}`);
  if (!Array.isArray(seed.candidateConcepts) || seed.candidateConcepts.length < 1) fail(`missing concepts on ${seed.seedId}`);
  if (seed.sourceEvidenceCount < 1) fail(`empty source evidence count on ${seed.seedId}`);
  if (seed.educationOnly !== true || seed.productionReady !== false || seed.learnerFacingRelease !== false || seed.writeAllowedNow !== false || seed.sourceFolderMayBeDeleted !== false) fail(`seed boundary drift on ${seed.seedId}`);
  if (seed.publicGroundingNeeded !== true || seed.originalRewriteNeeded !== true || seed.visualLabelCheckNeeded !== true || seed.realReviewerNeededBeforeLearnerUse !== true) fail(`seed review gates drift on ${seed.seedId}`);
  if (seed.releaseStatus !== 'internal_only_not_learner_ready') fail(`seed release status drift on ${seed.seedId}`);
  for (const input of seed.evidenceInputs) {
    if (!input.inputId || !input.sampleImagePath || !input.moduleDisposition || !input.evidenceRole) fail(`thin evidence input on ${seed.seedId}`);
  }
}

for (const moduleId of sourceModules.keys()) {
  if (!seedModules.has(moduleId)) fail(`missing seed module ${moduleId}`);
}
if ((seedModules.get('chart_pattern_encyclopedia') || 0) < 5) fail('chart module seeds too thin');

const searchable = JSON.stringify(artifact).toLowerCase();
for (const phrase of forbiddenPhrases) {
  if (searchable.includes(phrase)) fail(`forbidden phrase found: ${phrase}`);
}

console.log(JSON.stringify({ ok: true, seedStatus: artifact.seedStatus, sourceRows: artifact.sourceRows, moduleRows: artifact.moduleRows, lessonSeedRows: artifact.lessonSeedRows, learnerReadyModules: artifact.learnerReadyModules, sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted }, null, 2));
