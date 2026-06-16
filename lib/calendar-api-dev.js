import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { fetchUpcomingShows } = require("./calendar.cjs");

export function createCalendarApiMiddleware() {
  return async (req, res, next) => {
    const url = new URL(req.url, "http://localhost");

    if (url.pathname !== "/api/calendar/upcoming") {
      return next();
    }

    if (req.method !== "GET") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false }));
      return;
    }

    try {
      const result = await fetchUpcomingShows(3);
      res.statusCode = result.ok ? 200 : 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    } catch {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        ok: false,
        error: "Unable to load schedule"
      }));
    }
  };
}
