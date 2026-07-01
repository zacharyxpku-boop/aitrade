import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import cv2
    import numpy as np
except Exception as error:  # pragma: no cover - reported in artifact
    cv2 = None
    np = None
    CV_IMPORT_ERROR = str(error)
else:
    CV_IMPORT_ERROR = None


QUEUE_JSON = Path("docs/LOCAL_COURSE_5_VISUAL_REVIEW_QUEUE.json")
OUTPUT_JSON = Path("docs/LOCAL_COURSE_5_VISUAL_SEMANTIC_MAP.json")
OUTPUT_MD = Path("docs/LOCAL_COURSE_5_VISUAL_SEMANTIC_MAP.md")

BOUNDARY = (
    "Course 5 visual semantic map is private reviewer-facing education research only. "
    "It indexes representative chart/scan samples for review. It is not OCR-complete, "
    "not learner-facing, not publication-cleared, and cannot be used as stock "
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


def semantic_tags(row):
    text = f"{row.get('relativePath', '')} {' '.join(row.get('moduleTags', []))}".lower()
    tags = []
    rules = [
        ("chart_pattern_encyclopedia", ["百科", "encyclopedia", "chart pattern"]),
        ("course_slide_visual", ["课程ppt", "ppt", "基础1-36", "进阶37-52"]),
        ("trend_visual", ["trend", "趋势"]),
        ("range_visual", ["range", "区间"]),
        ("reversal_visual", ["reversal", "反转"]),
        ("bar_by_bar_visual", ["bar by bar", "逐根", "k线", "蜡烛"]),
        ("setup_visual", ["setup", "设置"]),
        ("glossary_visual", ["缩写", "术语", "glossary"]),
    ]
    for tag, needles in rules:
        if any(needle in text for needle in needles):
            tags.append(tag)
    return tags or ["unclassified_visual_review_sample"]


def analyze_image(image_path):
    if cv2 is None or np is None:
        return {
            "analysisStatus": f"blocked_missing_cv2_or_numpy: {CV_IMPORT_ERROR}",
            "width": None,
            "height": None,
            "edgeDensity": None,
            "darkPixelRatio": None,
            "visualDensity": None,
        }
    image = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        return {
            "analysisStatus": "failed_image_read",
            "width": None,
            "height": None,
            "edgeDensity": None,
            "darkPixelRatio": None,
            "visualDensity": None,
        }
    height, width = image.shape[:2]
    small = cv2.resize(image, (min(width, 900), max(1, int(height * min(width, 900) / width)))) if width > 900 else image
    edges = cv2.Canny(small, 80, 160)
    edge_density = float(np.count_nonzero(edges)) / float(edges.size)
    dark_ratio = float(np.count_nonzero(small < 90)) / float(small.size)
    visual_density = min(1.0, edge_density * 2.2 + dark_ratio * 0.8)
    return {
        "analysisStatus": "visual_metrics_ready",
        "width": int(width),
        "height": int(height),
        "edgeDensity": round(edge_density, 5),
        "darkPixelRatio": round(dark_ratio, 5),
        "visualDensity": round(visual_density, 5),
    }


def main():
    queue = read_json(QUEUE_JSON)
    if queue.get("educationOnly") is not True:
        fail("visual queue must keep educationOnly:true")
    if queue.get("productionReady") is not False:
        fail("visual queue must keep productionReady:false")

    tesseract_available = shutil.which("tesseract") is not None
    sample_rows = []
    source_rows = []
    for row in queue.get("rows", []):
        tags = semantic_tags(row)
        samples = []
        for sample in row.get("samples", []):
            image_path = Path(sample["imagePath"])
            metrics = analyze_image(image_path)
            sample_row = {
                "visualSampleId": f"{row['visualReviewId']}_page_{sample['pageNumber']}",
                "visualReviewId": row["visualReviewId"],
                "recordId": row["recordId"],
                "relativePath": row["relativePath"],
                "pageNumber": sample["pageNumber"],
                "imagePath": sample["imagePath"],
                "semanticTags": tags,
                "ocrStatus": "ocr_engine_missing_not_text_complete" if not tesseract_available else "ocr_engine_available_not_run",
                "chartSemanticStatus": "visual_metrics_ready_needs_reviewer_interpretation",
                "learnerFacingRelease": False,
                "approvalStatus": "not_approved",
                "productionReady": False,
                "writeAllowedNow": False,
                **metrics,
            }
            samples.append(sample_row)
            sample_rows.append(sample_row)
        source_rows.append({
            "visualReviewId": row["visualReviewId"],
            "recordId": row["recordId"],
            "relativePath": row["relativePath"],
            "pageCount": row.get("pageCount"),
            "sampleCount": len(samples),
            "semanticTags": tags,
            "moduleTags": row.get("moduleTags", []),
            "courseAlignment": row.get("courseAlignment", []),
            "ocrStatus": "ocr_engine_missing_not_text_complete" if not tesseract_available else "ocr_engine_available_not_run",
            "chartSemanticStatus": "visual_samples_metric_indexed_release_blocked",
            "sampleRows": samples,
            "learnerFacingRelease": False,
            "approvalStatus": "not_approved",
            "productionReady": False,
            "writeAllowedNow": False,
        })

    analyzed_samples = [row for row in sample_rows if row["analysisStatus"] == "visual_metrics_ready"]
    high_density_samples = [row for row in analyzed_samples if (row.get("visualDensity") or 0) >= 0.12]
    tag_counts = {}
    for row in source_rows:
        for tag in row["semanticTags"]:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    artifact = {
        "generatedAt": now_iso(),
        "educationOnly": True,
        "productionReady": False,
        "learnerFacingRelease": False,
        "approvalStatus": "not_approved",
        "writeAllowedNow": False,
        "sourceVisualQueue": str(QUEUE_JSON).replace("\\", "/"),
        "visualSemanticStatus": (
            "course_5_visual_semantic_samples_indexed_ocr_missing_release_blocked"
            if not tesseract_available
            else "course_5_visual_semantic_samples_indexed_ocr_available_not_run_release_blocked"
        ),
        "ocrEngineAvailable": tesseract_available,
        "cvMetricsAvailable": cv2 is not None and np is not None,
        "sourceRows": len(source_rows),
        "sampleRows": len(sample_rows),
        "analyzedSampleRows": len(analyzed_samples),
        "highDensitySampleRows": len(high_density_samples),
        "semanticTagCounts": dict(sorted(tag_counts.items(), key=lambda item: (-item[1], item[0]))),
        "rows": source_rows,
        "sampleRowsDetail": sample_rows,
        "commands": [
            "npm.cmd run build:local-course-5-visual-semantic-map",
            "npm.cmd run check:local-course-5-visual-semantic-map",
            "npm.cmd run verify",
        ],
        "completionRule": (
            "Visual samples are considered semantically indexed when every queue sample has a metrics row, semantic tags, "
            "and OCR availability status. They are not fully absorbed into teachable modules until OCR or reviewer visual "
            "interpretation converts the charts into paraphrased concepts with public grounding."
        ),
        "boundary": BOUNDARY,
    }
    write_json(OUTPUT_JSON, artifact)
    write_md(OUTPUT_MD, [
        "# Local Course 5 Visual Semantic Map",
        "",
        f"- Visual semantic status: {artifact['visualSemanticStatus']}",
        f"- Source rows: {artifact['sourceRows']}",
        f"- Sample rows: {artifact['sampleRows']}",
        f"- Analyzed sample rows: {artifact['analyzedSampleRows']}",
        f"- High-density sample rows: {artifact['highDensitySampleRows']}",
        f"- OCR engine available: {artifact['ocrEngineAvailable']}",
        f"- Write allowed now: {artifact['writeAllowedNow']}",
        "",
        "## Semantic Tag Counts",
        "",
        *[f"- {tag}: {count}" for tag, count in artifact["semanticTagCounts"].items()],
        "",
        "## Boundary",
        "",
        BOUNDARY,
    ])
    print(json.dumps({
        "ok": True,
        "educationOnly": artifact["educationOnly"],
        "productionReady": artifact["productionReady"],
        "learnerFacingRelease": artifact["learnerFacingRelease"],
        "approvalStatus": artifact["approvalStatus"],
        "writeAllowedNow": artifact["writeAllowedNow"],
        "visualSemanticStatus": artifact["visualSemanticStatus"],
        "ocrEngineAvailable": artifact["ocrEngineAvailable"],
        "sourceRows": artifact["sourceRows"],
        "sampleRows": artifact["sampleRows"],
        "analyzedSampleRows": artifact["analyzedSampleRows"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
