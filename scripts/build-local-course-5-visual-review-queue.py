import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import fitz
except Exception as error:  # pragma: no cover - reported in artifact
    fitz = None
    FITZ_IMPORT_ERROR = str(error)
else:
    FITZ_IMPORT_ERROR = None


INTAKE_JSON = Path("docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json")
OUTPUT_JSON = Path("docs/LOCAL_COURSE_5_VISUAL_REVIEW_QUEUE.json")
OUTPUT_MD = Path("docs/LOCAL_COURSE_5_VISUAL_REVIEW_QUEUE.md")
IMAGE_DIR = Path("docs/local-course-5-visual-samples")
MAX_ROWS = int(os.environ.get("LOCAL_COURSE_5_VISUAL_MAX_ROWS", "0") or "0")
MAX_SAMPLES_PER_PDF = int(os.environ.get("LOCAL_COURSE_5_VISUAL_SAMPLES_PER_PDF", "3") or "3")
RENDER_ZOOM = float(os.environ.get("LOCAL_COURSE_5_VISUAL_ZOOM", "0.8") or "0.8")

BOUNDARY = (
    "Course 5 visual review samples are private reviewer-facing education research only. "
    "They are not learner-facing, not publication-cleared, and cannot be used as stock "
    "recommendations, live signals, return promises, broker workflows, automation, "
    "real-money guidance, write authorization, learner release, or production readiness."
)


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def fail(message):
    raise RuntimeError(message)


def read_json(path):
    if not path.exists():
        fail(f"missing {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_md(path, lines):
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def sample_page_indexes(page_count):
    if page_count <= 0:
        return []
    candidates = [0, page_count // 2, page_count - 1]
    if MAX_SAMPLES_PER_PDF >= 5 and page_count >= 5:
        candidates.extend([page_count // 4, (page_count * 3) // 4])
    ordered = []
    for index in candidates:
        if 0 <= index < page_count and index not in ordered:
            ordered.append(index)
    return ordered[:MAX_SAMPLES_PER_PDF]


def needs_visual_review(row):
    if row.get("duplicateOf"):
        return False
    if row.get("extension") != ".pdf":
        return False
    bucket = row.get("extractionBucket", "")
    extraction = row.get("textExtraction", "")
    char_count = int(row.get("charCount") or 0)
    return (
        "visual" in bucket
        or "no_text" in bucket
        or "large_file_deferred" in bucket
        or "failed" in bucket
        or extraction == "skipped_by_size_policy"
        or char_count < 500
    )


def render_samples(row):
    if fitz is None:
        return {
            "status": f"blocked_missing_pymupdf: {FITZ_IMPORT_ERROR}",
            "pageCount": None,
            "samples": [],
            "error": FITZ_IMPORT_ERROR,
        }
    source = Path(row["sourceLocalPath"])
    if not source.exists():
        return {
            "status": "blocked_source_file_missing",
            "pageCount": None,
            "samples": [],
            "error": str(source),
        }
    record_dir = IMAGE_DIR / row["recordId"]
    record_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(source)
    samples = []
    try:
        page_count = doc.page_count
        for page_index in sample_page_indexes(page_count):
            output = record_dir / f"page-{page_index + 1:04d}.png"
            if not output.exists():
                page = doc.load_page(page_index)
                pixmap = page.get_pixmap(matrix=fitz.Matrix(RENDER_ZOOM, RENDER_ZOOM), alpha=False)
                pixmap.save(output)
            samples.append({
                "pageNumber": page_index + 1,
                "imagePath": str(output).replace("\\", "/"),
            })
    finally:
        doc.close()
    return {
        "status": "visual_samples_ready" if samples else "blocked_no_pages",
        "pageCount": page_count,
        "samples": samples,
        "error": None,
    }


def main():
    intake = read_json(INTAKE_JSON)
    if intake.get("educationOnly") is not True:
        fail("intake must keep educationOnly:true")
    if intake.get("productionReady") is not False:
        fail("intake must keep productionReady:false")
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    target_rows = [row for row in intake.get("rows", []) if needs_visual_review(row)]
    if MAX_ROWS:
        target_rows = target_rows[:MAX_ROWS]

    queue_rows = []
    for row in target_rows:
        visual = render_samples(row)
        queue_row = {
            "visualReviewId": f"course5_visual_{row['recordId']}",
            "recordId": row["recordId"],
            "relativePath": row["relativePath"],
            "sourceLocalPath": row["sourceLocalPath"],
            "sizeMb": row.get("sizeMb"),
            "charCount": row.get("charCount", 0),
            "textExtraction": row.get("textExtraction"),
            "extractionBucket": row.get("extractionBucket"),
            "moduleTags": row.get("moduleTags", []),
            "courseAlignment": row.get("courseAlignment", []),
            "pageCount": visual["pageCount"],
            "sampleCount": len(visual["samples"]),
            "samples": visual["samples"],
            "visualReviewStatus": visual["status"],
            "reviewStatus": "needs_visual_ocr_or_chart_semantic_review",
            "learnerFacingRelease": False,
            "approvalStatus": "not_approved",
            "productionReady": False,
            "writeAllowedNow": False,
            "error": visual["error"],
        }
        queue_rows.append(queue_row)
        print(json.dumps({
            "relativePath": row["relativePath"],
            "visualReviewStatus": queue_row["visualReviewStatus"],
            "pageCount": queue_row["pageCount"],
            "sampleCount": queue_row["sampleCount"],
        }, ensure_ascii=False), flush=True)

    status_counts = {}
    for row in queue_rows:
        status_counts[row["visualReviewStatus"]] = status_counts.get(row["visualReviewStatus"], 0) + 1

    artifact = {
        "generatedAt": now_iso(),
        "educationOnly": True,
        "productionReady": False,
        "learnerFacingRelease": False,
        "approvalStatus": "not_approved",
        "writeAllowedNow": False,
        "sourceIntake": str(INTAKE_JSON).replace("\\", "/"),
        "queueStatus": (
            "course_5_visual_review_queue_samples_ready_release_blocked"
            if queue_rows and all(row["sampleCount"] > 0 for row in queue_rows)
            else "course_5_visual_review_queue_attention_required"
        ),
        "targetRows": len(target_rows),
        "queueRows": len(queue_rows),
        "sampleImageRows": sum(row["sampleCount"] for row in queue_rows),
        "statusCounts": status_counts,
        "rows": queue_rows,
        "commands": [
            "npm.cmd run build:local-course-5-visual-review-queue",
            "npm.cmd run check:local-course-5-visual-review-queue",
            "npm.cmd run verify",
        ],
        "completionRule": (
            "Course 5 visual material is considered indexed for review when every low-text or deferred PDF has representative "
            "page samples and a queue row. This still does not equal OCR-complete, learner-facing, publication-cleared, or "
            "human-approved teaching content."
        ),
        "boundary": BOUNDARY,
    }
    write_json(OUTPUT_JSON, artifact)
    write_md(OUTPUT_MD, [
        "# Local Course 5 Visual Review Queue",
        "",
        f"- Queue status: {artifact['queueStatus']}",
        f"- Queue rows: {artifact['queueRows']}",
        f"- Sample image rows: {artifact['sampleImageRows']}",
        f"- Write allowed now: {artifact['writeAllowedNow']}",
        "",
        "## Status Counts",
        "",
        *[f"- {status}: {count}" for status, count in status_counts.items()],
        "",
        "## Largest Follow-up Rows",
        "",
        *[
            f"- {row['relativePath']}: {row['pageCount']} pages, {row['sampleCount']} samples, {row['sizeMb']} MB"
            for row in sorted(queue_rows, key=lambda item: -(item.get("sizeMb") or 0))[:30]
        ],
        "",
        "## Boundary",
        "",
        BOUNDARY,
    ])
    print(json.dumps({
        "ok": True,
        "educationOnly": True,
        "productionReady": False,
        "learnerFacingRelease": False,
        "approvalStatus": "not_approved",
        "writeAllowedNow": False,
        "queueStatus": artifact["queueStatus"],
        "queueRows": artifact["queueRows"],
        "sampleImageRows": artifact["sampleImageRows"],
        "outputJson": str(OUTPUT_JSON).replace("\\", "/"),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
