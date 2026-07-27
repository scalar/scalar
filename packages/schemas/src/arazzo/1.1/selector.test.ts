import { validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { arazzoSelectorObject } from './selector'
import { arazzoStepObject } from './step'

describe('selector', () => {
  it('validates a standalone Selector Object', () => {
    expect(
      validate(arazzoSelectorObject, {
        context: '$response.body',
        selector: '$.pets[0].id',
        type: 'jsonpath',
      }),
    ).toBe(true)
  })

  it('validates a Selector Object whose type is an Expression Type Object', () => {
    expect(
      validate(arazzoSelectorObject, {
        context: '$response.body',
        selector: '$.pets[0].id',
        type: { type: 'jsonpath', version: 'rfc9535' },
      }),
    ).toBe(true)
  })

  it('rejects a Selector Object missing a required field', () => {
    expect(validate(arazzoSelectorObject, { context: '$response.body', selector: '$.pets[0].id' })).toBe(false)
  })

  it('validates a step output as a Selector Object instead of a plain expression string', () => {
    expect(
      validate(arazzoStepObject, {
        stepId: 'loginStep',
        operationId: 'loginUser',
        outputs: {
          sessionToken: { context: '$response.body', selector: '$.token', type: 'jsonpath' },
        },
      }),
    ).toBe(true)
  })

  it('validates a step output as a plain runtime expression string', () => {
    expect(
      validate(arazzoStepObject, {
        stepId: 'loginStep',
        operationId: 'loginUser',
        outputs: { sessionToken: '$response.body' },
      }),
    ).toBe(true)
  })
})
