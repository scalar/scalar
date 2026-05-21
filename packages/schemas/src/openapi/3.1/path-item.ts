import { array, lazy, object, optional, string } from '@scalar/validation'

import { operation } from '@/openapi/3.1/operation'
import { parameter } from '@/openapi/3.1/parameter'
import { recursiveRef } from '@/openapi/3.1/reference'
import { server } from '@/openapi/3.1/server'

export const pathItem = object(
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
    get: optional(recursiveRef(lazy(() => operation))),
    put: optional(recursiveRef(lazy(() => operation))),
    post: optional(recursiveRef(lazy(() => operation))),
    delete: optional(recursiveRef(lazy(() => operation))),
    patch: optional(recursiveRef(lazy(() => operation))),
    connect: optional(recursiveRef(lazy(() => operation))),
    options: optional(recursiveRef(lazy(() => operation))),
    head: optional(recursiveRef(lazy(() => operation))),
    trace: optional(recursiveRef(lazy(() => operation))),
    servers: optional(array(server, { typeName: 'PathItemServers' })),
    parameters: optional(array(recursiveRef(lazy(() => parameter)), { typeName: 'PathItemParameters' })),
  },
  { typeName: 'PathItemObject' },
)
