const Pusher = require("pusher");

let pusherInstance = null;

const CHAT_CHANNEL = "radio-chat";
const CHAT_EVENT = "new-message";

function getPusherConfig() {
  return {
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
  };
}

function isPusherConfigured() {
  const config = getPusherConfig();
  return Boolean(
    config.appId &&
    config.key &&
    config.secret &&
    config.cluster
  );
}

function getPusherServer() {
  if (!isPusherConfigured()) {
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher(getPusherConfig());
  }

  return pusherInstance;
}

async function triggerChatEvent(event, payload) {
  const pusher = getPusherServer();
  if (!pusher) {
    console.error("[pusher] server not configured — check PUSHER_* env vars");
    return false;
  }

  try {
    await pusher.trigger(CHAT_CHANNEL, event, payload);
    console.log("[pusher] trigger ok:", CHAT_CHANNEL, event, payload?.id);
    return true;
  } catch (err) {
    console.error("[pusher] trigger failed:", CHAT_CHANNEL, event, err);
    return false;
  }
}

module.exports = {
  CHAT_CHANNEL,
  CHAT_EVENT,
  getPusherConfig,
  getPusherServer,
  isPusherConfigured,
  triggerChatEvent
};
