const {
  clearAttempts,
  enforceRateLimit,
  recordFailedAttempt,
  verifyDjPassword
} = require("../lib/dj-auth-rate-limit.cjs");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const expectedPassword = process.env.DJ_PASSWORD;

  if (!expectedPassword) {
    return res.status(500).json({ ok: false });
  }

  const clientKey =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  await enforceRateLimit(clientKey);

  const { password } = req.body || {};
  const ok = verifyDjPassword(password, expectedPassword);

  if (!ok) {
    await recordFailedAttempt(clientKey);
    return res.status(401).json({ ok: false });
  }

  clearAttempts(clientKey);
  return res.status(200).json({ ok: true });
};
