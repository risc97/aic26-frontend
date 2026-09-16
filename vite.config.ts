import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), tailwindcss()],
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
