import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lalitasahasranama.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
