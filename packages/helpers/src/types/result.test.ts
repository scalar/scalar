import { describe, expect, it } from 'vitest'

import { type Result, err, ok } from '@/types/result'

describe('result', () => {
  it('builds a success variant via `ok`', () => {
    const result = ok({ id: 1 })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual({ id: 1 })
    }
  })

  it('builds a failure variant with a free-form error message', () => {
    const result = err('Document not found')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Document not found')
      expect(result.message).toBeUndefined()
    }
  })

  it('builds a failure variant with a discriminated code and message', () => {
    const result: Result<never, 'CONFLICT' | 'FETCH_FAILED'> = err('CONFLICT', 'Slug is already taken')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('CONFLICT')
      expect(result.message).toBe('Slug is already taken')
    }
  })

  it('narrows to the success branch when `ok` is true', () => {
    const compute = (): Result<number> => ok(42)
    const result = compute()

    if (!result.ok) {
      throw new Error('Expected success result')
    }

    expect(result.data + 1).toBe(43)
  })

  it('narrows to the failure branch with a typed error union', () => {
    type PublishError = 'CONFLICT' | 'FETCH_FAILED' | 'UNAUTHORIZED'

    const compute = (): Result<{ commitHash: string }, PublishError> => err('CONFLICT')
    const result = compute()

    if (result.ok) {
      throw new Error('Expected failure result')
    }

    const codes: PublishError[] = ['CONFLICT', 'FETCH_FAILED', 'UNAUTHORIZED']
    expect(codes).toContain(result.error)
  })

  it('supports custom error shapes', () => {
    type ValidationError = { code: number; field: string }

    const result: Result<string, ValidationError> = err({ code: 400, field: 'name' }, 'Invalid input')

    if (result.ok) {
      throw new Error('Expected failure result')
    }

    expect(result.error.code).toBe(400)
    expect(result.error.field).toBe('name')
    expect(result.message).toBe('Invalid input')
  })
})
