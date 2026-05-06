import { describe, expect, it } from 'vitest'

import { isTokenExpired } from './is-token-expired'

const BUFFER_SECONDS = 25

/** Build a minimal JWT with the given exp value in the payload */
const makeJwtWithExp = (exp: number): string => {
  const header = btoa('{"alg":"none"}')
  const body = btoa(JSON.stringify({ exp }))
  return `${header}.${body}.sig`
}

/** Build a JWT with no exp field in the payload */
const makeJwtNoExp = (): string => {
  const header = btoa('{"alg":"none"}')
  const body = btoa(JSON.stringify({ sub: 'user' }))
  return `${header}.${body}.sig`
}

describe('isTokenExpired', () => {
  const now = 1_700_000_000_000 // fixed epoch in ms
  const nowSeconds = Math.floor(now / 1000)

  it('returns false for a token that expires well in the future', () => {
    const token = makeJwtWithExp(nowSeconds + 3600) // 1 hour from now
    expect(isTokenExpired(token, now)).toBe(false)
  })

  it('returns true for a token that has already expired', () => {
    const token = makeJwtWithExp(nowSeconds - 1)
    expect(isTokenExpired(token, now)).toBe(true)
  })

  it('returns true for a token expiring within the 25-second buffer', () => {
    const token = makeJwtWithExp(nowSeconds + BUFFER_SECONDS - 1)
    expect(isTokenExpired(token, now)).toBe(true)
  })

  it('returns true when the JWT payload has no exp field (defaults to 0)', () => {
    const token = makeJwtNoExp()
    expect(isTokenExpired(token, now)).toBe(true)
  })

  it('returns true for a completely invalid token string', () => {
    expect(isTokenExpired('not-a-jwt', now)).toBe(true)
  })

  it('returns false when exp is exactly at the buffer boundary (exp === nowSeconds + 25)', () => {
    // The condition is exp < nowSeconds + 25, so equality is NOT expired
    const token = makeJwtWithExp(nowSeconds + BUFFER_SECONDS)
    expect(isTokenExpired(token, now)).toBe(false)
  })

  it('returns true when exp is exactly one second inside the buffer boundary (exp === nowSeconds + 24)', () => {
    const token = makeJwtWithExp(nowSeconds + BUFFER_SECONDS - 1)
    expect(isTokenExpired(token, now)).toBe(true)
  })
})
