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

/**
 * `--version` succeeds even when the host blocks namespaces (common in
 * Docker/Koyeb). Probe a real unshare so we don't select a broken backend.
 */
async function bwrapCanCreateNamespace(): Promise<boolean> {
  if (!(await pathExists("/usr/bin/bwrap"))) return false;

  const trueBin = (await pathExists("/usr/bin/true"))
    ? "/usr/bin/true"
    : "/bin/true";

  const binds: string[] = ["--ro-bind", "/usr", "/usr"];
  if (await pathExists("/lib")) binds.push("--ro-bind", "/lib", "/lib");
  if (await pathExists("/lib64")) binds.push("--ro-bind", "/lib64", "/lib64");
  if (await pathExists("/bin")) binds.push("--ro-bind", "/bin", "/bin");

  try {
    await execFileAsync(
      "/usr/bin/bwrap",
      [
        "--die-with-parent",
        "--unshare-net",
        ...binds,
        "--proc",
        "/proc",
        "--dev",
        "/dev",
        "--tmpfs",
        "/tmp",
        "--",
        trueBin,
      ],
      { timeout: 5000 },
    );
    return true;
  } catch {
    return false;
  }
}

export async function detectSandboxCapabilities(): Promise<SandboxCapabilities> {
  const preferred = (process.env.SANDBOX_MODE || "auto").toLowerCase();
  const allowUnsafeLocal = process.env.ALLOW_UNSAFE_LOCAL_EXEC === "true";
  /** Set in the production Dockerfile — platform container is the isolation boundary. */
  const containerIsolation = process.env.CONTAINER_ISOLATION === "true";

  const gppAvailable =
    (await pathExists("/usr/bin/g++")) || (await canRun("g++", ["--version"]));
  const dockerAvailable = await canRun("docker", ["info"]);
  const bwrapAvailable = await bwrapCanCreateNamespace();

  let mode: SandboxMode = "none";
  let message = "";

  if (preferred === "docker") {
    if (dockerAvailable) mode = "docker";
    else
      message =
        "SANDBOX_MODE=docker but Docker daemon is unavailable. Start Docker or use bwrap.";
  } else if (preferred === "bwrap") {
    if (bwrapAvailable) mode = "bwrap";
    else
      message =
        "SANDBOX_MODE=bwrap but bubblewrap cannot create namespaces " +
        "(blocked inside many Docker/Koyeb hosts). Use Docker sandbox locally, " +
        "or CONTAINER_ISOLATION / ALLOW_UNSAFE_LOCAL_EXEC in a container image with g++.";
  } else if (preferred === "none") {
    if (allowUnsafeLocal || containerIsolation) {
      mode = "none";
      message = containerIsolation
        ? "Using in-container g++ (platform container isolation; nested bwrap unavailable)."
        : "WARNING: ALLOW_UNSAFE_LOCAL_EXEC=true — runs are NOT sandboxed. Dev only.";
    } else {
      message =
        "SANDBOX_MODE=none requires ALLOW_UNSAFE_LOCAL_EXEC=true (dev only) " +
        "or CONTAINER_ISOLATION=true (Docker/Koyeb image with g++).";
    }
  } else if (dockerAvailable) {
    mode = "docker";
  } else if (bwrapAvailable) {
    mode = "bwrap";
  } else if (allowUnsafeLocal || (containerIsolation && gppAvailable)) {
    mode = "none";
    message = containerIsolation
      ? "Using in-container g++ (platform container isolation; nested bwrap unavailable)."
      : "WARNING: no Docker/bwrap — using ALLOW_UNSAFE_LOCAL_EXEC (unsandboxed).";
  } else {
    message =
      "No sandbox backend available. Install Docker (preferred) or bubblewrap, " +
      "or set ALLOW_UNSAFE_LOCAL_EXEC=true for local dev only. " +
      "On Docker/Koyeb, set CONTAINER_ISOLATION=true and install g++ in the image.";
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
    allowUnsafeLocal: allowUnsafeLocal || containerIsolation,
    message,
  };
}
