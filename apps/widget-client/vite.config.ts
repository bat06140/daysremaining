import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import macros from "vite-plugin-babel-macros";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ command }) => ({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
    macros(),
    ...(command === "build" ? [viteSingleFile()] : []),
    svgr({
      include: "**/*.svg",
    }),
  ],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:3001",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
