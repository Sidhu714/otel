#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import http from "node:http";

const args = process.argv.slice(2);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const register = pathToFileURL(
  path.resolve(__dirname, "../register.js")
).href;

const collectorEntry = path.resolve(__dirname, "../src/server.js");

let collectorProcess = null;
let appProcess = null;

/* ------------------------- Helpers ------------------------- */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function isCollectorRunning() {
  return new Promise(resolve => {
    const req = http.get("http://localhost:4320/api/health", res => {
      res.resume();
      resolve(true);
    });

    req.on("error", () => resolve(false));

    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForCollector(timeout = 10000) {
  const started = Date.now();

  while (Date.now() - started < timeout) {
    if (await isCollectorRunning()) return true;
    await sleep(200);
  }

  return false;
}

function shutdown() {
  console.log("\n[otellocal] shutting down...");

  if (appProcess && !appProcess.killed) {
    appProcess.kill("SIGINT");
  }

  if (collectorProcess && !collectorProcess.killed) {
    collectorProcess.kill("SIGINT");
  }

  process.exit();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/* ---------------------- Collector Mode ---------------------- */

if (args.length === 0) {
  await import("../src/server.js");
} else if (args[0] === "run") {
  // run logic
} else {
  console.error("Usage:");
  console.error("  otellocal");
  console.error("  otellocal run <app.js>");
  process.exit(1);
}

/* -------------------------- Run ----------------------------- */

if (args[0] !== "run") {
  console.error("Usage:");
  console.error("  otellocal");
  console.error("  otellocal run <app.js>");
  process.exit(1);
}

const target = args[1];

if (!target) {
  console.error("Usage: otellocal run <app.js>");
  process.exit(1);
}

/* ------------------ Start collector if needed ------------------ */

if (!(await isCollectorRunning())) {
  console.log("[otellocal] starting collector...");

  collectorProcess = spawn(
    process.execPath,
    [collectorEntry],
    {
      stdio: "inherit"
    }
  );

  collectorProcess.on("error", err => {
    console.error("[collector]", err);
    process.exit(1);
  });

  const ready = await waitForCollector();

  if (!ready) {
    console.error("[otellocal] collector failed to start.");
    process.exit(1);
  }
} else {
  console.log("[otellocal] using existing collector");
}

/* ----------------------- Start App ------------------------ */

console.log("[otellocal] starting app...\n");

appProcess = spawn(
  process.execPath,
  [
    "--import",
    register,
    target,
    ...args.slice(2)
  ],
  {
    stdio: "inherit"
  }
);

appProcess.on("error", err => {
  console.error(err);
});

appProcess.on("exit", code => {
  if (collectorProcess && !collectorProcess.killed) {
    collectorProcess.kill("SIGINT");
  }

  process.exit(code ?? 0);
});