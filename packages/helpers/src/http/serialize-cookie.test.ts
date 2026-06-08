import { describe, expect, it } from 'vitest'

import { serializeCookie } from './serialize-cookie'

describe('serializeCookie', () => {
  it('serializes a basic name/value pair', () => {
    expect(serializeCookie('foo', 'bar')).toBe('foo=bar')
  })

  it('leaves the value raw and unencoded', () => {
    // A space would normally be percent-encoded by `encodeURIComponent`; we keep the value as-is.
    expect(serializeCookie('foo', 'bar%20baz')).toBe('foo=bar%20baz')
  })

  it('serializes an empty value', () => {
    expect(serializeCookie('foo', '')).toBe('foo=')
  })

  it('adds the Path attribute', () => {
    expect(serializeCookie('foo', 'bar', { path: '/' })).toBe('foo=bar; Path=/')
  })

  it('adds the Domain attribute', () => {
    expect(serializeCookie('foo', 'bar', { domain: 'example.com' })).toBe('foo=bar; Domain=example.com')
  })

  it('renders expires as a UTC string', () => {
    const expires = new Date('2026-06-08T00:00:00.000Z')
    expect(serializeCookie('foo', 'bar', { expires })).toBe(`foo=bar; Expires=${expires.toUTCString()}`)
  })

  it('renders maxAge as Max-Age', () => {
    expect(serializeCookie('foo', 'bar', { maxAge: 3600 })).toBe('foo=bar; Max-Age=3600')
  })

  it('adds HttpOnly and Secure flags', () => {
    expect(serializeCookie('foo', 'bar', { httpOnly: true, secure: true })).toBe('foo=bar; HttpOnly; Secure')
  })

  it('renders sameSite as a string', () => {
    expect(serializeCookie('foo', 'bar', { sameSite: 'lax' })).toBe('foo=bar; SameSite=Lax')
    expect(serializeCookie('foo', 'bar', { sameSite: 'strict' })).toBe('foo=bar; SameSite=Strict')
    expect(serializeCookie('foo', 'bar', { sameSite: 'none' })).toBe('foo=bar; SameSite=None')
  })

  it('treats sameSite true as Strict', () => {
    expect(serializeCookie('foo', 'bar', { sameSite: true })).toBe('foo=bar; SameSite=Strict')
  })

  it('adds the Partitioned attribute', () => {
    expect(serializeCookie('foo', 'bar', { partitioned: true })).toBe('foo=bar; Partitioned')
  })

  it('renders priority', () => {
    expect(serializeCookie('foo', 'bar', { priority: 'high' })).toBe('foo=bar; Priority=High')
  })

  it('combines multiple attributes in order', () => {
    const expires = new Date('2026-06-08T00:00:00.000Z')
    expect(
      serializeCookie('session', 'abc', {
        maxAge: 60,
        domain: 'example.com',
        path: '/',
        expires,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      }),
    ).toBe(
      `session=abc; Max-Age=60; Domain=example.com; Path=/; Expires=${expires.toUTCString()}; HttpOnly; Secure; SameSite=Lax`,
    )
  })

  it('throws for an invalid name', () => {
    expect(() => serializeCookie('foo bar', 'baz')).toThrow(TypeError)
  })
})
