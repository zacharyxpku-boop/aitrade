const { corpusChunks } = require("./education-corpus-index");

// Deterministic keyword retrieval over corpus evidence chunks.
// This is a local rule-based retrieval layer for reviewer tooling and
// AI-explanation grounding. It performs no generation, no external calls,
// and grants no publication rights over chunk text.

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "for", "to", "with", "is", "are",
  "was", "were", "be", "this", "that", "it", "as", "at", "by", "from", "we", "can",
]);

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

// Precompute token sets per chunk once; texts are immutable after harvest.
const chunkTokens = corpusChunks.map((chunk) => {
  const tokens = tokenize(chunk.text);
  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  return counts;
});

// Inverse document frequency: rare, topical tokens (candlestick, wick) outweigh
// generic question words (mean, form, why) so noise chunks stop winning on
// common-word matches. Computed once over the immutable chunk set.
const docFrequency = new Map();
for (const counts of chunkTokens) {
  for (const token of counts.keys()) docFrequency.set(token, (docFrequency.get(token) || 0) + 1);
}
const totalChunks = chunkTokens.length || 1;
function idf(token) {
  const df = docFrequency.get(token) || 0;
  return Math.log((totalChunks + 1) / (df + 1)) + 1;
}

function scoreChunk(index, queryTokens, options) {
  const counts = chunkTokens[index];
  const chunk = corpusChunks[index];
  if (chunk.qualityTier === "low_noise") return 0;
  if (options.allowedTiers && !options.allowedTiers.has(chunk.tier)) return 0;
  let score = 0;
  for (const token of queryTokens) {
    const hits = counts.get(token);
    if (hits) score += idf(token) * (1 + Math.min(hits, 4) * 0.25);
  }
  if (score === 0) return 0;
  if (options.category && chunk.conceptCategoryCandidates.includes(options.category)) score *= 1.5;
  if (options.domain && chunk.domains.includes(options.domain)) score *= 1.5;
  return score;
}

function searchChunks(query, options = {}) {
  const queryTokens = [...new Set(tokenize(Array.isArray(query) ? query.join(" ") : query))];
  if (!queryTokens.length) return [];
  const limit = Math.min(options.limit || 5, 20);
  const allowedTiers = options.allowedTiers ? new Set(options.allowedTiers) : null;
  const scored = [];
  for (let index = 0; index < corpusChunks.length; index += 1) {
    const score = scoreChunk(index, queryTokens, { ...options, allowedTiers });
    if (score > 0) scored.push({ index, score });
  }
  scored.sort((left, right) => right.score - left.score);
  return scored.slice(0, limit).map(({ index, score }) => {
    const chunk = corpusChunks[index];
    return {
      chunkId: chunk.id,
      documentId: chunk.documentId,
      sourceId: chunk.sourceId,
      url: chunk.url,
      tier: chunk.tier,
      domains: chunk.domains,
      conceptCategoryCandidates: chunk.conceptCategoryCandidates,
      charCount: chunk.charCount,
      score: Number(score.toFixed(3)),
      // Excerpts: public-domain text may be shown to reviewers directly;
      // open-access text stays pointer-only outside the research layer.
      excerpt: ["public_domain", "share_alike", "permissive"].includes(chunk.tier) ? chunk.text.slice(0, 400) : null,
      excerptPolicy: chunk.tier === "public_domain"
        ? "public_domain_excerpt_reviewer_use"
        : chunk.tier === "share_alike"
          ? "share_alike_excerpt_attribution_required"
          : chunk.tier === "permissive"
            ? "permissive_excerpt_attribution_and_license_notice"
            : "pointer_only_cite_and_paraphrase",
      boundary: chunk.boundary,
    };
  });
}

function queryTermsForNode(node) {
  const conceptTerms = (node.reviewedSourceRefs || [])
    .flatMap((ref) => ref.matchedConcepts || [])
    .flatMap((concept) => [concept.label, concept.category, concept.subcategory]);
  return conceptTerms.filter(Boolean).join(" ").replace(/[._]/g, " ");
}

module.exports = {
  searchChunks,
  queryTermsForNode,
};
