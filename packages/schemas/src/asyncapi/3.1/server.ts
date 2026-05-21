import { array, object, optional, record, string } from '@scalar/validation'

import { asyncApiServerBindingsObject } from './bindings'
import { asyncApiExternalDocumentationObject } from './external-documentation'
import { normalRef } from './reference'
import { asyncApiSecuritySchemeObject } from './security-scheme'
import { asyncApiServerVariableObject } from './server-variable'
import { asyncApiTagsObject } from './tag'

/** Server Object | Reference Object */
export const asyncApiServerObject = normalRef(
  object(
    {
      host: string({
        typeComment:
          'REQUIRED. The server host name. It MAY include the port. Supports Server Variables in {braces}.',
      }),
      protocol: string({ typeComment: 'REQUIRED. The protocol this server supports for connection.' }),
      protocolVersion: optional(
        string({ typeComment: 'The version of the protocol used for connection (for example 0-9-1 for AMQP).' }),
      ),
      pathname: optional(
        string({
          typeComment: 'The path to a resource in the host. Supports Server Variables in {braces}.',
        }),
      ),
      description: optional(
        string({
          typeComment:
            'An optional string describing the server. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      title: optional(string({ typeComment: 'A human-friendly title for the server.' })),
      summary: optional(string({ typeComment: 'A short summary of the server.' })),
      variables: optional(
        record(string(), asyncApiServerVariableObject, {
          typeComment: 'Map between a variable name and its Server Variable Object or Reference Object.',
        }),
      ),
      security: optional(
        array(asyncApiSecuritySchemeObject, {
          typeComment:
            'Alternative security schemes for this server; only one of the security scheme objects need to be satisfied.',
        }),
      ),
      tags: optional(asyncApiTagsObject),
      externalDocs: optional(asyncApiExternalDocumentationObject),
      bindings: optional(normalRef(asyncApiServerBindingsObject)),
    },
    { typeName: 'AsyncApiServerObject' },
  ),
)

export const asyncApiServersObject = record(string(), asyncApiServerObject, {
  typeName: 'AsyncApiServersObject',
  typeComment: 'Map of server name to Server Object or Reference Object.',
})
