import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lalitasahasranama.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Astro 7 drops spaces between inline tags by default ('jsx'); keep the Astro 5 behaviour, which the templates rely on.
  compressHTML: true,
});
