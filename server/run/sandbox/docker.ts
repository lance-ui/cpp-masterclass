import { spawnLimited } from "../spawnLimited.js";
import type { ExecuteLimits } from "../types.js";

const IMAGE =
  process.env.SANDBOX_DOCKER_IMAGE || "cpp-masterclass-sandbox:local";

export function dockerRunArgv(
  workDir: string,
  innerArgv: string[],
  limits: ExecuteLimits,
): string[] {
  return [
    "docker",
    "run",
    "--rm",
    "--network",
    "none",
    "--memory",
    `${limits.memoryMb}m`,
    "--memory-swap",
    `${limits.memoryMb}m`,
    "--cpus",
    String(limits.cpus),
    "--pids-limit",
    String(limits.pidsLimit),
    "--read-only",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=32m",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--user",
    "65534:65534",
    "--workdir",
    "/work",
    "--mount",
    `type=bind,source=${workDir},target=/work`,
    IMAGE,
    ...innerArgv,
  ];
}

export async function runInDocker(
  workDir: string,
  innerArgv: string[],
  opts: {
    stdin?: string;
    timeoutMs: number;
    maxOutputBytes: number;
    limits: ExecuteLimits;
  },
) {
  const argv = dockerRunArgv(workDir, innerArgv, opts.limits);
  return spawnLimited({
    argv,
    stdin: opts.stdin,
    timeoutMs: opts.timeoutMs,
    maxOutputBytes: opts.maxOutputBytes,
    processGroup: true,
  });
}

export { IMAGE as SANDBOX_DOCKER_IMAGE };
