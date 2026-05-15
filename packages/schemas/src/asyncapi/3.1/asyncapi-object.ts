import { object, optional, string } from '@scalar/validation'

import { asyncApiChannelsObject } from './channel'
import { asyncApiComponentsObject } from './components'
import { asyncApiInfoObject } from './info'
import { asyncApiOperationsObject } from './operation'
import { normalRef } from './reference'
import { asyncApiServersObject } from './server'

/**
 * Root AsyncAPI 3.1.0 document object (the A2S / AsyncAPI Object).
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.1.0#A2SObject
 */
export const asyncApiObjectSchema = object(
  {
    asyncapi: string({
      typeComment: 'REQUIRED. AsyncAPI Specification version (major.minor.patch). Patch MAY include a hyphen suffix.',
    }),
    id: optional(
      string({
        typeComment: 'Identifier of the application the AsyncAPI document is defining (URI, RFC3986).',
      }),
    ),
    info: asyncApiInfoObject,
    servers: optional(asyncApiServersObject),
    defaultContentType: optional(
      string({
        typeComment: 'Default content type when encoding/decoding a message payload (for example application/json).',
      }),
    ),
    channels: optional(asyncApiChannelsObject),
    operations: optional(asyncApiOperationsObject),
    components: optional(normalRef(asyncApiComponentsObject)),
  },
  {
    typeName: 'AsyncApiObject',
    typeComment: 'Root AsyncAPI 3.1.0 document combining resource listing and API declaration.',
  },
)

/** Alias matching the specification term “A2S” (AsyncAPI Specification) root object. */
export const asyncApiA2sObjectSchema = asyncApiObjectSchema
