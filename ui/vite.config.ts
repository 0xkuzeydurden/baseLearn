import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
      "#artifacts": resolve(rootDir, "../artifacts")
    }
  },
  server: {
    fs: {
      // allow the dev server to import compiled artifacts from the Hardhat root
      allow: [resolve(rootDir, "..")]
    }
  }
});
