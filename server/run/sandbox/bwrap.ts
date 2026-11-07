import { pathExists, spawnLimited } from "../spawnLimited.js";
import type { ExecuteLimits } from "../types.js";

/** Host paths that must exist for a minimal Linux userspace inside bwrap. */
async function existingBinds(): Promise<string[]> {
  const candidates = [
    "/usr",
    "/lib",
    "/lib64",
    "/bin",
    "/sbin",
    // Fedora/Debian: /usr/bin/ld → /etc/alternatives/ld → /usr/bin/ld.bfd
    "/etc/alternatives",
    "/etc/ld.so.cache",
    "/etc/ld.so.conf",
    "/etc/ld.so.conf.d",
  ];
  const out: string[] = [];
  for (const p of candidates) {
    if (await pathExists(p)) out.push(p);
  }
  return out;
}

export async function buildBwrapArgv(
  workDir: string,
  innerArgv: string[],
): Promise<string[]> {
  const binds = await existingBinds();
  // Keep namespaces minimal: --unshare-net is the important isolation.
  // Extra unshare-pid/ipc/new-session often fail with
  // "Creating new namespace failed: Resource temporarily unavailable".
  const argv = ["/usr/bin/bwrap", "--die-with-parent"];

  for (const p of binds) {
    argv.push("--ro-bind", p, p);
  }

  argv.push(
    "--proc",
    "/proc",
    "--dev",
    "/dev",
    "--tmpfs",
    "/tmp",
    "--bind",
    workDir,
    "/work",
    "--chdir",
    "/work",
    "--unshare-net",
    "--clearenv",
    "--setenv",
    "PATH",
    "/usr/bin:/bin",
    "--setenv",
    "HOME",
    "/work",
    "--setenv",
    "TMPDIR",
    "/tmp",
    "--setenv",
    "LANG",
    "C.UTF-8",
    "--",
    ...innerArgv,
  );

  return argv;
}

export async function runInBwrap(
  workDir: string,
  innerArgv: string[],
  opts: {
    stdin?: string;
    timeoutMs: number;
    maxOutputBytes: number;
    limits: ExecuteLimits;
  },
) {
  void opts.limits; // memory/pids enforced via timeout kill + Docker when available
  const argv = await buildBwrapArgv(workDir, innerArgv);

  return spawnLimited({
    argv,
    cwd: workDir,
    stdin: opts.stdin,
    timeoutMs: opts.timeoutMs,
    maxOutputBytes: opts.maxOutputBytes,
    processGroup: true,
    env: {
      PATH: "/usr/bin:/bin",
      LANG: "C.UTF-8",
    },
  });
}
