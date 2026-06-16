const Pusher = require("pusher");

let pusherInstance = null;

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

const CHAT_CHANNEL = "123radio-chat";

function triggerChatEvent(event, payload) {
  const pusher = getPusherServer();
  if (!pusher) {
    return false;
  }

  pusher.trigger(CHAT_CHANNEL, event, payload);
  return true;
}

module.exports = {
  CHAT_CHANNEL,
  getPusherConfig,
  getPusherServer,
  isPusherConfigured,
  triggerChatEvent
};
