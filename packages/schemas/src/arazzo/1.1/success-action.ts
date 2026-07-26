import { array, literal, object, optional, string, union } from '@scalar/validation'

import { arazzoCriterionObject } from './criterion'
import { arazzoParameterObject } from './parameter'
import { arazzoReusableObject } from './reusable'

/**
 * Success Action Object.
 *
 * Describes an action to take upon success of a workflow step: `end` returns control to the
 * caller, `goto` transfers control to another workflow or step.
 */
export const arazzoSuccessActionObject = object(
  {
    name: string({ typeComment: 'REQUIRED. The name of the success action.' }),
    type: union([literal('end'), literal('goto')], { typeComment: 'REQUIRED. The type of action to take.' }),
    workflowId: optional(
      string({
        typeComment: 'The workflowId to transfer to upon success. Only relevant when type is "goto".',
      }),
    ),
    stepId: optional(
      string({ typeComment: 'The stepId to transfer to upon success. Only relevant when type is "goto".' }),
    ),
    parameters: optional(
      array(union([arazzoParameterObject, arazzoReusableObject]), {
        typeComment: 'A list of parameters to pass to the referenced workflow or step.',
      }),
    ),
    criteria: optional(
      array(arazzoCriterionObject, { typeComment: 'A list of assertions to determine if this action applies.' }),
    ),
  },
  { typeName: 'ArazzoSuccessActionObject' },
)
