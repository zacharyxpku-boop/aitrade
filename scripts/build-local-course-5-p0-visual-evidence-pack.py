import json
import sys
import zipfile
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

try:
    import fitz
except Exception as error:  # pragma: no cover - reported in artifact
    fitz = None
    FITZ_IMPORT_ERROR = str(error)
else:
    FITZ_IMPORT_ERROR = None

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


WORK_PACKS_JSON = Path("docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json")
OUTPUT_JSON = Path("docs/LOCAL_COURSE_5_P0_VISUAL_EVIDENCE_PACK.json")
OUTPUT_MD = Path("docs/LOCAL_COURSE_5_P0_VISUAL_EVIDENCE_PACK.md")
SAMPLE_DIR = Path("docs/local-course-5-p0-visual-evidence")
PDF_SAMPLES_PER_SOURCE = 9
ZIP_SAMPLES_PER_SOURCE = 24
PDF_RENDER_ZOOM = 0.8

BOUNDARY = (
    "Course 5 P0 visual evidence pack is private reviewer-facing education research only. "
    "It deepens representative visual evidence for P0 blocker sources so reviewers can later "
    "distill paraphrased teaching modules. It is not exhaustive OCR, not learner-facing, not "
    "publication-cleared, and cannot be used as stock recommendations, live signals, return "
    "promises, broker workflows, automation, real-money guidance, write authorization, learner "
    "release, or production readiness."
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
    anchors = [
        0,
        max(0, count // 20),
        count // 8,
        count // 4,
        count // 2,
        (count * 3) // 4,
        (count * 7) // 8,
        min(count - 1, (count * 19) // 20),
        count - 1,
    ]
    out = []
    for index in anchors:
        if 0 <= index < count and index not in out:
            out.append(index)
    cursor = 0
    step = max(1, count // limit)
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
            "width": None,
            "height": None,
        }
    image = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        return {
            "analysisStatus": "failed_image_read",
            "edgeDensity": None,
            "darkPixelRatio": None,
            "visualDensity": None,
            "width": None,
            "height": None,
        }
    height, width = image.shape[:2]
    if width > 900:
        small = cv2.resize(image, (900, max(1, int(height * 900 / width))))
    else:
        small = image
    edges = cv2.Canny(small, 80, 160)
    edge_density = float(np.count_nonzero(edges)) / float(edges.size)
    dark_ratio = float(np.count_nonzero(small < 90)) / float(small.size)
    return {
        "analysisStatus": "visual_metrics_ready",
        "edgeDensity": round(edge_density, 5),
        "darkPixelRatio": round(dark_ratio, 5),
        "visualDensity": round(min(1.0, edge_density * 2.2 + dark_ratio * 0.8), 5),
        "width": int(width),
        "height": int(height),
    }


def render_pdf_samples(item):
    if fitz is None:
        return [], f"blocked_missing_pymupdf: {FITZ_IMPORT_ERROR}"
    source = Path(item["sourceLocalPath"])
    if not source.exists():
        return [], "blocked_source_file_missing"
    record_dir = SAMPLE_DIR / item["recordId"]
    record_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(source)
    samples = []
    try:
        for page_index in sample_indexes(doc.page_count, PDF_SAMPLES_PER_SOURCE):
            output = record_dir / f"page-{page_index + 1:05d}.png"
            if not output.exists():
                page = doc.load_page(page_index)
                pixmap = page.get_pixmap(matrix=fitz.Matrix(PDF_RENDER_ZOOM, PDF_RENDER_ZOOM), alpha=False)
                pixmap.save(output)
            metrics = analyze_image(output)
            samples.append({
                "sampleId": f"course5_p0_pdf_{item['recordId']}_{page_index + 1:05d}",
                "recordId": item["recordId"],
                "sampleKind": "pdf_page",
                "pageNumber": page_index + 1,
                "sampleImagePath": str(output).replace("\\", "/"),
                "reviewStatus": "needs_chart_semantic_review_or_ocr",
                "learnerFacingRelease": False,
                "approvalStatus": "not_approved",
                "productionReady": False,
                "writeAllowedNow": False,
                **metrics,
            })
    finally:
        doc.close()
    return samples, "p0_pdf_visual_samples_ready" if samples else "blocked_no_pdf_pages"


def normalize_zip_image(data, output):
    if Image is None:
        output.write_bytes(data)
        return {"sourceImageWidth": None, "sourceImageHeight": None, "sourceImageFormat": "unknown"}
    try:
        with Image.open(BytesIO(data)) as image:
            source_meta = {
                "sourceImageWidth": image.width,
                "sourceImageHeight": image.height,
                "sourceImageFormat": image.format,
            }
            rgb = image.convert("RGB")
            rgb.thumbnail((1600, 1600))
            output.parent.mkdir(parents=True, exist_ok=True)
            rgb.save(output, "PNG", optimize=True)
            return source_meta
    except Exception:
        return None


def render_zip_samples(item):
    source = Path(item["sourceLocalPath"])
    if not source.exists():
        return [], "blocked_source_file_missing"
    record_dir = SAMPLE_DIR / item["recordId"]
    record_dir.mkdir(parents=True, exist_ok=True)
    samples = []
    invalid = 0
    with zipfile.ZipFile(source) as archive:
        image_infos = [info for info in archive.infolist() if not info.is_dir() and is_image(info.filename)]
        for image_index in sample_indexes(len(image_infos), ZIP_SAMPLES_PER_SOURCE):
            info = image_infos[image_index]
            output = record_dir / f"zip-sample-{len(samples) + 1:02d}.png"
            source_meta = {}
            if not output.exists():
                meta = normalize_zip_image(archive.read(info), output)
                if meta is None:
                    invalid += 1
                    continue
                source_meta = meta
            metrics = analyze_image(output)
            samples.append({
                "sampleId": f"course5_p0_zip_{item['recordId']}_{len(samples) + 1:02d}",
                "recordId": item["recordId"],
                "sampleKind": "zip_image",
                "archiveImageIndex": image_index,
                "archiveImageName": info.filename,
                "archiveImageBytes": info.file_size,
                "sampleImagePath": str(output).replace("\\", "/"),
                "reviewStatus": "needs_chart_semantic_review",
                "learnerFacingRelease": False,
                "approvalStatus": "not_approved",
                "productionReady": False,
                "writeAllowedNow": False,
                **source_meta,
                **metrics,
            })
    status = "p0_zip_visual_samples_ready" if samples else "blocked_no_zip_images"
    if invalid:
        status = f"{status}_invalid_candidates_skipped_{invalid}"
    return samples, status


def main():
    work_packs = read_json(WORK_PACKS_JSON)
    if work_packs.get("educationOnly") is not True:
        fail("work packs must keep educationOnly:true")
    if work_packs.get("productionReady") is not False:
        fail("work packs must keep productionReady:false")
    if work_packs.get("learnerFacingRelease") is not False:
        fail("work packs must keep learnerFacingRelease:false")
    if work_packs.get("writeAllowedNow") is not False:
        fail("work packs must keep writeAllowedNow:false")

    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    p0_items = [item for item in work_packs.get("workItems", []) if str(item.get("priority", "")).startswith("P0")]
    source_rows = []
    sample_rows = []
    for item in p0_items:
        if item.get("extension") == ".pdf":
            samples, status = render_pdf_samples(item)
        elif item.get("extension") == ".zip":
            samples, status = render_zip_samples(item)
        else:
            samples, status = [], "blocked_unsupported_p0_source_type"
        source_row = {
            "recordId": item["recordId"],
            "relativePath": item["relativePath"],
            "sourceLocalPath": item["sourceLocalPath"],
            "extension": item["extension"],
            "priority": item.get("priority"),
            "moduleTags": item.get("moduleTags", []),
            "courseAlignment": item.get("courseAlignment", []),
            "pageCount": item.get("pageCount"),
            "imageEntryCount": item.get("imageEntryCount", 0),
            "sampleCount": len(samples),
            "sampleStatus": status,
            "samples": samples,
            "reviewStatus": "p0_visual_evidence_ready_needs_reviewer_semantics",
            "learnerFacingRelease": False,
            "approvalStatus": "not_approved",
            "productionReady": False,
            "writeAllowedNow": False,
        }
        source_rows.append(source_row)
        sample_rows.extend(samples)
        print(json.dumps({
            "recordId": item["recordId"],
            "extension": item["extension"],
            "priority": item.get("priority"),
            "sampleStatus": status,
            "sampleCount": len(samples),
        }, ensure_ascii=False), flush=True)

    pdf_rows = [row for row in source_rows if row["extension"] == ".pdf"]
    zip_rows = [row for row in source_rows if row["extension"] == ".zip"]
    artifact = {
        "generatedAt": now_iso(),
        "educationOnly": True,
        "productionReady": False,
        "learnerFacingRelease": False,
        "approvalStatus": "not_approved",
        "writeAllowedNow": False,
        "sourceWorkPacks": str(WORK_PACKS_JSON).replace("\\", "/"),
        "evidenceStatus": "course_5_p0_visual_evidence_deepened_release_blocked",
        "p0SourceRows": len(source_rows),
        "p0PdfRows": len(pdf_rows),
        "p0ZipRows": len(zip_rows),
        "pdfSamplesPerSourceLimit": PDF_SAMPLES_PER_SOURCE,
        "zipSamplesPerSourceLimit": ZIP_SAMPLES_PER_SOURCE,
        "sampleRows": len(sample_rows),
        "pdfSampleRows": sum(row["sampleCount"] for row in pdf_rows),
        "zipSampleRows": sum(row["sampleCount"] for row in zip_rows),
        "cvMetricsAvailable": cv2 is not None and np is not None,
        "ocrEngineAvailable": False,
        "sourceRows": source_rows,
        "sampleRowsDetail": sample_rows,
        "commands": [
            "npm.cmd run build:local-course-5-p0-visual-evidence-pack",
            "npm.cmd run check:local-course-5-p0-visual-evidence-pack",
            "npm.cmd run verify",
        ],
        "completionRule": (
            "Course 5 P0 visual evidence is deepened when every P0 follow-up source has bounded, "
            "stratified visual samples with local image files, visual metrics, module tags, and release-blocked "
            "review status. Deletion still remains blocked until OCR/manual review and teaching-module distillation are complete."
        ),
        "boundary": BOUNDARY,
    }

    write_json(OUTPUT_JSON, artifact)
    write_md(OUTPUT_MD, [
        "# Course 5 P0 Visual Evidence Pack",
        "",
        f"- Evidence status: {artifact['evidenceStatus']}",
        f"- P0 source rows: {artifact['p0SourceRows']}",
        f"- P0 PDF rows: {artifact['p0PdfRows']}",
        f"- P0 ZIP rows: {artifact['p0ZipRows']}",
        f"- Sample rows: {artifact['sampleRows']}",
        f"- PDF sample rows: {artifact['pdfSampleRows']}",
        f"- ZIP sample rows: {artifact['zipSampleRows']}",
        f"- CV metrics available: {artifact['cvMetricsAvailable']}",
        f"- OCR engine available: {artifact['ocrEngineAvailable']}",
        f"- Write allowed now: {artifact['writeAllowedNow']}",
        "",
        "## Source Rows",
        "",
        "| Source | Priority | Type | Pages | Images | Samples | Status |",
        "| --- | --- | --- | ---: | ---: | ---: | --- |",
        *[
            f"| {row['relativePath']} | {row['priority']} | {row['extension']} | {row.get('pageCount') or ''} | {row.get('imageEntryCount') or 0} | {row['sampleCount']} | {row['sampleStatus']} |"
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
        "evidenceStatus": artifact["evidenceStatus"],
        "p0SourceRows": artifact["p0SourceRows"],
        "p0PdfRows": artifact["p0PdfRows"],
        "p0ZipRows": artifact["p0ZipRows"],
        "sampleRows": artifact["sampleRows"],
        "pdfSampleRows": artifact["pdfSampleRows"],
        "zipSampleRows": artifact["zipSampleRows"],
        "cvMetricsAvailable": artifact["cvMetricsAvailable"],
        "ocrEngineAvailable": artifact["ocrEngineAvailable"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
