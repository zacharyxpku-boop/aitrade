import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { localCourse5Knowledge } = require("../education-local-course-5-knowledge-nodes.js");

const jsonPath = "docs/LOCAL_COURSE_5_FOLLOWUP_KNOWLEDGE_NODES.json";
const mdPath = "docs/LOCAL_COURSE_5_FOLLOWUP_KNOWLEDGE_NODES.md";

fs.writeFileSync(jsonPath, `${JSON.stringify(localCourse5Knowledge, null, 2)}\n`);

const moduleRows = (localCourse5Knowledge.moduleSummary || [])
  .map((row) => `| ${row.moduleId} | ${row.aiAbsorbedRows} | ${row.lessonSeedRows} |`)
  .join("\n");

fs.writeFileSync(
  mdPath,
  `# Course 5 Follow-up Knowledge Nodes\n\n` +
    `- Status: ${localCourse5Knowledge.status}\n` +
    `- Source rows: ${localCourse5Knowledge.sourceRows}\n` +
    `- Modules: ${localCourse5Knowledge.moduleRows}\n` +
    `- Lesson seeds: ${localCourse5Knowledge.lessonSeedRows}\n` +
    `- Internal knowledge nodes: ${localCourse5Knowledge.internalKnowledgeNodeRows}\n` +
    `- Learner-facing release: ${localCourse5Knowledge.learnerFacingRelease}\n` +
    `- Source folder may be deleted: ${localCourse5Knowledge.sourceFolderMayBeDeleted}\n\n` +
    `| Module | AI rows | Knowledge seeds |\n|---|---:|---:|\n${moduleRows}\n\n` +
    `${localCourse5Knowledge.boundary}\n`,
);

console.log(JSON.stringify({
  ok: true,
  status: localCourse5Knowledge.status,
  sourceRows: localCourse5Knowledge.sourceRows,
  moduleRows: localCourse5Knowledge.moduleRows,
  lessonSeedRows: localCourse5Knowledge.lessonSeedRows,
  internalKnowledgeNodeRows: localCourse5Knowledge.internalKnowledgeNodeRows,
  learnerFacingRelease: localCourse5Knowledge.learnerFacingRelease,
  sourceFolderMayBeDeleted: localCourse5Knowledge.sourceFolderMayBeDeleted,
}, null, 2));
