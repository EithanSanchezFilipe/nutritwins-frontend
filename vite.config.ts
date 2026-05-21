import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dotenv from "dotenv";

dotenv.config();

const viteApiBaseUrl = process.env.VITE_API_BASE_URL;
console.log("[vite] VITE_API_BASE_URL=", viteApiBaseUrl || "<not set>");

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target: viteApiBaseUrl || "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
