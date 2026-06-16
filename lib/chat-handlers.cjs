const { getHistory, sendMessage } = require("./chat-store.cjs");
const { getPusherConfig } = require("./pusher-server.cjs");

function getMissingPusherEnvVars() {
  const missing = [];

  if (!process.env.PUSHER_APP_ID) {
    missing.push("PUSHER_APP_ID");
  }
  if (!process.env.PUSHER_KEY) {
    missing.push("PUSHER_KEY");
  }
  if (!process.env.PUSHER_SECRET) {
    missing.push("PUSHER_SECRET");
  }
  if (!process.env.PUSHER_CLUSTER) {
    missing.push("PUSHER_CLUSTER");
  }

  return missing;
}

function requirePusher(res) {
  const missing = getMissingPusherEnvVars();

  if (missing.length > 0) {
    console.error(
      "[chat] Missing server environment variable(s):",
      missing.join(", ")
    );
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
  const result = await sendMessage({ username, message });

  console.log("[chat] send API result:", result.ok ? "ok" : "fail", result.message?.id || result.error);

  if (!result.ok) {
    const status = result.error === "Realtime delivery failed." ? 502 : 400;
    return res.status(status).json(result);
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
