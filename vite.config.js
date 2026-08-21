import { defineConfig } from 'vite'

// The library is built by tsc (`npm run build`), not by Vite.
// Vite only serves the demo (`npm run dev`) and builds it (`npm run build:demo`).
export default defineConfig(({ command, mode }) => {
  const demo = command === 'serve' || mode === 'demo'

  if (!demo) return { root: '.' }

  return {
    root: 'src/demo',
    // relative asset URLs, so the build works from any path (a GitHub Pages project
    // subpath like /picoui/, a domain root, a preview URL, …)
    base: './',
    build: {
      outDir: '../../dist-demo',
      emptyOutDir: true,
    },
  }
});
