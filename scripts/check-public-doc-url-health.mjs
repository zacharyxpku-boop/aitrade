import fs from "node:fs/promises";

const snapshotPath = "docs/REAL_SOURCE_HARVEST.json";
const outputJson = "docs/PUBLIC_DOCUMENT_URL_HEALTH.json";
const outputMd = "docs/PUBLIC_DOCUMENT_URL_HEALTH.md";
const limit = Number(process.env.PUBLIC_DOC_HEALTH_LIMIT || 200);
const timeoutMs = Number(process.env.PUBLIC_DOC_HEALTH_TIMEOUT_MS || 5000);
const concurrency = Number(process.env.PUBLIC_DOC_HEALTH_CONCURRENCY || 12);
const allowGetFallback = process.env.PUBLIC_DOC_HEALTH_GET_FALLBACK === "1";

const snapshot = JSON.parse(await fs.readFile(snapshotPath, "utf8"));
const sources = Array.isArray(snapshot.sources) ? snapshot.sources : [];
const publicDocs = sources
  .filter((source) => !["github-repository", "npm-package"].includes(source.sourceType))
  .filter((source) => !/^npm-linked-/i.test(source.sourceType || ""))
  .filter((source) => source.url && /^https?:\/\//i.test(source.url))
  .slice(0, limit);

async function probe(source) {
  async function attempt(method) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(source.url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "TradeGym education source health check; metadata-only; local prototype",
          "accept": "text/html,application/json,text/plain,*/*",
        },
      });
      clearTimeout(timeout);
      return {
        method,
        status: response.status,
        ok: response.status >= 200 && response.status < 400,
        error: "",
      };
    } catch (error) {
      clearTimeout(timeout);
      return {
        method,
        status: 0,
        ok: false,
        error: error.name === "AbortError" ? "timeout" : error.message,
      };
    }
  }

  const head = await attempt("HEAD");
  const final = head.ok || !allowGetFallback ? head : await attempt("GET");
  const ok = final.ok;
  return {
    name: source.name,
    url: source.url,
    sourceType: source.sourceType,
    status: final.status,
    ok,
    method: final.method,
    note: ok
      ? `Reachable by ${final.method}.`
      : `Probe failed or blocked (${final.error || `HTTP ${final.status}`}). Keep as research_only until reviewed.`,
  };
}

const results = [];
for (let index = 0; index < publicDocs.length; index += concurrency) {
  const batch = publicDocs.slice(index, index + concurrency);
  results.push(...await Promise.all(batch.map((source) => probe(source))));
}

const okCount = results.filter((item) => item.ok).length;
const failed = results.filter((item) => !item.ok);
const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  checked: results.length,
  reachable: okCount,
  needsManualReview: failed.length,
  reachableRate: results.length ? Number((okCount / results.length).toFixed(4)) : 0,
  boundary: "This health check verifies URL status only. It does not copy page text, grant reuse rights, or authorize market-data use.",
  failed: failed.slice(0, 40),
  results,
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, [
  "# Public Document URL Health",
  "",
  "This report checks public-document URL reachability only. It does not copy third-party content and does not grant reuse rights.",
  "",
  `- Checked: ${report.checked}`,
  `- Reachable: ${report.reachable}`,
  `- Needs manual review: ${report.needsManualReview}`,
  `- Reachable rate: ${report.reachableRate}`,
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
  "## First Failed/Review Items",
  "",
  ...failed.slice(0, 20).map((item) => `- ${item.status} ${item.name}: ${item.url} (${item.note})`),
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: report.checked > 0,
  productionReady: false,
  educationOnly: true,
  healthStatus: report.needsManualReview > 0 ? "advisory-review-needed" : "all-checked-urls-reachable",
  checked: report.checked,
  reachable: report.reachable,
  needsManualReview: report.needsManualReview,
  reachableRate: report.reachableRate,
  outputJson,
  outputMd,
}, null, 2));
