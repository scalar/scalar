import { describe, expect, it } from 'vitest'

import { pillSignature } from './pill-signature'

describe('pill-signature', () => {
  it('returns an empty signature when withVariables is false', () => {
    expect(pillSignature('{{baseUrl}}', false)).toBe('')
  })

  it('returns an empty signature when the text contains no pill markers', () => {
    expect(pillSignature('plain text', true)).toBe('')
  })

  it('returns an empty signature for the empty string', () => {
    expect(pillSignature('', true)).toBe('')
  })

  it('captures a single pill name', () => {
    expect(pillSignature('hello {{baseUrl}}', true)).toBe('|baseUrl')
  })

  it('captures multiple pill names in document order', () => {
    expect(pillSignature('{{baseUrl}}/{{apiKey}}', true)).toBe('|baseUrl|apiKey')
  })

  it('matches the same signature for different surrounding text', () => {
    expect(pillSignature('before {{x}} after', true)).toBe(pillSignature('{{x}}', true))
  })

  it('produces different signatures when the pill set differs', () => {
    expect(pillSignature('{{a}}', true)).not.toBe(pillSignature('{{b}}', true))
    expect(pillSignature('{{a}}', true)).not.toBe(pillSignature('{{a}}{{b}}', true))
  })
})
