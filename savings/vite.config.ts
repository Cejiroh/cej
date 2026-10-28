import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// base './' lets the build work from any GitHub Pages sub-path (user.github.io/repo/)
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
