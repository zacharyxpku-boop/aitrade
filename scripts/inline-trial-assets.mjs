import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexPath = path.join(root, "index.html");

const assets = {
  "styles.css": fs.readFileSync(path.join(root, "styles.css"), "utf8"),
  "trial-flow-state.js": fs.readFileSync(path.join(root, "trial-flow-state.js"), "utf8"),
  "training-flow-state.js": fs.readFileSync(path.join(root, "training-flow-state.js"), "utf8"),
  "app.js": fs.readFileSync(path.join(root, "app.js"), "utf8"),
};

let html = fs.readFileSync(indexPath, "utf8");

function replaceBlock(source, tagName, assetName, replacement) {
  const inlinePattern = new RegExp(
    `\\s*<${tagName} data-inline-asset="${assetName.replace(".", "\\.")}"[^>]*>[\\s\\S]*?<\\/${tagName}>\\s*`,
    "m"
  );
  const externalPattern = tagName === "style"
    ? new RegExp(`\\s*<link rel="stylesheet" href="\\/?${assetName.replace(".", "\\.")}" \\/>\\s*`, "m")
    : new RegExp(`\\s*<script src="\\/?${assetName.replace(".", "\\.")}"><\\/script>\\s*`, "m");
  if (inlinePattern.test(source)) return source.replace(inlinePattern, replacement);
  return source.replace(externalPattern, replacement);
}

html = replaceBlock(
  html,
  "style",
  "styles.css",
  `\n    <style data-inline-asset="styles.css">\n${assets["styles.css"]}\n    </style>\n`
);

for (const assetName of ["trial-flow-state.js", "training-flow-state.js", "app.js"]) {
  html = replaceBlock(
    html,
    "script",
    assetName,
    `\n    <script data-inline-asset="${assetName}">\n${assets[assetName]}\n    </script>\n`
  );
}

fs.writeFileSync(indexPath, html);
