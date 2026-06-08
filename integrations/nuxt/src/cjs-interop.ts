/**
 * Helpers that smooth over CommonJS dependencies which break Vite's ESM handling
 * under pnpm's strict node_modules layout.
 *
 * When @scalar/nuxt is installed with pnpm (without `shamefully-hoist`), several
 * transitive CommonJS dependencies are not reliably pre-bundled by Vite and get
 * served raw. In the browser that surfaces as `exports is not defined` (for
 * example `cookie`), and during SSR as missing-export errors (for example
 * `extend`, pulled in via `unified`). We wrap those modules in a CommonJS context
 * and re-expose proper ESM default and named exports.
 */

/**
 * File-path fragments of the CommonJS modules we wrap. Matching on the path keeps
 * this importer-agnostic, so it also covers copies that are pulled in transitively
 * (for example `extend` via `unified`, rather than directly by a @scalar package).
 */
const CJS_MODULE_PATHS = [
  '/highlight.js/lib/core.js',
  '/node_modules/extend/index.js',
  '/node_modules/cookie/dist/index.js',
]

/** Whether the given module id is one of the CommonJS modules we need to wrap. */
export const isWrappableCjsModule = (id: string): boolean => CJS_MODULE_PATHS.some((moduleId) => id.includes(moduleId))

/**
 * Wrap CommonJS source in a module/exports context and re-export it as ESM.
 *
 * The named exports are required for consumers that use `import { x } from '...'`
 * or `import * as ns from '...'` (for example `import * as cookie from 'cookie'`,
 * where a default-only export is not enough).
 */
export const wrapCjsModuleAsEsm = (code: string): string => {
  // Collect the names assigned to `exports`/`module.exports` so they can be
  // re-exported as named ESM exports.
  const namedExports = new Set<string>()
  for (const match of code.matchAll(/(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=/g)) {
    const name = match[1]
    if (name && name !== '__esModule' && name !== 'default') {
      namedExports.add(name)
    }
  }

  return [
    'const module = { exports: {} };',
    'const exports = module.exports;',
    '(function (module, exports) {',
    code,
    '})(module, exports);',
    'export default module.exports;',
    ...[...namedExports].map((name) => `export const ${name} = module.exports[${JSON.stringify(name)}];`),
  ].join('\n')
}
