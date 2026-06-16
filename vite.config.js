import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createDjAuthMiddleware } from "./lib/dj-auth-dev.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (!env.DJ_PASSWORD) {
    console.warn(
      "[dj-auth] DJ_PASSWORD is not set. Copy .env.example to .env.local for local dev."
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
        }
      }
    ]
  };
});
