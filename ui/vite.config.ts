import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // ChatGPT widget runtime is browser-only (no Node globals). Some deps (e.g. React)
  // reference `process.env.NODE_ENV`, so replace it at build time.
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  plugins: [tailwindcss(), react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false, // CSSを1本にまとめる
    lib: {
      entry: "src/widget.tsx",
      formats: ["es"],
      fileName: () => "widget.js",
    },
  },
});
