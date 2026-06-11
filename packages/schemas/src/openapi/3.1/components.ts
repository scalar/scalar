import { lazy, object, optional, record, string } from '@scalar/validation'

import { callback } from '@/openapi/3.1/callback'
import { example } from '@/openapi/3.1/example'
import { link } from '@/openapi/3.1/link'
import { header } from '@/openapi/3.1/media-type'
import { parameter } from '@/openapi/3.1/parameter'
import { pathItem } from '@/openapi/3.1/path-item'
import { normalRef, recursiveRef } from '@/openapi/3.1/reference'
import { requestBody } from '@/openapi/3.1/request-body'
import { response } from '@/openapi/3.1/response'
import { schema } from '@/openapi/3.1/schema'
import { securityScheme } from '@/openapi/3.1/security-schemes'

export const components = lazy(() =>
  object(
    {
      schemas: optional(record(string(), normalRef(schema), { typeName: 'ComponentsSchemas' })),
      responses: optional(record(string(), recursiveRef(lazy(() => response)), { typeName: 'ComponentsResponses' })),
      parameters: optional(record(string(), recursiveRef(lazy(() => parameter)), { typeName: 'ComponentsParameters' })),
      examples: optional(record(string(), recursiveRef(lazy(() => example)), { typeName: 'ComponentsExamples' })),
      requestBodies: optional(
        record(string(), recursiveRef(lazy(() => requestBody)), { typeName: 'ComponentsRequestBodies' }),
      ),
      headers: optional(record(string(), recursiveRef(lazy(() => header)), { typeName: 'ComponentsHeaders' })),
      securitySchemes: optional(
        record(string(), recursiveRef(lazy(() => securityScheme)), { typeName: 'ComponentsSecuritySchemes' }),
      ),
      links: optional(record(string(), recursiveRef(lazy(() => link)), { typeName: 'ComponentsLinks' })),
      callbacks: optional(record(string(), recursiveRef(lazy(() => callback)), { typeName: 'ComponentsCallbacks' })),
      pathItems: optional(record(string(), recursiveRef(lazy(() => pathItem)), { typeName: 'ComponentsPathItems' })),
    },
    { typeName: 'ComponentsObject' },
  ),
)
