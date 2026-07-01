import fs from "node:fs";

const distillationPath = "docs/LOCAL_COURSE_5_TEACHING_MODULE_DISTILLATION.json";
const distillationMdPath = "docs/LOCAL_COURSE_5_TEACHING_MODULE_DISTILLATION.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const artifact = readJson(distillationPath);
if (!fs.existsSync(distillationMdPath)) fail(`missing ${distillationMdPath}`);

if (artifact.educationOnly !== true) fail("distillation must keep educationOnly:true");
if (artifact.productionReady !== false) fail("distillation must keep productionReady:false");
if (artifact.learnerFacingRelease !== false) fail("distillation must keep learnerFacingRelease:false");
if (artifact.approvalStatus !== "not_approved") fail("distillation must keep approvalStatus:not_approved");
if (artifact.writeAllowedNow !== false) fail("distillation must keep writeAllowedNow:false");
if (artifact.distillationStatus !== "course_5_teaching_module_distillation_ready_private_design_release_blocked") {
  fail(`unexpected distillationStatus: ${artifact.distillationStatus}`);
}

if (artifact.totalFiles !== 134) fail("Course 5 total file count drift");
if (artifact.uniquePrimaryRows !== 131) fail("Course 5 unique primary count drift");
if (artifact.textAbsorbedRows < 82) fail("text absorbed rows regressed");
if (artifact.followupRequiredRows !== 49) fail("follow-up row count drift");
if (artifact.totalExtractedChars < 15315443) fail("extracted chars regressed");
if (artifact.modules < 13) fail("too few module rows");
if (artifact.modulesWithLessonSeeds !== artifact.modules) fail("every module must have lesson seeds");
if (artifact.totalLessonSeeds < artifact.modules * 4) fail("lesson seed coverage too thin");
if (artifact.modulesWithEvidenceAnchors < 10) fail("too few modules with text evidence anchors");
if (artifact.totalEvidenceAnchors < 50) fail("evidence anchor coverage too thin");
if (artifact.modulesBlockedByVisualOrOcr < 8) fail("visual/OCR blocker accounting missing");
if (artifact.readyReviewerNotes !== 0) fail("real reviewer notes should still be zero");
if (artifact.acceptedForModuleDistillationRows !== 0) fail("machine drafts must not be accepted as distillation");
if (artifact.acceptedForDeletionReadinessRows !== 0) fail("machine drafts must not be accepted for deletion readiness");
if (artifact.sourceFolderMayBeDeleted !== false) fail("Course 5 source folder must remain non-deletable");
if (artifact.learnerReadyModules !== 0) fail("no Course 5 module may be learner-ready");

if (!Array.isArray(artifact.moduleRows) || artifact.moduleRows.length !== artifact.modules) fail("module rows missing or mismatched");
for (const row of artifact.moduleRows) {
  if (!Array.isArray(row.lessonSeedRows) || row.lessonSeedRows.length < 4) fail(`lesson seeds missing for ${row.moduleId}`);
  if (!Array.isArray(row.conceptSignalRows) || row.conceptSignalRows.length === 0) fail(`concept signals missing for ${row.moduleId}`);
  if (row.productionReady !== false || row.learnerFacingRelease !== false || row.writeAllowedNow !== false || row.approvalStatus !== "not_approved") {
    fail(`release boundary violated for ${row.moduleId}`);
  }
  for (const lesson of row.lessonSeedRows) {
    if (lesson.releaseStatus !== "blocked_not_learner_facing") fail(`lesson seed release drift for ${row.moduleId}`);
    if (!String(lesson.teachingUse || "").includes("requires_paraphrase_public_grounding_and_review")) {
      fail(`lesson seed teaching boundary missing for ${row.moduleId}`);
    }
  }
}

for (const requiredModule of ["price_action_foundations", "chart_pattern_encyclopedia", "course_slides_alignment", "terminology_glossary", "risk_management"]) {
  if (!artifact.moduleRows.some((row) => row.moduleId === requiredModule)) fail(`required module missing: ${requiredModule}`);
}

const boundaryText = `${artifact.boundary || ""} ${artifact.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education design",
  "paraphrase-only lesson seeds",
  "not learner-facing",
  "publication-cleared",
  "does not copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

if (!Array.isArray(artifact.commands) || !artifact.commands.some((command) => /check:local-course-5-teaching-module-distillation/.test(command))) {
  fail("commands must include teaching module distillation check");
}

console.log(JSON.stringify({
  ok: true,
  distillationStatus: artifact.distillationStatus,
  modules: artifact.modules,
  modulesWithLessonSeeds: artifact.modulesWithLessonSeeds,
  totalLessonSeeds: artifact.totalLessonSeeds,
  modulesWithEvidenceAnchors: artifact.modulesWithEvidenceAnchors,
  totalEvidenceAnchors: artifact.totalEvidenceAnchors,
  modulesBlockedByVisualOrOcr: artifact.modulesBlockedByVisualOrOcr,
  learnerReadyModules: artifact.learnerReadyModules,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
