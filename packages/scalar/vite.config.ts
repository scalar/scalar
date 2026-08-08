import { posix } from 'node:path'

import { type Plugin, defineConfig } from 'vite'
import banner from 'vite-plugin-banner'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

import { name, version } from './package.json'

/**
 * Rewrite relative chunk imports to a root-relative, version-pinned path.
 *
 * The whole point of this package is the short bare CDN URL
 * (`https://cdn.jsdelivr.net/npm/@scalar/scalar`). jsDelivr serves that bare URL inline without
 * redirecting to the real file path, so a plain `./chunks/x.js` would resolve against
 * `…/npm/@scalar/` and 404. We can't fix that with a normal relative path — but a root-relative one
 * (leading `/`, no host) resolves against the entry's origin, which is always the CDN, so it works
 * from the bare URL and stays consistent when the URL is version-pinned. The base is derived from
 * `package.json` (name + version); no CDN host or absolute URL is hardcoded.
 */
const rewriteChunkUrls = (): Plugin => {
  const chunkBase = `/npm/${name}@${version}/dist/`

  // Matches the specifier of static imports/re-exports (`from"…"`), side-effect imports (`import"…"`)
  // and dynamic imports (`import("…")`), while ignoring property access like `Array.from("…")`.
  const importSpecifier = /(?<![\w.$])((?:from|import)\s*\(?\s*)(["'])([^"']+)\2/g

  return {
    name: 'scalar:rewrite-chunk-urls',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'chunk') {
          continue
        }

        const fromDir = posix.dirname(file.fileName)

        file.code = file.code.replace(importSpecifier, (match, prefix, quote, specifier) => {
          if (!specifier.startsWith('.')) {
            return match
          }

          // Resolve the relative specifier to a path relative to the dist root, then make it
          // root-relative against the package's published location on the CDN.
          const resolved = posix.normalize(posix.join(fromDir, specifier))
          return `${prefix}${quote}${chunkBase}${resolved}${quote}`
        })
      }
    },
  }
}

const licenseBanner = `/**
 * ${name} ${version}
 *
 * The Scalar API Reference, bundled as a single code-split ES module.
 *
 * Website: https://scalar.com
 * GitHub:  https://github.com/scalar/scalar
 * License: https://github.com/scalar/scalar/blob/main/LICENSE
**/`

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    rewriteChunkUrls(),
    // Inline the bundled CSS and inject it at runtime, tagged with a known id so the runtime can
    // detach it on `destroy()`. `useStrictCSP` lets the injected <style> pick up a CSP nonce from a
    // `<meta property="csp-nonce">` tag. Kept in sync with the standalone build in @scalar/api-reference.
    cssInjectedByJsPlugin({ attributes: { id: 'scalar-style' }, useStrictCSP: true }),
    banner({ outDir: 'dist', content: licenseBanner }),
  ],
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    cssCodeSplit: false,
    lib: {
      entry: { index: 'src/index.ts' },
      name,
      formats: ['es'],
    },
    rolldownOptions: {
      // An ESM bundle loaded via `import` in the browser cannot resolve bare specifiers, so it must
      // be fully self-contained: bundle everything and let tree-shaking drop the unreachable parts.
      treeshake: {
        moduleSideEffects: (id) => id.includes('.css'),
      },
      output: {
        entryFileNames: '[name].js',
        // Lazy chunks ship as siblings under dist/chunks/ with plain relative imports. Loaded from the
        // package's dist path (.../@scalar/scalar/dist/index.js), jsDelivr resolves them correctly, and
        // a pinned entry version stays consistent with its chunks automatically.
        chunkFileNames: 'chunks/[name]-[hash].js',
        // Keep genuinely-async boundaries (API client modal, YAML parser, per-icon imports) as real
        // lazy chunks instead of inlining them into the entry.
        codeSplitting: true,
        // Vite forces `minifyWhitespace: false` for ES library builds; enable Rolldown's native
        // minifier to get a fully-minified bundle.
        minify: true,
      },
    },
  },
})
