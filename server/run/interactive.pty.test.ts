import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  spawnInteractive,
  wrapForLiveOutput,
} from "./spawnInteractive.js";

test("wrapForLiveOutput prefers a PTY wrapper", async () => {
  const wrapped = await wrapForLiveOutput(["./main"]);
  assert.ok(wrapped.length >= 1);
  const head = wrapped[0];
  assert.ok(
    head === "/usr/bin/script" ||
      head === "/usr/bin/python3" ||
      head === "/usr/bin/stdbuf" ||
      head === "./main",
    `unexpected wrapper: ${wrapped.join(" ")}`,
  );
});

test("interactive spawn surfaces prompt before stdin and echoes input", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "cpp-pty-"));
  try {
    // Tiny shell "program" that prints a prompt without newline, then reads a line
    const scriptPath = path.join(dir, "prog.sh");
    await writeFile(
      scriptPath,
      `#!/bin/sh
printf 'Enter an integer value: '
IFS= read -r line
echo "You said: $line"
`,
      "utf8",
    );
    await chmod(scriptPath, 0o755);

    const wrapped = await wrapForLiveOutput([scriptPath]);
    const collected: string[] = [];

    await new Promise<void>((resolve, reject) => {
      const handle = spawnInteractive({
        argv: wrapped,
        cwd: dir,
        timeoutMs: 10_000,
        idleTimeoutMs: 10_000,
        maxOutputBytes: 64 * 1024,
        processGroup: true,
      });

      let sent = false;
      handle.on("stdout", (data: string) => {
        collected.push(data);
        const soFar = collected.join("");
        if (!sent && soFar.includes("Enter an integer value:")) {
          sent = true;
          // Prompt appeared before we typed — core requirement
          handle.writeStdin("42\n");
        }
      });
      handle.on("stderr", (data: string) => collected.push(data));
      handle.on("exit", () => {
        try {
          const out = collected.join("");
          assert.match(out, /Enter an integer value:/);
          assert.match(out, /You said: 42/);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
