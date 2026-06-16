import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  clearAttempts,
  enforceRateLimit,
  recordFailedAttempt,
  verifyDjPassword
} = require("./dj-auth-rate-limit.cjs");

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });

    req.on("error", reject);
  });
}

export function createDjAuthMiddleware(expectedPassword) {
  return async (req, res, next) => {
    if (req.url !== "/api/dj-auth" && !req.url?.startsWith("/api/dj-auth?")) {
      return next();
    }

    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false }));
      return;
    }

    if (!expectedPassword) {
      console.warn("[dj-auth] DJ_PASSWORD is not set.");
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "DJ_PASSWORD env var missing" }));
      return;
    }

    const clientKey = req.socket.remoteAddress || "local";

    try {
      await enforceRateLimit(clientKey);

      const body = await readJsonBody(req);
      const ok = verifyDjPassword(body.password, expectedPassword);

      if (!ok) {
        await recordFailedAttempt(clientKey);
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false }));
        return;
      }

      clearAttempts(clientKey);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false }));
    }
  };
}
