import { describe, expect, it } from 'vitest'

import { isWrappableCjsModule, wrapCjsModuleAsEsm } from './cjs-interop'

describe('isWrappableCjsModule', () => {
  it('matches the CommonJS modules that break under pnpm', () => {
    // pnpm strict layout paths (the layout that triggers the bug)
    expect(isWrappableCjsModule('/app/node_modules/.pnpm/cookie@1.1.1/node_modules/cookie/dist/index.js')).toBe(true)
    expect(isWrappableCjsModule('/app/node_modules/.pnpm/extend@3.0.2/node_modules/extend/index.js')).toBe(true)
    expect(isWrappableCjsModule('/app/node_modules/.pnpm/highlight.js@11/node_modules/highlight.js/lib/core.js')).toBe(
      true,
    )
  })

  it('ignores unrelated modules', () => {
    expect(isWrappableCjsModule('/app/node_modules/vue/dist/vue.runtime.esm-bundler.js')).toBe(false)
    expect(isWrappableCjsModule('/app/node_modules/cookie/dist/index.d.ts')).toBe(false)
  })
})

describe('wrapCjsModuleAsEsm', () => {
  it('exposes a default export for `module.exports = ...` modules (e.g. extend)', () => {
    const wrapped = wrapCjsModuleAsEsm('module.exports = function extend() { return "merged" }')

    expect(wrapped).toContain('export default module.exports;')
    // `module.exports = fn` style has no named exports to re-export
    expect(wrapped).not.toContain('export const')
  })

  it('re-exports named exports for `exports.name = ...` modules (e.g. cookie)', () => {
    // The shape that caused "exports is not defined" / missing named exports
    const code = [
      'Object.defineProperty(exports, "__esModule", { value: true });',
      'exports.parse = parseCookie;',
      'exports.serialize = stringifySetCookie;',
      'module.exports.stringify = stringifySetCookie;',
    ].join('\n')

    const wrapped = wrapCjsModuleAsEsm(code)

    expect(wrapped).toContain('export default module.exports;')
    expect(wrapped).toContain('export const parse = module.exports["parse"];')
    expect(wrapped).toContain('export const serialize = module.exports["serialize"];')
    expect(wrapped).toContain('export const stringify = module.exports["stringify"];')
    // `__esModule` must not be re-exported as a binding
    expect(wrapped).not.toContain('export const __esModule')
  })

  it('runs the wrapped CommonJS so named exports resolve to real values', async () => {
    const code = [
      'exports.parse = (value) => `parsed:${value}`;',
      'exports.serialize = (name, value) => `${name}=${value}`;',
    ].join('\n')

    // Evaluate the produced ESM as a data-URL module to prove the wrapping works
    const moduleUrl = `data:text/javascript;base64,${Buffer.from(wrapCjsModuleAsEsm(code)).toString('base64')}`
    const mod = (await import(moduleUrl)) as {
      default: { serialize: (name: string, value: string) => string }
      parse: (value: string) => string
      serialize: (name: string, value: string) => string
    }

    expect(mod.parse('a')).toBe('parsed:a')
    expect(mod.serialize('id', '1')).toBe('id=1')
    // Namespace and default access agree (this is what `import * as cookie` relies on)
    expect(mod.default.serialize('id', '1')).toBe('id=1')
  })
})
