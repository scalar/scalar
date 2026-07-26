import { object, optional, record, string, unknown } from '@scalar/validation'

import { arazzoFailureActionObject } from './failure-action'
import { arazzoParameterObject } from './parameter'
import { arazzoSuccessActionObject } from './success-action'

/**
 * Components Object.
 *
 * Holds reusable objects referenced elsewhere in the document via Reusable Objects
 * (`$components.<field>.<key>`). Keys MUST match `^[a-zA-Z0-9\.\-_]+$`, not enforced here.
 */
export const arazzoComponentsObject = object(
  {
    inputs: optional(
      record(string(), unknown(), {
        typeComment: 'An object to hold reusable JSON Schema objects to be referenced from workflow inputs.',
      }),
    ),
    parameters: optional(
      record(string(), arazzoParameterObject, { typeComment: 'An object to hold reusable Parameter Objects.' }),
    ),
    successActions: optional(
      record(string(), arazzoSuccessActionObject, {
        typeComment: 'An object to hold reusable Success Action Objects.',
      }),
    ),
    failureActions: optional(
      record(string(), arazzoFailureActionObject, {
        typeComment: 'An object to hold reusable Failure Action Objects.',
      }),
    ),
  },
  { typeName: 'ArazzoComponentsObject' },
)
