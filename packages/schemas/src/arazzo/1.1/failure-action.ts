import { array, literal, number, object, optional, string, union } from '@scalar/validation'

import { arazzoCriterionObject } from './criterion'
import { arazzoParameterObject } from './parameter'
import { arazzoReusableObject } from './reusable'

/**
 * Failure Action Object.
 *
 * Describes an action to take upon failure of a workflow step: `end` returns control to the
 * caller, `retry` retries the current step, `goto` transfers control to another workflow or step.
 */
export const arazzoFailureActionObject = object(
  {
    name: string({ typeComment: 'REQUIRED. The name of the failure action.' }),
    type: union([literal('end'), literal('retry'), literal('goto')], {
      typeComment: 'REQUIRED. The type of action to take.',
    }),
    workflowId: optional(
      string({
        typeComment: 'The workflowId to transfer to. Only relevant when type is "goto" or "retry".',
      }),
    ),
    stepId: optional(
      string({ typeComment: 'The stepId to transfer to. Only relevant when type is "goto" or "retry".' }),
    ),
    parameters: optional(
      array(union([arazzoParameterObject, arazzoReusableObject]), {
        typeComment: 'A list of parameters to pass to the referenced workflow or step.',
      }),
    ),
    retryAfter: optional(
      number({ typeComment: 'A non-negative decimal indicating the seconds to delay before the retry.' }),
    ),
    retryLimit: optional(number({ typeComment: 'A non-negative integer indicating how many times to retry.' })),
    criteria: optional(
      array(arazzoCriterionObject, { typeComment: 'A list of assertions to determine if this action applies.' }),
    ),
  },
  { typeName: 'ArazzoFailureActionObject' },
)
