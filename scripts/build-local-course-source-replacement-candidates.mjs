import fs from "node:fs";

const manifestPath = "docs/LOCAL_INVESTMENT_COURSE_SOURCE_MANIFEST.json";
const replacementPackPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_SOURCE_REPLACEMENT_PACK.json";
const sourceQualityPath = "docs/LOCAL_COURSE_SOURCE_QUALITY_AUDIT.json";
const outputJsonPath = "docs/LOCAL_COURSE_SOURCE_REPLACEMENT_CANDIDATES.json";
const outputMdPath = "docs/LOCAL_COURSE_SOURCE_REPLACEMENT_CANDIDATES.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalize(value = "") {
  return value
    .replace(/\.pdf$/i, "")
    .replace(/[_-]?\u7b14\u8bb0/g, "")
    .replace(/[\s\u3010\u3011\[\]()\uff08\uff09\u300a\u300b\uff1a:\uff0c,\u3002\uff01!\u3001\-\u2014_]/g, "")
    .toLowerCase();
}

function numbers(value = "") {
  return (value.match(/\d+/g) || []).filter((item) => item.length >= 2);
}

function charSimilarity(a, b) {
  const left = new Set([...normalize(a)]);
  const right = new Set([...normalize(b)]);
  let intersection = 0;
  for (const item of left) {
    if (right.has(item)) intersection += 1;
  }
  return intersection / Math.max(1, Math.min(left.size, right.size));
}

function confidence(score, exactNumberHits, sameModule, sameNormalizedTitle) {
  if (sameModule && sameNormalizedTitle && exactNumberHits > 0 && score >= 110) return "direct_replacement_candidate";
  if (sameModule && score >= 85) return "same_module_neighbor_candidate";
  if (sameModule && score >= 60) return "context_reference_candidate";
  return "weak_reference_only";
}

const manifest = readJson(manifestPath);
const replacementPack = readJson(replacementPackPath);
const sourceQuality = readJson(sourceQualityPath);

for (const [name, data] of Object.entries({ manifest, replacementPack, sourceQuality })) {
  if (data.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${name} must keep productionReady:false`);
}
if (replacementPack.learnerFacingRelease !== false || replacementPack.approvalStatus !== "not_approved") {
  fail("replacement pack release gate drift");
}

const lowExtractionIds = new Set((sourceQuality.lowExtractionList || []).map((item) => item.sourceId));
const files = manifest.files || [];
const targetRows = (replacementPack.replacementCards || []).map((target) => {
  const targetNums = numbers(target.sourceRelativePath);
  const targetNorm = normalize(target.sourceRelativePath);
  const candidates = files
    .filter((file) => file.relativePath !== target.sourceRelativePath)
    .map((file) => {
      const candidateNums = numbers(file.relativePath);
      const exactNumberHits = targetNums.filter((item) => candidateNums.includes(item)).length;
      const sameModule = file.module === target.sourceModule;
      const similarity = charSimilarity(target.sourceRelativePath, file.relativePath);
      const candidateNorm = normalize(file.relativePath);
      const sameNormalizedTitle = candidateNorm === targetNorm;
      const containsTitle = candidateNorm.includes(targetNorm) || targetNorm.includes(candidateNorm);
      let score = 0;
      if (sameModule) score += 30;
      score += exactNumberHits * 20;
      score += Math.round(similarity * 40);
      if (sameNormalizedTitle) score += 40;
      if (containsTitle && !sameNormalizedTitle) score += 15;
      if (file.bytes > 500000) score += 5;
      if (lowExtractionIds.has(file.sourceId)) score -= 30;
      return {
        sourceId: file.sourceId,
        relativePath: file.relativePath,
        module: file.module,
        bytes: file.bytes,
        duplicateOf: file.duplicateOf,
        sameModule,
        exactNumberHits,
        similarity: Number(similarity.toFixed(3)),
        score,
        confidence: confidence(score, exactNumberHits, sameModule, sameNormalizedTitle),
        reviewerUse: "candidate_only_verify_before_replacement",
      };
    })
    .filter((candidate) => candidate.sameModule || candidate.score >= 55)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  const directCandidates = candidates.filter((candidate) => candidate.confidence === "direct_replacement_candidate");
  return {
    id: target.id,
    documentId: target.documentId,
    sourceId: target.sourceId,
    sourceRelativePath: target.sourceRelativePath,
    sourceModule: target.sourceModule,
    pageNumber: target.pageNumber,
    previewPath: target.previewPath,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    targetStatus: "source_replacement_required",
    candidateCount: candidates.length,
    directReplacementCandidateCount: directCandidates.length,
    recommendedAction: directCandidates.length
      ? "review_direct_candidate_before_reexport_or_replacement"
      : "no_direct_replacement_found_review_neighbor_candidates_or_locate_external_original",
    candidates,
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  discoveryStatus: "candidate_discovery_complete_review_required",
  sourceRoot: manifest.root,
  replacementTargets: targetRows.length,
  targetsWithCandidates: targetRows.filter((row) => row.candidateCount > 0).length,
  targetsWithDirectReplacementCandidates: targetRows.filter((row) => row.directReplacementCandidateCount > 0).length,
  totalCandidateRows: targetRows.reduce((sum, row) => sum + row.candidateCount, 0),
  targetRows,
  boundary: "Source replacement candidates are reviewer-only suggestions for blank-preview local private course PDFs. They do not replace files, infer missing content, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Source Replacement Candidates",
  "",
  "Candidate discovery for blank-preview low-extraction local course PDFs.",
  "",
  `- Discovery status: ${report.discoveryStatus}`,
  `- Replacement targets: ${report.replacementTargets}`,
  `- Targets with candidates: ${report.targetsWithCandidates}`,
  `- Targets with direct replacement candidates: ${report.targetsWithDirectReplacementCandidates}`,
  `- Total candidate rows: ${report.totalCandidateRows}`,
  "",
  "## Targets",
  "",
  "| Target | Candidates | Direct | Recommended action |",
  "| --- | ---: | ---: | --- |",
  ...targetRows.map((row) => `| ${row.sourceRelativePath} | ${row.candidateCount} | ${row.directReplacementCandidateCount} | ${row.recommendedAction} |`),
  "",
  "## Top Candidates",
  "",
  ...targetRows.flatMap((row) => [
    `### ${row.sourceRelativePath}`,
    "",
    "| Candidate | Score | Confidence |",
    "| --- | ---: | --- |",
    ...row.candidates.slice(0, 5).map((candidate) => `| ${candidate.relativePath} | ${candidate.score} | ${candidate.confidence} |`),
    "",
  ]),
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  discoveryStatus: report.discoveryStatus,
  replacementTargets: report.replacementTargets,
  targetsWithCandidates: report.targetsWithCandidates,
  targetsWithDirectReplacementCandidates: report.targetsWithDirectReplacementCandidates,
  totalCandidateRows: report.totalCandidateRows,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
