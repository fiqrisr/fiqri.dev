// @ts-check

import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import favicons from "astro-favicons";

// https://astro.build/config
export default defineConfig({
  site: "https://fiqri.dev",
  adapter: cloudflare(),
  integrations: [
    react(),
    sitemap(),
    favicons({
      name: "Fiqri Syah Redha",
      short_name: "Fiqri",
      input: {
        favicons: ["public/favicon.png"],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["picomatch", "@astrojs/react > @astrojs/internal-helpers > picomatch"],
      exclude: ["astro-favicons"],
    },
  },
});
