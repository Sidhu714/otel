#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import http from "node:http";
import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const register = pathToFileURL(
  path.resolve(__dirname, "../register.js")
).href;

const collectorEntry = path.resolve(__dirname, "../src/server.js");
const packageJson = path.resolve(__dirname, "../package.json");

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


function printUsage() {
  console.log(`
Usage:
  otellocal
  otellocal run <app.js>

Commands:
  run <app.js>   Run an application with OpenTelemetry

Options:
  --demo         Start the collector only
  -h, --help     Show this help message
  -v, --version  Show the package version
`);
}


async function printVersion() {
  const packageData = JSON.parse(await readFile(packageJson, "utf8"));
  console.log(packageData.version);
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

/* ---------------------------- Modes -------------------------------- */

async function runCollectorOnly() {
  await import("../src/server.js");
  // server.js registers its own listeners and keeps the process alive —
  // nothing further to do here, and nothing below this function runs.
}

async function runWithApp(target, extraArgs) {
  if (!(await isCollectorRunning())) {
    console.log("[otellocal] starting collector...");

    collectorProcess = spawn(process.execPath, [collectorEntry], {
      stdio: "inherit"
    });

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

  console.log("[otellocal] starting app...\n");

  appProcess = spawn(
    process.execPath,
    ["--import", register, target, ...extraArgs],
    { stdio: "inherit" }
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
}

/* ---------------------------- Entry -------------------------------- */

async function main() {

  if (args[0] === "--help" || args[0] === "-h") {
    printUsage();
    return;
  }

  // Version
  if (args[0] === "--version" || args[0] === "-v") {
    await printVersion();
    return;
  }


  if (args.length === 0 || args[0] === '--demo') {
    await runCollectorOnly();
    return;
  }

  if (args[0] !== "run") {
    printUsage();
    process.exit(1);
  }

  const target = args[1];
  if (!target) {
    console.error("Usage: otellocal run <app.js>");
    process.exit(1);
  }

  await runWithApp(target, args.slice(2));
}

main();