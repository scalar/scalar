import { array, lazy, nullable, object, optional, record, string, union } from '@scalar/validation'

import { asyncApiChannelBindingsObject } from './bindings'
import { createAsyncApiExternalDocumentationObject } from './external-documentation'
import { createAsyncApiMessageSchemas } from './message'
import { createAsyncApiParametersObject } from './parameters'
import { type MaybeRefFn, asyncApiReferenceObject, normalRef } from './reference'
import { createAsyncApiTagSchemas } from './tag'

/**
 * Builds Channel-related schemas for {@link generateSchema}.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 * @returns `channelObject` — **Reference union** (`Channel Object | Reference Object`). Lazy for
 *   circular dependencies. Do not wrap again.
 * @returns `channelsObject` — Map whose values use the same union.
 */
export const createAsyncApiChannelSchemas = (maybeRef: MaybeRefFn) => {
  const externalDocumentation = createAsyncApiExternalDocumentationObject(maybeRef)
  const { messagesObject } = createAsyncApiMessageSchemas(maybeRef)
  const parameters = createAsyncApiParametersObject(maybeRef)
  const { tagsObject } = createAsyncApiTagSchemas(maybeRef)

  const channelObject = lazy(() =>
    maybeRef(
      object(
        {
          address: optional(union([string(), nullable()], { typeComment: 'Channel address or null when unknown.' })),
          messages: optional(messagesObject),
          title: optional(string({ typeComment: 'A human-friendly title for the channel.' })),
          summary: optional(string({ typeComment: 'A short summary of the channel.' })),
          description: optional(
            string({
              typeComment:
                'An optional description of this channel. CommonMark syntax MAY be used for rich text representation.',
            }),
          ),
          servers: optional(
            array(asyncApiReferenceObject, {
              typeComment:
                'References to Server definitions where this channel is available (Reference Objects only in the raw document).',
            }),
          ),
          parameters: optional(parameters),
          tags: optional(tagsObject),
          externalDocs: optional(externalDocumentation),
          bindings: optional(maybeRef(asyncApiChannelBindingsObject)),
        },
        { typeName: 'AsyncApiChannelObject' },
      ),
    ),
  )

  const channelsObject = record(string(), channelObject, {
    typeName: 'AsyncApiChannelsObject',
    typeComment: 'Map of channelId to Channel Object or Reference Object.',
  })

  return { channelObject, channelsObject }
}

const defaultChannelSchemas = createAsyncApiChannelSchemas(normalRef)

export const asyncApiChannelObject = defaultChannelSchemas.channelObject
export const asyncApiChannelsObject = defaultChannelSchemas.channelsObject
