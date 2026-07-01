function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

function scoreCompleteness(item, requiredFields = []) {
  if (!requiredFields.length) return 0;
  const filled = requiredFields.filter((field) => hasValue(item[field])).length;
  return Math.round((filled / requiredFields.length) * 40);
}

function knowledgeQualityScore(item) {
  const required = [
    "definition",
    "principle",
    "whyItMatters",
    "howToRead",
    "multiTimeframeView",
    "commonMistakes",
    "antiExamples",
    "relatedCaseIds",
    "practiceTaskIds",
    "rubricIds",
    "mistakeTagIds",
    "boundaryNote",
  ];
  return Math.min(100, scoreCompleteness(item, required)
    + (hasValue(item.principle) ? 12 : 0)
    + (hasValue(item.antiExamples) ? 12 : 0)
    + (hasValue(item.relatedCaseIds) ? 12 : 0)
    + (hasValue(item.practiceTaskIds) ? 12 : 0)
    + (hasValue(item.rubricIds) ? 6 : 0)
    + (hasValue(item.boundaryNote) ? 6 : 0));
}

function caseQualityScore(item) {
  const required = [
    "chartNarrative",
    "beforeContext",
    "duringContext",
    "afterContext",
    "keyObservations",
    "commonTrap",
    "whatUserShouldNotice",
    "whatUserShouldNotConclude",
    "linkedKnowledgeNodeIds",
    "trainingScenarioIds",
    "dataBoundary",
    "boundaryNote",
  ];
  return Math.min(100, scoreCompleteness(item, required)
    + (hasValue(item.whatUserShouldNotice) ? 15 : 0)
    + (hasValue(item.whatUserShouldNotConclude) ? 15 : 0)
    + (hasValue(item.dataBoundary) ? 15 : 0)
    + (hasValue(item.boundaryNote) ? 15 : 0));
}

function scenarioQualityScore(item) {
  const required = [
    "question",
    "choices",
    "shortAnswerPrompt",
    "expectedObservation",
    "coachRubric",
    "mistakeTagIds",
    "nextPracticeSuggestion",
    "boundaryNote",
  ];
  return Math.min(100, scoreCompleteness(item, required)
    + (hasValue(item.expectedObservation) ? 20 : 0)
    + (hasValue(item.coachRubric) ? 20 : 0)
    + (hasValue(item.mistakeTagIds) ? 10 : 0)
    + (hasValue(item.boundaryNote) ? 10 : 0));
}

module.exports = {
  hasValue,
  knowledgeQualityScore,
  caseQualityScore,
  scenarioQualityScore,
};
