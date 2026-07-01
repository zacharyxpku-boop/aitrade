import fs from "node:fs";
const artifactPath="docs/LOCAL_COURSE_5_FOLLOWUP_AI_REVIEW_DRAFT_BATCH_001.json";
const mdPath="docs/LOCAL_COURSE_5_FOLLOWUP_AI_REVIEW_DRAFT_BATCH_001.md";
const forbidden=['buy signal','sell signal','must buy','must sell','recommended buy','recommended sell','guaranteed return','win rate','profit target','stop loss instruction','real money','broker','auto trading','approved for release','learner-facing approved','write allowed','delete source'];
const required=['visibleElements','visualSemanticNote','ocrOrManualText','uncertaintyNotes','moduleDisposition','publicGroundingNeeded','originalRewriteGuidance','sourceRetentionDecision'];
function fail(m){throw new Error(m)}
function assertBoundary(a){if(a.educationOnly!==true)fail('educationOnly drift'); if(a.productionReady!==false)fail('productionReady drift'); if(a.learnerFacingRelease!==false)fail('learnerFacingRelease drift'); if(a.approvalStatus!=='not_approved')fail('approvalStatus drift'); if(a.writeAllowedNow!==false)fail('writeAllowedNow drift')}
if(!fs.existsSync(artifactPath)) fail('missing artifact'); if(!fs.existsSync(mdPath)) fail('missing md');
const artifact=JSON.parse(fs.readFileSync(artifactPath,'utf8')); assertBoundary(artifact);
if(artifact.draftStatus!=="course_5_followup_ai_review_draft_batch_001_ready_for_human_review_release_blocked") fail('status drift');
if(artifact.totalTemplateRows!==386) fail('expected 386 template rows');
if(artifact.batchRows!==12||artifact.aiDraftRows!==12) fail('expected 12 draft rows');
if(artifact.realReviewerInputRows!==0||artifact.readyReviewerNotes!==0) fail('AI draft must not count as real input');
if(artifact.acceptedForModuleDistillationRows!==0||artifact.acceptedForDeletionReadinessRows!==0) fail('acceptance rows must remain 0');
if(artifact.sourceFolderMayBeDeleted!==false||artifact.currentKnowledgeArtifactsCanReplaceSourceFolder!==false) fail('deletion gates must remain closed');
const rows=artifact.draftRows||[]; if(rows.length!==12) fail('expected 12 rows');
rows.forEach((row,i)=>{ const expected='course5_followup_review_input_'+String(i+1).padStart(3,'0'); if(row.inputId!==expected) fail('unexpected input '+row.inputId); if(!fs.existsSync(row.sampleImagePath)) fail('missing image '+row.sampleImagePath); if(row.aiDraftStatus!=='ai_visual_draft_ready_for_human_review_not_real_input') fail('draft status drift '+row.inputId); if(row.realReviewerInputFilled!==false||row.acceptedForModuleDistillation!==false||row.acceptedForDeletionReadiness!==false) fail('row gate drift '+row.inputId); if(row.learnerFacingRelease!==false||row.productionReady!==false||row.writeAllowedNow!==false) fail('row boundary drift '+row.inputId); const joined=required.map(k=>String(row[k]||'').trim()).join('\n'); if(required.some(k=>!String(row[k]||'').trim())) fail('missing field '+row.inputId); const lower=joined.toLowerCase(); const hits=forbidden.filter(p=>lower.includes(p)); if(hits.length) fail(row.inputId+' forbidden '+hits.join(',')); });
console.log(JSON.stringify({ok:true,draftStatus:artifact.draftStatus,batchRows:artifact.batchRows,aiDraftRows:artifact.aiDraftRows,realReviewerInputRows:artifact.realReviewerInputRows,readyReviewerNotes:artifact.readyReviewerNotes,sourceFolderMayBeDeleted:artifact.sourceFolderMayBeDeleted}, null, 2));
