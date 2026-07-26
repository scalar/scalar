import { validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { arazzoStepObject } from './step'

describe('step', () => {
  it('validates a step targeting an operationId', () => {
    expect(validate(arazzoStepObject, { stepId: 'loginStep', operationId: 'loginUser' })).toBe(true)
  })

  it('validates a step targeting an operationPath', () => {
    expect(
      validate(arazzoStepObject, {
        stepId: 'getPetStep',
        operationPath: '{$sourceDescriptions.petstore.url}#/paths/~1pet/get',
      }),
    ).toBe(true)
  })

  it('validates a step targeting a channelPath', () => {
    expect(
      validate(arazzoStepObject, {
        stepId: 'subscribeStep',
        channelPath: '{$sourceDescriptions.asyncApiSource.url}#/channels/lightingMeasured',
        action: 'receive',
        correlationId: '$inputs.orderCorrelationId',
      }),
    ).toBe(true)
  })

  it('validates a step targeting a workflowId', () => {
    expect(validate(arazzoStepObject, { stepId: 'nestedStep', workflowId: 'anotherWorkflow' })).toBe(true)
  })

  it('validates a step with timeout and dependsOn', () => {
    expect(
      validate(arazzoStepObject, {
        stepId: 'thirdStep',
        operationId: 'thirdOperation',
        timeout: 30,
        dependsOn: ['loginStep', 'getPetStep'],
      }),
    ).toBe(true)
  })

  it('rejects a step missing stepId', () => {
    expect(validate(arazzoStepObject, { operationId: 'loginUser' })).toBe(false)
  })
})
