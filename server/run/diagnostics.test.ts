import test from "node:test";
import assert from "node:assert/strict";
import { parseGppDiagnostics } from "./diagnostics.js";

test("parseGppDiagnostics extracts line/col/severity", () => {
  const stderr = [
    "main.cpp:3:11: error: 'cout' was not declared in this scope",
    "main.cpp:5:1: warning: unused variable 'x'",
    "main.cpp:7:5: note: suggested alternative: 'std::cout'",
    "collect2: error: ld returned 1 exit status",
  ].join("\n");
  const d = parseGppDiagnostics(stderr);
  assert.equal(d.length, 3);
  assert.equal(d[0]?.severity, "error");
  assert.equal(d[0]?.line, 3);
  assert.equal(d[0]?.col, 11);
  assert.match(d[0]?.message || "", /cout/);
  assert.equal(d[1]?.severity, "warning");
  assert.equal(d[2]?.severity, "note");
});
