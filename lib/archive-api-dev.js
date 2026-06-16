import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { fetchArchiveReposts } = require("./soundcloud.cjs");

export function createArchiveApiMiddleware() {
  return async (req, res, next) => {
    const url = new URL(req.url, "http://localhost");

    if (url.pathname !== "/api/archive/reposts") {
      return next();
    }

    if (req.method !== "GET") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false }));
      return;
    }

    try {
      const forceRefresh = url.searchParams.get("refresh") === "1";
      const result = await fetchArchiveReposts(20, { forceRefresh });
      res.statusCode = result.ok ? 200 : 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    } catch {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        ok: false,
        error: "Unable to load archive"
      }));
    }
  };
}
