import { describe, expect, it } from 'vitest'
import { XPromptSchema } from './x-prompt'

describe('XPromptSchema', () => {
  it('allows login', () => {
    const result = XPromptSchema.parse({
      'x-prompt': 'login',
    })

    expect(result).toEqual({ 'x-prompt': 'login' })
  })

  it('allows select_account', () => {
    const result = XPromptSchema.parse({
      'x-prompt': 'select_account',
    })

    expect(result).toEqual({ 'x-prompt': 'select_account' })
  })

  it('allows consent', () => {
    const result = XPromptSchema.parse({
      'x-prompt': 'consent',
    })

    expect(result).toEqual({ 'x-prompt': 'consent' })
  })

  it('allows none', () => {
    const result = XPromptSchema.parse({
      'x-prompt': 'none',
    })

    expect(result).toEqual({ 'x-prompt': 'none' })
  })

  it('defaults to undefined when empty', () => {
    expect(XPromptSchema.parse({})).toEqual({ 'x-prompt': undefined })
  })
})
