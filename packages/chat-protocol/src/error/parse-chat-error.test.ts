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

  it('tolerates envelopes without a message — the shipped 403/400 wire shape', () => {
    // The OpenAPI chat route serializes its error definitions without a
    // message field; the code must still reach consumers that branch on it.
    const error = new Error(JSON.stringify({ code: 'UNAUTHORIZED', schema: { def: {} } }))
    const parsed = parseChatError(error)

    expect(parsed.code).toBe('UNAUTHORIZED')
    expect(parsed.message).toBe('Something went wrong. Please try again.')
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

  it('parses an envelope wrapped in Error.cause', () => {
    // fetch and nested AI-SDK errors surface the original in `.cause` rather
    // than serializing it into `.message`.
    const error = new Error('Failed to fetch', {
      cause: new Error(JSON.stringify({ code: 'LIMIT_REACHED', detail: { upgradeUrl: 'https://example.com/plan' } })),
    })

    const parsed = parseChatError(error)

    expect(parsed.code).toBe('LIMIT_REACHED')
    expect(parsed.upgradeUrl).toBe('https://example.com/plan')
  })

  it('parses an already-parsed envelope object carried in Error.cause', () => {
    const error = new Error('wrapper', { cause: { code: 'UNAUTHORIZED', status: 403 } })

    expect(parseChatError(error)).toMatchObject({ code: 'UNAUTHORIZED', status: 403 })
  })

  it('prefers the message envelope over the cause', () => {
    const error = new Error(JSON.stringify({ code: 'AGENT_FAILED', message: 'From message.' }), {
      cause: new Error(JSON.stringify({ code: 'LIMIT_REACHED' })),
    })

    expect(parseChatError(error).code).toBe('AGENT_FAILED')
  })

  it('does not loop when a cause points back at the error', () => {
    const error = new Error('self')
    error.cause = error

    expect(parseChatError(error)).toEqual({ code: 'UNKNOWN_ERROR', message: 'self' })
  })

  it('falls back to the default message when Error.message is not a string', () => {
    const error = new Error('placeholder')
    // Subclasses can assign a non-string message; parsing must not throw.
    Object.defineProperty(error, 'message', { value: { unexpected: true } })

    expect(parseChatError(error)).toEqual({
      code: 'UNKNOWN_ERROR',
      message: 'Something went wrong. Please try again.',
    })
  })
})
