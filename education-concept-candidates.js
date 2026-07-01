const { sourceInventory } = require("./education-source-inventory");
const { patternTaxonomy } = require("./education-pattern-taxonomy");

const categories = [
  ["chart_reading", "structure", ["context", "location", "close confirmation", "wick rejection", "range edge"]],
  ["trend", "market_structure", ["higher high", "higher low", "lower high", "lower low", "trend exhaustion"]],
  ["breakout", "price_action", ["compression", "failed breakout", "retest", "acceptance", "expansion"]],
  ["range", "price_action", ["upper edge", "lower edge", "middle noise", "rotation", "false escape"]],
  ["reversal", "market_structure", ["exhaustion", "double top", "double bottom", "structure shift", "failed reversal"]],
  ["timeframe", "multi_timeframe", ["D1 context", "H4 structure", "H1 rhythm", "M15 detail", "conflict"]],
  ["news_sentiment", "context", ["headline bias", "event timing", "overreaction", "narrative fit", "single source bias"]],
  ["backtest", "research_hygiene", ["future leakage", "small sample", "cherry picking", "cost ignored", "overfitting"]],
  ["psychology_risk", "learner_behavior", ["FOMO", "confirmation bias", "overconfidence", "invalidation missing", "no action condition"]],
  ["indicator_taxonomy", "indicator", ["trend indicator", "momentum indicator", "volatility indicator", "volume indicator", "overlap indicator"]],
];

const conceptCandidates = [];

function hasReviewedLowRiskUse(source) {
  if (source.status === "research_only") return false;
  if (["green_official_public_domain", "green_public_domain_classic"].includes(source.sourceUseTier)) return true;
  return /public[-_]domain|us-federal-public-domain|CC0|Unlicense|MIT|Apache|BSD|ISC|MPL/i.test(source.license || "");
}

for (let index = 0; conceptCandidates.length < 50000; index += 1) {
  const [category, subcategory, terms] = categories[index % categories.length];
  const term = terms[Math.floor(index / categories.length) % terms.length];
  const pattern = patternTaxonomy[index % patternTaxonomy.length];
  const source = sourceInventory[index % sourceInventory.length];
  const clearLicense = hasReviewedLowRiskUse(source);
  const learnerFacingAllowed = source.status === "taxonomy_allowed" && clearLicense && ["S", "A"].includes(source.reliabilityGrade);
  conceptCandidates.push({
    id: `cc_${String(index + 1).padStart(5, "0")}`,
    sourceId: source.id,
    rawLabel: `${term} / ${pattern.name}`,
    normalizedLabel: `${category}.${term.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    category,
    subcategory,
    aliases: [term, pattern.name, pattern.aliases[0]],
    relatedTerms: [pattern.type, pattern.category, subcategory],
    sourceType: source.sourceType,
    sourceReliability: source.reliabilityGrade,
    licenseBoundary: learnerFacingAllowed
      ? "Taxonomy cue may be used after human review; learner-facing explanation must be original."
      : "Research-only until license and terms are reviewed.",
    confidence: learnerFacingAllowed ? 0.78 : 0.52,
    learnerFacingAllowed,
  });
}

module.exports = {
  conceptCandidates,
};
