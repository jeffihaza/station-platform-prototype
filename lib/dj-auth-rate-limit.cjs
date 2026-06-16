const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;
const FAIL_DELAY_MS = 1_000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enforceRateLimit(key) {
  const now = Date.now();
  const record = attempts.get(key) || { count: 0, windowStart: now };

  if (now - record.windowStart > WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }

  if (record.count >= MAX_ATTEMPTS) {
    const waitMs = Math.min(
      FAIL_DELAY_MS * record.count,
      WINDOW_MS
    );
    await delay(waitMs);
    record.count = 0;
    record.windowStart = Date.now();
  }

  attempts.set(key, record);
  return record;
}

async function recordFailedAttempt(key) {
  const record = attempts.get(key) || { count: 0, windowStart: Date.now() };
  record.count += 1;
  attempts.set(key, record);
  await delay(FAIL_DELAY_MS);
}

function clearAttempts(key) {
  attempts.delete(key);
}

function verifyDjPassword(submitted, expected) {
  if (!expected || typeof submitted !== "string") {
    return false;
  }

  return submitted === expected;
}

module.exports = {
  clearAttempts,
  enforceRateLimit,
  recordFailedAttempt,
  verifyDjPassword
};
