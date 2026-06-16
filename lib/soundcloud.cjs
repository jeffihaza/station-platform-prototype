const DEFAULT_PROFILE_URL =
  "https://soundcloud.com/watergunskillpeople/reposts";

const CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_LIMIT = 20;

let cache = {
  fetchedAt: 0,
  profileUrl: "",
  result: null
};

function clearArchiveCache() {
  cache = {
    fetchedAt: 0,
    profileUrl: "",
    result: null
  };
}

function getProfileUrl() {
  return (process.env.SOUNDCLOUD_PROFILE_URL || DEFAULT_PROFILE_URL).trim();
}

function formatDate(iso) {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function buildEmbedUrl(permalinkUrl) {
  const params = new URLSearchParams({
    visual: "true",
    url: permalinkUrl,
    show_artwork: "true",
    auto_play: "false",
    hide_related: "true",
    show_comments: "false",
    show_user: "true",
    show_reposts: "false",
    show_teaser: "false"
  });

  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; 123radio-archive/1.0)"
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return res.text();
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; 123radio-archive/1.0)"
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return res.json();
}

function parseHydration(html) {
  const match = html.match(/window\.__sc_hydration\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) {
    throw new Error("SoundCloud hydration data not found");
  }

  const hydration = JSON.parse(match[1]);
  const apiClient = hydration.find((entry) => entry.hydratable === "apiClient");
  const user = hydration.find((entry) => entry.hydratable === "user");

  const clientId = apiClient?.data?.id;
  const userId = user?.data?.id;

  if (!clientId || !userId) {
    throw new Error("SoundCloud client or user id missing from page");
  }

  return { clientId, userId };
}

function getRepostResource(item) {
  if (item.type === "track-repost" && item.track) {
    return {
      kind: "track",
      title: item.track.title,
      permalinkUrl: item.track.permalink_url,
      artworkUrl: item.track.artwork_url || null,
      date: item.created_at || item.track.display_date || item.track.created_at
    };
  }

  if (item.type === "playlist-repost" && item.playlist) {
    return {
      kind: "playlist",
      title: item.playlist.title,
      permalinkUrl: item.playlist.permalink_url,
      artworkUrl: item.playlist.artwork_url || null,
      date: item.created_at || item.playlist.created_at
    };
  }

  return null;
}

async function fetchOEmbed(permalinkUrl) {
  const oembedUrl =
    "https://soundcloud.com/oembed?" +
    new URLSearchParams({
      url: permalinkUrl,
      format: "json"
    }).toString();

  const data = await fetchJson(oembedUrl);

  return {
    title: data.title || null,
    artworkUrl: data.thumbnail_url || null,
    embedHtml: data.html || null
  };
}

async function normalizeRepost(item) {
  const resource = getRepostResource(item);
  if (!resource?.permalinkUrl) {
    return null;
  }

  let title = resource.title?.trim() || null;
  let artworkUrl = resource.artworkUrl || null;

  if (!title || !artworkUrl) {
    try {
      const oembed = await fetchOEmbed(resource.permalinkUrl);
      title = title || oembed.title;
      artworkUrl = artworkUrl || oembed.artworkUrl;
    } catch (err) {
      console.warn("[archive] oEmbed fallback failed:", resource.permalinkUrl, err.message);
    }
  }

  if (!title) {
    return null;
  }

  return {
    id: item.uuid || resource.permalinkUrl,
    title,
    url: resource.permalinkUrl,
    artworkUrl,
    date: formatDate(resource.date),
    embedUrl: buildEmbedUrl(resource.permalinkUrl),
    kind: resource.kind
  };
}

async function fetchArchiveReposts(limit = DEFAULT_LIMIT, options = {}) {
  const { forceRefresh = false } = options;
  const profileUrl = getProfileUrl();
  const now = Date.now();

  if (forceRefresh) {
    clearArchiveCache();
  }

  if (
    cache.result &&
    cache.profileUrl === profileUrl &&
    now - cache.fetchedAt < CACHE_TTL_MS
  ) {
    return cache.result;
  }

  try {
    console.log("[archive] fetching SoundCloud profile:", profileUrl);

    const html = await fetchText(profileUrl);
    const { clientId, userId } = parseHydration(html);

    const repostsUrl =
      "https://api-v2.soundcloud.com/stream/users/" +
      `${userId}/reposts?` +
      new URLSearchParams({
        limit: String(limit),
        client_id: clientId
      }).toString();

    const repostsData = await fetchJson(repostsUrl);
    const collection = Array.isArray(repostsData?.collection)
      ? repostsData.collection
      : [];

    const shows = (
      await Promise.all(collection.map((item) => normalizeRepost(item)))
    ).filter(Boolean);

    const result = {
      ok: true,
      shows
    };

    cache = {
      fetchedAt: now,
      profileUrl,
      result
    };

    console.log("[archive] loaded reposts:", shows.length);
    return result;
  } catch (err) {
    console.error("[archive] failed to load SoundCloud reposts:", err.message);
    return {
      ok: false,
      error: "Unable to load archive"
    };
  }
}

module.exports = {
  DEFAULT_PROFILE_URL,
  clearArchiveCache,
  fetchArchiveReposts,
  getProfileUrl
};
