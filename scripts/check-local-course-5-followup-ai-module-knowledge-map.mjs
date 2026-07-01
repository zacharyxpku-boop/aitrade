import fs from 'node:fs';
function fail(m){throw new Error(m)}
const p='docs/LOCAL_COURSE_5_FOLLOWUP_AI_MODULE_KNOWLEDGE_MAP.json'; const md='docs/LOCAL_COURSE_5_FOLLOWUP_AI_MODULE_KNOWLEDGE_MAP.md';
if(!fs.existsSync(p)) fail('missing map'); if(!fs.existsSync(md)) fail('missing md');
const a=JSON.parse(fs.readFileSync(p,'utf8'));
if(a.educationOnly!==true||a.productionReady!==false||a.learnerFacingRelease!==false||a.approvalStatus!=='not_approved'||a.writeAllowedNow!==false) fail('boundary drift');
if(a.mapStatus!=='course_5_followup_ai_module_knowledge_map_complete_internal_release_blocked') fail('status drift');
if(a.internalAiAbsorptionComplete!==true) fail('AI absorption should be complete');
if(a.totalAiAbsorbedRows!==386) fail('expected 386 absorbed rows');
if(!Array.isArray(a.moduleRows)||a.moduleRows.length<8) fail('module rows too thin');
if(a.totalModuleEvidenceAssignments<386) fail('module assignments below absorption rows');
if(a.learnerReadyModules!==0||a.sourceFolderMayBeDeleted!==false) fail('release/delete gates drift');
const chart=a.moduleRows.find(r=>r.moduleId==='chart_pattern_encyclopedia'); if(!chart||chart.aiAbsorbedRows<200||chart.moduleCandidateRows<200) fail('chart module map too thin');
for(const row of a.moduleRows){ if(row.aiAbsorbedRows<1) fail('empty module '+row.moduleId); if(!Array.isArray(row.representativeInputs)||row.representativeInputs.length<1) fail('missing representatives '+row.moduleId); if(!row.nextKnowledgeAction) fail('missing next action '+row.moduleId); }
console.log(JSON.stringify({ok:true,mapStatus:a.mapStatus,totalAiAbsorbedRows:a.totalAiAbsorbedRows,moduleRows:a.moduleRows.length,totalModuleEvidenceAssignments:a.totalModuleEvidenceAssignments,sourceFolderMayBeDeleted:a.sourceFolderMayBeDeleted},null,2));
