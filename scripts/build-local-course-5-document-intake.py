import hashlib
import io
import json
import os
import re
import sys
import time
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

try:
    import fitz
except Exception as error:  # pragma: no cover - reported in artifact
    fitz = None
    FITZ_IMPORT_ERROR = str(error)
else:
    FITZ_IMPORT_ERROR = None

try:
    import openpyxl
except Exception as error:  # pragma: no cover - reported in artifact
    openpyxl = None
    OPENPYXL_IMPORT_ERROR = str(error)
else:
    OPENPYXL_IMPORT_ERROR = None

try:
    from bs4 import BeautifulSoup
except Exception as error:  # pragma: no cover - reported in artifact
    BeautifulSoup = None
    BS4_IMPORT_ERROR = str(error)
else:
    BS4_IMPORT_ERROR = None

try:
    from PIL import Image
except Exception as error:  # pragma: no cover - reported in artifact
    Image = None
    PIL_IMPORT_ERROR = str(error)
else:
    PIL_IMPORT_ERROR = None


ROOT = Path(os.environ.get("LOCAL_COURSE_5_ROOT", r"C:\Users\86136\Desktop\5"))
DOCS_DIR = Path("docs")
TEXT_DIR = DOCS_DIR / "local-course-5-extracted-text"
RECORD_DIR = DOCS_DIR / "local-course-5-document-records"
INVENTORY_JSON = DOCS_DIR / "LOCAL_COURSE_5_SOURCE_INVENTORY.json"
INVENTORY_MD = DOCS_DIR / "LOCAL_COURSE_5_SOURCE_INVENTORY.md"
INTAKE_JSON = DOCS_DIR / "LOCAL_COURSE_5_DOCUMENT_INTAKE.json"
INTAKE_MD = DOCS_DIR / "LOCAL_COURSE_5_DOCUMENT_INTAKE.md"
MAX_FILES = int(os.environ.get("LOCAL_COURSE_5_MAX_FILES", "0") or "0")
MAX_SECONDS = int(os.environ.get("LOCAL_COURSE_5_MAX_SECONDS", "0") or "0")
MAX_PDF_MB = int(os.environ.get("LOCAL_COURSE_5_MAX_PDF_MB", "0") or "0")
MAX_PDF_PAGES = int(os.environ.get("LOCAL_COURSE_5_MAX_PDF_PAGES", "0") or "0")
TEXT_PREVIEW_CHARS = 1600
SCHEMA_VERSION = "course5-document-intake-v4"


BOUNDARY = (
    "Course 5 local documents are private reviewer-facing education research only. "
    "They are not learner-facing, not publication-cleared, and cannot be used as "
    "stock recommendations, live signals, return promises, broker workflows, "
    "automation, real-money guidance, write authorization, learner release, or "
    "production readiness."
)

MODULE_RULES = [
    ("price_action_foundations", [r"price action", r"价格行为", r"PA基础", r"基础篇", r"how to trade price action"]),
    ("trends_and_channels", [r"trend", r"趋势", r"channel", r"通道"]),
    ("trading_ranges", [r"range", r"区间", r"震荡"]),
    ("reversals", [r"reversal", r"反转"]),
    ("breakouts_and_pullbacks", [r"breakout", r"突破", r"pullback", r"回调"]),
    ("bar_by_bar_reading", [r"bar by bar", r"逐根", r"K线", r"蜡烛图", r"candlestick"]),
    ("chart_pattern_encyclopedia", [r"encyclopedia", r"百科", r"8800", r"chart pattern", r"图表百科"]),
    ("trade_management", [r"scalp", r"swing", r"波段", r"setup", r"设置", r"entry", r"exit", r"进场", r"出场"]),
    ("risk_management", [r"risk", r"风险", r"stop", r"止损", r"position", r"仓位"]),
    ("psychology_and_discipline", [r"psychology", r"心理", r"discipline", r"纪律", r"mistake", r"错误"]),
    ("course_slides_alignment", [r"PPT", r"课程", r"1_阿布", r"2_阿布", r"3_阿布"]),
    ("terminology_glossary", [r"术语", r"缩写", r"glossary", r"翻译", r"解释"]),
]

COURSE_RULES = [
    ("course_1_foundations_1_36", [r"1-36", r"01-36", r"基础", r"foundations"]),
    ("course_2_advanced_37_52", [r"37-52", r"进阶", r"advanced"]),
    ("course_3_trading_ranges_reversals", [r"区间", r"反转", r"range", r"reversal"]),
    ("course_4_supplemental_cases", [r"百科", r"图表", r"案例", r"chart", r"pattern"]),
]

RISK_PATTERNS = [
    r"推荐买入",
    r"推荐卖出",
    r"保证收益",
    r"胜率承诺",
    r"实盘信号",
    r"自动下单",
    r"接入券商",
    r"真实资金建议",
]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def fail(message):
    raise RuntimeError(message)


def ensure_dirs():
    DOCS_DIR.mkdir(exist_ok=True)
    TEXT_DIR.mkdir(parents=True, exist_ok=True)
    RECORD_DIR.mkdir(parents=True, exist_ok=True)


def rel(path):
    return path.relative_to(ROOT).as_posix()


def safe_id(text):
    digest = hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()[:24]
    return f"course5_{digest}"


def sha256_file(path):
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def all_files():
    return sorted([path for path in ROOT.rglob("*") if path.is_file()], key=lambda item: rel(item).lower())


def classify_modules(text):
    haystack = text.lower()
    modules = []
    for module, patterns in MODULE_RULES:
        if any(re.search(pattern, haystack, re.IGNORECASE) for pattern in patterns):
            modules.append(module)
    return modules or ["unclassified_supplement"]


def align_courses(text):
    haystack = text.lower()
    courses = []
    for course, patterns in COURSE_RULES:
        if any(re.search(pattern, haystack, re.IGNORECASE) for pattern in patterns):
            courses.append(course)
    return courses or ["course_1_to_4_general_supplement"]


def risk_hits(text):
    return [pattern for pattern in RISK_PATTERNS if re.search(pattern, text, re.IGNORECASE)]


def text_stats(text):
    chinese_chars = len(re.findall(r"[\u4e00-\u9fff]", text))
    latin_words = len(re.findall(r"[A-Za-z][A-Za-z0-9_-]{2,}", text))
    return {
        "chars": len(text),
        "chineseChars": chinese_chars,
        "latinWords": latin_words,
        "lines": text.count("\n") + (1 if text else 0),
    }


def extraction_bucket(char_count, status):
    if status == "epub_text_extracted":
        if char_count >= 5000:
            return "usable_full_text_private_research"
        if char_count >= 500:
            return "thin_text_needs_reviewer_attention"
    if "container_inventory" in status or status.startswith("epub_container"):
        return "container_inventory_only_requires_unpack_or_semantic_review"
    if status.startswith("failed"):
        return "failed_requires_manual_or_tooling_review"
    if status == "skipped_by_size_policy":
        return "large_file_deferred_for_dedicated_visual_or_ocr_pass"
    if char_count >= 5000:
        return "usable_full_text_private_research"
    if char_count >= 500:
        return "thin_text_needs_reviewer_attention"
    if char_count > 0:
        return "very_low_text_likely_scanned_or_visual"
    return "no_text_extracted_likely_scanned_or_binary"


def extract_pdf(path, size_mb):
    if fitz is None:
        return "", {"status": f"failed_missing_pymupdf: {FITZ_IMPORT_ERROR}", "pageCount": None, "pagesRead": 0}
    if MAX_PDF_MB and size_mb > MAX_PDF_MB:
        return "", {"status": "skipped_by_size_policy", "pageCount": None, "pagesRead": 0}
    doc = fitz.open(path)
    parts = []
    page_count = doc.page_count
    pages_to_read = page_count if not MAX_PDF_PAGES else min(page_count, MAX_PDF_PAGES)
    try:
        for index in range(pages_to_read):
            page = doc.load_page(index)
            parts.append(page.get_text("text"))
    finally:
        doc.close()
    text = "\n".join(parts).replace("\x00", " ").strip()
    status = "full_text_extracted" if pages_to_read == page_count else "partial_text_extracted_by_page_policy"
    return text, {"status": status, "pageCount": page_count, "pagesRead": pages_to_read}


def extract_txt(path):
    for encoding in ("utf-8-sig", "utf-16", "gb18030"):
        try:
            return path.read_text(encoding=encoding, errors="strict"), {"status": "full_text_extracted", "encoding": encoding}
        except Exception:
            continue
    return path.read_text(encoding="utf-8", errors="ignore"), {"status": "partial_text_extracted_with_replacement", "encoding": "utf-8-ignore"}


def extract_xlsx(path):
    if openpyxl is None:
        return "", {"status": f"failed_missing_openpyxl: {OPENPYXL_IMPORT_ERROR}", "sheetCount": None}
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    parts = []
    sheet_rows = []
    try:
        for sheet in workbook.worksheets:
            rows_seen = 0
            non_empty = 0
            parts.append(f"# Sheet: {sheet.title}")
            for row in sheet.iter_rows(values_only=True):
                rows_seen += 1
                values = [str(value).strip() for value in row if value is not None and str(value).strip()]
                if values:
                    non_empty += 1
                    parts.append(" | ".join(values))
            sheet_rows.append({"sheet": sheet.title, "rowsSeen": rows_seen, "nonEmptyRows": non_empty})
    finally:
        workbook.close()
    return "\n".join(parts).strip(), {"status": "full_text_extracted", "sheetCount": len(sheet_rows), "sheetRows": sheet_rows}


def entry_kind(name):
    suffix = Path(name).suffix.lower()
    if suffix in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tif", ".tiff"}:
        return "image"
    if suffix in {".pdf"}:
        return "pdf"
    if suffix in {".html", ".htm", ".xhtml", ".xml"}:
        return "markup"
    if suffix in {".txt", ".md", ".csv"}:
        return "text"
    if suffix in {".xlsx", ".xls"}:
        return "spreadsheet"
    return "other"


def html_to_text(raw):
    if BeautifulSoup is None:
        return ""
    soup = BeautifulSoup(raw, "lxml")
    for tag in soup(["script", "style", "nav"]):
        tag.decompose()
    return soup.get_text("\n", strip=True)


def extract_epub_text(path):
    if BeautifulSoup is None:
        text, detail = extract_zip_like(path, ".epub")
        detail["status"] = f"epub_container_inventory_extracted_text_blocked_missing_bs4: {BS4_IMPORT_ERROR}"
        return text, detail
    if not zipfile.is_zipfile(path):
        return "", {"status": "not_a_zip_container", "entryCount": 0, "entriesPreview": []}
    parts = []
    entries = []
    total_entries = 0
    markup_files = 0
    with zipfile.ZipFile(path) as archive:
        for info in archive.infolist():
            total_entries += 1
            kind = entry_kind(info.filename)
            if len(entries) < 300:
                entries.append({
                    "name": info.filename,
                    "kind": kind,
                    "bytes": info.file_size,
                    "compressedBytes": info.compress_size,
                })
            if kind != "markup":
                continue
            markup_files += 1
            try:
                raw = archive.read(info)
                page_text = html_to_text(raw)
            except Exception:
                continue
            if page_text:
                parts.append(f"# {info.filename}\n{page_text}")
    text = "\n\n".join(parts).strip()
    return text, {
        "status": "epub_text_extracted" if text else "epub_container_inventory_extracted_text_empty",
        "entryCount": total_entries,
        "entriesPreview": entries,
        "markupFilesRead": markup_files,
        "bs4Available": BeautifulSoup is not None,
    }


def image_dimensions_from_zip(archive, info):
    if Image is None:
        return None
    try:
        with archive.open(info) as handle:
            data = handle.read(min(info.file_size, 20 * 1024 * 1024))
        with Image.open(io.BytesIO(data)) as image:
            return {
                "name": info.filename,
                "width": image.width,
                "height": image.height,
                "mode": image.mode,
                "format": image.format,
                "bytes": info.file_size,
            }
    except Exception:
        return None


def extract_zip_like(path, extension):
    if not zipfile.is_zipfile(path):
        return "", {"status": "not_a_zip_container", "entryCount": 0, "entriesPreview": []}
    entries = []
    total_entries = 0
    kind_counts = Counter()
    sample_image_dimensions = []
    total_uncompressed = 0
    with zipfile.ZipFile(path) as archive:
        for info in archive.infolist():
            total_entries += 1
            total_uncompressed += info.file_size
            kind = entry_kind(info.filename)
            kind_counts[kind] += 1
            if len(entries) < 300:
                entries.append({
                    "name": info.filename,
                    "kind": kind,
                    "bytes": info.file_size,
                    "compressedBytes": info.compress_size,
                })
            if kind == "image" and len(sample_image_dimensions) < 80:
                dimensions = image_dimensions_from_zip(archive, info)
                if dimensions:
                    sample_image_dimensions.append(dimensions)
    text_lines = [f"{item['name']} ({item['bytes']} bytes)" for item in entries]
    status = "zip_container_inventory_extracted"
    return "\n".join(text_lines), {
        "status": status,
        "entryCount": total_entries,
        "entriesPreview": entries,
        "entryKindCounts": dict(kind_counts),
        "sampleImageDimensions": sample_image_dimensions,
        "pilAvailable": Image is not None,
        "totalUncompressedBytes": total_uncompressed,
    }


def extract_for_file(path, extension, size_mb):
    if extension == ".pdf":
        return extract_pdf(path, size_mb)
    if extension == ".txt":
        return extract_txt(path)
    if extension == ".xlsx":
        return extract_xlsx(path)
    if extension == ".epub":
        return extract_epub_text(path)
    if extension in {".zip", ".epub"}:
        return extract_zip_like(path, extension)
    return "", {"status": "unsupported_extension_inventory_only"}


def existing_record(record_id):
    path = RECORD_DIR / f"{record_id}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_md(path, lines):
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    if not ROOT.exists():
        fail(f"Course 5 source folder does not exist: {ROOT}")
    ensure_dirs()
    started = time.monotonic()
    files = all_files()
    extension_counts = Counter(path.suffix.lower() or "<none>" for path in files)
    total_bytes = sum(path.stat().st_size for path in files)

    inventory_rows = []
    intake_rows = []
    processed_this_run = 0
    duplicate_by_hash = {}
    hashes = defaultdict(list)

    for index, path in enumerate(files, start=1):
        if MAX_FILES and processed_this_run >= MAX_FILES:
            break
        if MAX_SECONDS and processed_this_run > 0 and time.monotonic() - started > MAX_SECONDS:
            break

        relative_path = rel(path)
        stat = path.stat()
        extension = path.suffix.lower()
        sha = sha256_file(path)
        hashes[sha].append(relative_path)
        duplicate_of = duplicate_by_hash.get(sha)
        if duplicate_of is None:
            duplicate_by_hash[sha] = relative_path
        record_id = safe_id(sha)
        size_mb = stat.st_size / 1024 / 1024
        existing = existing_record(record_id)

        inventory_row = {
            "recordId": record_id,
            "relativePath": relative_path,
            "extension": extension,
            "bytes": stat.st_size,
            "sizeMb": round(size_mb, 3),
            "sha256": sha,
            "duplicateOf": duplicate_of,
            "lastModified": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
            "moduleTags": classify_modules(relative_path),
            "courseAlignment": align_courses(relative_path),
        }
        inventory_rows.append(inventory_row)

        if duplicate_of:
            intake_rows.append({
                **inventory_row,
                "schemaVersion": SCHEMA_VERSION,
                "absorptionStatus": "duplicate_file_represented_by_primary_hash",
                "textExtraction": "duplicate_skipped",
                "charCount": 0,
                "knowledgeNodeCandidateCount": 0,
                "reviewStatus": "duplicate_review_primary_record",
                "approvalStatus": "not_approved",
                "learnerFacingRelease": False,
                "productionReady": False,
                "writeAllowedNow": False,
            })
            continue

        if existing and existing.get("sha256") == sha and existing.get("schemaVersion") == SCHEMA_VERSION:
            intake_rows.append(existing)
            continue

        try:
            text, extraction = extract_for_file(path, extension, size_mb)
            stats = text_stats(text)
            text_path = TEXT_DIR / f"{record_id}.txt"
            if text:
                text_path.write_text(text, encoding="utf-8", errors="ignore")
            else:
                if text_path.exists():
                    text_path.unlink()
            combined_for_tags = f"{relative_path}\n{text[:12000]}"
            module_tags = classify_modules(combined_for_tags)
            course_alignment = align_courses(combined_for_tags)
            risk = risk_hits(text)
            concepts = sorted(set(module_tags + course_alignment))
            bucket = extraction_bucket(stats["chars"], extraction["status"])
            record = {
                **inventory_row,
                "schemaVersion": SCHEMA_VERSION,
                "moduleTags": module_tags,
                "courseAlignment": course_alignment,
                "contentType": extension.lstrip(".") or "unknown",
                "sourceLocalPath": str(path),
                "sourceUrl": f"local-course-5://{sha[:24]}",
                "textArtifact": str(text_path).replace("\\", "/") if text else None,
                "textPreview": text[:TEXT_PREVIEW_CHARS],
                "charCount": stats["chars"],
                "textStats": stats,
                "textExtraction": extraction["status"],
                "extractionDetail": extraction,
                "extractionBucket": bucket,
                "absorptionStatus": (
                    "absorbed_private_research_text"
                    if bucket in {"usable_full_text_private_research", "thin_text_needs_reviewer_attention"}
                    else "inventory_absorbed_followup_required"
                ),
                "knowledgeNodeCandidateCount": len(concepts),
                "knowledgeNodeCandidates": [
                    {
                        "candidateId": f"{record_id}_{concept}",
                        "concept": concept,
                        "sourceRecordId": record_id,
                        "evidenceMode": "private_local_course_5_document",
                        "reviewStatus": "needs_reviewer_distillation_public_grounding_and_source_fit_review",
                    }
                    for concept in concepts
                ],
                "riskLanguageHits": risk,
                "reviewStatus": "needs_reviewer_distillation",
                "learnerFacingRelease": False,
                "approvalStatus": "not_approved",
                "productionReady": False,
                "writeAllowedNow": False,
                "fetchedAt": now_iso(),
                "boundary": BOUNDARY,
            }
        except Exception as error:
            record = {
                **inventory_row,
                "schemaVersion": SCHEMA_VERSION,
                "contentType": extension.lstrip(".") or "unknown",
                "sourceLocalPath": str(path),
                "sourceUrl": f"local-course-5://{sha[:24]}",
                "textArtifact": None,
                "textPreview": "",
                "charCount": 0,
                "textStats": text_stats(""),
                "textExtraction": f"failed: {error}",
                "extractionDetail": {"status": f"failed: {error}"},
                "extractionBucket": "failed_requires_manual_or_tooling_review",
                "absorptionStatus": "inventory_absorbed_followup_required",
                "knowledgeNodeCandidateCount": 0,
                "knowledgeNodeCandidates": [],
                "riskLanguageHits": [],
                "reviewStatus": "needs_tooling_or_manual_review",
                "learnerFacingRelease": False,
                "approvalStatus": "not_approved",
                "productionReady": False,
                "writeAllowedNow": False,
                "fetchedAt": now_iso(),
                "boundary": BOUNDARY,
            }
        write_json(RECORD_DIR / f"{record_id}.json", record)
        intake_rows.append(record)
        processed_this_run += 1
        print(json.dumps({
            "processed": processed_this_run,
            "seen": index,
            "totalFiles": len(files),
            "relativePath": relative_path,
            "textExtraction": record["textExtraction"],
            "charCount": record["charCount"],
        }, ensure_ascii=False), flush=True)

    # Add inventory-only rows for files not reached in a bounded run.
    reached = {row["relativePath"] for row in inventory_rows}
    if MAX_FILES or MAX_SECONDS:
        for path in files:
            relative_path = rel(path)
            if relative_path in reached:
                continue
            stat = path.stat()
            extension = path.suffix.lower()
            inventory_rows.append({
                "recordId": safe_id(relative_path),
                "relativePath": relative_path,
                "extension": extension,
                "bytes": stat.st_size,
                "sizeMb": round(stat.st_size / 1024 / 1024, 3),
                "sha256": None,
                "duplicateOf": None,
                "lastModified": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
                "moduleTags": classify_modules(relative_path),
                "courseAlignment": align_courses(relative_path),
                "inventoryStatus": "not_hashed_in_bounded_run",
            })

    unique_hashes = {row["sha256"] for row in inventory_rows if row.get("sha256")}
    duplicate_rows = [row for row in inventory_rows if row.get("duplicateOf")]
    module_counts = Counter(module for row in intake_rows for module in row.get("moduleTags", []))
    course_counts = Counter(course for row in intake_rows for course in row.get("courseAlignment", []))
    bucket_counts = Counter(row.get("extractionBucket", row.get("textExtraction", "unknown")) for row in intake_rows)
    status_counts = Counter(row.get("absorptionStatus", "unknown") for row in intake_rows)
    knowledge_candidates = [
        candidate
        for row in intake_rows
        for candidate in row.get("knowledgeNodeCandidates", [])
    ]

    all_files_hashed = all(row.get("sha256") for row in inventory_rows)
    unique_primary_rows = [row for row in intake_rows if not row.get("duplicateOf")]
    text_absorbed_rows = [
        row for row in unique_primary_rows
        if row.get("absorptionStatus") == "absorbed_private_research_text"
    ]
    followup_rows = [
        row for row in unique_primary_rows
        if row.get("absorptionStatus") != "absorbed_private_research_text"
    ]
    intake_status = (
        "course_5_all_unique_files_absorbed_private_research_release_blocked"
        if all_files_hashed and len(unique_primary_rows) == len(unique_hashes) and not followup_rows
        else "course_5_absorption_in_progress_followup_required"
    )

    inventory = {
        "generatedAt": now_iso(),
        "educationOnly": True,
        "productionReady": False,
        "learnerFacingRelease": False,
        "approvalStatus": "not_approved",
        "sourceRoot": str(ROOT),
        "totalFiles": len(files),
        "totalBytes": total_bytes,
        "totalGb": round(total_bytes / 1024 / 1024 / 1024, 3),
        "extensionCounts": dict(sorted(extension_counts.items())),
        "hashedFilesInArtifact": sum(1 for row in inventory_rows if row.get("sha256")),
        "uniqueHashes": len(unique_hashes),
        "duplicateFiles": len(duplicate_rows),
        "inventoryRows": sorted(inventory_rows, key=lambda row: row["relativePath"].lower()),
        "boundary": BOUNDARY,
    }
    intake = {
        "generatedAt": now_iso(),
        "educationOnly": True,
        "productionReady": False,
        "learnerFacingRelease": False,
        "approvalStatus": "not_approved",
        "writeAllowedNow": False,
        "sourceRoot": str(ROOT),
        "intakeStatus": intake_status,
        "totalFiles": len(files),
        "inventoryRows": len(inventory_rows),
        "processedThisRun": processed_this_run,
        "intakeRows": len(intake_rows),
        "uniquePrimaryRows": len(unique_primary_rows),
        "textAbsorbedRows": len(text_absorbed_rows),
        "followupRequiredRows": len(followup_rows),
        "totalExtractedChars": sum(row.get("charCount", 0) for row in intake_rows),
        "moduleCounts": dict(module_counts.most_common()),
        "courseAlignmentCounts": dict(course_counts.most_common()),
        "extractionBucketCounts": dict(bucket_counts.most_common()),
        "absorptionStatusCounts": dict(status_counts.most_common()),
        "knowledgeNodeCandidateRows": len(knowledge_candidates),
        "knowledgeNodeConceptCounts": dict(Counter(candidate["concept"] for candidate in knowledge_candidates).most_common()),
        "followupQueue": sorted(followup_rows, key=lambda row: (-row.get("bytes", 0), row["relativePath"]))[:80],
        "sampleAbsorbedRows": sorted(text_absorbed_rows, key=lambda row: -row.get("charCount", 0))[:30],
        "rows": sorted(intake_rows, key=lambda row: row["relativePath"].lower()),
        "commands": [
            "npm.cmd run build:local-course-5-document-intake",
            "npm.cmd run check:local-course-5-document-intake",
            "npm.cmd run verify",
        ],
        "completionRule": (
            "Course 5 is considered absorbed only for the private research layer when every file is inventoried, "
            "deduplicated by hash, extractable text is stored, binary/scan-only material is queued for OCR or visual review, "
            "and each primary source row maps to at least one module/course candidate. Learner-facing lessons still require "
            "reviewer distillation, public grounding, originality checks, and explicit approval."
        ),
        "boundary": BOUNDARY,
    }

    write_json(INVENTORY_JSON, inventory)
    write_json(INTAKE_JSON, intake)
    write_md(INVENTORY_MD, [
        "# Local Course 5 Source Inventory",
        "",
        f"- Source root: {ROOT}",
        f"- Total files: {inventory['totalFiles']}",
        f"- Total size: {inventory['totalGb']} GB",
        f"- Hashed files in artifact: {inventory['hashedFilesInArtifact']}",
        f"- Unique hashes: {inventory['uniqueHashes']}",
        f"- Duplicate files: {inventory['duplicateFiles']}",
        f"- Production ready: {inventory['productionReady']}",
        "",
        "## Extensions",
        "",
        *[f"- {ext}: {count}" for ext, count in inventory["extensionCounts"].items()],
        "",
        "## Boundary",
        "",
        BOUNDARY,
    ])
    write_md(INTAKE_MD, [
        "# Local Course 5 Document Intake",
        "",
        f"- Intake status: {intake['intakeStatus']}",
        f"- Intake rows: {intake['intakeRows']}",
        f"- Unique primary rows: {intake['uniquePrimaryRows']}",
        f"- Text absorbed rows: {intake['textAbsorbedRows']}",
        f"- Follow-up required rows: {intake['followupRequiredRows']}",
        f"- Total extracted chars: {intake['totalExtractedChars']}",
        f"- Knowledge node candidate rows: {intake['knowledgeNodeCandidateRows']}",
        f"- Write allowed now: {intake['writeAllowedNow']}",
        "",
        "## Module Counts",
        "",
        *[f"- {module}: {count}" for module, count in intake["moduleCounts"].items()],
        "",
        "## Follow-up Queue",
        "",
        *[
            f"- {row['relativePath']}: {row.get('extractionBucket', row.get('textExtraction'))}, {row.get('sizeMb')} MB"
            for row in intake["followupQueue"][:30]
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
        "intakeStatus": intake_status,
        "totalFiles": len(files),
        "processedThisRun": processed_this_run,
        "intakeRows": len(intake_rows),
        "uniquePrimaryRows": len(unique_primary_rows),
        "textAbsorbedRows": len(text_absorbed_rows),
        "followupRequiredRows": len(followup_rows),
        "totalExtractedChars": intake["totalExtractedChars"],
        "outputJson": str(INTAKE_JSON).replace("\\", "/"),
        "inventoryJson": str(INVENTORY_JSON).replace("\\", "/"),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
