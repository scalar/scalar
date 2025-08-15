import { describe, it, expect, vi, beforeEach } from 'vitest'
import { measureSync, measureAsync } from './measure'

describe('measure', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('should measure and log synchronous function execution time', () => {
    const result = measureSync('sync-test', () => 42)
    expect(result).toBe(42)
    expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/sync-test: \d+ ms/))
  })

  it('should measure and log asynchronous function execution time', async () => {
    const result = await measureAsync('async-test', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return 42
    })
    expect(result).toBe(42)
    expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/async-test: \d+ ms/))
  })

  it('should preserve the return type of the measured function', () => {
    const stringResult = measureSync('string-test', () => 'hello')
    expect(typeof stringResult).toBe('string')
    expect(stringResult).toBe('hello')

    const numberResult = measureSync('number-test', () => 123)
    expect(typeof numberResult).toBe('number')
    expect(numberResult).toBe(123)

    const objectResult = measureSync('object-test', () => ({ key: 'value' }))
    expect(typeof objectResult).toBe('object')
    expect(objectResult).toEqual({ key: 'value' })
  })
})
