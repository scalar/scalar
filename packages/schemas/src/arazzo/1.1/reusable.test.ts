import { validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { arazzoFailureActionObject } from './failure-action'
import { arazzoParameterObject } from './parameter'
import { arazzoReusableObject } from './reusable'
import { arazzoStepObject } from './step'
import { arazzoSuccessActionObject } from './success-action'

describe('reusable', () => {
  it('validates a standalone Reusable Object with only a reference', () => {
    expect(validate(arazzoReusableObject, { reference: '$components.successActions.notify' })).toBe(true)
  })

  it('validates a standalone Reusable Object with a reference and a value', () => {
    expect(validate(arazzoReusableObject, { reference: '$components.parameters.page', value: 1 })).toBe(true)
  })

  it('rejects a Reusable Object missing reference', () => {
    expect(validate(arazzoReusableObject, { value: 1 })).toBe(false)
  })

  it('accepts a Parameter Object directly (not a Reusable Object)', () => {
    expect(validate(arazzoParameterObject, { name: 'page', in: 'query', value: 1 })).toBe(true)
  })

  it('accepts a Reusable Object wherever a step parameter is expected', () => {
    expect(
      validate(arazzoStepObject, {
        stepId: 'getPetStep',
        operationId: 'getPet',
        parameters: [{ reference: '$components.parameters.page' }],
      }),
    ).toBe(true)
  })

  it('accepts a Reusable Object wherever an onSuccess action is expected', () => {
    expect(
      validate(arazzoStepObject, {
        stepId: 'getPetStep',
        operationId: 'getPet',
        onSuccess: [{ reference: '$components.successActions.notify' }],
      }),
    ).toBe(true)
  })

  it('accepts a Reusable Object wherever an onFailure action is expected', () => {
    expect(
      validate(arazzoStepObject, {
        stepId: 'getPetStep',
        operationId: 'getPet',
        onFailure: [{ reference: '$components.failureActions.retryLater' }],
      }),
    ).toBe(true)
  })

  it('accepts a Success Action Object directly (not a Reusable Object)', () => {
    expect(validate(arazzoSuccessActionObject, { name: 'notify', type: 'end' })).toBe(true)
  })

  it('accepts a Failure Action Object directly (not a Reusable Object)', () => {
    expect(validate(arazzoFailureActionObject, { name: 'retryLater', type: 'retry', retryLimit: 3 })).toBe(true)
  })
})
