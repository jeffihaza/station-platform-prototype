const MAX_MESSAGE_LENGTH = 300;

function sanitizeUsername(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 32);
}

function sanitizeMessage(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, MAX_MESSAGE_LENGTH);
}

function isValidUsername(username) {
  return username.length >= 2 && username.length <= 32;
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

module.exports = {
  MAX_MESSAGE_LENGTH,
  createMessageId,
  isValidUsername,
  sanitizeMessage,
  sanitizeUsername
};
