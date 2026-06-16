const { getHistory, sendMessage } = require("./chat-store.cjs");
const { getPusherConfig, isPusherConfigured } = require("./pusher-server.cjs");

function requirePusher(res) {
  if (!isPusherConfigured()) {
    res.status(500).json({ error: "Pusher env vars missing" });
    return false;
  }

  return true;
}

async function handleSend(req, res) {
  if (!requirePusher(res)) {
    return;
  }

  const { username, message } = req.body || {};
  const result = sendMessage({ username, message });

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.status(200).json(result);
}

async function handleHistory(req, res) {
  if (!requirePusher(res)) {
    return;
  }

  return res.status(200).json(getHistory());
}

async function handleConfig(req, res) {
  if (!requirePusher(res)) {
    return;
  }

  const config = getPusherConfig();

  return res.status(200).json({
    key: config.key,
    cluster: config.cluster
  });
}

module.exports = {
  handleConfig,
  handleHistory,
  handleSend
};
