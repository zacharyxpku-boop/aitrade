import { spawn } from "node:child_process";

const steps = [
  {
    name: "git parity",
    command: "git",
    args: ["rev-list", "--left-right", "--count", "origin/main...main"],
    parse(stdout) {
      const value = stdout.trim();
      if (value !== "0\t0" && value !== "0 0") {
        throw new Error(`GitHub sync check failed: expected 0 0, got ${JSON.stringify(value)}`);
      }
      return { aheadBehind: value };
    },
  },
  {
    name: "code completion",
    command: "npm.cmd",
    args: ["run", "check:completion"],
  },
  {
    name: "local friend trial UI",
    command: "npm.cmd",
    args: ["run", "smoke:friend-trial-ui"],
  },
  {
    name: "live friend trial",
    command: "npm.cmd",
    args: ["run", "smoke:friend-trial-live"],
  },
];

function runStep(step) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const isWindowsCmd = process.platform === "win32" && step.command.toLowerCase().endsWith(".cmd");
    const command = isWindowsCmd ? (process.env.ComSpec || "cmd.exe") : step.command;
    const args = isWindowsCmd ? ["/d", "/s", "/c", [step.command, ...step.args].join(" ")] : step.args;
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = String(chunk);
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = String(chunk);
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      const durationMs = Date.now() - startedAt;
      if (code !== 0) {
        reject(new Error(`${step.name} failed with exit ${code}`));
        return;
      }
      try {
        const parsed = step.parse ? step.parse(stdout) : {};
        resolve({ name: step.name, ok: true, durationMs, ...parsed });
      } catch (error) {
        reject(error);
      }
    });
  });
}

const results = [];

for (const step of steps) {
  console.log(`\n[release-check] ${step.name}`);
  try {
    results.push(await runStep(step));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      failedStep: step.name,
      message: error.message,
      completed: results,
      productionReady: false,
      educationOnly: true,
    }, null, 2));
    process.exit(1);
  }
}

console.log(JSON.stringify({
  ok: true,
  releaseSurface: "/friend-trial",
  checks: results,
  productionReady: false,
  educationOnly: true,
}, null, 2));
