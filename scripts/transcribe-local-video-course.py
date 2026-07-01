import argparse
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from faster_whisper import WhisperModel


ROOT = Path(__file__).resolve().parents[1]
INTAKE_PATH = Path(os.environ.get("TRADEGYM_VIDEO_COURSE_INTAKE_PATH", ROOT / "docs" / "LOCAL_VIDEO_COURSE_KNOWLEDGE_INTAKE.json"))
TRANSCRIPT_DIR = Path(os.environ.get("TRADEGYM_VIDEO_COURSE_TRANSCRIPT_DIR", ROOT / "docs" / "local-video-course-transcripts"))
STATUS_JSON = Path(os.environ.get("TRADEGYM_VIDEO_COURSE_STATUS_JSON", ROOT / "docs" / "LOCAL_VIDEO_COURSE_TRANSCRIPT_STATUS.json"))
STATUS_MD = Path(os.environ.get("TRADEGYM_VIDEO_COURSE_STATUS_MD", ROOT / "docs" / "LOCAL_VIDEO_COURSE_TRANSCRIPT_STATUS.md"))
DEFAULT_FFMPEG = Path(os.environ.get("TRADEGYM_FFMPEG_PATH", r"C:\Users\86136\.local\bin\ffmpeg.exe"))


def fail(message):
    raise RuntimeError(message)


def read_json(path):
    if not path.exists():
        fail(f"missing {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def safe_name(value):
    return "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in value)


def run_ffmpeg(source, output, max_seconds=None):
    cmd = [
        str(DEFAULT_FFMPEG),
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(source),
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
    ]
    if max_seconds:
        cmd.extend(["-t", str(max_seconds)])
    cmd.extend(["-f", "wav", str(output)])
    subprocess.run(cmd, check=True)


def transcribe_audio(model, audio_path, language, beam_size):
    segments, info = model.transcribe(
        str(audio_path),
        language=language,
        beam_size=beam_size,
        vad_filter=True,
        word_timestamps=False,
    )
    segment_rows = []
    text_parts = []
    for index, segment in enumerate(segments, start=1):
        text = segment.text.strip()
        if text:
            text_parts.append(text)
        segment_rows.append({
            "index": index,
            "start": round(float(segment.start), 3),
            "end": round(float(segment.end), 3),
            "text": text,
            "avgLogprob": getattr(segment, "avg_logprob", None),
            "noSpeechProb": getattr(segment, "no_speech_prob", None),
        })
    return {
        "detectedLanguage": getattr(info, "language", language),
        "languageProbability": getattr(info, "language_probability", None),
        "duration": getattr(info, "duration", None),
        "segments": segment_rows,
        "text": "\n".join(text_parts).strip(),
    }


def write_status(intake, transcript_rows, args):
    video_rows = intake["videoRows"]
    transcript_by_id = {row["intakeId"]: row for row in transcript_rows}
    status_rows = []
    for row in video_rows:
        transcript = transcript_by_id.get(row["intakeId"])
        status_rows.append({
            "intakeId": row["intakeId"],
            "lessonCode": row["lessonCode"],
            "lessonTitle": row["lessonTitle"],
            "sourceId": row["sourceId"],
            "relativePath": row["relativePath"],
            "transcriptStatus": transcript["transcriptStatus"] if transcript else "not_started",
            "transcriptPath": transcript["transcriptPath"] if transcript else "",
            "semanticAbsorptionStatus": transcript["semanticAbsorptionStatus"] if transcript else "blocked_missing_transcript",
            "isPartialTranscript": transcript["isPartialTranscript"] if transcript else False,
            "segments": transcript["segments"] if transcript else 0,
            "charCount": transcript["charCount"] if transcript else 0,
        })
    transcribed_rows = [row for row in status_rows if row["transcriptStatus"] in ("partial_transcript_created", "full_transcript_created")]
    full_rows = [row for row in status_rows if row["transcriptStatus"] == "full_transcript_created"]
    partial_rows = [row for row in status_rows if row["transcriptStatus"] == "partial_transcript_created"]
    status = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "educationOnly": True,
        "productionReady": False,
        "learnerFacingRelease": False,
        "approvalStatus": "not_approved",
        "transcriptStatus": "local_video_course_transcription_in_progress_release_blocked",
        "transcriptionMode": "faster_whisper_local_cpu_resumable_batch",
        "modelName": args.model,
        "language": args.language,
        "sourceVideos": len(video_rows),
        "transcribedRows": len(transcribed_rows),
        "fullTranscriptRows": len(full_rows),
        "partialTranscriptRows": len(partial_rows),
        "notStartedRows": len(video_rows) - len(transcribed_rows),
        "semanticAbsorptionCompleteRows": 0,
        "semanticAbsorptionBlockedRows": len(video_rows),
        "writeAllowedNow": False,
        "manualAuthorizationRequired": True,
        "statusRows": status_rows,
        "commands": [
            "npm.cmd run transcribe:local-video-course:smoke",
            "npm.cmd run build:local-video-course-transcript-status",
            "npm.cmd run check:local-video-course-transcript-status",
            "npm.cmd run verify",
        ],
        "boundary": "Local video course transcripts are private reviewer-facing education-only working artifacts. They do not publish copied course material, approve learner-facing citations, generate trading advice, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
    }
    STATUS_JSON.write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "# Local Video Course Transcript Status",
        "",
        f"- Transcript status: {status['transcriptStatus']}",
        f"- Model: {status['modelName']}",
        f"- Source videos: {status['sourceVideos']}",
        f"- Transcribed rows: {status['transcribedRows']}",
        f"- Full transcript rows: {status['fullTranscriptRows']}",
        f"- Partial transcript rows: {status['partialTranscriptRows']}",
        f"- Not started rows: {status['notStartedRows']}",
        f"- Semantic absorption complete rows: {status['semanticAbsorptionCompleteRows']}",
        f"- Write allowed now: {status['writeAllowedNow']}",
        "",
        "## Rows",
        "",
        "| Intake ID | Lesson | Transcript status | Partial | Segments | Chars |",
        "| --- | --- | --- | --- | ---: | ---: |",
    ]
    for row in status_rows:
        lines.append(
            f"| {row['intakeId']} | {row['lessonCode']} | {row['transcriptStatus']} | {str(row['isPartialTranscript']).lower()} | {row['segments']} | {row['charCount']} |"
        )
    lines.extend(["", "## Boundary", "", status["boundary"], ""])
    STATUS_MD.write_text("\n".join(lines), encoding="utf-8")
    return status


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--start-index", type=int, default=1, help="1-based intake row index to start from.")
    parser.add_argument("--intake-id", action="append", default=[], help="Specific intake id to process. Can be repeated.")
    parser.add_argument("--only-not-started", action="store_true", help="Skip rows that already have any transcript.")
    parser.add_argument("--keep-partial", action="store_true", help="When running full transcription, keep existing partial transcripts instead of replacing them.")
    parser.add_argument("--max-seconds", type=int, default=0)
    parser.add_argument("--model", default="tiny")
    parser.add_argument("--language", default="zh")
    parser.add_argument("--beam-size", type=int, default=1)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if not DEFAULT_FFMPEG.exists():
        fail(f"ffmpeg not found: {DEFAULT_FFMPEG}")
    intake = read_json(INTAKE_PATH)
    if intake.get("educationOnly") is not True:
        fail("intake must remain educationOnly:true")
    if intake.get("productionReady") is not False:
        fail("intake must remain productionReady:false")

    TRANSCRIPT_DIR.mkdir(parents=True, exist_ok=True)
    all_video_rows = intake.get("videoRows", [])
    if args.start_index < 1:
        fail("--start-index must be >= 1")
    video_rows = all_video_rows[args.start_index - 1:]
    if args.intake_id:
        wanted = set(args.intake_id)
        video_rows = [row for row in all_video_rows if row["intakeId"] in wanted]
        missing = wanted - {row["intakeId"] for row in video_rows}
        if missing:
            fail(f"unknown intake ids: {', '.join(sorted(missing))}")
    if args.limit:
        video_rows = video_rows[: args.limit]

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    transcript_rows = []
    existing_transcripts = {}
    for transcript_file in TRANSCRIPT_DIR.glob("*.transcript.json"):
        try:
            transcript = read_json(transcript_file)
            existing_transcripts[transcript.get("intakeId")] = transcript
        except Exception:
            continue

    for row in video_rows:
        intake_id = row["intakeId"]
        output_path = TRANSCRIPT_DIR / f"{safe_name(intake_id)}.transcript.json"
        existing = existing_transcripts.get(intake_id)
        if existing and not args.force:
            existing_is_partial = bool(existing.get("isPartialTranscript"))
            requested_partial = bool(args.max_seconds)
            should_skip = (
                args.only_not_started or
                existing.get("transcriptStatus") == "full_transcript_created" or
                (requested_partial and existing_is_partial) or
                (not requested_partial and existing_is_partial and args.keep_partial)
            )
            if should_skip:
                transcript_rows.append({
                    "intakeId": intake_id,
                    "transcriptStatus": existing["transcriptStatus"],
                    "semanticAbsorptionStatus": existing["semanticAbsorptionStatus"],
                    "isPartialTranscript": existing["isPartialTranscript"],
                    "transcriptPath": str(output_path.relative_to(ROOT)).replace("\\", "/"),
                    "segments": len(existing.get("segments", [])),
                    "charCount": len(existing.get("text", "")),
                })
                continue

        source_path = Path(intake["sourceRoot"]) / row["relativePath"]
        if not source_path.exists():
            fail(f"missing video file: {source_path}")
        with tempfile.TemporaryDirectory(prefix="tradegym-video-audio-") as tmpdir:
            audio_path = Path(tmpdir) / f"{safe_name(intake_id)}.wav"
            run_ffmpeg(source_path, audio_path, max_seconds=args.max_seconds or None)
            result = transcribe_audio(model, audio_path, args.language, args.beam_size)

        is_partial = bool(args.max_seconds)
        transcript = {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "educationOnly": True,
            "productionReady": False,
            "learnerFacingRelease": False,
            "approvalStatus": "not_approved",
            "intakeId": intake_id,
            "sourceId": row["sourceId"],
            "relativePath": row["relativePath"],
            "lessonCode": row["lessonCode"],
            "lessonTitle": row["lessonTitle"],
            "modelName": args.model,
            "language": args.language,
            "detectedLanguage": result["detectedLanguage"],
            "languageProbability": result["languageProbability"],
            "audioDuration": result["duration"],
            "maxSeconds": args.max_seconds,
            "isPartialTranscript": is_partial,
            "transcriptStatus": "partial_transcript_created" if is_partial else "full_transcript_created",
            "semanticAbsorptionStatus": "blocked_pending_full_transcript_and_reviewer_distillation" if is_partial else "full_transcript_ready_for_private_semantic_distillation",
            "segments": result["segments"],
            "text": result["text"],
            "writeAllowedNow": False,
            "boundary": "Private reviewer-facing transcript. Do not publish as learner-facing copied course material or trading advice.",
        }
        output_path.write_text(json.dumps(transcript, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        transcript_rows.append({
            "intakeId": intake_id,
            "transcriptStatus": transcript["transcriptStatus"],
            "semanticAbsorptionStatus": transcript["semanticAbsorptionStatus"],
            "isPartialTranscript": transcript["isPartialTranscript"],
            "transcriptPath": str(output_path.relative_to(ROOT)).replace("\\", "/"),
            "segments": len(transcript["segments"]),
            "charCount": len(transcript["text"]),
        })

    for intake_id, transcript in existing_transcripts.items():
        if intake_id in {row["intakeId"] for row in transcript_rows}:
            continue
        path_for_existing = TRANSCRIPT_DIR / f"{safe_name(intake_id)}.transcript.json"
        transcript_rows.append({
            "intakeId": intake_id,
            "transcriptStatus": transcript.get("transcriptStatus", "unknown"),
            "semanticAbsorptionStatus": transcript.get("semanticAbsorptionStatus", "blocked_pending_review"),
            "isPartialTranscript": transcript.get("isPartialTranscript", False),
            "transcriptPath": str(path_for_existing.relative_to(ROOT)).replace("\\", "/"),
            "segments": len(transcript.get("segments", [])),
            "charCount": len(transcript.get("text", "")),
        })

    status = write_status(intake, transcript_rows, args)
    print(json.dumps({
        "ok": True,
        "transcriptStatus": status["transcriptStatus"],
        "sourceVideos": status["sourceVideos"],
        "transcribedRows": status["transcribedRows"],
        "fullTranscriptRows": status["fullTranscriptRows"],
        "partialTranscriptRows": status["partialTranscriptRows"],
        "notStartedRows": status["notStartedRows"],
        "semanticAbsorptionCompleteRows": status["semanticAbsorptionCompleteRows"],
        "writeAllowedNow": status["writeAllowedNow"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
