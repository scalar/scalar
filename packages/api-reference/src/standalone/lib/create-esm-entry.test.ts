import { describe, expect, it } from 'vitest'

import { createEsmEntry } from './create-esm-entry'

describe('createEsmEntry', () => {
  it('bakes the given version into the entry point', () => {
    expect(createEsmEntry('1.2.3')).toContain('const version = "1.2.3"')
  })

  it('pins the bundle to that version on jsDelivr', () => {
    const source = createEsmEntry('1.2.3')

    expect(source).toContain('jsdelivr\\.net$')
    expect(source).toContain("'/npm/@scalar/api-reference@' + version + '/dist/browser/standalone.esm.js'")
  })

  it('keeps the bundle next to the entry point everywhere else', () => {
    expect(createEsmEntry('1.2.3')).toContain("new URL('./dist/browser/standalone.esm.js', url).href")
  })

  it('re-exports createApiReference from the bundle', () => {
    const source = createEsmEntry('1.2.3')

    expect(source).toContain('const { createApiReference } = await import(bundle)')
    expect(source).toContain('export { createApiReference }')
  })
})
