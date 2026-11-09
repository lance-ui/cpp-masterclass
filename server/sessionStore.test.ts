import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type session from "express-session";
import { FileSessionStore } from "./sessionStore.js";

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cpp-mc-sessions-"));
}

test("FileSessionStore round-trips a session", async () => {
  const dir = tmpDir();
  const store = new FileSessionStore(dir);
  const sid = "abc123";
  const sess = {
    cookie: { originalMaxAge: 1000, expires: new Date(Date.now() + 60_000) },
    userId: "user-1",
  } as session.SessionData;

  await new Promise<void>((resolve, reject) => {
    store.set(sid, sess, (err) => (err ? reject(err) : resolve()));
  });

  const loaded = await new Promise<session.SessionData | null | undefined>(
    (resolve, reject) => {
      store.get(sid, (err, value) => (err ? reject(err) : resolve(value)));
    },
  );
  assert.equal((loaded as { userId?: string } | null)?.userId, "user-1");

  await new Promise<void>((resolve, reject) => {
    store.destroy(sid, (err) => (err ? reject(err) : resolve()));
  });

  const after = await new Promise<session.SessionData | null | undefined>(
    (resolve, reject) => {
      store.get(sid, (err, value) => (err ? reject(err) : resolve(value)));
    },
  );
  assert.equal(after ?? null, null);

  fs.rmSync(dir, { recursive: true, force: true });
});

test("FileSessionStore drops expired sessions", async () => {
  const dir = tmpDir();
  const store = new FileSessionStore(dir);
  const sid = "expired-1";
  const sess = {
    cookie: { originalMaxAge: 1000, expires: new Date(Date.now() - 1000) },
    userId: "user-old",
  } as session.SessionData;

  await new Promise<void>((resolve, reject) => {
    store.set(sid, sess, (err) => (err ? reject(err) : resolve()));
  });

  const loaded = await new Promise<session.SessionData | null | undefined>(
    (resolve, reject) => {
      store.get(sid, (err, value) => (err ? reject(err) : resolve(value)));
    },
  );
  assert.equal(loaded ?? null, null);
  fs.rmSync(dir, { recursive: true, force: true });
});
