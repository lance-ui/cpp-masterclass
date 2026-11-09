import fs from "node:fs";
import path from "node:path";
import session from "express-session";

/** Safe filename for a session id (blocks path traversal). */
function sessionFileName(sid: string): string {
  const safe = sid.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${safe}.json`;
}

/**
 * Minimal file-backed express-session store so logins survive API restarts.
 * Matches the project's JSON-on-disk pattern (no Redis required for single-node).
 */
export class FileSessionStore extends session.Store {
  private readonly dir: string;

  constructor(dir: string) {
    super();
    this.dir = dir;
    fs.mkdirSync(this.dir, { recursive: true });
  }

  private filePath(sid: string): string {
    return path.join(this.dir, sessionFileName(sid));
  }

  get(
    sid: string,
    callback: (err: any, session?: session.SessionData | null) => void,
  ): void {
    const file = this.filePath(sid);
    fs.readFile(file, "utf8", (err, raw) => {
      if (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          callback(null, null);
          return;
        }
        callback(err);
        return;
      }
      try {
        const parsed = JSON.parse(raw) as {
          cookie: session.Cookie;
          expires?: string | number | Date | null;
        } & session.SessionData;
        const expires = parsed.cookie?.expires ?? parsed.expires;
        if (expires) {
          const expMs = new Date(expires as string | number | Date).getTime();
          if (Number.isFinite(expMs) && expMs <= Date.now()) {
            fs.unlink(file, () => callback(null, null));
            return;
          }
        }
        callback(null, parsed);
      } catch (parseErr) {
        callback(parseErr);
      }
    });
  }

  set(
    sid: string,
    sess: session.SessionData,
    callback?: (err?: any) => void,
  ): void {
    const file = this.filePath(sid);
    const tmp = `${file}.${process.pid}.tmp`;
    let payload: string;
    try {
      payload = JSON.stringify(sess);
    } catch (err) {
      callback?.(err);
      return;
    }
    fs.writeFile(tmp, payload, "utf8", (writeErr) => {
      if (writeErr) {
        callback?.(writeErr);
        return;
      }
      fs.rename(tmp, file, (renameErr) => {
        if (renameErr) {
          fs.unlink(tmp, () => undefined);
          callback?.(renameErr);
          return;
        }
        callback?.();
      });
    });
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    fs.unlink(this.filePath(sid), (err) => {
      if (err && (err as NodeJS.ErrnoException).code !== "ENOENT") {
        callback?.(err);
        return;
      }
      callback?.();
    });
  }

  touch(
    sid: string,
    sess: session.SessionData,
    callback?: (err?: any) => void,
  ): void {
    this.set(sid, sess, callback);
  }
}
