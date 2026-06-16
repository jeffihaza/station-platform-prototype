const { fetchArchiveReposts } = require("../../lib/soundcloud.cjs");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false });
  }

  const forceRefresh = req.query?.refresh === "1";
  const result = await fetchArchiveReposts(20, { forceRefresh });
  const status = result.ok ? 200 : 502;
  return res.status(status).json(result);
};
