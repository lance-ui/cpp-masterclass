import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathExists } from "../spawnLimited.js";
import type { SandboxCapabilities, SandboxMode } from "../types.js";

const execFileAsync = promisify(execFile);

async function canRun(
  bin: string,
  args: string[],
): Promise<boolean> {
  try {
    await execFileAsync(bin, args, { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

export async function detectSandboxCapabilities(): Promise<SandboxCapabilities> {
  const preferred = (process.env.SANDBOX_MODE || "auto").toLowerCase();
  const allowUnsafeLocal = process.env.ALLOW_UNSAFE_LOCAL_EXEC === "true";

  const gppAvailable =
    (await pathExists("/usr/bin/g++")) || (await canRun("g++", ["--version"]));
  const dockerAvailable = await canRun("docker", ["info"]);
  const bwrapAvailable =
    (await pathExists("/usr/bin/bwrap")) &&
    (await canRun("/usr/bin/bwrap", ["--version"]));

  let mode: SandboxMode = "none";
  let message = "";

  if (preferred === "docker") {
    if (dockerAvailable) mode = "docker";
    else
      message =
        "SANDBOX_MODE=docker but Docker daemon is unavailable. Start Docker or use bwrap.";
  } else if (preferred === "bwrap") {
    if (bwrapAvailable) mode = "bwrap";
    else message = "SANDBOX_MODE=bwrap but bubblewrap is not installed.";
  } else if (preferred === "none") {
    if (allowUnsafeLocal) {
      mode = "none";
      message =
        "WARNING: ALLOW_UNSAFE_LOCAL_EXEC=true — runs are NOT sandboxed. Dev only.";
    } else {
      message =
        "SANDBOX_MODE=none requires ALLOW_UNSAFE_LOCAL_EXEC=true (dev only).";
    }
  } else if (dockerAvailable) {
    mode = "docker";
  } else if (bwrapAvailable) {
    mode = "bwrap";
  } else if (allowUnsafeLocal) {
    mode = "none";
    message =
      "WARNING: no Docker/bwrap — using ALLOW_UNSAFE_LOCAL_EXEC (unsandboxed).";
  } else {
    message =
      "No sandbox backend available. Install Docker (preferred) or bubblewrap, " +
      "or set ALLOW_UNSAFE_LOCAL_EXEC=true for local dev only.";
  }

  if (!gppAvailable && mode !== "docker") {
    message =
      (message ? message + " " : "") +
      "g++ not found on PATH. Install a C++ toolchain (e.g. `sudo dnf install gcc-c++` " +
      "or `sudo apt install g++`) or use the Docker sandbox image.";
  }

  if (mode !== "none" && !message) {
    message = `Sandbox ready (${mode}).`;
  }

  return {
    mode,
    gppAvailable,
    dockerAvailable,
    bwrapAvailable,
    allowUnsafeLocal,
    message,
  };
}
