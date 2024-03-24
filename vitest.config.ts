import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", "lib/seed.ts"],
  },
  resolve: {
    alias: [{ find: "@", replacement: resolve(__dirname) }],
  },
});
