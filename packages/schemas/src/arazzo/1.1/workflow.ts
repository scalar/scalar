import { array, object, optional, record, string, union, unknown } from '@scalar/validation'

import { arazzoFailureActionObject } from './failure-action'
import { arazzoParameterObject } from './parameter'
import { arazzoReusableObject } from './reusable'
import { arazzoSelectorObject } from './selector'
import { arazzoStepObject } from './step'
import { arazzoSuccessActionObject } from './success-action'

/**
 * Workflow Object.
 *
 * Describes the steps to be taken across one or more APIs to achieve an objective.
 */
export const arazzoWorkflowObject = object(
  {
    workflowId: string({ typeComment: 'REQUIRED. Unique string to represent the workflow.' }),
    summary: optional(string({ typeComment: 'A summary of the purpose or objective of the workflow.' })),
    description: optional(string({ typeComment: 'A description of the workflow.' })),
    inputs: optional(
      unknown({ typeComment: 'A JSON Schema 2020-12 object representing the input parameters used by this workflow.' }),
    ),
    dependsOn: optional(
      array(string(), {
        typeComment: 'A list of workflowIds that MUST be completed before this workflow can be processed.',
      }),
    ),
    steps: array(arazzoStepObject, { typeComment: 'REQUIRED. An ordered list of steps this workflow executes.' }),
    successActions: optional(
      array(union([arazzoSuccessActionObject, arazzoReusableObject]), {
        typeComment: 'An array of success action objects that apply to all steps in this workflow.',
      }),
    ),
    failureActions: optional(
      array(union([arazzoFailureActionObject, arazzoReusableObject]), {
        typeComment: 'An array of failure action objects that apply to all steps in this workflow.',
      }),
    ),
    outputs: optional(
      record(string(), union([string(), arazzoSelectorObject]), {
        typeComment: 'Map of output name to a Runtime Expression or Selector Object.',
      }),
    ),
    parameters: optional(
      array(union([arazzoParameterObject, arazzoReusableObject]), {
        typeComment: 'A list of parameters applicable for all steps in this workflow.',
      }),
    ),
  },
  { typeName: 'ArazzoWorkflowObject' },
)
