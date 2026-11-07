import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeNextPath, readNextFromSearch } from "./safeNextPath.ts";

describe("safeNextPath", () => {
  it("allows known app paths", () => {
    assert.equal(safeNextPath("/sandbox"), "/sandbox");
    assert.equal(safeNextPath("/lessons"), "/lessons");
    assert.equal(safeNextPath("/dashboard?tab=1"), "/dashboard?tab=1");
  });

  it("rejects open redirects", () => {
    assert.equal(safeNextPath("https://evil.example"), "/lessons");
    assert.equal(safeNextPath("//evil.example"), "/lessons");
    assert.equal(safeNextPath("/\\evil"), "/lessons");
    assert.equal(safeNextPath("/login"), "/lessons");
    assert.equal(safeNextPath("/unknown"), "/lessons");
  });

  it("reads next from search", () => {
    assert.equal(readNextFromSearch("?next=%2Fsandbox"), "/sandbox");
    assert.equal(readNextFromSearch(""), "/lessons");
  });
});
