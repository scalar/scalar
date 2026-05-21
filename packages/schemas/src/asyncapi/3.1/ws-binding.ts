import { literal, object, optional, string, union } from '@scalar/validation'

import { asyncApiSchemaObjectOrReference } from './schema-payload'

/**
 * AsyncAPI WebSocket binding (channel / operation / server).
 *
 * @see https://github.com/asyncapi/bindings/tree/master/websockets
 */
export const asyncApiWsBindingObject = object(
  {
    method: optional(
      union([literal('GET'), literal('POST')], {
        typeComment: 'HTTP method used when establishing the WebSocket connection (typically GET).',
      }),
    ),
    query: optional(asyncApiSchemaObjectOrReference, {
      typeComment:
        'Schema Object describing WebSocket handshake query parameters (type object with properties). May be a Reference Object.',
    }),
    headers: optional(asyncApiSchemaObjectOrReference, {
      typeComment:
        'Schema Object describing HTTP headers sent during the WebSocket handshake (type object with properties). May be a Reference Object.',
    }),
    bindingVersion: optional(
      string({
        typeComment: 'Version of the WebSocket binding. When omitted, "latest" is assumed per the binding spec.',
      }),
    ),
  },
  {
    typeName: 'AsyncApiWsBindingObject',
    typeComment: 'AsyncAPI WebSocket binding for handshake method, query, and headers.',
  },
)
