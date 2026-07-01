import { describe, expect, it } from 'vitest'

import { formatAsyncApiBindings, isComplexBindingValue } from './format-async-api-bindings'

describe('formatAsyncApiBindings', () => {
  it('returns an empty array for nullish or non-object input', () => {
    expect(formatAsyncApiBindings(undefined)).toEqual([])
    expect(formatAsyncApiBindings(null)).toEqual([])
    expect(formatAsyncApiBindings('nope')).toEqual([])
  })

  it('flattens each protocol into key/value entries', () => {
    const groups = formatAsyncApiBindings({
      kafka: { topic: 'user-signedup', partitions: 10 },
      ws: { method: 'GET' },
    })

    expect(groups).toEqual([
      {
        protocol: 'kafka',
        entries: [
          { key: 'topic', value: 'user-signedup' },
          { key: 'partitions', value: 10 },
        ],
      },
      { protocol: 'ws', entries: [{ key: 'method', value: 'GET' }] },
    ])
  })

  it('skips protocols with a null/undefined value', () => {
    const groups = formatAsyncApiBindings({ kafka: { topic: 't' }, amqp: null, mqtt: undefined })
    expect(groups.map((g) => g.protocol)).toEqual(['kafka'])
  })

  it('resolves a $ref on the bindings object itself', () => {
    const groups = formatAsyncApiBindings({
      $ref: '#/components/channelBindings/kafka',
      '$ref-value': { kafka: { topic: 't' } },
    })
    expect(groups).toEqual([{ protocol: 'kafka', entries: [{ key: 'topic', value: 't' }] }])
  })

  it('resolves a $ref on an individual protocol value', () => {
    const groups = formatAsyncApiBindings({
      kafka: { $ref: '#/x', '$ref-value': { topic: 't' } },
    })
    expect(groups).toEqual([{ protocol: 'kafka', entries: [{ key: 'topic', value: 't' }] }])
  })

  it('surfaces a non-object payload under a synthetic value entry', () => {
    const groups = formatAsyncApiBindings({ kafka: 'raw-string' })
    expect(groups).toEqual([{ protocol: 'kafka', entries: [{ key: 'value', value: 'raw-string' }] }])
  })

  it('drops fields whose value is null or undefined', () => {
    const groups = formatAsyncApiBindings({ ws: { method: 'GET', query: null, headers: undefined } })
    expect(groups).toEqual([{ protocol: 'ws', entries: [{ key: 'method', value: 'GET' }] }])
  })

  it('skips a protocol whose value resolves to nullish (for example an unresolved $ref)', () => {
    const groups = formatAsyncApiBindings({ kafka: { $ref: '#/missing' }, ws: { method: 'GET' } })
    expect(groups.map((g) => g.protocol)).toEqual(['ws'])
  })

  it('skips a protocol whose object fields are all nullish', () => {
    const groups = formatAsyncApiBindings({ kafka: { topic: null }, ws: { method: 'GET' } })
    expect(groups.map((g) => g.protocol)).toEqual(['ws'])
  })
})

describe('isComplexBindingValue', () => {
  it('is true for objects and arrays', () => {
    expect(isComplexBindingValue({ type: 'string' })).toBe(true)
    expect(isComplexBindingValue([1, 2])).toBe(true)
  })

  it('is false for primitives', () => {
    expect(isComplexBindingValue('GET')).toBe(false)
    expect(isComplexBindingValue(10)).toBe(false)
    expect(isComplexBindingValue(true)).toBe(false)
    expect(isComplexBindingValue(null)).toBe(false)
  })
})
