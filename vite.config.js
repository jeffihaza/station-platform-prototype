import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createDjAuthMiddleware } from "./lib/dj-auth-dev.js";
import { createChatApiMiddleware } from "./lib/chat-api-dev.js";

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
    console.warn(
      "[chat] Client Pusher env vars missing. Add VITE_PUSHER_KEY and VITE_PUSHER_CLUSTER to .env.local."
    );
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
        }
      }
    ]
  };
});
