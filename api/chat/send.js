const { handleSend } = require("../../lib/chat-handlers.cjs");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  return handleSend(req, res);
};
