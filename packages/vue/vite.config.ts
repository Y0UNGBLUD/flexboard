import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],

  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },

    rollupOptions: {
      external: ["vue", "@flexboard/core"],
    },

    sourcemap: true,
  },
});
