import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createDjAuthMiddleware } from "./lib/dj-auth-dev.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

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
