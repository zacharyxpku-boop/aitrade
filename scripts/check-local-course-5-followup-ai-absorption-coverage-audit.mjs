import fs from 'node:fs';
function fail(m){throw new Error(m)}
const p='docs/LOCAL_COURSE_5_FOLLOWUP_AI_ABSORPTION_COVERAGE_AUDIT.json'; const md='docs/LOCAL_COURSE_5_FOLLOWUP_AI_ABSORPTION_COVERAGE_AUDIT.md';
if(!fs.existsSync(p)) fail('missing audit'); if(!fs.existsSync(md)) fail('missing md');
const a=JSON.parse(fs.readFileSync(p,'utf8'));
if(a.educationOnly!==true||a.productionReady!==false||a.learnerFacingRelease!==false||a.approvalStatus!=='not_approved'||a.writeAllowedNow!==false) fail('boundary drift');
if(a.auditStatus!=='course_5_followup_ai_absorption_coverage_complete_internal_knowledge_release_blocked') fail('status drift');
if(a.internalAiAbsorptionComplete!==true) fail('internal AI absorption should be complete');
if(a.aiAbsorbedRows!==386||a.totalFollowupReviewerCards!==386) fail('expected 386/386');
if(a.p0Rows!==282||a.nonP0Rows!==104) fail('tier count drift');
if(a.rowsWithMachineDraftCoverage!==386||a.rowsWithSampleImageEvidence!==386) fail('coverage drift');
for(const k of ['realReviewerInputRows','readyReviewerNotes','humanVerifiedRows','ocrVerifiedRows','publicGroundedRows','originalRewriteReadyRows','acceptedForModuleDistillationRows','acceptedForDeletionReadinessRows','learnerReadyModules']) if(a[k]!==0) fail(k+' must remain 0');
if(a.sourceFolderMayBeDeleted!==false||a.currentKnowledgeArtifactsCanReplaceSourceFolder!==false) fail('delete gate drift');
if(!a.moduleCounts.chart_pattern_encyclopedia||a.moduleCounts.chart_pattern_encyclopedia<200) fail('chart module coverage low');
console.log(JSON.stringify({ok:true,auditStatus:a.auditStatus,internalAiAbsorptionComplete:a.internalAiAbsorptionComplete,aiAbsorbedRows:a.aiAbsorbedRows,totalFollowupReviewerCards:a.totalFollowupReviewerCards,sourceFolderMayBeDeleted:a.sourceFolderMayBeDeleted},null,2));
