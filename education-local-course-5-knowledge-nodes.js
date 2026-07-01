const fs = require("node:fs");

const lessonSeedsPath = "docs/LOCAL_COURSE_5_FOLLOWUP_AI_MODULE_LESSON_SEEDS.json";

function readLessonSeedsArtifact() {
  if (!fs.existsSync(lessonSeedsPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(lessonSeedsPath, "utf8"));
}

function titleCase(value) {
  return String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildInternalKnowledgeNode(seed, index) {
  const evidenceRefs = (seed.evidenceInputs || []).map((input) => ({
    inputId: input.inputId,
    sourcePath: input.sampleImagePath,
    disposition: input.moduleDisposition,
    evidenceRole: input.evidenceRole,
  }));
  const firstConcept = (seed.candidateConcepts || [])[0] || seed.moduleId;
  return {
    id: `course5_kb_node_${String(index + 1).padStart(3, "0")}`,
    seedId: seed.seedId,
    courseId: "local_course_5_followup",
    sourceFolderLabel: "Desktop folder 5",
    nodeType: "internal_course_knowledge_node",
    moduleId: seed.moduleId,
    module: seed.moduleLabel,
    title: `${seed.moduleLabel}: ${titleCase(seed.seedType)}`,
    topic: titleCase(firstConcept),
    difficulty: index % 3 === 0 ? "starter" : index % 3 === 1 ? "builder" : "advanced",
    learningUse: seed.learningUse,
    definition: seed.privateDraftTeachingPoint,
    evidenceRefs,
    sourceEvidenceCount: seed.sourceEvidenceCount,
    candidateConcepts: seed.candidateConcepts || [],
    practicePrompt: `Rewrite this ${seed.moduleLabel} seed into an observation-only lesson note, citing the retained evidence inputs and separating visible chart facts from interpretation.`,
    reviewChecklist: [
      "Confirm visible labels and chart context before learner-facing writing.",
      "Rewrite in original TradeGym education language.",
      "Ground terminology with approved public or official references before release.",
      "Keep this as observation training and curriculum design, not action guidance.",
    ],
    reviewStatus: "internal_ai_absorbed_needs_grounding_and_rewrite",
    learnerFacingAllowed: false,
    learnerFacingRelease: false,
    productionReady: false,
    educationOnly: true,
    writeAllowedNow: false,
    sourceFolderMayBeDeleted: false,
    safetyBoundary: seed.learnerSafetyBoundary,
    boundaryNote:
      "Internal knowledge-base node for Course 5 follow-up absorption. It supports curriculum design and review only; it is not a learner-facing lesson, action instruction, execution workflow, or source-folder deletion approval.",
  };
}

function buildLocalCourse5Knowledge() {
  const artifact = readLessonSeedsArtifact();
  if (!artifact) {
    return {
      courseId: "local_course_5_followup",
      status: "missing_lesson_seed_artifact",
      educationOnly: true,
      productionReady: false,
      learnerFacingRelease: false,
      internalKnowledgeNodes: [],
    };
  }
  const internalKnowledgeNodes = (artifact.lessonSeeds || []).map(buildInternalKnowledgeNode);
  return {
    courseId: "local_course_5_followup",
    status: "course_5_followup_internal_knowledge_nodes_available_release_blocked",
    sourceArtifact: lessonSeedsPath,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    writeAllowedNow: false,
    internalAiAbsorptionComplete: artifact.internalAiAbsorptionComplete === true,
    aiOnlyAbsorptionAcceptedForKnowledgeBase: artifact.aiOnlyAbsorptionAcceptedForKnowledgeBase === true,
    sourceRows: artifact.sourceRows,
    moduleRows: artifact.moduleRows,
    lessonSeedRows: artifact.lessonSeedRows,
    internalKnowledgeNodeRows: internalKnowledgeNodes.length,
    learnerReadyModules: 0,
    sourceFolderMayBeDeleted: false,
    currentKnowledgeArtifactsCanReplaceSourceFolder: false,
    moduleSummary: artifact.moduleSeedSummary || [],
    internalKnowledgeNodes,
    boundary:
      "Course 5 follow-up material is available to the internal education knowledge base as reviewable knowledge nodes. Learner release, source replacement, and commercial readiness remain blocked until grounding, originality rewrite, and review gates pass.",
  };
}

const localCourse5Knowledge = buildLocalCourse5Knowledge();

module.exports = {
  localCourse5Knowledge,
};
