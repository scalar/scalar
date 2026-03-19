import { describe, expect, it, vi } from 'vitest'

import { getCookieHeaderKeys } from './get-cookie-header-keys'

describe('getCookieHeaderKeys', () => {
  it('returns array of Set-Cookie values when getSetCookie is available', () => {
    const mockHeaders = new Headers()
    mockHeaders.append('Set-Cookie', 'session=abc123; Path=/; HttpOnly')
    mockHeaders.append('Set-Cookie', 'user=john; Path=/; Secure')
    mockHeaders.append('Set-Cookie', 'theme=dark; Path=/; SameSite=Strict')

    const result = getCookieHeaderKeys(mockHeaders)

    expect(result).toEqual([
      'session=abc123; Path=/; HttpOnly',
      'user=john; Path=/; Secure',
      'theme=dark; Path=/; SameSite=Strict',
    ])
  })

  it('returns empty array when no Set-Cookie headers exist', () => {
    const mockHeaders = new Headers()
    mockHeaders.append('Content-Type', 'application/json')
    mockHeaders.append('Authorization', 'Bearer token123')

    const result = getCookieHeaderKeys(mockHeaders)

    expect(result).toEqual([])
  })

  it('returns empty array when getSetCookie method does not exist', () => {
    const mockHeaders = {
      get: () => null,
      has: () => false,
      forEach: vi.fn(),
    } as Partial<Headers>

    const result = getCookieHeaderKeys(mockHeaders as Headers)

    expect(result).toEqual([])
  })

  it('returns empty array when getSetCookie exists but is not a function', () => {
    // @ts-expect-error testing scenario where getSetCookie is not a function
    const mockHeaders = {
      getSetCookie: 'not-a-function',
      get: () => null,
      has: () => false,
      forEach: vi.fn(),
    } as Partial<Headers>

    const result = getCookieHeaderKeys(mockHeaders as Headers)

    expect(result).toEqual([])
  })

  it('handles complex cookie values with special characters and multiple attributes', () => {
    const mockHeaders = new Headers()
    mockHeaders.append(
      'Set-Cookie',
      'complex_cookie=value%20with%20spaces; Domain=.example.com; Path=/api; Secure; HttpOnly; SameSite=None; Max-Age=3600',
    )
    mockHeaders.append('Set-Cookie', 'another=value;with;semicolons; Path=/; Expires=Wed, 21 Oct 2025 07:28:00 GMT')

    const result = getCookieHeaderKeys(mockHeaders)

    expect(result).toHaveLength(2)
    expect(result[0]).toContain('complex_cookie=value%20with%20spaces')
    expect(result[0]).toContain('Domain=.example.com')
    expect(result[1]).toContain('another=value;with;semicolons')
    expect(result[1]).toContain('Expires=Wed, 21 Oct 2025 07:28:00 GMT')
  })
})
