import fs from "node:fs/promises";

const inputJson = "docs/PUBLIC_DOCUMENT_URL_HEALTH.json";
const outputJson = "docs/PUBLIC_DOCUMENT_GET_REVIEW.json";
const outputMd = "docs/PUBLIC_DOCUMENT_GET_REVIEW.md";
const limit = Number(process.env.PUBLIC_DOC_GET_REVIEW_LIMIT || 60);
const timeoutMs = Number(process.env.PUBLIC_DOC_GET_REVIEW_TIMEOUT_MS || 6000);
const concurrency = Number(process.env.PUBLIC_DOC_GET_REVIEW_CONCURRENCY || 4);

const health = JSON.parse(await fs.readFile(inputJson, "utf8"));
const failed = (health.results || [])
  .filter((item) => !item.ok)
  .filter((item) => item.url && /^https?:\/\//i.test(item.url))
  .slice(0, limit);

async function probe(item) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(item.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "TradeGym education source GET review; metadata-only; no body copy",
        "accept": "text/html,application/json,text/plain,*/*",
      },
    });
    clearTimeout(timeout);
    response.body?.cancel?.();
    return {
      name: item.name,
      url: item.url,
      sourceType: item.sourceType,
      headStatus: item.status,
      getStatus: response.status,
      ok: response.status >= 200 && response.status < 400,
      contentType: response.headers.get("content-type") || "",
      finalUrl: response.url,
      note: response.status >= 200 && response.status < 400
        ? "GET reachable. Still requires terms/access review before any learner-facing use."
        : `GET failed or blocked (HTTP ${response.status}). Keep research_only until reviewed.`,
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      name: item.name,
      url: item.url,
      sourceType: item.sourceType,
      headStatus: item.status,
      getStatus: 0,
      ok: false,
      contentType: "",
      finalUrl: item.url,
      note: `GET failed or blocked (${error.name === "AbortError" ? "timeout" : error.message}). Keep research_only until reviewed.`,
    };
  }
}

const results = [];
for (let index = 0; index < failed.length; index += concurrency) {
  const batch = failed.slice(index, index + concurrency);
  results.push(...await Promise.all(batch.map((item) => probe(item))));
}

const reachable = results.filter((item) => item.ok);
const stillManual = results.filter((item) => !item.ok);
const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  source: inputJson,
  checked: results.length,
  getReachable: reachable.length,
  stillNeedsManualReview: stillManual.length,
  reachableRate: results.length ? Number((reachable.length / results.length).toFixed(4)) : 0,
  boundary: "GET review records response metadata only. It does not copy page text, grant reuse rights, authorize market-data use, or approve learner-facing publication.",
  results,
};

if (report.educationOnly !== true) throw new Error("GET review must keep educationOnly true");
if (report.productionReady !== false) throw new Error("GET review must keep productionReady false");
if (report.checked < Math.min(limit, failed.length)) throw new Error("GET review checked fewer URLs than expected");

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, [
  "# Public Document GET Review",
  "",
  "This report retries HEAD-failed public-document URLs with GET and records response metadata only. It does not copy page text or grant reuse rights.",
  "",
  `- Checked: ${report.checked}`,
  `- GET reachable: ${report.getReachable}`,
  `- Still needs manual review: ${report.stillNeedsManualReview}`,
  `- Reachable rate: ${report.reachableRate}`,
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
  "## First GET-Reachable Items",
  "",
  ...reachable.slice(0, 20).map((item) => `- ${item.getStatus} ${item.name}: ${item.url} (${item.note})`),
  "",
  "## First Still-Manual Items",
  "",
  ...stillManual.slice(0, 20).map((item) => `- ${item.getStatus} ${item.name}: ${item.url} (${item.note})`),
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  productionReady: false,
  educationOnly: true,
  checked: report.checked,
  getReachable: report.getReachable,
  stillNeedsManualReview: report.stillNeedsManualReview,
  reachableRate: report.reachableRate,
  outputJson,
  outputMd,
}, null, 2));
