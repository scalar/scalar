import { describe, expect, it } from 'vitest'

import { getSelectedServer } from './get-selected-server'

describe('getSelectedServer', () => {
  it('returns the server matching selectedServerUrl', () => {
    const servers = [
      { url: 'https://api.example.com' },
      { url: 'https://staging.example.com' },
      { url: 'https://dev.example.com' },
    ]

    const result = getSelectedServer(servers, 'https://staging.example.com')

    expect(result).toEqual({ url: 'https://staging.example.com' })
  })

  it('returns null when selectedServerUrl does not match any server URL', () => {
    const servers = [{ url: 'https://api.example.com' }, { url: 'https://staging.example.com' }]

    const result = getSelectedServer(servers, 'https://nonexistent.example.com')

    expect(result).toBeNull()
  })

  it('returns null when servers array is null', () => {
    const result = getSelectedServer(null, 'https://api.example.com')

    expect(result).toBeNull()
  })

  it('returns first server when selectedServerUrl is undefined', () => {
    const servers = [{ url: 'https://api.example.com' }, { url: 'https://staging.example.com' }]

    const result = getSelectedServer(servers, undefined)

    expect(result).toEqual({ url: 'https://api.example.com' })
  })

  it('returns null when selectedServerUrl is empty string (user un-selected)', () => {
    const servers = [{ url: 'https://api.example.com' }]

    const result = getSelectedServer(servers, '')

    expect(result).toBeNull()
  })
})
