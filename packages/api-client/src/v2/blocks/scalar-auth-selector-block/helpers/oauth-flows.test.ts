import { describe, expect, it } from 'vitest'

import { getVisibleOrderedFlowKeys } from './oauth-flows'

describe('getVisibleOrderedFlowKeys', () => {
  it('returns an empty array when flows is undefined', () => {
    expect(getVisibleOrderedFlowKeys(undefined)).toEqual([])
  })

  it('keeps document order when no x-order is set', () => {
    const flows = {
      authorizationCode: {},
      implicit: {},
      clientCredentials: {},
    }

    expect(getVisibleOrderedFlowKeys(flows)).toEqual(['authorizationCode', 'implicit', 'clientCredentials'])
  })

  it('drops flows marked with x-scalar-ignore', () => {
    const flows = {
      authorizationCode: {},
      clientCredentials: { 'x-scalar-ignore': true },
    }

    expect(getVisibleOrderedFlowKeys(flows)).toEqual(['authorizationCode'])
  })

  it('drops flows marked with x-internal', () => {
    const flows = {
      authorizationCode: {},
      clientCredentials: { 'x-internal': true },
    }

    expect(getVisibleOrderedFlowKeys(flows)).toEqual(['authorizationCode'])
  })

  it('sorts flows by x-order ascending', () => {
    const flows = {
      implicit: { 'x-order': 2 },
      authorizationCode: { 'x-order': 1 },
      clientCredentials: { 'x-order': 3 },
    }

    expect(getVisibleOrderedFlowKeys(flows)).toEqual(['authorizationCode', 'implicit', 'clientCredentials'])
  })

  it('places ordered flows before unordered ones, which keep document order', () => {
    const flows = {
      password: {},
      implicit: { 'x-order': 2 },
      clientCredentials: {},
      authorizationCode: { 'x-order': 1 },
    }

    expect(getVisibleOrderedFlowKeys(flows)).toEqual(['authorizationCode', 'implicit', 'password', 'clientCredentials'])
  })

  it('makes the lowest x-order flow the default (first) even when declared last', () => {
    const flows = {
      clientCredentials: { 'x-scalar-ignore': true },
      implicit: {},
      authorizationCode: { 'x-order': 1 },
    }

    expect(getVisibleOrderedFlowKeys(flows)[0]).toBe('authorizationCode')
  })
})
