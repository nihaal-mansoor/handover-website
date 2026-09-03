// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  site: "https://dubairealestateadvice.com",
  output: "static",
  integrations: [sitemap(), icon({ include: { lucide: ["*"] } })],
  vite: { plugins: [tailwind()] },
  build: { inlineStylesheets: "auto" },
  compressHTML: true,
  prefetch: false,
});
