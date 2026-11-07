import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  executeCpp,
  getSandboxCapabilities,
  SandboxUnavailableError,
} from "./execute.js";

const HELLO = `#include <iostream>
int main() {
  std::cout << "hello,g++" << std::endl;
  return 0;
}
`;

const BAD = `#include <iostream>
int main() {
  std::cout << missing << std::endl;
  return 0;
}
`;

const CIN = `#include <iostream>
int main() {
  int x;
  std::cin >> x;
  std::cout << "got:" << x << std::endl;
  return 0;
}
`;

const LOOP = `int main() { while(true) {} }`;

const SEGFAULT = `int main() {
  int* p = nullptr;
  return *p;
}
`;

const READ_PASSWD = `#include <fstream>
#include <iostream>
int main() {
  std::ifstream f("/etc/passwd");
  std::string line;
  if (std::getline(f, line)) std::cout << line << std::endl;
  else std::cout << "blocked-or-empty" << std::endl;
  return 0;
}
`;

const FORK_BOMB = `#include <unistd.h>
int main() {
  while (true) { fork(); }
  return 0;
}
`;

const HUGE = `#include <iostream>
int main() {
  for (int i = 0; i < 200000; ++i) std::cout << 'A';
  return 0;
}
`;

async function requireSandbox() {
  const caps = await getSandboxCapabilities(true);
  if (caps.mode === "none" && !caps.allowUnsafeLocal) {
    return null;
  }
  return caps;
}

test("sandbox capabilities detect a backend or refuse clearly", async () => {
  const caps = await getSandboxCapabilities(true);
  assert.ok(caps.message.length > 0);
  console.log("[test] sandbox:", caps.mode, caps.message);
});

test("hello world compiles and runs", async (t) => {
  if (!(await requireSandbox())) return t.skip("no sandbox backend");
  const res = await executeCpp({ code: HELLO });
  assert.equal(res.compile.ok, true, res.compile.stderr);
  assert.ok(res.run);
  assert.equal(res.run.ok, true, res.run.stderr);
  assert.match(res.run.stdout, /hello,g\+\+/);
  assert.equal(res.run.exitCode, 0);
});

test("compile error includes structured diagnostics", async (t) => {
  if (!(await requireSandbox())) return t.skip("no sandbox backend");
  const res = await executeCpp({ code: BAD });
  assert.equal(res.compile.ok, false);
  assert.ok(res.compile.diagnostics.length >= 1);
  assert.ok(res.compile.diagnostics.some((d) => d.severity === "error"));
  assert.ok(res.compile.diagnostics.some((d) => d.line >= 1));
  assert.equal(res.run, null);
});

test("cin reads from provided stdin", async (t) => {
  if (!(await requireSandbox())) return t.skip("no sandbox backend");
  const res = await executeCpp({ code: CIN, stdin: "42" });
  assert.equal(res.compile.ok, true, res.compile.stderr);
  assert.ok(res.run);
  assert.match(res.run.stdout, /got:42/);
});

test("infinite loop times out", async (t) => {
  if (!(await requireSandbox())) return t.skip("no sandbox backend");
  const prev = process.env.RUN_TIMEOUT_MS;
  process.env.RUN_TIMEOUT_MS = "1500";
  try {
    // reload limits by calling execute — loadExecuteLimits reads env each time
    const res = await executeCpp({ code: LOOP });
    assert.equal(res.compile.ok, true, res.compile.stderr);
    assert.ok(res.run);
    assert.equal(res.run.timedOut, true);
  } finally {
    if (prev === undefined) delete process.env.RUN_TIMEOUT_MS;
    else process.env.RUN_TIMEOUT_MS = prev;
  }
});

test("null deref fails the run (signal or nonzero)", async (t) => {
  if (!(await requireSandbox())) return t.skip("no sandbox backend");
  const res = await executeCpp({ code: SEGFAULT });
  assert.equal(res.compile.ok, true, res.compile.stderr);
  assert.ok(res.run);
  assert.equal(res.run.ok, false);
  assert.ok(
    res.run.signal === "SIGSEGV" ||
      res.run.exitCode !== 0 ||
      /Segmentation|Sanitizer|runtime error/i.test(res.run.stderr),
  );
});

test("huge stdout is truncated", async (t) => {
  if (!(await requireSandbox())) return t.skip("no sandbox backend");
  const prev = process.env.MAX_OUTPUT_BYTES;
  process.env.MAX_OUTPUT_BYTES = "2048";
  try {
    const res = await executeCpp({ code: HUGE });
    assert.equal(res.compile.ok, true, res.compile.stderr);
    assert.ok(res.run);
    assert.equal(res.run.truncated, true);
    assert.ok(Buffer.byteLength(res.run.stdout, "utf8") < 10_000);
  } finally {
    if (prev === undefined) delete process.env.MAX_OUTPUT_BYTES;
    else process.env.MAX_OUTPUT_BYTES = prev;
  }
});

test("fork bomb is contained (timeout or nproc limit)", async (t) => {
  if (!(await requireSandbox())) return t.skip("no sandbox backend");
  const prev = process.env.RUN_TIMEOUT_MS;
  process.env.RUN_TIMEOUT_MS = "2000";
  try {
    const res = await executeCpp({ code: FORK_BOMB });
    // Must not hang the test runner indefinitely
    assert.equal(res.compile.ok, true, res.compile.stderr);
    assert.ok(res.run);
    assert.ok(res.run.timedOut || res.run.exitCode !== 0 || res.run.signal);
  } finally {
    if (prev === undefined) delete process.env.RUN_TIMEOUT_MS;
    else process.env.RUN_TIMEOUT_MS = prev;
  }
});

test("reading /etc/passwd is blocked or empty inside sandbox", async (t) => {
  const caps = await requireSandbox();
  if (!caps) return t.skip("no sandbox backend");
  if (caps.mode === "none") return t.skip("unsafe local can read host files");
  const res = await executeCpp({ code: READ_PASSWD });
  assert.equal(res.compile.ok, true, res.compile.stderr);
  assert.ok(res.run);
  // bwrap does not mount /etc/passwd by default in our bind set
  assert.doesNotMatch(res.run.stdout, /^root:/);
});

test("unauthenticated POST /api/run is rejected", async () => {
  // Hit whatever is configured; if server isn't up, start a tiny stub.
  // We unit-check the route contract via a minimal express app.
  const express = (await import("express")).default;
  const { registerRunRoutes } = await import("./routes.js");
  const app = express();
  app.use(express.json());
  registerRunRoutes(app, () => null);

  const server = await new Promise<http.Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const addr = server.address();
  assert.ok(addr && typeof addr === "object");
  const port = addr.port;

  const body = JSON.stringify({ code: HELLO });
  const result = await new Promise<{ status: number; json: { error?: string } }>(
    (resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: "/api/run",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            resolve({
              status: res.statusCode || 0,
              json: JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"),
            });
          });
        },
      );
      req.on("error", reject);
      req.write(body);
      req.end();
    },
  );

  assert.equal(result.status, 401);
  assert.match(result.json.error || "", /Sign in/i);

  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("missing sandbox refuses instead of silent host exec", async () => {
  const prevMode = process.env.SANDBOX_MODE;
  const prevUnsafe = process.env.ALLOW_UNSAFE_LOCAL_EXEC;
  process.env.SANDBOX_MODE = "none";
  delete process.env.ALLOW_UNSAFE_LOCAL_EXEC;
  try {
    await getSandboxCapabilities(true);
    await assert.rejects(
      () => executeCpp({ code: HELLO }),
      (err: unknown) => err instanceof SandboxUnavailableError,
    );
  } finally {
    if (prevMode === undefined) delete process.env.SANDBOX_MODE;
    else process.env.SANDBOX_MODE = prevMode;
    if (prevUnsafe === undefined) delete process.env.ALLOW_UNSAFE_LOCAL_EXEC;
    else process.env.ALLOW_UNSAFE_LOCAL_EXEC = prevUnsafe;
    await getSandboxCapabilities(true);
  }
});
