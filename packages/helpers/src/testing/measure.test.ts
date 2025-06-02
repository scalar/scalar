import { describe, it, expect, vi, beforeEach } from 'vitest'
import { measure } from './measure'

describe('measure', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('should measure and log synchronous function execution time', () => {
    const result = measure('sync-test', () => 42)
    expect(result).toBe(42)
    expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/sync-test: \d+ ms/))
  })

  it('should measure and log asynchronous function execution time', async () => {
    const result = await measure('async-test', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return 42
    })
    expect(result).toBe(42)
    expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/async-test: \d+ ms/))
  })

  it('should preserve the return type of the measured function', () => {
    const stringResult = measure('string-test', () => 'hello')
    expect(typeof stringResult).toBe('string')
    expect(stringResult).toBe('hello')

    const numberResult = measure('number-test', () => 123)
    expect(typeof numberResult).toBe('number')
    expect(numberResult).toBe(123)

    const objectResult = measure('object-test', () => ({ key: 'value' }))
    expect(typeof objectResult).toBe('object')
    expect(objectResult).toEqual({ key: 'value' })
  })
})
