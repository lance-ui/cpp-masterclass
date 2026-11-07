import type { Express, Request, Response } from "express";
import {
  executeCpp,
  getSandboxCapabilities,
  RunValidationError,
  SandboxUnavailableError,
} from "./execute.js";
import { loadExecuteLimits } from "./limits.js";
import { ConcurrencyGate, RateLimiter } from "./rateLimit.js";
import type { PublicUser } from "../usersStore.js";

type SessionUserFn = (req: Request) => PublicUser | null;

export interface RunControllers {
  rateLimiter: RateLimiter;
  concurrencyGate: ConcurrencyGate;
}

export function createRunControllers(): RunControllers {
  const limits = loadExecuteLimits();
  return {
    rateLimiter: new RateLimiter(limits.rateLimitPerMinute),
    concurrencyGate: new ConcurrencyGate(limits.maxConcurrentRuns),
  };
}

export function registerRunRoutes(
  app: Express,
  sessionUser: SessionUserFn,
  controllers: RunControllers = createRunControllers(),
): RunControllers {
  const limits = loadExecuteLimits();
  const { rateLimiter, concurrencyGate } = controllers;

  app.get("/api/run/status", async (_req, res) => {
    const caps = await getSandboxCapabilities();
    res.json({
      ready: caps.mode !== "none" || caps.allowUnsafeLocal,
      sandbox: caps,
      limits: {
        maxCodeBytes: limits.maxCodeBytes,
        maxStdinBytes: limits.maxStdinBytes,
        compileTimeoutMs: limits.compileTimeoutMs,
        runTimeoutMs: limits.runTimeoutMs,
        maxOutputBytes: limits.maxOutputBytes,
        maxConcurrentRuns: limits.maxConcurrentRuns,
        rateLimitPerMinute: limits.rateLimitPerMinute,
        interactiveTimeoutMs: limits.interactiveTimeoutMs,
        interactiveIdleTimeoutMs: limits.interactiveIdleTimeoutMs,
      },
      interactive: { websocketPath: "/api/run/ws" },
    });
  });

  app.post("/api/run", async (req: Request, res: Response) => {
    const user = sessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Sign in required to run code." });
      return;
    }

    if (!rateLimiter.allow(user.id)) {
      res.status(429).json({
        error: `Rate limit: max ${limits.rateLimitPerMinute} runs per minute.`,
      });
      return;
    }

    const release = concurrencyGate.tryAcquire();
    if (!release) {
      res.status(429).json({
        error: "Compiler busy — too many concurrent runs. Try again shortly.",
      });
      return;
    }

    try {
      const result = await executeCpp({
        code: req.body?.code,
        stdin: req.body?.stdin,
        options: {
          memoryChecks: Boolean(req.body?.options?.memoryChecks),
        },
      });
      res.json(result);
    } catch (err) {
      if (err instanceof RunValidationError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      if (err instanceof SandboxUnavailableError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      console.error("[api/run]", err);
      res.status(500).json({
        error: "Could not compile or run that program. Try again.",
      });
    } finally {
      release();
    }
  });

  return controllers;
}
