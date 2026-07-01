import fs from "node:fs";

const path = "docs/REAL_SOURCE_HARVEST.json";
if (!fs.existsSync(path)) {
  throw new Error("Missing docs/REAL_SOURCE_HARVEST.json. Run npm.cmd run harvest:real-sources first.");
}

const snapshot = JSON.parse(fs.readFileSync(path, "utf8"));
const sources = Array.isArray(snapshot.sources) ? snapshot.sources : [];

function fail(message) {
  throw new Error(message);
}

const relevanceCounts = sources.reduce((counts, source) => {
  const key = source.domainRelevance || "missing";
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});

const offTopic = sources.filter((source) => source.domainRelevance === "off_topic_review_only");
const weak = sources.filter((source) => source.domainRelevance === "weak_relevance_review_only");
const officialOrDocument = sources.filter((source) => source.domainRelevance === "authority_public_document");
const relevantMetadata = sources.filter((source) => source.domainRelevance === "relevant_metadata");
const badPromotions = [...offTopic, ...weak].filter((source) => source.status !== "research_only" || source.reliabilityGrade === "S");
const missingRelevance = sources.filter((source) => !source.domainRelevance || typeof source.domainRelevanceScore !== "number");
const oversizedDescriptions = sources.filter((source) => String(source.description || "").length > 340);

if (missingRelevance.length) fail(`sources missing domain relevance review: ${missingRelevance.length}`);
if (badPromotions.length) fail(`weak/off-topic sources promoted beyond research_only: ${badPromotions.length}`);
if (officialOrDocument.length < 250) fail(`official/public document coverage too low after relevance pass: ${officialOrDocument.length}`);
if (relevantMetadata.length < 2500) fail(`relevant metadata source count too low: ${relevantMetadata.length}`);
if (oversizedDescriptions.length) fail(`source descriptions should stay metadata-sized, oversized: ${oversizedDescriptions.length}`);

console.log(JSON.stringify({
  ok: true,
  productionReady: false,
  educationOnly: true,
  totalSources: sources.length,
  relevanceCounts,
  officialOrDocumentSources: officialOrDocument.length,
  relevantMetadataSources: relevantMetadata.length,
  offTopicReviewOnly: offTopic.length,
  weakRelevanceReviewOnly: weak.length,
  badPromotions: badPromotions.length,
  oversizedDescriptions: oversizedDescriptions.length,
  boundary: "Off-topic and weak-relevance sources are retained only as review inventory and must not ground learner-facing curriculum.",
}, null, 2));
