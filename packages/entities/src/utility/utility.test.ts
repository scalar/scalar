import { describe, expect, test } from 'vitest'
import { z } from 'zod'

import { schemaModel, unixTimestamp } from './index'

describe('Wraps a schema into an object sanitizer', () => {
  test('Handles basic schema', () => {
    const modelled = schemaModel(['one', 'two'], z.string().array())

    expect(modelled).toEqual(['one', 'two'])
  })

  test('Throws an error by default', () => {
    expect(() => schemaModel('one, two', z.string().array())).toThrowError()
  })

  test('Can return valid data with silent parsing', () => {
    const modelled = schemaModel(['one', 'two'], z.string().array(), false)
    expect(modelled).toEqual(['one', 'two'])
  })

  test('Can prevent error throw and return null on fail', () => {
    const modelled = schemaModel('one, two', z.string().array(), false)
    expect(modelled).toEqual(null)
  })

  test('Drops extra properties when sanitizing', () => {
    const testData = {
      name: 'Dave',
      displayName: 'Dave',
      email: 'Dave@example.com',
    }

    const testSchema = z.object({
      name: z.string(),
      email: z.string(),
    })

    expect(schemaModel(testData, testSchema, false)).toEqual({
      name: 'Dave',
      email: 'Dave@example.com',
    })
  })
})

const UNIX_YEAR_3000 = 32500000000

describe('Unix Timestamps', () => {
  test('Creates a timestamp in seconds', () => {
    const timestamp = unixTimestamp('2021/10/01')
    expect(timestamp).greaterThan(0)
    expect(timestamp).lessThan(UNIX_YEAR_3000)
  })

  test('Create a current timestamp', () => {
    const now = Math.floor(Date.now() / 1000)
    const timestamp = unixTimestamp()

    expect(Math.abs(now - timestamp)).lessThanOrEqual(2)
  })
})
