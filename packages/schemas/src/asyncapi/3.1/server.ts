import { array, object, optional, record, string } from '@scalar/validation'

import { asyncApiServerBindingsObject } from './bindings'
import { createAsyncApiExternalDocumentationObject } from './external-documentation'
import { type MaybeRefFn, normalRef } from './reference'
import { createAsyncApiSecuritySchemeObject } from './security-scheme'
import { createAsyncApiServerVariableObject } from './server-variable'
import { createAsyncApiTagSchemas } from './tag'

/**
 * Builds Server-related schemas for {@link generateSchema}.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 * @returns `serverObject` — **Reference union** (`Server Object | Reference Object`). Do not
 *   wrap again.
 * @returns `serversObject` — Map whose values use the same union.
 */
export const createAsyncApiServerSchemas = (maybeRef: MaybeRefFn) => {
  const externalDocumentation = createAsyncApiExternalDocumentationObject(maybeRef)
  const serverVariable = createAsyncApiServerVariableObject(maybeRef)
  const securityScheme = createAsyncApiSecuritySchemeObject(maybeRef)
  const { tagsObject } = createAsyncApiTagSchemas(maybeRef)

  const serverObject = maybeRef(
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
          record(string(), serverVariable, {
            typeComment: 'Map between a variable name and its Server Variable Object or Reference Object.',
          }),
        ),
        security: optional(
          array(securityScheme, {
            typeComment:
              'Alternative security schemes for this server; only one of the security scheme objects need to be satisfied.',
          }),
        ),
        tags: optional(tagsObject),
        externalDocs: optional(externalDocumentation),
        bindings: optional(maybeRef(asyncApiServerBindingsObject)),
      },
      { typeName: 'AsyncApiServerObject' },
    ),
  )

  const serversObject = record(string(), serverObject, {
    typeName: 'AsyncApiServersObject',
    typeComment: 'Map of server name to Server Object or Reference Object.',
  })

  return { serverObject, serversObject }
}

const defaultServerSchemas = createAsyncApiServerSchemas(normalRef)

export const asyncApiServerObject = defaultServerSchemas.serverObject
export const asyncApiServersObject = defaultServerSchemas.serversObject
