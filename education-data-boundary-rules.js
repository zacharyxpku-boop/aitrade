const boundaryTypes = [
  "github_project",
  "github_search",
  "official_doc",
  "data_provider_doc",
  "exchange_doc",
  "education_page",
  "terms_page",
  "user_upload",
  "demo_case",
  "licensed_feed_future",
];

const rules = [
  "record license before reuse",
  "taxonomy only until reviewed",
  "no learner-facing text copy",
  "no screenshot redistribution without rights",
  "no market data redistribution without contract",
  "source attribution required",
  "timestamp must be visible",
  "delay or realtime status must be disclosed",
  "research-only if terms unclear",
  "human review required before publishing",
];

const dataBoundaryRules = Array.from({ length: 300 }, (_, index) => {
  const sourceType = boundaryTypes[index % boundaryTypes.length];
  const rule = rules[Math.floor(index / boundaryTypes.length) % rules.length];
  return {
    id: `dbr_${String(index + 1).padStart(3, "0")}`,
    label: `${sourceType}: ${rule}`,
    sourceType,
    rule,
    allowedUse: "Use for inventory, taxonomy extraction, source review, or original education explanation after review.",
    disallowedUse: "Do not copy protected text, redistribute data, imply authorization, or convert material into action guidance.",
    learnerDisclosure: "Show whether the material is demo, research-only, public documentation, user-provided, or licensed before learner use.",
  };
});

module.exports = {
  dataBoundaryRules,
};
