const { knowledgeLessons, knowledgeLessonReport } = require("./education-knowledge-lessons");

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function buildModulePath(module, lessons, moduleIndex) {
  const ordered = lessons.slice().sort((a, b) => a.sequence - b.sequence);
  const units = chunk(ordered, 10).map((items, unitIndex) => ({
    id: `unit_${moduleIndex + 1}_${unitIndex + 1}`,
    title: `${module} unit ${unitIndex + 1}`,
    lessonIds: items.map((lesson) => lesson.id),
    prerequisiteUnitIds: unitIndex === 0 ? [] : [`unit_${moduleIndex + 1}_${unitIndex}`],
    nextUnitId: unitIndex < Math.ceil(ordered.length / 10) - 1 ? `unit_${moduleIndex + 1}_${unitIndex + 2}` : "",
    focus: unitIndex === 0 ? "foundation" : unitIndex === 1 ? "application" : "review",
    estimatedMinutes: items.length * 8,
    checkpoint: {
      prompt: "Summarize the visible evidence, uncertainty, common mistake, and review boundary before moving on.",
      passCriteria: [
        "Describes evidence before interpretation.",
        "Uses multi-timeframe context.",
        "Names one uncertainty or counterexample.",
        "Avoids action guidance and performance claims.",
      ],
    },
  }));
  return {
    id: `path_${moduleIndex + 1}`,
    module,
    educationOnly: true,
    productionReady: false,
    prerequisitePathIds: moduleIndex === 0 ? [] : [`path_${moduleIndex}`],
    nextPathId: moduleIndex < 11 ? `path_${moduleIndex + 2}` : "",
    lessonCount: ordered.length,
    unitCount: units.length,
    estimatedMinutes: units.reduce((sum, unit) => sum + unit.estimatedMinutes, 0),
    entryLessonId: ordered[0]?.id || "",
    finalLessonId: ordered[ordered.length - 1]?.id || "",
    units,
    reviewLoop: {
      afterEachUnit: "Run an AI review against the rubric draft and rewrite overconfident claims as observations.",
      afterPath: "Pick three lessons, compare mistakes, and write a no-action learning summary.",
    },
    boundary: "Curriculum paths organize education lessons only. They do not provide recommendations, live signals, broker workflows, or real-funds guidance.",
  };
}

const modules = [...new Set(knowledgeLessons.map((lesson) => lesson.module))];
const curriculumPaths = modules.map((module, index) => buildModulePath(
  module,
  knowledgeLessons.filter((lesson) => lesson.module === module),
  index,
));

const curriculumPathReport = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  paths: curriculumPaths.length,
  totalLessons: knowledgeLessonReport.lessons,
  totalPathLessons: curriculumPaths.reduce((sum, path) => sum + path.lessonCount, 0),
  totalUnits: curriculumPaths.reduce((sum, path) => sum + path.unitCount, 0),
  totalEstimatedMinutes: curriculumPaths.reduce((sum, path) => sum + path.estimatedMinutes, 0),
  prerequisitePathEdges: curriculumPaths.reduce((sum, path) => sum + path.prerequisitePathIds.length, 0),
  prerequisiteUnitEdges: curriculumPaths.reduce((sum, path) => sum + path.units.reduce((unitSum, unit) => unitSum + unit.prerequisiteUnitIds.length, 0), 0),
  pathsWithReviewLoops: curriculumPaths.filter((path) => path.reviewLoop.afterEachUnit && path.reviewLoop.afterPath).length,
  boundary: "Curriculum paths are sequencing scaffolds for education-only lesson drafts and remain review-needed.",
};

module.exports = {
  curriculumPaths,
  curriculumPathReport,
};
