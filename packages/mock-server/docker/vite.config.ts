import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  ssr: {
    noExternal: true,
    target: 'node',
  },
  build: {
    ssr: true,
    minify: true,
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      input: 'src/docker-entrypoint.ts',
      output: {
        format: 'es',
        entryFileNames: 'docker-entrypoint.js',
      },
    },
  },
})
