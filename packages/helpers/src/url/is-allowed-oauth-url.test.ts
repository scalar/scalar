import { describe, expect, it } from 'vitest'

import { isAllowedOAuthUrl } from './is-allowed-oauth-url'

describe('is-allowed-oauth-url', () => {
  it.each([
    'https://auth.example.com/authorize',
    'HTTPS://auth.example.com/authorize',
    'http://localhost:3000/authorize',
    'http://127.0.0.1/authorize',
    'http://[::1]/authorize',
    'http://0.0.0.0/authorize',
    'http://auth.test/authorize',
    'http://auth.example/authorize',
    'http://auth.invalid/authorize',
    'http://auth.localhost/authorize',
  ])('allows %s', (value) => {
    expect(isAllowedOAuthUrl(new URL(value))).toBe(true)
  })

  it.each([
    ['http://AUTH.dev.internal:8080/', true],
    ['http://auth.dev.internal', false],
    ['https://auth.dev.internal:8080', false],
    ['http://auth.dev.internal.evil:8080', false],
    ['http://auth.dev.internal:8080/authorize', false],
    ['http://user@auth.dev.internal:8080', false],
    ['http://auth.dev.internal:8080?option', false],
  ])('checks configured origin %s exactly', (origin, expected) => {
    expect(isAllowedOAuthUrl(new URL('http://auth.dev.internal:8080/authorize'), [origin])).toBe(expected)
  })

  it('rejects HTTP authorization URLs with user information on a configured origin', () => {
    expect(
      isAllowedOAuthUrl(new URL('http://test-user@auth.dev.internal:8080/authorize'), [
        'http://auth.dev.internal:8080',
      ]),
    ).toBe(false)
  })

  it.each([
    'file:///tmp/authorization',
    'smb://example.invalid/share',
    'javascript:void(0)//',
    'java\tscript:void(0)//',
    'data:text/html,inert',
    'custom-protocol://authorize',
    'mailto:user@example.com',
    'ftp://example.com/authorize',
    'http://auth.example.com/authorize',
    'http://localhost.example.com/authorize',
    'http://localhost@example.com/authorize',
  ])('rejects %s', (value) => {
    expect(isAllowedOAuthUrl(new URL(value))).toBe(false)
  })
})
