import { intersection, object, optional, string } from '@scalar/validation'

import {
  XOriginalAasVersion,
  XScalarIsDirty,
  XScalarNavigation,
  XScalarOriginalDocumentHash,
  XScalarOriginalSourceUrl,
  XScalarRegistryMeta,
  XScalarWatchMode,
} from '@/extensions/document'

import { asyncApiChannelsObject } from './channel'
import { asyncApiComponentsObject } from './components'
import { asyncApiInfoObject } from './info'
import { asyncApiOperationsObject } from './operation'
import { recursiveRef } from './reference'
import { asyncApiServersObject } from './server'

const asyncApiExtensions = intersection(
  [
    XOriginalAasVersion,
    XScalarNavigation,
    XScalarOriginalSourceUrl,
    XScalarOriginalDocumentHash,
    XScalarIsDirty,
    XScalarWatchMode,
    XScalarRegistryMeta,
  ],
  {
    typeName: 'AsyncApiExtensions',
    typeComment: 'AsyncAPI document-level Scalar extensions shared with workspace tooling.',
  },
)

const asyncApiDocumentCore = object(
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
    components: optional(recursiveRef(asyncApiComponentsObject)),
  },
  {
    typeName: 'AsyncApiDocumentCore',
    typeComment: 'Root AsyncAPI 3.1.0 document combining resource listing and API declaration.',
  },
)

/**
 * Root AsyncAPI 3.1.0 document (the A2S / AsyncAPI Object).
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.1.0#A2SObject
 */
export const asyncApiObjectSchema = intersection([asyncApiDocumentCore, asyncApiExtensions], {
  typeName: 'AsyncApiObject',
  typeComment: 'Root AsyncAPI 3.1.0 document including Scalar workspace extensions (AsyncApiExtensionsSchema).',
})
