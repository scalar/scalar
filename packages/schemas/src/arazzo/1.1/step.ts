import { array, literal, number, object, optional, record, string, union } from '@scalar/validation'

import { arazzoCriterionObject } from './criterion'
import { arazzoFailureActionObject } from './failure-action'
import { arazzoParameterObject } from './parameter'
import { arazzoRequestBodyObject } from './request-body'
import { arazzoReusableObject } from './reusable'
import { arazzoSelectorObject } from './selector'
import { arazzoSuccessActionObject } from './success-action'

/**
 * Step Object.
 *
 * Describes a single workflow step: a call to an API operation (`operationId`/`operationPath`),
 * an AsyncAPI channel (`channelPath`), or another workflow (`workflowId`). These four target
 * fields are mutually exclusive by specification prose, not enforced here at the schema level so
 * a document that violates it still renders.
 */
export const arazzoStepObject = object(
  {
    description: optional(string({ typeComment: 'A description of the step.' })),
    stepId: string({ typeComment: 'REQUIRED. Unique string to represent the step.' }),
    operationId: optional(
      string({
        typeComment:
          'The name of an existing, resolvable operation within one of the sourceDescriptions. Mutually exclusive with operationPath, channelPath, and workflowId.',
      }),
    ),
    operationPath: optional(
      string({
        typeComment:
          'A Source Description Object combined with a JSON Pointer to reference an operation. Mutually exclusive with operationId, channelPath, and workflowId.',
      }),
    ),
    channelPath: optional(
      string({
        typeComment:
          'A Source Description Object combined with a JSON Pointer to reference an AsyncAPI channel. Mutually exclusive with operationId, operationPath, and workflowId.',
      }),
    ),
    workflowId: optional(
      string({
        typeComment:
          'The workflowId of an existing workflow to invoke. Mutually exclusive with operationId, operationPath, and channelPath.',
      }),
    ),
    action: optional(
      union([literal('send'), literal('receive')], {
        typeComment: 'Whether this step sends or receives a message. Only relevant when channelPath is set.',
      }),
    ),
    correlationId: optional(
      string({ typeComment: 'A Runtime Expression identifying the correlation ID used to pair send/receive steps.' }),
    ),
    parameters: optional(
      array(union([arazzoParameterObject, arazzoReusableObject]), {
        typeComment: 'A list of parameters to pass to the referenced operation, channel, or workflow.',
      }),
    ),
    requestBody: optional(arazzoRequestBodyObject),
    successCriteria: optional(
      array(arazzoCriterionObject, { typeComment: 'A list of assertions to determine step success.' }),
    ),
    onSuccess: optional(
      array(union([arazzoSuccessActionObject, arazzoReusableObject]), {
        typeComment: 'An array of success action objects to run upon step success.',
      }),
    ),
    onFailure: optional(
      array(union([arazzoFailureActionObject, arazzoReusableObject]), {
        typeComment: 'An array of failure action objects to run upon step failure.',
      }),
    ),
    outputs: optional(
      record(string(), union([string(), arazzoSelectorObject]), {
        typeComment: 'Map of output name to a Runtime Expression or Selector Object.',
      }),
    ),
    timeout: optional(
      number({ typeComment: 'A non-negative integer indicating the timeout in seconds for this step.' }),
    ),
    dependsOn: optional(
      array(string(), { typeComment: 'A list of stepIds that MUST be completed before this step can be processed.' }),
    ),
  },
  { typeName: 'ArazzoStepObject' },
)
