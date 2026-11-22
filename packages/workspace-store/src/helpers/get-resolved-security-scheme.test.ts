import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'

import { getResolvedSecurityScheme } from './get-resolved-security-scheme'

const apiKey = { type: 'apiKey', in: 'header', name: 'X-Api-Key', description: 'Base description.' }

describe('get-resolved-security-scheme', () => {
  it('uses the nearest description without changing the scheme or reference wrappers', () => {
    const document = createMagicProxy({
      target: apiKey,
      alias: { $ref: '#/target', description: 'Inner description.' },
      reference: { $ref: '#/alias', description: 'Outer description.' },
    })
    expect(getResolvedSecurityScheme(document.reference)).toStrictEqual({
      ...apiKey,
      description: 'Outer description.',
    })
    expect(document.target).toStrictEqual(apiKey)
    expect(document.alias.description).toBe('Inner description.')
  })

  it('keeps an empty description override and ignores unsupported siblings', () => {
    const document = createMagicProxy({
      target: apiKey,
      reference: { $ref: '#/target', description: '', name: 'Ignored' },
    })
    expect(getResolvedSecurityScheme(document.reference)).toStrictEqual({ ...apiKey, description: '' })
    expect(getResolvedSecurityScheme(document.reference, { overrideDescription: false })).toStrictEqual(apiKey)
  })

  it('inherits the first description found in the reference chain', () => {
    const document = createMagicProxy({
      target: apiKey,
      alias: { $ref: '#/target', description: 'Inner description.' },
      reference: { $ref: '#/alias' },
      unannotated: { $ref: '#/target' },
    })
    expect(getResolvedSecurityScheme(document.reference)).toStrictEqual({
      ...apiKey,
      description: 'Inner description.',
    })
    expect(getResolvedSecurityScheme(document.unannotated)).toStrictEqual(apiKey)
  })

  it('leaves missing targets and circular aliases unresolved', () => {
    const document = createMagicProxy({
      missing: { $ref: '#/absent', description: 'Missing' },
      a: { $ref: '#/b', description: 'A' },
      b: { $ref: '#/a', description: 'B' },
    })
    expect(getResolvedSecurityScheme(document.missing)).toBeUndefined()
    expect(getResolvedSecurityScheme(document.a)).toBeUndefined()
  })

  it('returns inline schemes unchanged', () => {
    expect(getResolvedSecurityScheme(apiKey)).toBe(apiKey)
    expect(getResolvedSecurityScheme(undefined)).toBeUndefined()
  })
})
