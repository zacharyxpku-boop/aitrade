import fs from "node:fs";

const PRECHECK_PATH = "docs/KNOWLEDGE_AI_ONLY_TEACHING_PRECHECK.json";
const JSON_OUT = "docs/KNOWLEDGE_INTERNAL_TEACHING_PACKAGES.json";
const MD_OUT = "docs/KNOWLEDGE_INTERNAL_TEACHING_PACKAGES.md";
const JS_OUT = "education-internal-teaching-packages.js";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function slug(value, fallback) {
  const out = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return out || fallback;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function shortText(value, fallback = "Internal education draft only.") {
  const text = String(value || fallback).replace(/\s+/g, " ").trim();
  return text.length > 360 ? `${text.slice(0, 357)}...` : text;
}

function sourceFitCounts(rows) {
  return rows.reduce((counts, row) => {
    counts[row.aiSourceFitCategory] = (counts[row.aiSourceFitCategory] || 0) + 1;
    return counts;
  }, {});
}

function riskLevel(module, rows) {
  const highRiskRows = rows.filter((row) => row.aiSourceFitCategory === "high_risk").length;
  if (highRiskRows >= 20) return "high_risk_internal_only";
  if (rows.some((row) => row.aiSourceFitCategory === "needs_rewrite")) return "rewrite_needed_internal_only";
  if (rows.some((row) => row.aiSourceFitCategory === "weak_source_fit")) return "source_fit_thin_internal_only";
  return "draft_ready_internal_only";
}

function lessonOutline(module, dossier, seed, index, moduleRows, rewrites, videos) {
  const concept = seed?.title || seed?.lessonTitle || `${module} lesson ${index + 1}`;
  const sourceRows = moduleRows.slice(index * 3, index * 3 + 5);
  const rewrite = rewrites[index % Math.max(rewrites.length, 1)] || null;
  const video = videos[index % Math.max(videos.length, 1)] || null;
  const practiceBase = seed?.practicePrompt || dossier.practiceTypes?.[index % Math.max(dossier.practiceTypes.length, 1)] || "observation journal";
  const misconception = dossier.commonMistakeFocus?.[index % Math.max(dossier.commonMistakeFocus.length, 1)] || "Do not turn a label into a trading conclusion.";

  const practiceItems = [
    {
      itemId: `${seed?.draftSeedId || slug(concept, "lesson")}-practice-1`,
      type: "observation_prompt",
      prompt: `Write a neutral observation for ${concept}. Separate what is visible from what is inferred.`,
      expectedBoundary: "No buy/sell instruction, no forecast, no real-money action.",
    },
    {
      itemId: `${seed?.draftSeedId || slug(concept, "lesson")}-practice-2`,
      type: "misconception_rewrite",
      prompt: `Rewrite this mistake into a safer learning note: ${shortText(misconception, "A pattern label is not enough evidence.")}`,
      expectedBoundary: "Use original education wording and keep uncertainty visible.",
    },
  ];

  const quizItems = [
    {
      itemId: `${seed?.draftSeedId || slug(concept, "lesson")}-quiz-1`,
      type: "boundary_check",
      question: `Which statement keeps ${concept} inside education-only chart review?`,
      answerKey: "The answer that describes evidence, uncertainty, and review status without recommending an action.",
      rationale: "The knowledge base trains observation and reasoning, not trade execution.",
    },
    {
      itemId: `${seed?.draftSeedId || slug(concept, "lesson")}-quiz-2`,
      type: "source_fit_check",
      question: "What must remain blocked before learner-facing use?",
      answerKey: "Citation/source fit, copied-text permissions, high-risk wording, and private visual/transcript grounding.",
      rationale: "AI can precheck and draft, but cannot claim real review approval.",
    },
    {
      itemId: `${seed?.draftSeedId || slug(concept, "lesson")}-quiz-3`,
      type: "concept_application",
      question: `How should a learner use ${concept} during replay review?`,
      answerKey: "As a structured observation lens with notes, counterexamples, and a self-check rubric.",
      rationale: "The package supports internal course design and practice planning only.",
    },
  ];

  return {
    lessonId: `internal_lesson_${slug(module, `module-${index}`)}_${String(index + 1).padStart(2, "0")}`,
    module,
    sequence: index + 1,
    title: concept,
    internalUseStatus: "internal_lesson_outline_ready",
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    writeAllowedNow: false,
    learningObjectives: [
      `Define the observation boundary for ${concept}.`,
      "Separate visible evidence from interpretation.",
      "Identify at least one misconception and rewrite it as a safer learning note.",
    ],
    conceptExplanation: shortText(seed?.conceptExplanation || rewrite?.conceptExplanationDraft || dossier.teachableSequence?.[index] || `${concept} is taught as an internal observation and reasoning exercise.`),
    misconceptionWarnings: unique([
      misconception,
      "Do not convert this lesson into a stock recommendation, live signal, return claim, broker workflow, or real-money instruction.",
    ]),
    practicePrompts: practiceItems,
    quizQuestions: quizItems,
    sourceRiskNotes: {
      sourceFitPrecheckSample: sourceRows.map((row) => ({
        nodeId: row.nodeId,
        category: row.aiSourceFitCategory,
        action: row.aiNextAction,
      })),
      course5Supplement: rewrite ? {
        rewriteId: rewrite.rewriteId,
        sourceNodeId: rewrite.sourceNodeId,
        note: shortText(rewrite.conceptExplanationDraft),
      } : null,
      videoSupplement: video ? {
        candidateId: video.candidateId,
        mappedModule: video.mappedModule,
        note: shortText(video.teachingUse || video.concept || video.title),
      } : null,
    },
    releaseBlockers: [
      "real human source-fit and citation-use approval is absent",
      "learner-facing wording has not been approved",
      "private source visual/transcript grounding may still be required",
    ],
    boundary: "Internal course-design outline only. Not learner-facing approved and not trading guidance.",
  };
}

function buildPackage(dossier, precheck, index) {
  const module = dossier.module;
  const moduleRows = precheck.sourceFitPrecheckRows.filter((row) => row.module === module);
  const rewrites = precheck.course5TeachingRewriteDrafts.filter((row) => row.mappedCanonicalModule === module || row.module === module || dossier.course5Supplements?.some((item) => item.rewriteId === row.rewriteId));
  const videos = precheck.videoModuleMappings.filter((row) => row.mappedModule === module);
  const seeds = (dossier.lessonDraftSeeds || precheck.lessonDraftSeeds.filter((seed) => seed.module === module)).slice(0, 5);
  const normalizedSeeds = seeds.length >= 3 ? seeds : [
    ...seeds,
    ...dossier.teachableSequence.slice(0, 3 - seeds.length).map((title, extraIndex) => ({
      draftSeedId: `fallback_${slug(module, "module")}_${extraIndex + 1}`,
      title,
      practicePrompt: "Internal observation and misconception review.",
    })),
  ];
  const lessonOutlines = normalizedSeeds.slice(0, 5).map((seed, lessonIndex) => lessonOutline(module, dossier, seed, lessonIndex, moduleRows, rewrites, videos));

  return {
    packageId: `internal_teaching_package_${slug(module, `module-${index + 1}`)}`,
    module,
    sequence: index + 1,
    internalTeachingStatus: "internal_teaching_package_ready_for_course_design",
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    writeAllowedNow: false,
    moduleOverview: {
      coreConcepts: dossier.coreConcepts || [],
      teachableSequence: dossier.teachableSequence || [],
      practiceTypes: dossier.practiceTypes || [],
      commonMistakes: (dossier.commonMistakeFocus || []).slice(0, 5),
      sourceEvidenceSummary: dossier.evidenceSummary || {},
      sourceFitPrecheckCounts: sourceFitCounts(moduleRows),
      riskLevel: riskLevel(module, moduleRows),
    },
    lessonOutlines,
    practiceItemCount: lessonOutlines.reduce((sum, lesson) => sum + lesson.practicePrompts.length, 0),
    quizItemCount: lessonOutlines.reduce((sum, lesson) => sum + lesson.quizQuestions.length, 0),
    moduleLearningPathSuggestion: {
      pathId: `internal_path_${slug(module, `module-${index + 1}`)}`,
      module,
      sequence: index + 1,
      recommendedOrder: lessonOutlines.map((lesson) => lesson.lessonId),
      checkpoint: `Learner can explain ${module} using evidence, uncertainty, a misconception warning, and a source/release boundary.`,
      internalOnly: true,
      learnerFacingRelease: false,
    },
    sourceAndRiskNotes: {
      sourceFitRows: moduleRows.length,
      course5Supplements: rewrites.length,
      videoSupplements: videos.length,
      requiredBeforeRelease: [
        "human source-fit confirmation",
        "copyright/citation-use confirmation",
        "high-risk wording approval",
        "visual/transcript grounding where private sources are used",
      ],
    },
    releaseBlockers: precheck.blockedReleaseReasons || [],
    boundary: "Internal AI-only teaching package for curriculum design. It is not publication approval or trading guidance.",
  };
}

function markdown(artifact) {
  const rows = artifact.moduleTeachingPackages.map((pkg) => (
    `| ${pkg.module} | ${pkg.lessonOutlines.length} | ${pkg.quizItemCount + pkg.practiceItemCount} | ${pkg.moduleOverview.riskLevel} | ${pkg.sourceAndRiskNotes.sourceFitRows} | ${pkg.sourceAndRiskNotes.course5Supplements} | ${pkg.sourceAndRiskNotes.videoSupplements} |`
  ));
  return `# Knowledge Internal Teaching Packages

- Status: ${artifact.packageStatus}
- Module packages: ${artifact.totals.moduleTeachingPackages}
- Lesson outlines: ${artifact.totals.lessonOutlines}
- Quiz/practice items: ${artifact.totals.quizAndPracticeItems}
- Learning path suggestions: ${artifact.totals.moduleLearningPathSuggestions}
- Learner-facing release: ${artifact.learnerFacingRelease}
- Approval status: ${artifact.approvalStatus}

## Module Packages

| Module | Lessons | Quiz/practice | Risk | Source-fit rows | Course 5 | Video |
|---|---:|---:|---|---:|---:|---:|
${rows.join("\n")}

## Global Course Graph

${artifact.globalCourseGraph.nodes.map((node) => `- ${node.sequence}. ${node.module}: ${node.dependsOn.length ? `depends on ${node.dependsOn.join(", ")}` : "entry module"}`).join("\n")}

## Boundary

${artifact.boundary}
`;
}

const precheck = readJson(PRECHECK_PATH);
const moduleTeachingPackages = precheck.moduleDossiers.map((dossier, index) => buildPackage(dossier, precheck, index));
const lessonOutlines = moduleTeachingPackages.flatMap((pkg) => pkg.lessonOutlines);
const quizAndPracticeItems = lessonOutlines.flatMap((lesson) => [...lesson.practicePrompts, ...lesson.quizQuestions]);
const moduleLearningPathSuggestions = moduleTeachingPackages.map((pkg) => pkg.moduleLearningPathSuggestion);

const globalCourseGraph = {
  graphId: "internal_ai_only_course_dependency_graph",
  status: "internal_dependency_graph_ready_for_course_design",
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  nodes: moduleTeachingPackages.map((pkg, index) => ({
    module: pkg.module,
    packageId: pkg.packageId,
    sequence: index + 1,
    lessonCount: pkg.lessonOutlines.length,
    riskLevel: pkg.moduleOverview.riskLevel,
    dependsOn: index === 0 ? [] : [moduleTeachingPackages[index - 1].module],
    unlocks: moduleTeachingPackages[index + 1] ? [moduleTeachingPackages[index + 1].module] : [],
  })),
  edges: moduleTeachingPackages.slice(1).map((pkg, index) => ({
    from: moduleTeachingPackages[index].module,
    to: pkg.module,
    relation: "DEPENDS_ON",
    rationale: "Course-design dependency order derived from the existing module dossier sequence.",
  })),
};

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  packageStatus: "internal_teaching_packages_ready_for_course_design_release_blocked",
  sourceArtifacts: {
    precheck: PRECHECK_PATH,
    browserIndex: "education-knowledge-browser-index.js",
  },
  totals: {
    moduleTeachingPackages: moduleTeachingPackages.length,
    lessonOutlines: lessonOutlines.length,
    quizItems: lessonOutlines.reduce((sum, lesson) => sum + lesson.quizQuestions.length, 0),
    practiceItems: lessonOutlines.reduce((sum, lesson) => sum + lesson.practicePrompts.length, 0),
    quizAndPracticeItems: quizAndPracticeItems.length,
    moduleLearningPathSuggestions: moduleLearningPathSuggestions.length,
    globalCourseGraphNodes: globalCourseGraph.nodes.length,
    globalCourseGraphEdges: globalCourseGraph.edges.length,
  },
  moduleTeachingPackages,
  lessonOutlines,
  quizAndPracticeItems,
  moduleLearningPathSuggestions,
  globalCourseGraph,
  ontologyMap: {
    domain: "TradeGym internal AI-only teaching package graph",
    entities_count: moduleTeachingPackages.length + lessonOutlines.length + quizAndPracticeItems.length,
    relationships_count: globalCourseGraph.edges.length + lessonOutlines.length,
    key_entities: moduleTeachingPackages.slice(0, 5).map((pkg) => pkg.module),
    critical_paths: [
      moduleTeachingPackages.map((pkg) => pkg.module).join(" -> "),
      "module dossier -> lesson outline -> practice item -> quiz item -> release blocker",
    ],
    knowledge_tree: moduleTeachingPackages.map((pkg) => ({
      module: pkg.module,
      lessons: pkg.lessonOutlines.map((lesson) => lesson.title),
    })),
    insights: [
      "The existing knowledge base is now shaped into internal teaching packages, not just source inventory.",
      "High-risk modules remain blocked for release while still usable for internal lesson design.",
      "Practice and quiz items make the knowledge testable without converting it into trading advice.",
    ],
    gaps: [
      "No real human source-fit approval exists.",
      "Private visual/transcript-derived examples still require grounding before learner-facing release.",
      "Learner-facing copy approval remains blocked.",
    ],
  },
  knowledgeBrowserSurface: {
    field: "internalTeachingPackages",
    visibleInOverview: true,
    internalOnly: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    contents: [
      "moduleTeachingPackages",
      "lessonOutlines",
      "quizAndPracticeItems",
      "moduleLearningPathSuggestions",
      "globalCourseGraph",
    ],
  },
  boundary: "Internal AI-only teaching packages for curriculum design. They do not approve publication, citation use, copied text, trading advice, execution guidance, platform workflows, or real-funds use.",
};

fs.writeFileSync(JSON_OUT, `${JSON.stringify(artifact, null, 2)}\n`);
fs.writeFileSync(MD_OUT, markdown(artifact));
fs.writeFileSync(JS_OUT, `// Generated by scripts/build-knowledge-internal-teaching-packages.mjs.\n// Internal education-only teaching packages; not learner-facing approved.\nconst internalTeachingPackages = ${JSON.stringify({
  packageStatus: artifact.packageStatus,
  educationOnly: artifact.educationOnly,
  productionReady: artifact.productionReady,
  learnerFacingRelease: artifact.learnerFacingRelease,
  approvalStatus: artifact.approvalStatus,
  writeAllowedNow: artifact.writeAllowedNow,
  totals: artifact.totals,
  moduleTeachingPackages: artifact.moduleTeachingPackages,
  moduleLearningPathSuggestions: artifact.moduleLearningPathSuggestions,
  globalCourseGraph: artifact.globalCourseGraph,
  knowledgeBrowserSurface: artifact.knowledgeBrowserSurface,
  boundary: artifact.boundary,
}, null, 2)};\n\nmodule.exports = { internalTeachingPackages };\n`);

console.log(JSON.stringify({
  ok: true,
  packageStatus: artifact.packageStatus,
  moduleTeachingPackages: artifact.totals.moduleTeachingPackages,
  lessonOutlines: artifact.totals.lessonOutlines,
  quizAndPracticeItems: artifact.totals.quizAndPracticeItems,
  moduleLearningPathSuggestions: artifact.totals.moduleLearningPathSuggestions,
}, null, 2));
