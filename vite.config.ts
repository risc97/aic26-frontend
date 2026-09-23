import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'child_process';
import { defineConfig } from 'vite'

let commit = 'unknown';
try {
  commit = execSync('git rev-parse --short HEAD').toString().trim();
} catch {}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  define: {
    __BUILD_COMMIT__: JSON.stringify(commit),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  build: {
    minify: 'terser',
    sourcemap: false,
    terserOptions: {
      mangle: {
        keep_classnames: false,
        keep_fnames: false,
        toplevel: false,
        module: false,
      },
    }
  }
})
