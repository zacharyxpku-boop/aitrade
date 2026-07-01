import fs from "node:fs";

// License-tier classifier for the corpus layer.
// It assigns one of four tiers to every harvested source URL.
// It never edits the source pool and never grants learner-facing publication rights.

const inputPath = "docs/REAL_SOURCE_HARVEST.json";
if (!fs.existsSync(inputPath)) {
  throw new Error("Missing docs/REAL_SOURCE_HARVEST.json. Run npm.cmd run harvest:real-sources first.");
}

const snapshot = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const sources = Array.isArray(snapshot.sources) ? snapshot.sources : [];

const PERMISSIVE_LICENSES = /^(mit|apache-2\.0|bsd-2-clause|bsd-3-clause|isc|cc0-1\.0|0bsd|unlicense)$/i;
const VIDEO_HOSTS = /(youtube\.com|youtu\.be|bilibili\.com|tiktok\.com|douyin\.com|vimeo\.com|twitch\.tv)/i;

// Regional Federal Reserve banks and FRED are quasi-governmental: their content is
// not automatically US-government public domain, so they stay out of public_domain.
const FED_REGIONAL_HOSTS = /(stlouisfed\.org|newyorkfed\.org|atlantafed\.org|chicagofed\.org|clevelandfed\.org|philadelphiafed\.org|richmondfed\.org|dallasfed\.org|kansascityfed\.org|frbsf\.org)/i;

function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function classify(source) {
  const url = source.url || "";
  const host = hostnameOf(url);
  if (!host) return { tier: "restricted_default", reason: "unparseable url" };

  if (VIDEO_HOSTS.test(host)) {
    return { tier: "restricted_default", reason: "video platform; terms of service forbid scraping; metadata only" };
  }

  if (FED_REGIONAL_HOSTS.test(host)) {
    return {
      tier: "restricted_default",
      reason: "regional Federal Reserve / FRED content is quasi-governmental, not automatic public domain; terms review required",
      exception: "fed_regional_terms",
    };
  }

  if (/\.(gov|mil)$/.test(host) || /\.(gov|mil)\./.test(host)) {
    return { tier: "public_domain", reason: "US federal government work (17 U.S.C. 105); verify no third-party material inside documents" };
  }

  if (source.sourceType === "public-domain-classic" || source.sourceUseTier === "green_public_domain_classic") {
    return {
      tier: "public_domain",
      reason: "public-domain classic catalog entry; verify edition/date and embedded third-party material before quoting",
    };
  }

  if (host === "arxiv.org" || host.endsWith(".arxiv.org")) {
    return { tier: "open_access", reason: "arXiv open access; copyright stays with authors; internal research use, cite + original paraphrase only" };
  }

  if (source.sourceType === "github-repository" && PERMISSIVE_LICENSES.test(String(source.license || ""))) {
    return { tier: "permissive", reason: `permissive license ${source.license}; reuse requires attribution and license preservation` };
  }

  return { tier: "restricted_default", reason: "no affirmative license evidence; metadata and taxonomy use only" };
}

const tiered = sources.map((source) => {
  const result = classify(source);
  return {
    sourceId: source.id,
    name: source.name,
    url: source.url,
    sourceType: source.sourceType,
    license: source.license,
    status: source.status,
    tier: result.tier,
    tierReason: result.reason,
    ...(result.exception ? { exception: result.exception } : {}),
  };
});

const counts = tiered.reduce((acc, item) => {
  acc[item.tier] = (acc[item.tier] || 0) + 1;
  return acc;
}, {});

const exceptions = tiered.filter((item) => item.exception);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  totalSources: tiered.length,
  tierCounts: counts,
  fedRegionalExceptions: exceptions.length,
  corpusEligibleTiers: ["public_domain", "open_access"],
  corpusEligibleCount: tiered.filter((item) => ["public_domain", "open_access"].includes(item.tier)).length,
  boundary: "License tiers gate corpus harvesting only. They are not legal advice, not publication approval, and not a learner-facing promotion. Restricted sources stay metadata-only.",
  sources: tiered,
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/SOURCE_LICENSE_TIERS.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");

const md = [
  "# Source License Tiers",
  "",
  "Four-tier license classification that gates which sources the corpus layer may fetch full content from.",
  "It does not change any source status and does not approve learner-facing reuse.",
  "",
  "## Tier Counts",
  "",
  `- Total sources: ${report.totalSources}`,
  ...Object.entries(counts).map(([tier, count]) => `- ${tier}: ${count}`),
  `- Corpus-eligible (public_domain + open_access): ${report.corpusEligibleCount}`,
  `- Regional Fed / FRED exceptions held back for terms review: ${exceptions.length}`,
  "",
  "## Tier Rules",
  "",
  "- `public_domain`: US federal .gov/.mil hosts. Federal works carry no copyright, but individual documents can embed third-party material, so spot review is still required before commercial quoting.",
  "- `permissive`: GitHub repositories whose license metadata is MIT, Apache-2.0, BSD, ISC, CC0, 0BSD, or Unlicense. Reuse requires attribution and license preservation.",
  "- `open_access`: arXiv. Full text may enter the internal research layer only; learner-facing output must cite and use original wording.",
  "- `restricted_default`: everything else, including all video platforms and quasi-governmental regional Fed/FRED content. Metadata and taxonomy use only.",
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n");

fs.writeFileSync("docs/SOURCE_LICENSE_TIERS.md", md, "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  totalSources: report.totalSources,
  tierCounts: counts,
  corpusEligibleCount: report.corpusEligibleCount,
  outputJson: "docs/SOURCE_LICENSE_TIERS.json",
  outputMd: "docs/SOURCE_LICENSE_TIERS.md",
}, null, 2));
