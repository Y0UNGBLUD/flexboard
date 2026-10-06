import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    react(),

    dts({
      insertTypesEntry: true,
    }),

    cssInjectedByJsPlugin(),
  ],

  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },

    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "@flexboard/core"],
    },

    sourcemap: true,

    emptyOutDir: true,
  },

  test: {
    environment: "jsdom",
  },
});
