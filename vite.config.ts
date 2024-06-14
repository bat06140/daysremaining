import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import macros from "vite-plugin-babel-macros";
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
    macros(),
    viteSingleFile()
  ],
});
