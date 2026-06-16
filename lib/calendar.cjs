const ical = require("node-ical");

const CALENDAR_ID =
  "c57d9a5a721941285feca9b21a3c360258e38b3da6fee794bbe017f7abab37f9@group.calendar.google.com";

const ICS_URL =
  "https://calendar.google.com/calendar/ical/c57d9a5a721941285feca9b21a3c360258e38b3da6fee794bbe017f7abab37f9%40group.calendar.google.com/public/basic.ics";

const PUBLIC_CALENDAR_URL =
  "https://calendar.google.com/calendar/embed?src=" +
  encodeURIComponent(CALENDAR_ID);

const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_LIMIT = 3;

let cache = {
  fetchedAt: 0,
  result: null
};

function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function normalizeEvent(event) {
  const start = event.start instanceof Date ? event.start : new Date(event.start);
  const endValue = event.end || event.start;
  const end = endValue instanceof Date ? endValue : new Date(endValue);

  return {
    title: (event.summary || "Untitled Show").trim(),
    date: formatDate(start),
    startTime: formatTime(start),
    endTime: formatTime(end),
    description: event.description ? String(event.description).trim() : null,
    startMs: start.getTime(),
    endMs: end.getTime()
  };
}

function parseUpcomingEvents(icsData, limit = DEFAULT_LIMIT) {
  const now = Date.now();
  const events = [];

  for (const item of Object.values(icsData)) {
    if (!item || item.type !== "VEVENT") {
      continue;
    }

    const normalized = normalizeEvent(item);

    if (normalized.endMs >= now) {
      events.push(normalized);
    }
  }

  events.sort((a, b) => a.startMs - b.startMs);

  return events.slice(0, limit).map(({ startMs, endMs, ...show }) => show);
}

async function fetchUpcomingShows(limit = DEFAULT_LIMIT) {
  const now = Date.now();

  if (cache.result && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.result;
  }

  try {
    const icsData = await ical.async.fromURL(ICS_URL);
    const shows = parseUpcomingEvents(icsData, limit);
    const result = {
      ok: true,
      shows,
      calendarUrl: PUBLIC_CALENDAR_URL
    };

    cache = {
      fetchedAt: now,
      result
    };

    return result;
  } catch (err) {
    console.error("[calendar] failed to load ICS feed:", err.message);
    return {
      ok: false,
      error: "Unable to load schedule"
    };
  }
}

module.exports = {
  CALENDAR_ID,
  ICS_URL,
  PUBLIC_CALENDAR_URL,
  fetchUpcomingShows
};
