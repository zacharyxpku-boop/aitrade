import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

// One-off repair: re-extract text for corpus documents whose PDF parse failed
// under the old pdf-parse API. Uses raw PDFs already on disk; no network.

const corpusDir = "data/corpus";
const files = fs.readdirSync(corpusDir).filter((file) => /^corpus_\d+\.json$/.test(file));

let repaired = 0;
let skipped = 0;
let stillFailed = 0;

for (const file of files) {
  const docPath = path.join(corpusDir, file);
  const doc = JSON.parse(fs.readFileSync(docPath, "utf8"));
  const needsRepair = doc.rawFile && /failed|partial/i.test(String(doc.textExtraction));
  if (!needsRepair) {
    skipped += 1;
    continue;
  }
  if (!fs.existsSync(doc.rawFile)) {
    stillFailed += 1;
    continue;
  }
  try {
    const buffer = fs.readFileSync(doc.rawFile);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    let text = "";
    try {
      const result = await parser.getText();
      text = (result.text || "").trim();
    } finally {
      await parser.destroy();
    }
    if (text.length > 200) {
      doc.text = text;
      doc.charCount = text.length;
      doc.textExtraction = "full";
      doc.repairedAt = new Date().toISOString();
      fs.writeFileSync(docPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
      repaired += 1;
    } else {
      doc.textExtraction = `partial after repair (${text.length} chars)`;
      fs.writeFileSync(docPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
      stillFailed += 1;
    }
  } catch (error) {
    doc.textExtraction = `failed after repair: ${error.message}`;
    fs.writeFileSync(docPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    stillFailed += 1;
  }
}

console.log(JSON.stringify({ ok: true, repaired, skipped, stillFailed }, null, 2));
