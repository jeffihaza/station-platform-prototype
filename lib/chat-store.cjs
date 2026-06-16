const {
  MAX_MESSAGE_LENGTH,
  createMessageId,
  isValidUsername,
  sanitizeMessage,
  sanitizeUsername
} = require("./chat-utils.cjs");
const { triggerChatEvent } = require("./pusher-server.cjs");

const store = {
  messages: []
};

function getHistory() {
  return { messages: store.messages };
}

function sendMessage({ username, message }) {
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
  triggerChatEvent("new-message", entry);

  return { ok: true, message: entry };
}

module.exports = {
  getHistory,
  sendMessage
};
