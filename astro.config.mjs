// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://uma-calendar.vercel.app',
  integrations: [react()],
  trailingSlash: 'ignore',
});
