import { describe, expect, it } from 'vitest'

import { parseChatError } from './parse-chat-error'

describe('parse-chat-error', () => {
  it('parses the wire envelope from an Error message', () => {
    const error = new Error(
      JSON.stringify({
        code: 'AGENT_FAILED',
        message: 'The agent failed while producing a response.',
        detail: { requestId: 'req-001' },
      }),
    )

    expect(parseChatError(error)).toEqual({
      code: 'AGENT_FAILED',
      message: 'The agent failed while producing a response.',
      upgradeUrl: undefined,
      detail: { requestId: 'req-001' },
    })
  })

  it('lifts upgradeUrl out of the LIMIT_REACHED detail', () => {
    const error = new Error(
      JSON.stringify({
        code: 'LIMIT_REACHED',
        message: "You've reached the free usage limit. Upgrade your plan to send more messages.",
        detail: { upgradeUrl: 'https://example.com/change-plan', remaining: 0 },
      }),
    )

    const parsed = parseChatError(error)

    expect(parsed.code).toBe('LIMIT_REACHED')
    expect(parsed.upgradeUrl).toBe('https://example.com/change-plan')
  })

  it('parses the legacy client shape with a status', () => {
    const error = new Error(JSON.stringify({ code: 'UNAUTHORIZED', message: 'Not allowed.', status: 403 }))

    expect(parseChatError(error)).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Not allowed.',
      status: 403,
    })
  })

  it('falls back to UNKNOWN_ERROR for plain error messages', () => {
    expect(parseChatError(new Error('connection refused'))).toEqual({
      code: 'UNKNOWN_ERROR',
      message: 'connection refused',
    })
  })

  it('accepts an already-parsed envelope object', () => {
    expect(parseChatError({ code: 'PROMPT_TOO_LARGE', message: 'Prompt too large.' })).toMatchObject({
      code: 'PROMPT_TOO_LARGE',
      message: 'Prompt too large.',
    })
  })

  it('accepts a raw JSON string', () => {
    expect(parseChatError('{"code":"AGENT_FAILED","message":"Failed."}')).toMatchObject({
      code: 'AGENT_FAILED',
      message: 'Failed.',
    })
  })

  it('falls back for values that are not errors at all', () => {
    expect(parseChatError(undefined)).toEqual({
      code: 'UNKNOWN_ERROR',
      message: 'Something went wrong. Please try again.',
    })
    expect(parseChatError(42)).toMatchObject({ code: 'UNKNOWN_ERROR' })
  })

  it('treats a non-envelope JSON message as unknown', () => {
    const error = new Error(JSON.stringify({ hello: 'world' }))

    expect(parseChatError(error)).toEqual({
      code: 'UNKNOWN_ERROR',
      message: error.message,
    })
  })
})
