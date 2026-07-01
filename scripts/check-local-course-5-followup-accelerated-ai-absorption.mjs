import fs from 'node:fs';
const a=JSON.parse(fs.readFileSync('docs/LOCAL_COURSE_5_FOLLOWUP_ACCELERATED_AI_ABSORPTION.json','utf8'));
function fail(m){throw new Error(m)}
if(!fs.existsSync('docs/LOCAL_COURSE_5_FOLLOWUP_ACCELERATED_AI_ABSORPTION.md')) fail('missing md');
if(a.educationOnly!==true||a.productionReady!==false||a.learnerFacingRelease!==false||a.approvalStatus!=='not_approved'||a.writeAllowedNow!==false) fail('boundary drift');
if(a.absorptionStatus!=='course_5_followup_all_386_cards_ai_absorbed_for_internal_knowledge_review_release_blocked') fail('status drift');
if(a.aiAbsorbedRows!==386||a.totalTemplateRows!==386) fail('expected 386 absorbed rows');
if(a.p0Rows!==282||a.nonP0Rows!==104) fail('tier counts drift');
if(a.rowsWithMachineDraftCoverage!==386||a.rowsWithSampleImageEvidence!==386) fail('coverage drift');
for (const k of ['realReviewerInputRows','readyReviewerNotes','humanVerifiedRows','ocrVerifiedRows','publicGroundedRows','originalRewriteReadyRows','acceptedForModuleDistillationRows','acceptedForDeletionReadinessRows','learnerReadyModules']) if(a[k]!==0) fail(k+' must remain 0');
if(a.sourceFolderMayBeDeleted!==false||a.currentKnowledgeArtifactsCanReplaceSourceFolder!==false) fail('delete gate drift');
const rows=a.absorptionRows||[]; if(rows.length!==386) fail('row length drift');
const ids=new Set(); const required=['visibleElements','visualSemanticNote','ocrOrManualText','uncertaintyNotes','moduleDisposition','publicGroundingNeeded','originalRewriteGuidance','sourceRetentionDecision']; const forbidden=['buy signal','sell signal','must buy','must sell','recommended buy','recommended sell','guaranteed return','win rate','profit target','stop loss instruction','real money','broker','auto trading','approved for release','learner-facing approved','write allowed','delete source'];
for(const r of rows){ if(ids.has(r.inputId)) fail('duplicate '+r.inputId); ids.add(r.inputId); if(!fs.existsSync(r.sampleImagePath)) fail('missing image '+r.sampleImagePath); if(r.aiAbsorptionStatus!=='ai_absorbed_for_internal_knowledge_review_not_human_verified') fail('status '+r.inputId); for(const f of required) if(!String(r[f]||'').trim()) fail('missing '+f+' '+r.inputId); if(r.realReviewerInputFilled!==false||r.humanVerified!==false||r.ocrVerified!==false||r.publicGrounded!==false||r.originalRewriteReady!==false) fail('verification flags '+r.inputId); if(r.acceptedForModuleDistillation!==false||r.acceptedForDeletionReadiness!==false||r.learnerFacingRelease!==false||r.productionReady!==false||r.writeAllowedNow!==false) fail('gate '+r.inputId); const lower=required.map(f=>String(r[f]||'')).join('\n').toLowerCase(); const hits=forbidden.filter(p=>lower.includes(p)); if(hits.length) fail(r.inputId+' forbidden '+hits.join(',')); }
if(!a.moduleCounts.chart_pattern_encyclopedia||a.moduleCounts.chart_pattern_encyclopedia<200) fail('chart module coverage low');
console.log(JSON.stringify({ok:true,absorptionStatus:a.absorptionStatus,aiAbsorbedRows:a.aiAbsorbedRows,totalTemplateRows:a.totalTemplateRows,p0Rows:a.p0Rows,nonP0Rows:a.nonP0Rows,readyReviewerNotes:a.readyReviewerNotes,sourceFolderMayBeDeleted:a.sourceFolderMayBeDeleted},null,2));
