import { spawn } from "node:child_process";

function spawnNpm(args) {
  if (process.platform === "win32") {
    return spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm.cmd", ...args], {
      env: process.env,
      shell: false,
      stdio: "inherit",
    });
  }

  return spawn("npm", args, {
    env: process.env,
    shell: false,
    stdio: "inherit",
  });
}

const mode = process.argv[2] ?? "dev";
const passthroughArgs = process.argv.slice(3);
const nextArgs = passthroughArgs[0] === "--" ? passthroughArgs.slice(1) : passthroughArgs;
const portFlagIndex = nextArgs.findIndex((arg) => arg === "--port" || arg === "-p");
const port = portFlagIndex >= 0 ? nextArgs[portFlagIndex + 1] : "3000";
const childEnv = {
  ...process.env,
  DASHBOARD_REFRESH_URL: process.env.DASHBOARD_REFRESH_URL ?? `http://localhost:${port}`,
};

const app = spawnNpm(["run", mode, ...(nextArgs.length > 0 ? ["--", ...nextArgs] : [])]);

const worker = spawn(process.execPath, ["scripts/dashboard-refresh-worker.mjs"], {
  env: childEnv,
  shell: false,
  stdio: "inherit",
});

function stopAll(signal) {
  worker.kill(signal);
  app.kill(signal);
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));

app.on("exit", (code, signal) => {
  worker.kill("SIGTERM");
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

worker.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`[dashboard-refresh-worker] exited with code ${code}`);
  }
});
