import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createDjAuthMiddleware } from "./lib/dj-auth-dev.js";
import { createChatApiMiddleware } from "./lib/chat-api-dev.js";
import { createCalendarApiMiddleware } from "./lib/calendar-api-dev.js";
import { createArchiveApiMiddleware } from "./lib/archive-api-dev.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (!env.DJ_PASSWORD) {
    console.warn(
      "[dj-auth] DJ_PASSWORD is not set. Copy .env.example to .env.local for local dev."
    );
  }

  if (!env.PUSHER_APP_ID) {
    console.warn(
      "[chat] Server Pusher env vars missing. Add PUSHER_* to .env.local."
    );
  }

  if (!env.VITE_PUSHER_KEY) {
    console.warn("[chat] Missing environment variable: VITE_PUSHER_KEY");
  }

  if (!env.VITE_PUSHER_CLUSTER) {
    console.warn("[chat] Missing environment variable: VITE_PUSHER_CLUSTER");
  }

  return {
    plugins: [
      react(),
      {
        name: "dj-auth-api",
        configureServer(server) {
          server.middlewares.use(
            createDjAuthMiddleware(env.DJ_PASSWORD)
          );
          server.middlewares.use(
            createChatApiMiddleware(env)
          );
          server.middlewares.use(
            createCalendarApiMiddleware()
          );
          server.middlewares.use(
            createArchiveApiMiddleware()
          );
        }
      }
    ]
  };
});
