import { describe, expect, it } from 'vitest'

import { pythonAiohttp } from './aiohttp/aiohttp'
import { pythonHttpxAsync } from './httpx/async'
import { pythonHttpxSync } from './httpx/sync'
import { pythonRequests } from './requests/requests'
import { formatPythonValue } from './requestsLike'

describe('formatPythonValue', () => {
  it.each([
    [true, 'True'],
    [false, 'False'],
  ])('formats the root JSON literal %s', (value, expected) => {
    expect(formatPythonValue(value)).toBe(expected)
  })

  it.each(['true', 'false', 'null'])('keeps the string %s quoted', (value) => {
    expect(formatPythonValue(value)).toBe(JSON.stringify(value))
  })
})

describe.each([pythonRequests, pythonHttpxSync, pythonHttpxAsync, pythonAiohttp])(
  '$client root JSON booleans',
  (plugin) => {
    it.each([
      [true, 'True'],
      [false, 'False'],
    ])('serializes %s for Python', (value, expected) => {
      const result = plugin.generate({
        url: 'https://example.com',
        method: 'POST',
        postData: { mimeType: 'application/json', text: JSON.stringify(value) },
      })
      expect(result).toContain(`json=${expected}`)
    })
  },
)
