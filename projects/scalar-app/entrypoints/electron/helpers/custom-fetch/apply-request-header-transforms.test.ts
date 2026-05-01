import { describe, expect, it } from 'vitest'

import { applyRequestHeaderTransforms } from './apply-request-header-transforms'

describe('apply-request-header-transforms', () => {
  it('promotes x-scalar-cookie to Cookie', () => {
    const result = applyRequestHeaderTransforms({
      'x-scalar-cookie': 'a=1',
    })
    expect(result['cookie']).toBe('a=1')
    expect(result['x-scalar-cookie']).toBeUndefined()
  })

  it('promotes x-scalar-user-agent to User-Agent', () => {
    const result = applyRequestHeaderTransforms({
      'x-scalar-user-agent': 'CLI/3',
    })
    expect(result['user-agent']).toBe('CLI/3')
    expect(result['x-scalar-user-agent']).toBeUndefined()
  })

  it('does not add Cookie when x-scalar-cookie is absent', () => {
    const result = applyRequestHeaderTransforms({
      accept: 'application/json',
    })
    expect(result['cookie']).toBeUndefined()
  })

  it('does not add User-Agent when x-scalar-user-agent is absent', () => {
    const result = applyRequestHeaderTransforms({
      accept: 'application/json',
    })
    expect(result['user-agent']).toBeUndefined()
  })

  it('preserves all other headers', () => {
    const result = applyRequestHeaderTransforms({
      'content-type': 'application/json',
      authorization: 'Bearer tok',
      'x-scalar-cookie': 'sid=1',
    })
    expect(result['content-type']).toBe('application/json')
    expect(result['authorization']).toBe('Bearer tok')
  })

  it('returns an empty object for an empty input', () => {
    expect(applyRequestHeaderTransforms({})).toEqual({})
  })

  it('promotes both x-scalar-cookie and x-scalar-user-agent together', () => {
    const result = applyRequestHeaderTransforms({
      'x-scalar-cookie': 'session=abc',
      'x-scalar-user-agent': 'MyApp/1.0',
    })
    expect(result['cookie']).toBe('session=abc')
    expect(result['user-agent']).toBe('MyApp/1.0')
    expect(result['x-scalar-cookie']).toBeUndefined()
    expect(result['x-scalar-user-agent']).toBeUndefined()
  })

  it('is case-insensitive for the x-scalar-* header names', () => {
    const result = applyRequestHeaderTransforms({
      'X-Scalar-Cookie': 'token=xyz',
      'X-Scalar-User-Agent': 'CustomAgent/2',
    })
    expect(result['cookie']).toBe('token=xyz')
    expect(result['user-agent']).toBe('CustomAgent/2')
    expect(result['x-scalar-cookie']).toBeUndefined()
    expect(result['x-scalar-user-agent']).toBeUndefined()
  })

  it('overwrites an existing User-Agent when x-scalar-user-agent is present', () => {
    const result = applyRequestHeaderTransforms({
      'user-agent': 'OldAgent/1',
      'x-scalar-user-agent': 'NewAgent/2',
    })
    expect(result['user-agent']).toBe('NewAgent/2')
    expect(result['x-scalar-user-agent']).toBeUndefined()
  })

  it('preserves an existing Cookie header when x-scalar-cookie is absent', () => {
    const result = applyRequestHeaderTransforms({
      cookie: 'existing=1',
    })
    expect(result['cookie']).toBe('existing=1')
  })
})
