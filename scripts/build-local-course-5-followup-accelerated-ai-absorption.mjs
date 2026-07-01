import fs from 'node:fs';
const artifact=JSON.parse(fs.readFileSync('docs/LOCAL_COURSE_5_FOLLOWUP_ACCELERATED_AI_ABSORPTION.json','utf8'));
fs.writeFileSync('docs/LOCAL_COURSE_5_FOLLOWUP_ACCELERATED_AI_ABSORPTION.json',JSON.stringify(artifact,null,2)+'\n');
console.log(JSON.stringify({ok:true,absorptionStatus:artifact.absorptionStatus,aiAbsorbedRows:artifact.aiAbsorbedRows,totalTemplateRows:artifact.totalTemplateRows,p0Rows:artifact.p0Rows,nonP0Rows:artifact.nonP0Rows,readyReviewerNotes:artifact.readyReviewerNotes,sourceFolderMayBeDeleted:artifact.sourceFolderMayBeDeleted},null,2));
