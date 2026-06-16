const { handleHistory } = require("../../lib/chat-handlers.cjs");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false });
  }

  return handleHistory(req, res);
};
