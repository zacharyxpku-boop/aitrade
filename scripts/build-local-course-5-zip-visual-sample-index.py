import json
import shutil
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

try:
    from PIL import Image
except Exception as error:  # pragma: no cover - reported in artifact
    Image = None
    PIL_IMPORT_ERROR = str(error)
else:
    PIL_IMPORT_ERROR = None

try:
    import cv2
    import numpy as np
except Exception as error:  # pragma: no cover - reported in artifact
    cv2 = None
    np = None
    CV_IMPORT_ERROR = str(error)
else:
    CV_IMPORT_ERROR = None


INTAKE_JSON = Path("docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json")
CONTAINER_JSON = Path("docs/LOCAL_COURSE_5_CONTAINER_INDEX.json")
WORK_PACKS_JSON = Path("docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json")
OUTPUT_JSON = Path("docs/LOCAL_COURSE_5_ZIP_VISUAL_SAMPLE_INDEX.json")
OUTPUT_MD = Path("docs/LOCAL_COURSE_5_ZIP_VISUAL_SAMPLE_INDEX.md")
SAMPLE_DIR = Path("docs/local-course-5-zip-visual-samples")
SAMPLES_PER_ZIP = 12

BOUNDARY = (
    "Course 5 ZIP visual sample index is private reviewer-facing education research only. "
    "It extracts bounded representative image samples from local ZIP packages for visual review. "
    "It is not exhaustive extraction, not OCR-complete, not learner-facing, not publication-cleared, "
    "and cannot be used as stock recommendations, live signals, return promises, broker workflows, "
    "automation, real-money guidance, write authorization, learner release, or production readiness."
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


def is_image(name):
    return Path(name).suffix.lower() in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tif", ".tiff"}


def sample_indexes(count, limit):
    if count <= 0:
        return []
    if count <= limit:
        return list(range(count))
    anchors = [0, 1, 2, count // 4, count // 3, count // 2, (count * 2) // 3, (count * 3) // 4, count - 3, count - 2, count - 1]
    out = []
    for index in anchors:
        if 0 <= index < count and index not in out:
            out.append(index)
    step = max(1, count // limit)
    cursor = 0
    while len(out) < limit and cursor < count:
        if cursor not in out:
            out.append(cursor)
        cursor += step
    return sorted(out[:limit])


def analyze_image(path):
    if cv2 is None or np is None:
        return {
            "analysisStatus": f"blocked_missing_cv2_or_numpy: {CV_IMPORT_ERROR}",
            "edgeDensity": None,
            "darkPixelRatio": None,
            "visualDensity": None,
        }
    image = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        return {
            "analysisStatus": "failed_image_read",
            "edgeDensity": None,
            "darkPixelRatio": None,
            "visualDensity": None,
        }
    height, width = image.shape[:2]
    scale_width = min(width, 900)
    small = cv2.resize(image, (scale_width, max(1, int(height * scale_width / width)))) if width > 900 else image
    edges = cv2.Canny(small, 80, 160)
    edge_density = float(np.count_nonzero(edges)) / float(edges.size)
    dark_ratio = float(np.count_nonzero(small < 90)) / float(small.size)
    return {
        "analysisStatus": "visual_metrics_ready",
        "edgeDensity": round(edge_density, 5),
        "darkPixelRatio": round(dark_ratio, 5),
        "visualDensity": round(min(1.0, edge_density * 2.2 + dark_ratio * 0.8), 5),
    }


def normalize_image(source_bytes, output_path):
    if Image is None:
        output_path.write_bytes(source_bytes)
        return {"width": None, "height": None, "format": "unknown", "mode": "unknown"}
    from io import BytesIO
    try:
        with Image.open(BytesIO(source_bytes)) as image:
            rgb = image.convert("RGB")
            rgb.thumbnail((1600, 1600))
            output_path.parent.mkdir(parents=True, exist_ok=True)
            rgb.save(output_path, "PNG", optimize=True)
            return {
                "width": image.width,
                "height": image.height,
                "format": image.format,
                "mode": image.mode,
            }
    except Exception:
        return None


def main():
    intake = read_json(INTAKE_JSON)
    container = read_json(CONTAINER_JSON)
    work_packs = read_json(WORK_PACKS_JSON)
    for name, artifact in {"intake": intake, "container": container, "work_packs": work_packs}.items():
        if artifact.get("educationOnly") is not True:
            fail(f"{name} must keep educationOnly:true")
        if artifact.get("productionReady") is not False:
            fail(f"{name} must keep productionReady:false")

    intake_by_record = {row["recordId"]: row for row in intake.get("rows", [])}
    zip_rows = [row for row in container.get("rows", []) if row.get("extension") == ".zip" and row.get("imageEntryCount", 0) > 0]
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    source_rows = []
    sample_rows = []

    for row in zip_rows:
        intake_row = intake_by_record.get(row["recordId"])
        if not intake_row:
            fail(f"missing intake row for {row['recordId']}")
        source_path = Path(intake_row["sourceLocalPath"])
        if not source_path.exists():
            fail(f"missing source zip: {source_path}")
        with zipfile.ZipFile(source_path) as archive:
            image_infos = [info for info in archive.infolist() if not info.is_dir() and is_image(info.filename)]
            samples = []
            preferred = sample_indexes(len(image_infos), SAMPLES_PER_ZIP)
            fallback = [index for index in range(len(image_infos)) if index not in preferred]
            candidate_indexes = preferred + fallback
            invalid_images = []
            for image_index in candidate_indexes:
                if len(samples) >= SAMPLES_PER_ZIP:
                    break
                info = image_infos[image_index]
                sample_number = len(samples) + 1
                output = SAMPLE_DIR / row["recordId"] / f"sample-{sample_number:02d}.png"
                if not output.exists():
                    data = archive.read(info)
                    image_meta = normalize_image(data, output)
                    if image_meta is None:
                        invalid_images.append(info.filename)
                        continue
                else:
                    image_meta = {}
                    if Image is not None:
                        try:
                            with Image.open(output) as image:
                                image_meta = {"width": image.width, "height": image.height, "format": image.format, "mode": image.mode}
                        except Exception:
                            image_meta = {}
                metrics = analyze_image(output)
                sample = {
                    "zipSampleId": f"course5_zip_sample_{row['recordId']}_{sample_number:02d}",
                    "recordId": row["recordId"],
                    "relativePath": row["relativePath"],
                    "archiveImageIndex": image_index,
                    "archiveImageName": info.filename,
                    "archiveImageBytes": info.file_size,
                    "sampleImagePath": str(output).replace("\\", "/"),
                    "moduleTags": row.get("moduleTags", []),
                    "courseAlignment": row.get("courseAlignment", []),
                    "reviewStatus": "needs_visual_reviewer_interpretation_or_ocr",
                    "learnerFacingRelease": False,
                    "approvalStatus": "not_approved",
                    "productionReady": False,
                    "writeAllowedNow": False,
                    **image_meta,
                    **metrics,
                }
                samples.append(sample)
                sample_rows.append(sample)
        source_rows.append({
            "recordId": row["recordId"],
            "relativePath": row["relativePath"],
            "sourceLocalPath": intake_row["sourceLocalPath"],
            "sizeMb": row.get("sizeMb"),
            "entryCount": row.get("entryCount", 0),
            "imageEntryCount": row.get("imageEntryCount", 0),
            "sampleCount": len(samples),
            "moduleTags": row.get("moduleTags", []),
            "courseAlignment": row.get("courseAlignment", []),
            "sampleRows": samples,
            "invalidImageCandidatesSkipped": invalid_images[:20],
            "reviewStatus": "zip_representative_visual_samples_ready_review_required",
            "learnerFacingRelease": False,
            "approvalStatus": "not_approved",
            "productionReady": False,
            "writeAllowedNow": False,
        })
        print(json.dumps({
            "relativePath": row["relativePath"],
            "imageEntryCount": row.get("imageEntryCount", 0),
            "sampleCount": len(samples),
        }, ensure_ascii=False), flush=True)

    artifact = {
        "generatedAt": now_iso(),
        "educationOnly": True,
        "productionReady": False,
        "learnerFacingRelease": False,
        "approvalStatus": "not_approved",
        "writeAllowedNow": False,
        "sourceContainerIndex": str(CONTAINER_JSON).replace("\\", "/"),
        "sourceWorkPacks": str(WORK_PACKS_JSON).replace("\\", "/"),
        "zipSampleStatus": "course_5_zip_visual_samples_ready_release_blocked",
        "zipRows": len(source_rows),
        "totalImageEntries": sum(row["imageEntryCount"] for row in source_rows),
        "sampleRows": len(sample_rows),
        "samplesPerZipLimit": SAMPLES_PER_ZIP,
        "ocrEngineAvailable": shutil.which("tesseract") is not None,
        "cvMetricsAvailable": cv2 is not None and np is not None,
        "rows": source_rows,
        "sampleRowsDetail": sample_rows,
        "commands": [
            "npm.cmd run build:local-course-5-zip-visual-sample-index",
            "npm.cmd run check:local-course-5-zip-visual-sample-index",
            "npm.cmd run verify",
        ],
        "completionRule": "ZIP image packages become review-ready when every ZIP with image entries has bounded representative samples, local sample image files, visual metrics, module tags, and release-blocked reviewer status. This is still not exhaustive extraction, OCR completion, or learner-facing approval.",
        "boundary": BOUNDARY,
    }
    write_json(OUTPUT_JSON, artifact)
    write_md(OUTPUT_MD, [
        "# Local Course 5 ZIP Visual Sample Index",
        "",
        f"- ZIP sample status: {artifact['zipSampleStatus']}",
        f"- ZIP rows: {artifact['zipRows']}",
        f"- Total image entries: {artifact['totalImageEntries']}",
        f"- Sample rows: {artifact['sampleRows']}",
        f"- Samples per ZIP limit: {artifact['samplesPerZipLimit']}",
        f"- OCR engine available: {artifact['ocrEngineAvailable']}",
        f"- Write allowed now: {artifact['writeAllowedNow']}",
        "",
        "## ZIP Rows",
        "",
        "| ZIP | Images | Samples | Modules |",
        "|---|---:|---:|---|",
        *[
            f"| {row['relativePath']} | {row['imageEntryCount']} | {row['sampleCount']} | {', '.join(row['moduleTags'])} |"
            for row in source_rows
        ],
        "",
        "## Boundary",
        "",
        BOUNDARY,
        "",
    ])
    print(json.dumps({
        "ok": True,
        "educationOnly": artifact["educationOnly"],
        "productionReady": artifact["productionReady"],
        "learnerFacingRelease": artifact["learnerFacingRelease"],
        "approvalStatus": artifact["approvalStatus"],
        "writeAllowedNow": artifact["writeAllowedNow"],
        "zipSampleStatus": artifact["zipSampleStatus"],
        "zipRows": artifact["zipRows"],
        "totalImageEntries": artifact["totalImageEntries"],
        "sampleRows": artifact["sampleRows"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
