import { describe, expect, it } from 'vitest'

import { wrapCjsModuleAsEsm } from './cjs-interop'

/**
 * Wrap CommonJS source and import the result as a real ES module, so we assert
 * the actual exported values rather than the shape of the generated source.
 */
const importWrapped = (code: string): Promise<Record<string, unknown> & { default: Record<string, unknown> }> =>
  import(`data:text/javascript;base64,${Buffer.from(wrapCjsModuleAsEsm(code)).toString('base64')}`)

describe('wrapCjsModuleAsEsm', () => {
  it('exposes `module.exports = ...` as the default export', async () => {
    const mod = await importWrapped('module.exports = (value) => `wrapped:${value}`')

    expect((mod.default as unknown as (value: string) => string)('a')).toBe('wrapped:a')
  })

  it('re-exports `exports.name = ...` assignments as named exports', async () => {
    const mod = await importWrapped('exports.value = 1; exports.compute = () => 2;')

    expect(mod.value).toBe(1)
    expect((mod.compute as () => number)()).toBe(2)
    // The named and default views agree, which is what `import * as ns` relies on
    expect(mod.default.value).toBe(1)
  })

  it('also picks up `module.exports.name = ...` assignments', async () => {
    const mod = await importWrapped('module.exports.value = "set";')

    expect(mod.value).toBe('set')
  })

  it('skips `default` and `__esModule` keys so the wrapped module stays valid', async () => {
    // The shape Babel/TS emit: an __esModule marker plus a default export. Emitting
    // `export const default = ...` would be a syntax error, so importing this at all
    // proves those keys are skipped while real named exports still come through.
    const mod = await importWrapped(
      'Object.defineProperty(exports, "__esModule", { value: true }); exports.default = "d"; exports.named = "n";',
    )

    expect(mod.named).toBe('n')
  })
})
