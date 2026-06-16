const { fetchUpcomingShows } = require("../../lib/calendar.cjs");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false });
  }

  const result = await fetchUpcomingShows(3);
  const status = result.ok ? 200 : 502;
  return res.status(status).json(result);
};
