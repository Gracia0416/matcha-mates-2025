import { defineConfig } from 'vite';
import vinext from 'vinext';
import { cloudflare } from '@cloudflare/vite-plugin';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: [{ find: /^(?:\.\.\/)*chatgpt-auth$/, replacement: fileURLToPath(new URL('./lib/cloudflare-auth.ts', import.meta.url)) }],
  },
  plugins: [vinext(), cloudflare({
    configPath: './wrangler.cloudflare.jsonc',
    viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
    inspectorPort: false,
  })],
});
