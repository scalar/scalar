import vue from '@vitejs/plugin-vue'
import path from 'path'
import { webpackStats } from 'rollup-plugin-webpack-stats'
import banner from 'vite-plugin-banner'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { defineConfig } from 'vitest/config'

// import licenseBannerTemplate from './license-banner-template.txt'
import { name, version } from './package.json'

const replaceVariables = (
  url: string,
  variables: Record<string, string | number>,
) => {
  return Object.entries(variables).reduce((acc, [key, value]) => {
    return acc.replace(`{${key}}`, value.toString())
  }, url)
}

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    vue(),
    cssInjectedByJsPlugin(),
    webpackStats(),
    // banner({
    //   outDir: 'dist/browser',
    //   content: replaceVariables(licenseBannerTemplate, [
    //     {
    //       name: 'packageName',
    //       value: name,
    //     },
    //     {
    //       name: 'version',
    //       value: version,
    //     },
    //   ]),
    // }),
  ],
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    commonjsOptions: {
      include: [/@scalar\/api-reference/, /node_modules/],
    },
    cssCodeSplit: false,
    minify: 'terser',
    lib: {
      entry: ['src/index.ts'],
      name: '@scalar/play-button',
      formats: ['umd'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    alias: [
      // Resolve the uncompiled source code for all @scalar packages
      // It’s working with the alias, too. It’s just required to enable HMR.
      // It also does not match components since we want the built version
      {
        // Resolve the uncompiled source code for all @scalar packages
        // @scalar/* -> packages/*/
        // (not @scalar/*/style.css)
        find: /^@scalar\/(?!(api-reference|openapi-parser|snippetz|galaxy|components\/style\.css|components\b))(.+)/,
        replacement: path.resolve(__dirname, '../$2/src/index.ts'),
      },
    ],
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
