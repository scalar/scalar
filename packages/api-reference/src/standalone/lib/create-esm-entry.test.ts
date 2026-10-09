import { describe, expect, it } from 'vitest'

import { createEsmEntry } from './create-esm-entry'

describe('createEsmEntry', () => {
  it.each([
    [
      'https://cdn.jsdelivr.net/npm/@scalar/api-reference/esm.js',
      'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.2.3/dist/browser/standalone.esm.js',
    ],
    [
      'https://unpkg.com/@scalar/api-reference/esm.js',
      'https://unpkg.com/@scalar/api-reference@1.2.3/dist/browser/standalone.esm.js',
    ],
    [
      'https://cdn.example.test/assets/npm/@scalar/api-reference@latest/esm.js',
      'https://cdn.example.test/assets/npm/@scalar/api-reference@1.2.3/dist/browser/standalone.esm.js',
    ],
    [
      'https://cdn.example.test/@scalar/api-reference@^1.0/esm.js',
      'https://cdn.example.test/@scalar/api-reference@1.2.3/dist/browser/standalone.esm.js',
    ],
    [
      'https://cdn.example.test/@scalar/api-reference@1.2.3/esm.js',
      'https://cdn.example.test/@scalar/api-reference@1.2.3/dist/browser/standalone.esm.js',
    ],
    [
      'https://cdn.example.test/@scalar/api-reference@1.2.3-beta.1/esm.min.js?cache=1#entry',
      'https://cdn.example.test/@scalar/api-reference@1.2.3/dist/browser/standalone.esm.js',
    ],
    ['https://docs.example.test/scalar/esm.js', 'https://docs.example.test/scalar/dist/browser/standalone.esm.js'],
    ['https://docs.example.test/esm.min.js', 'https://docs.example.test/dist/browser/standalone.esm.js'],
    [
      'https://docs.example.test/@scalar/api-reference-custom/esm.js',
      'https://docs.example.test/@scalar/api-reference-custom/dist/browser/standalone.esm.js',
    ],
    [
      'https://docs.example.test/@scalar/api-reference/nested/esm.js',
      'https://docs.example.test/@scalar/api-reference/nested/dist/browser/standalone.esm.js',
    ],
  ])('resolves the matching bundle from %s', (entryUrl, expectedBundle) => {
    // Execute the generated URL selection without importing the application bundle.
    const source = createEsmEntry('1.2.3').split('const { createApiReference } = await import(bundle)')[0]!
    const resolveBundle = new Function('entryUrl', source.replace('import.meta.url', 'entryUrl') + '\nreturn bundle')

    expect(resolveBundle(entryUrl)).toBe(expectedBundle)
  })

  it('re-exports createApiReference from the bundle', () => {
    const source = createEsmEntry('1.2.3')

    expect(source).toContain('const { createApiReference } = await import(bundle)')
    expect(source).toContain('export { createApiReference }')
  })
})
