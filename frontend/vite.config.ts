import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({ include: ["buffer", "process", "stream", "util"] }),
    wasm(),
  ],
  resolve: {
    alias: {
      "@midnight-ntwrk/compact-runtime": resolve(
        __dirname,
        "node_modules/@midnight-ntwrk/compact-runtime/dist/index.js",
      ),
      "isomorphic-ws": resolve(__dirname, "src/shims/isomorphic-ws.ts"),
      "cross-fetch": resolve(__dirname, "src/shims/cross-fetch.ts"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    target: "esnext",
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [".", resolve(__dirname, "../contracts")],
    },
  },
});
