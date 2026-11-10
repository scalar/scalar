import { encode as encodeBase64 } from 'js-base64'
import { describe, expect, it } from 'vitest'

import { createSecretRedactor } from './redact-secrets'

describe('redact-secrets', () => {
  it('redacts raw, URL-encoded and form-encoded secrets in nested values and keys', () => {
    const secret = 'secret +/"\\value'
    const redact = createSecretRedactor([{ in: 'query', name: 'key', value: secret }])
    const output = {
      [secret]: [secret, encodeURIComponent(secret), new URLSearchParams({ value: secret }).toString().slice(6)],
      status: 200,
      ok: true,
      empty: null,
    }

    expect(redact(output)).toStrictEqual({
      '[REDACTED]': ['[REDACTED]', '[REDACTED]', '[REDACTED]'],
      status: 200,
      ok: true,
      empty: null,
    })
    expect(output[secret]?.[0]).toBe(secret)
  })

  it('redacts Basic credentials and passwords while preserving usernames', () => {
    const value = 'private-user:private:password'
    const redact = createSecretRedactor([{ in: 'header', name: 'Authorization', format: 'basic', value }])

    expect(redact([value, `Basic ${encodeBase64(value)}`, 'private-user', 'private:password'])).toStrictEqual([
      '[REDACTED]',
      'Basic [REDACTED]',
      'private-user',
      '[REDACTED]',
    ])
  })

  it.each(['api', 'admin', 'user'])('preserves response keys and text containing Basic username %s', (username) => {
    const password = 'p +/secret'
    const value = `${username}:${password}`
    const redact = createSecretRedactor([{ in: 'header', name: 'Authorization', format: 'basic', value }])

    expect(
      redact({
        [`x-${username}-version`]: `${username} ${password}`,
        credentials: [value, encodeURIComponent(value), `Basic ${encodeBase64(value)}`],
      }),
    ).toStrictEqual({
      [`x-${username}-version`]: `${username} [REDACTED]`,
      credentials: ['[REDACTED]', '[REDACTED]', 'Basic [REDACTED]'],
    })
  })

  it('ignores empty credentials and preserves JSON scalar types', () => {
    const redact = createSecretRedactor([{ in: 'header', name: 'key', value: '' }])
    expect(redact({ status: 200, ok: true, body: null, text: 'unchanged' })).toStrictEqual({
      status: 200,
      ok: true,
      body: null,
      text: 'unchanged',
    })
    expect(redact(undefined)).toBeUndefined()
  })

  it('redacts overlapping credentials in one pass without changing replacement markers', () => {
    const redact = createSecretRedactor(
      ['secret', 'secret-long', 'REDACTED', 'true'].map((value) => ({ in: 'header', name: 'key', value })),
    )
    expect(redact({ body: 'secret-long secret REDACTED true', ok: true })).toStrictEqual({
      body: '[REDACTED] [REDACTED] [REDACTED] [REDACTED]',
      ok: true,
    })
  })
})
