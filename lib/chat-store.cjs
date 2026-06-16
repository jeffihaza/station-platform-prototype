const {
  createMessageId,
  isValidUsername,
  sanitizeMessage,
  sanitizeUsername
} = require("./chat-utils.cjs");
const { CHAT_EVENT, triggerChatEvent } = require("./pusher-server.cjs");

const store = {
  messages: []
};

function getHistory() {
  return { messages: store.messages };
}

async function sendMessage({ username, message }) {
  const cleanUsername = sanitizeUsername(username);
  const cleanMessage = sanitizeMessage(message);

  if (!isValidUsername(cleanUsername)) {
    return { ok: false, error: "Invalid username." };
  }

  if (!cleanMessage) {
    return { ok: false, error: "Message cannot be empty." };
  }

  const entry = {
    id: createMessageId(),
    username: cleanUsername,
    message: cleanMessage,
    timestamp: Date.now()
  };

  store.messages.push(entry);

  const triggered = await triggerChatEvent(CHAT_EVENT, entry);

  if (!triggered) {
    console.error("[chat] Pusher trigger failed for message:", entry.id);
    return { ok: false, error: "Realtime delivery failed." };
  }

  return { ok: true, message: entry };
}

module.exports = {
  getHistory,
  sendMessage
};
