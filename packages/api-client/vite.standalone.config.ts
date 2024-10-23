import vue from '@vitejs/plugin-vue'
import path from 'path'
import banner from 'vite-plugin-banner'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { defineConfig } from 'vitest/config'

import licenseBannerTemplate from './license-banner-template.txt'
import { name, version } from './package.json'

function replaceVariables(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce((content, [key, value]) => {
    return content.replace(new RegExp(`\\{\\{ ${key} \\}\\}`, 'g'), value)
  }, template)
}

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
    'PACKAGE_VERSION': version,
  },
  plugins: [
    vue(),
    cssInjectedByJsPlugin(),
    banner({
      outDir: 'dist/browser',
      content: replaceVariables(licenseBannerTemplate, {
        packageName: name,
        version: version,
      }),
    }),
  ],
  build: {
    emptyOutDir: false,
    outDir: 'dist/standalone',
    commonjsOptions: {
      include: [/node_modules/],
    },
    cssCodeSplit: false,
    minify: 'terser',
    // With the default terserOptions, highlight.js breaks the build.
    // * They’re using terser, too.
    // * Copying their options fixes the build.
    // * `max_line_len: 80` is the one setting that makes the difference.
    //
    // Source: https://github.com/highlightjs/highlight.js/blob/b9ae5fea90514b864f2c9b2889d7d3302d6156dc/tools/build_config.js#L58-L73
    terserOptions: {
      format: {
        max_line_len: 80,
      },
    },
    lib: {
      entry: ['src/layouts/Modal/index.ts'],
      name: '@scalar/api-client',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        manualChunks: () => 'api-client',
      },
    },
  },
  resolve: {
    dedupe: ['vue'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
