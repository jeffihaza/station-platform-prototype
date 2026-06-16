const ical = require("node-ical");

const CALENDAR_ID =
  "c57d9a5a721941285feca9b21a3c360258e38b3da6fee794bbe017f7abab37f9@group.calendar.google.com";

const ICS_URL =
  "https://calendar.google.com/calendar/ical/c57d9a5a721941285feca9b21a3c360258e38b3da6fee794bbe017f7abab37f9%40group.calendar.google.com/public/basic.ics";

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_VERSION = 2;
const DEFAULT_LIMIT = 3;
const BLOCKED_TITLES = new Set(["busy", "free"]);

let cache = {
  fetchedAt: 0,
  result: null,
  version: 0
};

function clearScheduleCache() {
  cache = {
    fetchedAt: 0,
    result: null,
    version: 0
  };
}

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

function getShowTitle(event) {
  const candidates = [
    { field: "summary", value: event.summary },
    { field: "title", value: event.title },
    { field: "name", value: event.name }
  ];

  for (const candidate of candidates) {
    if (candidate.value == null) {
      continue;
    }

    const text = String(candidate.value).trim();
    const normalized = text.toLowerCase();

    if (text && !BLOCKED_TITLES.has(normalized)) {
      return text;
    }
  }

  console.warn("[calendar] no usable title found — raw parsed event:", event);
  console.warn("[calendar] title field values:", {
    summary: event.summary ?? null,
    title: event.title ?? null,
    name: event.name ?? null
  });

  for (const candidate of candidates) {
    const text = candidate.value == null ? "" : String(candidate.value).trim();
    if (text) {
      console.warn(`[calendar] blocked or empty title from field "${candidate.field}":`, text);
    }
  }

  return "Untitled Show";
}

function getEventDescription(event) {
  if (!event.description) {
    return null;
  }

  const description = String(event.description).trim();
  const blocked = new Set(["busy", "free"]);

  if (!description || blocked.has(description.toLowerCase())) {
    return null;
  }

  return description;
}

function normalizeEvent(event) {
  const start = event.start instanceof Date ? event.start : new Date(event.start);
  const endValue = event.end || event.start;
  const end = endValue instanceof Date ? endValue : new Date(endValue);

  return {
    title: getShowTitle(event),
    date: formatDate(start),
    startTime: formatTime(start),
    endTime: formatTime(end),
    description: getEventDescription(event),
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

function logParsedEvents(icsData, shows) {
  const vevents = Object.values(icsData).filter((item) => item?.type === "VEVENT");

  console.log("[calendar] events parsed:", vevents.length);

  if (vevents.length === 0) {
    return;
  }

  const first = vevents[0];
  console.log("[calendar] first parsed event:", {
    summary: first.summary ?? null,
    title: first.title ?? null,
    name: first.name ?? null,
    start: first.start ?? null,
    description: first.description ?? null
  });

  if (shows[0]) {
    console.log("[calendar] first upcoming show:", shows[0]);
  }
}

async function fetchUpcomingShows(limit = DEFAULT_LIMIT, options = {}) {
  const { forceRefresh = false } = options;
  const now = Date.now();

  if (forceRefresh) {
    clearScheduleCache();
  }

  if (
    cache.result &&
    cache.version === CACHE_VERSION &&
    now - cache.fetchedAt < CACHE_TTL_MS
  ) {
    return cache.result;
  }

  try {
    console.log("[calendar] fetching ICS URL:", ICS_URL);

    const icsData = await ical.async.fromURL(ICS_URL);
    const shows = parseUpcomingEvents(icsData, limit);
    logParsedEvents(icsData, shows);

    const result = {
      ok: true,
      shows
    };

    cache = {
      fetchedAt: now,
      result,
      version: CACHE_VERSION
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
  clearScheduleCache,
  fetchUpcomingShows,
  getShowTitle
};
