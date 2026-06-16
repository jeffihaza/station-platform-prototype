import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  handleConfig,
  handleHistory,
  handleSend
} = require("./chat-handlers.cjs");

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });

    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function createMockRes() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

async function finishMockRes(res, response) {
  sendJson(res, response.statusCode || 200, response.payload);
}

export function createChatApiMiddleware(env) {
  process.env.PUSHER_APP_ID = env.PUSHER_APP_ID;
  process.env.PUSHER_KEY = env.PUSHER_KEY;
  process.env.PUSHER_SECRET = env.PUSHER_SECRET;
  process.env.PUSHER_CLUSTER = env.PUSHER_CLUSTER;

  return async (req, res, next) => {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;

    if (!pathname.startsWith("/api/chat")) {
      return next();
    }

    const mockRes = createMockRes();
    const route = pathname.replace("/api/chat", "") || "/";

    try {
      if (route === "/send" && req.method === "POST") {
        req.body = await readRequestBody(req);
        await handleSend(req, mockRes);
        return finishMockRes(res, mockRes);
      }

      if (route === "/history" && req.method === "GET") {
        await handleHistory(req, mockRes);
        return finishMockRes(res, mockRes);
      }

      if (route === "/config" && req.method === "GET") {
        await handleConfig(req, mockRes);
        return finishMockRes(res, mockRes);
      }

      sendJson(res, 404, { ok: false, error: "Not found" });
    } catch {
      sendJson(res, 500, { ok: false, error: "Server error" });
    }
  };
}
