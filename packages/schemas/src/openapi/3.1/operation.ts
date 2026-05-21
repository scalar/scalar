import { type Schema, array, boolean, intersection, lazy, object, optional, record, string } from '@scalar/validation'

import { XInternal, XScalarIgnore } from '@/extensions/document'
import { XPostResponse, XPreRequest } from '@/extensions/general'
import {
  XBadges,
  XCodeSamples,
  XDraftExamples,
  XScalarDisableParameters,
  XScalarStability,
} from '@/extensions/operation'
import { XScalarSelectedServer } from '@/extensions/server'

import { openApiExternalDocumentationObject } from './external-documentation'
import { createOpenApiParameterObject } from './parameter'
import { type MaybeRefFn, normalRef } from './reference'
import { createOpenApiRequestBodyObject } from './request-body'
import { createOpenApiResponseSchemas } from './response'
import { openApiSecurityRequirementObject } from './security-requirement'
import { openApiServerObject } from './server'

/**
 * Builds Operation and Path Item schemas for {@link createOpenApiDocumentSchema}.
 *
 * Operation callbacks reference path items and vice versa; both are defined here so `lazy`
 * can break the cycle.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createOpenApiOperationSchemas = (maybeRef: MaybeRefFn) => {
  const parameterObject = createOpenApiParameterObject(maybeRef)
  const requestBodyObject = createOpenApiRequestBodyObject(maybeRef)
  const { responsesObject } = createOpenApiResponseSchemas(maybeRef)

  let pathItemObject: Schema

  const callbackObject = record(string(), maybeRef(lazy(() => pathItemObject)), {
    typeName: 'CallbackObject',
  })

  const operationObject = intersection(
    [
      object({
        tags: optional(
          array(string(), {
            typeComment:
              'A list of tags for API documentation control. Tags can be used for logical grouping of operations by resources or any other qualifier.',
            typeName: 'OperationTags',
          }),
        ),
        summary: optional(string({ typeComment: 'A short summary of what the operation does.' })),
        description: optional(
          string({
            typeComment:
              'A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        externalDocs: optional(openApiExternalDocumentationObject),
        operationId: optional(
          string({
            typeComment:
              'Unique string used to identify the operation. The id MUST be unique among all operations described in the API. The operationId value is case-sensitive.',
          }),
        ),
        parameters: optional(array(maybeRef(lazy(() => parameterObject)), { typeName: 'OperationParameters' })),
        requestBody: optional(maybeRef(lazy(() => requestBodyObject))),
        responses: optional(lazy(() => responsesObject)),
        deprecated: optional(
          boolean({
            typeComment:
              'Declares this operation to be deprecated. Consumers SHOULD refrain from usage of the declared operation. Default value is false.',
          }),
        ),
        security: optional(array(openApiSecurityRequirementObject, { typeName: 'OperationSecurity' })),
        servers: optional(array(openApiServerObject, { typeName: 'OperationServers' })),
        callbacks: optional(record(string(), maybeRef(lazy(() => callbackObject)), { typeName: 'OperationCallbacks' })),
      }),
      XBadges,
      XInternal,
      XScalarIgnore,
      XCodeSamples,
      XScalarStability,
      XScalarDisableParameters,
      XPostResponse,
      XPreRequest,
      XDraftExamples,
      XScalarSelectedServer,
    ],
    { typeName: 'OperationObject' },
  )

  pathItemObject = object(
    {
      $ref: optional(
        string({
          typeComment:
            'Allows for a referenced definition of this path item. The value MUST be in the form of a URI, and the referenced structure MUST be in the form of a Path Item Object.',
        }),
      ),
      summary: optional(
        string({
          typeComment: 'An optional string summary, intended to apply to all operations in this path.',
        }),
      ),
      description: optional(
        string({
          typeComment:
            'An optional string description, intended to apply to all operations in this path. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      get: optional(maybeRef(lazy(() => operationObject))),
      put: optional(maybeRef(lazy(() => operationObject))),
      post: optional(maybeRef(lazy(() => operationObject))),
      delete: optional(maybeRef(lazy(() => operationObject))),
      patch: optional(maybeRef(lazy(() => operationObject))),
      connect: optional(maybeRef(lazy(() => operationObject))),
      options: optional(maybeRef(lazy(() => operationObject))),
      head: optional(maybeRef(lazy(() => operationObject))),
      trace: optional(maybeRef(lazy(() => operationObject))),
      servers: optional(array(openApiServerObject, { typeName: 'PathItemServers' })),
      parameters: optional(array(maybeRef(lazy(() => parameterObject)), { typeName: 'PathItemParameters' })),
    },
    { typeName: 'PathItemObject' },
  )

  return { operationObject, pathItemObject, callbackObject }
}

const defaultOperationSchemas = createOpenApiOperationSchemas(normalRef)

export const openApiOperationObject = defaultOperationSchemas.operationObject
export const openApiPathItemObject = defaultOperationSchemas.pathItemObject
export const openApiCallbackObject = defaultOperationSchemas.callbackObject
