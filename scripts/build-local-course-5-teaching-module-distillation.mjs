import fs from "node:fs";

const intakePath = "docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json";
const synthesisPath = "docs/LOCAL_COURSE_5_MODULE_SYNTHESIS.json";
const followupAuditPath = "docs/LOCAL_COURSE_5_FOLLOWUP_ABSORPTION_CONTROL_AUDIT.json";
const reviewerTemplatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_FOLLOWUP_REAL_REVIEWER_INPUT_TEMPLATE.json";
const outputJson = "docs/LOCAL_COURSE_5_TEACHING_MODULE_DISTILLATION.json";
const outputMd = "docs/LOCAL_COURSE_5_TEACHING_MODULE_DISTILLATION.md";

const boundary = "Course 5 teaching module distillation is private reviewer-facing education design. It converts absorbed local documents into paraphrase-only lesson seeds, evidence anchors, source gaps, and review tasks. It is not learner-facing, not publication-cleared, and does not copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.";

const moduleBlueprints = {
  price_action_foundations: {
    lessonSeeds: [
      "Market structure and always-in context",
      "Bars, closes, tails, gaps, and pressure",
      "Reading trader expectation versus chart evidence",
      "Foundational decision hygiene for educational chart review",
    ],
    concepts: ["always in", "bar", "close", "gap", "pressure", "context", "probability", "market"],
  },
  trends_and_channels: {
    lessonSeeds: [
      "Trend strength and channel behavior",
      "Pullbacks, failed breakouts, and trend resumption",
      "Transition from trend to range",
      "Trend-reading drills without signal claims",
    ],
    concepts: ["trend", "channel", "pullback", "breakout", "micro channel", "strong", "weak"],
  },
  trading_ranges: {
    lessonSeeds: [
      "Range formation and two-sided trading pressure",
      "Support, resistance, and failed continuation",
      "Breakout attempts inside ranges",
      "Range examples for scenario classification",
    ],
    concepts: ["range", "support", "resistance", "breakout", "reversal", "sideways", "test"],
  },
  reversals: {
    lessonSeeds: [
      "Reversal setup anatomy",
      "Climax, failed breakout, and second-entry logic",
      "Distinguishing reversal from pullback",
      "Reversal examples for after-the-fact education",
    ],
    concepts: ["reversal", "climax", "second entry", "failed", "wedge", "double top", "double bottom"],
  },
  breakouts_and_pullbacks: {
    lessonSeeds: [
      "Breakout context and follow-through",
      "Pullback quality after breakout",
      "Failed breakout as a learning pattern",
      "Breakout review rubrics for historical charts",
    ],
    concepts: ["breakout", "pullback", "follow-through", "failed breakout", "entry", "stop"],
  },
  bar_by_bar_reading: {
    lessonSeeds: [
      "Sequential bar interpretation",
      "Bull and bear bar pressure",
      "Context before pattern labels",
      "Bar-by-bar annotation practice",
    ],
    concepts: ["bar by bar", "bull bar", "bear bar", "close", "tail", "signal bar", "entry bar"],
  },
  chart_pattern_encyclopedia: {
    lessonSeeds: [
      "Pattern taxonomy as reference, not prediction",
      "Pattern examples grouped by context",
      "Visual checklist for pattern recognition",
      "Archive-to-module workflow for chart examples",
    ],
    concepts: ["pattern", "chart", "wedge", "triangle", "flag", "double", "channel", "range"],
  },
  trade_management: {
    lessonSeeds: [
      "Educational framing for stop and target discussion",
      "Managing uncertainty after entry in historical examples",
      "Scaling and exit concepts as risk vocabulary",
      "Trade management without live instruction",
    ],
    concepts: ["stop", "target", "exit", "scale", "risk", "reward", "management"],
  },
  risk_management: {
    lessonSeeds: [
      "Risk language and position-sizing boundaries",
      "Invalidation, uncertainty, and loss containment",
      "Why examples must avoid profit promises",
      "Risk review as a learner checklist",
    ],
    concepts: ["risk", "loss", "probability", "position", "stop", "reward", "uncertainty"],
  },
  psychology_and_discipline: {
    lessonSeeds: [
      "Discipline, patience, and cognitive bias",
      "Hope versus chart evidence",
      "Emotional traps in historical review",
      "Process notes for deliberate practice",
    ],
    concepts: ["discipline", "psychology", "hope", "fear", "patience", "trap", "denial"],
  },
  course_slides_alignment: {
    lessonSeeds: [
      "Map Course 1-4 slide concepts to module order",
      "Identify slide-only visual gaps",
      "Use slide sequence as curriculum spine",
      "Separate source notes from original teaching copy",
    ],
    concepts: ["slide", "video", "course", "lesson", "glossary", "definition"],
  },
  terminology_glossary: {
    lessonSeeds: [
      "Core abbreviations and definitions",
      "Term disambiguation across modules",
      "Glossary cards for learner review",
      "Public-source grounding for terms",
    ],
    concepts: ["glossary", "definition", "term", "always in", "high", "low", "entry"],
  },
  unclassified_supplement: {
    lessonSeeds: [
      "Classify remaining supplemental sources",
      "Decide archive-only versus module contribution",
      "Review low-text visual pages",
      "Record source retention decisions",
    ],
    concepts: ["supplement", "chart", "review", "visual", "source"],
  },
};

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

function countMatches(text, phrase) {
  if (!text || !phrase) return 0;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.match(new RegExp(escaped, "gi")) || []).length;
}

function readTextSample(textArtifact) {
  if (!textArtifact || !fs.existsSync(textArtifact)) return "";
  const text = fs.readFileSync(textArtifact, "utf8");
  return text.slice(0, 250000);
}

const intake = readJson(intakePath);
const synthesis = readJson(synthesisPath);
const followupAudit = readJson(followupAuditPath);
const reviewerTemplate = readJson(reviewerTemplatePath);

assertBoundary("intake", intake);
assertBoundary("synthesis", synthesis);
assertBoundary("followupAudit", followupAudit);
assertBoundary("reviewerTemplate", reviewerTemplate);

const rows = (intake.rows || []).filter((row) => !row.duplicateOf);
const rowsByModule = new Map();
for (const row of rows) {
  for (const moduleId of row.moduleTags || ["unclassified_supplement"]) {
    if (!rowsByModule.has(moduleId)) rowsByModule.set(moduleId, []);
    rowsByModule.get(moduleId).push(row);
  }
}

const followupByModule = new Map((followupAudit.moduleRows || []).map((row) => [row.moduleId, row]));
const moduleRows = (synthesis.moduleRows || []).map((module) => {
  const blueprint = moduleBlueprints[module.moduleId] || moduleBlueprints.unclassified_supplement;
  const moduleDocs = rowsByModule.get(module.moduleId) || [];
  const textDocs = moduleDocs
    .filter((row) => row.absorptionStatus === "absorbed_private_research_text" && row.charCount > 0)
    .sort((left, right) => (right.charCount || 0) - (left.charCount || 0));
  const sampleTexts = textDocs.slice(0, 6).map((row) => readTextSample(row.textArtifact)).join("\n");
  const conceptSignalRows = blueprint.concepts.map((concept) => ({
    concept,
    signalCountInSampledText: countMatches(sampleTexts, concept),
    evidenceMode: "keyword_signal_only_needs_reviewer_paraphrase",
  })).sort((left, right) => right.signalCountInSampledText - left.signalCountInSampledText || left.concept.localeCompare(right.concept));
  const topSignals = conceptSignalRows.filter((row) => row.signalCountInSampledText > 0).slice(0, 6);
  const followup = followupByModule.get(module.moduleId);
  const hasUnresolvedVisuals = (module.followupRows || 0) > 0 || (module.imageEntries || 0) > 0 || (module.visualSampleRows || 0) > 0 || (followup?.totalDraftRows || 0) > 0;
  const lessonSeedRows = blueprint.lessonSeeds.map((lessonTitle, index) => ({
    lessonSeedId: `course5_${module.moduleId}_lesson_seed_${String(index + 1).padStart(2, "0")}`,
    lessonTitle,
    teachingUse: "private_curriculum_design_seed_requires_paraphrase_public_grounding_and_review",
    primaryConceptSignals: topSignals.slice(0, 4).map((row) => row.concept),
    sourceEvidenceMode: textDocs.length > 0 ? "absorbed_text_plus_source_anchors" : "visual_or_inventory_only_requires_ocr_or_human_review",
    releaseStatus: "blocked_not_learner_facing",
  }));
  const evidenceAnchors = textDocs.slice(0, 8).map((row) => ({
    recordId: row.recordId,
    relativePath: row.relativePath,
    charCount: row.charCount || 0,
    textArtifact: row.textArtifact,
    evidenceRole: "private_source_anchor_for_reviewer_paraphrase_not_direct_copy",
    reviewStatus: row.reviewStatus || "needs_reviewer_distillation",
  }));
  return {
    moduleId: module.moduleId,
    moduleLabel: module.moduleLabel,
    sourceDocumentRows: module.sourceDocumentRows,
    textAbsorbedRows: module.textAbsorbedRows,
    followupRows: module.followupRows,
    visualSampleRows: module.visualSampleRows,
    imageEntries: module.imageEntries,
    p0OrNonP0DraftRows: followup?.totalDraftRows || 0,
    lessonSeedRows,
    lessonSeedCount: lessonSeedRows.length,
    conceptSignalRows,
    evidenceAnchors,
    evidenceAnchorCount: evidenceAnchors.length,
    unresolvedVisualOrOcrGate: hasUnresolvedVisuals,
    reviewerNextGate: hasUnresolvedVisuals
      ? "resolve_visual_or_ocr_cards_then_accept_distill_or_archive"
      : "review_text_evidence_then_paraphrase_and_public_ground",
    teachingModuleCandidateStatus: textDocs.length > 0
      ? "private_teaching_module_seed_ready_for_reviewer_distillation"
      : "module_seed_blocked_until_visual_or_ocr_review",
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  distillationStatus: "course_5_teaching_module_distillation_ready_private_design_release_blocked",
  distillationMode: "absorbed_course_5_sources_to_paraphrase_only_lesson_seeds",
  sourceIntake: intakePath,
  sourceSynthesis: synthesisPath,
  sourceFollowupAudit: followupAuditPath,
  sourceReviewerTemplate: reviewerTemplatePath,
  totalFiles: intake.totalFiles,
  uniquePrimaryRows: intake.uniquePrimaryRows,
  textAbsorbedRows: intake.textAbsorbedRows,
  followupRequiredRows: intake.followupRequiredRows,
  totalExtractedChars: intake.totalExtractedChars,
  modules: moduleRows.length,
  modulesWithLessonSeeds: moduleRows.filter((row) => row.lessonSeedCount > 0).length,
  totalLessonSeeds: moduleRows.reduce((sum, row) => sum + row.lessonSeedCount, 0),
  modulesWithEvidenceAnchors: moduleRows.filter((row) => row.evidenceAnchorCount > 0).length,
  totalEvidenceAnchors: moduleRows.reduce((sum, row) => sum + row.evidenceAnchorCount, 0),
  modulesBlockedByVisualOrOcr: moduleRows.filter((row) => row.unresolvedVisualOrOcrGate).length,
  readyReviewerNotes: followupAudit.readyReviewerNotes || 0,
  acceptedForModuleDistillationRows: followupAudit.acceptedForModuleDistillationRows || 0,
  acceptedForDeletionReadinessRows: followupAudit.acceptedForDeletionReadinessRows || 0,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  moduleRows,
  commands: [
    "npm.cmd run build:local-course-5-teaching-module-distillation",
    "npm.cmd run check:local-course-5-teaching-module-distillation",
    "npm.cmd run verify",
  ],
  completionRule: "Course 5 is closer to teachable absorption when every synthesized module has lesson seeds, evidence anchors, concept signals, unresolved visual/OCR gates, and locked release status. This still does not prove learner-facing readiness or source-folder deletion readiness.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course 5 Teaching Module Distillation",
  "",
  `- Distillation status: ${artifact.distillationStatus}`,
  `- Modules: ${artifact.modules}`,
  `- Modules with lesson seeds: ${artifact.modulesWithLessonSeeds}`,
  `- Total lesson seeds: ${artifact.totalLessonSeeds}`,
  `- Modules with evidence anchors: ${artifact.modulesWithEvidenceAnchors}`,
  `- Total evidence anchors: ${artifact.totalEvidenceAnchors}`,
  `- Modules blocked by visual/OCR gates: ${artifact.modulesBlockedByVisualOrOcr}`,
  `- Ready reviewer notes: ${artifact.readyReviewerNotes}`,
  `- Accepted for module distillation rows: ${artifact.acceptedForModuleDistillationRows}`,
  `- Source folder may be deleted: ${artifact.sourceFolderMayBeDeleted}`,
  `- Learner-ready modules: ${artifact.learnerReadyModules}`,
  "",
  "## Module Rows",
  "",
  "| Module | Lesson seeds | Evidence anchors | Text rows | Follow-up | Visual/OCR blocked | Status |",
  "|---|---:|---:|---:|---:|---|---|",
  ...moduleRows.map((row) => `| ${row.moduleLabel} | ${row.lessonSeedCount} | ${row.evidenceAnchorCount} | ${row.textAbsorbedRows} | ${row.followupRows} | ${row.unresolvedVisualOrOcrGate} | ${row.teachingModuleCandidateStatus} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  distillationStatus: artifact.distillationStatus,
  modules: artifact.modules,
  modulesWithLessonSeeds: artifact.modulesWithLessonSeeds,
  totalLessonSeeds: artifact.totalLessonSeeds,
  modulesWithEvidenceAnchors: artifact.modulesWithEvidenceAnchors,
  modulesBlockedByVisualOrOcr: artifact.modulesBlockedByVisualOrOcr,
  learnerReadyModules: artifact.learnerReadyModules,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
