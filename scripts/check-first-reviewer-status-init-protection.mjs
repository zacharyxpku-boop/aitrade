import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const outputJson = "docs/LESSON_BATCH_REVIEW_STATUS_INIT_PROTECTION.json";
const outputMd = "docs/LESSON_BATCH_REVIEW_STATUS_INIT_PROTECTION.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";

function fail(message) {
  throw new Error(message);
}

function renderMarkdown(report) {
  return [
    "# Lesson Batch Review Status Init Protection",
    "",
    "This report verifies that write mode will not overwrite an existing reviewer status overlay unless force is explicit.",
    "It uses a temporary overlay path and does not touch docs/LESSON_BATCH_REVIEW_STATUS.json.",
    "",
    "## Summary",
    "",
    `- Protection cases: ${report.protectionCases}`,
    `- Passed cases: ${report.passedCases}`,
    `- Real status overlay touched: ${report.realStatusOverlayTouched}`,
    `- Existing temp overlay preserved: ${report.existingTempOverlayPreserved}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Cases",
    "",
    "| Case | Passed | Detail |",
    "| --- | --- | --- |",
    ...report.rows.map((row) => `| ${row.name} | ${row.passed} | ${row.detail.replaceAll("|", "/")} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const realStatusBefore = await fs.access(realStatusPath).then(() => true, () => false);
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "tradegym-status-init-"));
const tempStatusPath = path.join(tempRoot, "LESSON_BATCH_REVIEW_STATUS.json");
const tempDryRunJson = path.join(tempRoot, "dry-run.json");
const tempDryRunMd = path.join(tempRoot, "dry-run.md");
const sentinel = {
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  humanReviewerNotesMustSurvive: true,
  sentinel: "do-not-overwrite",
};
await fs.writeFile(tempStatusPath, `${JSON.stringify(sentinel, null, 2)}\n`, "utf8");
const sentinelBefore = await fs.readFile(tempStatusPath, "utf8");

const result = spawnSync(process.execPath, ["scripts/init-first-reviewer-status-overlay.mjs", "--write"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    TRADEGYM_STATUS_OVERLAY_PATH: tempStatusPath,
    TRADEGYM_STATUS_INIT_DRY_RUN_JSON: tempDryRunJson,
    TRADEGYM_STATUS_INIT_DRY_RUN_MD: tempDryRunMd,
  },
  encoding: "utf8",
});

const sentinelAfter = await fs.readFile(tempStatusPath, "utf8");
const realStatusAfter = await fs.access(realStatusPath).then(() => true, () => false);
const rejectedExistingOverlay = result.status !== 0 && /already exists/.test(`${result.stderr}\n${result.stdout}`);
const existingTempOverlayPreserved = sentinelAfter === sentinelBefore;
const realStatusOverlayTouched = realStatusBefore !== realStatusAfter || realStatusAfter === true;

const rows = [
  {
    name: "write_rejects_existing_overlay_without_force",
    passed: rejectedExistingOverlay,
    detail: rejectedExistingOverlay ? "write mode failed on existing temp overlay as expected" : `unexpected status ${result.status}`,
  },
  {
    name: "existing_overlay_content_preserved",
    passed: existingTempOverlayPreserved,
    detail: existingTempOverlayPreserved ? "sentinel content was unchanged" : "sentinel content changed",
  },
  {
    name: "real_status_overlay_not_touched",
    passed: !realStatusOverlayTouched,
    detail: !realStatusOverlayTouched ? "docs/LESSON_BATCH_REVIEW_STATUS.json remains absent" : "real status overlay exists or changed",
  },
];

const failedRows = rows.filter((row) => !row.passed);
if (failedRows.length) fail(`status init protection failed: ${failedRows.map((row) => row.name).join(", ")}`);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  protectionCases: rows.length,
  passedCases: rows.filter((row) => row.passed).length,
  realStatusOverlayTouched,
  existingTempOverlayPreserved,
  rows,
  boundary: "This protection test uses only temporary files to verify overwrite safety. It does not create, modify, approve, publish, or promote any real reviewer status overlay or lesson.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");
await fs.rm(tempRoot, { recursive: true, force: true });

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  protectionCases: report.protectionCases,
  passedCases: report.passedCases,
  realStatusOverlayTouched: report.realStatusOverlayTouched,
  existingTempOverlayPreserved: report.existingTempOverlayPreserved,
  outputJson,
  outputMd,
}, null, 2));
