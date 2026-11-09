import assert from "node:assert/strict";
import test from "node:test";
import {
  isProgressEmpty,
  parseProgressBody,
} from "./usersStore.js";

test("parseProgressBody accepts a valid progress payload", () => {
  const parsed = parseProgressBody({
    bookmarkedModuleIds: ["m1"],
    completedModuleIds: ["m1", "m2"],
    quizScores: { m1: 80 },
    recentModuleIds: ["m2", "m1"],
    notes: { m1: "review pointers" },
  });
  assert.ok(parsed);
  assert.deepEqual(parsed.completedModuleIds, ["m1", "m2"]);
  assert.equal(parsed.quizScores.m1, 80);
  assert.equal(parsed.notes.m1, "review pointers");
});

test("parseProgressBody rejects invalid shapes", () => {
  assert.equal(parseProgressBody(null), null);
  assert.equal(parseProgressBody({ completedModuleIds: [1, 2] }), null);
  assert.equal(parseProgressBody({ quizScores: { m1: "80" } }), null);
});

test("isProgressEmpty detects blank progress", () => {
  assert.equal(
    isProgressEmpty({
      bookmarkedModuleIds: [],
      completedModuleIds: [],
      quizScores: {},
      recentModuleIds: [],
      notes: {},
    }),
    true,
  );
  assert.equal(
    isProgressEmpty({
      bookmarkedModuleIds: [],
      completedModuleIds: ["m1"],
      quizScores: {},
      recentModuleIds: [],
      notes: {},
    }),
    false,
  );
});
