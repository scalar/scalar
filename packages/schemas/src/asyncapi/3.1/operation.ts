import { array, lazy, literal, object, optional, record, string, union } from '@scalar/validation'

import { asyncApiOperationBindingsObject } from './bindings'
import { createAsyncApiExternalDocumentationObject } from './external-documentation'
import { createAsyncApiOperationReplyObject } from './operation-reply'
import { createAsyncApiOperationTraitObject } from './operation-trait'
import { type MaybeRefFn, asyncApiReferenceObject, normalRef } from './reference'
import { createAsyncApiSecuritySchemeObject } from './security-scheme'
import { createAsyncApiTagSchemas } from './tag'

/**
 * Builds Operation-related schemas for {@link generateSchema}.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 * @returns `operationObject` — **Reference union** (`Operation Object | Reference Object`). The
 *   `channel` field is a Reference Object only in the raw document. Do not wrap again.
 * @returns `operationsObject` — Map whose values use the same union.
 */
export const createAsyncApiOperationSchemas = (maybeRef: MaybeRefFn) => {
  const externalDocumentation = createAsyncApiExternalDocumentationObject(maybeRef)
  const operationReply = createAsyncApiOperationReplyObject(maybeRef)
  const operationTrait = createAsyncApiOperationTraitObject(maybeRef)
  const securityScheme = createAsyncApiSecuritySchemeObject(maybeRef)
  const { tagsObject } = createAsyncApiTagSchemas(maybeRef)

  const operationObject = lazy(() =>
    maybeRef(
      object(
        {
          action: union([literal('send'), literal('receive')], {
            typeComment:
              'REQUIRED. send when the application sends to the channel; receive when it receives from the channel.',
          }),
          channel: asyncApiReferenceObject,
          title: optional(string({ typeComment: 'A human-friendly title for the operation.' })),
          summary: optional(string({ typeComment: 'A short summary of what the operation is about.' })),
          description: optional(
            string({
              typeComment:
                'A verbose explanation of the operation. CommonMark syntax MAY be used for rich text representation.',
            }),
          ),
          security: optional(
            array(securityScheme, {
              typeComment:
                'Security schemes for this operation. Only one of the security scheme objects MUST be satisfied.',
            }),
          ),
          tags: optional(tagsObject),
          externalDocs: optional(externalDocumentation),
          bindings: optional(maybeRef(asyncApiOperationBindingsObject)),
          traits: optional(array(operationTrait)),
          messages: optional(
            array(asyncApiReferenceObject, {
              typeComment:
                'Subset of channel messages as Reference Objects only. Omit to include all channel messages; use [] for none.',
            }),
          ),
          reply: optional(operationReply),
        },
        { typeName: 'AsyncApiOperationObject' },
      ),
    ),
  )

  const operationsObject = record(string(), operationObject, {
    typeName: 'AsyncApiOperationsObject',
    typeComment: 'Map of operationId to Operation Object or Reference Object.',
  })

  return { operationObject, operationsObject }
}

const defaultOperationSchemas = createAsyncApiOperationSchemas(normalRef)

export const asyncApiOperationObject = defaultOperationSchemas.operationObject
export const asyncApiOperationsObject = defaultOperationSchemas.operationsObject
