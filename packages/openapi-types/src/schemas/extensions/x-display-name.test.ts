import { describe, expect, it } from 'vitest'
import { XDisplayNameSchema } from './x-display-name'

describe('XDisplayName', () => {
  it('allows string value', () => {
    const result = XDisplayNameSchema.parse({
      'x-displayName': 'User Profile',
    })
    expect(result).toEqual({ 'x-displayName': 'User Profile' })
  })

  it('allows empty string', () => {
    const result = XDisplayNameSchema.parse({
      'x-displayName': '',
    })
    expect(result).toEqual({ 'x-displayName': '' })
  })

  it('defaults to undefined when empty object', () => {
    const result = XDisplayNameSchema.parse({})
    expect(result).toEqual({ 'x-displayName': undefined })
  })

  it('defaults to undefined when invalid value provided', () => {
    const result = XDisplayNameSchema.parse({
      'x-displayName': 123, // Non-string value
    })
    expect(result).toEqual({ 'x-displayName': undefined })
  })
})
