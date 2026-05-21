import { type Schema, lazy, object, optional, record, string } from '@scalar/validation'

import { openApiExampleObject } from './example'
import { openApiLinkObject } from './link'
import { createOpenApiMediaTypeSchemas } from './media-type'
import { createOpenApiOperationSchemas } from './operation'
import { createOpenApiParameterObject } from './parameter'
import { type MaybeRefFn, normalRef } from './reference'
import { createOpenApiRequestBodyObject } from './request-body'
import { createOpenApiResponseSchemas } from './response'
import { openApiSchemaObject } from './schema'
import { openApiSecuritySchemeObject } from './security-scheme'

/**
 * Builds the Components Object schema for {@link createOpenApiDocumentSchema}.
 *
 * **Not a reference union:** The components container is always inline. Each map under
 * `components` uses values from other `create*` factories that are already reference unions
 * where the specification allows `$ref`.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createOpenApiComponentsObject = (maybeRef: MaybeRefFn): Schema => {
  const parameterObject = createOpenApiParameterObject(maybeRef)
  const requestBodyObject = createOpenApiRequestBodyObject(maybeRef)
  const { responseObject } = createOpenApiResponseSchemas(maybeRef)
  const { headerObject } = createOpenApiMediaTypeSchemas(maybeRef)
  const { pathItemObject, callbackObject } = createOpenApiOperationSchemas(maybeRef)

  return object(
    {
      schemas: optional(record(string(), maybeRef(openApiSchemaObject), { typeName: 'ComponentsSchemas' })),
      responses: optional(record(string(), maybeRef(lazy(() => responseObject)), { typeName: 'ComponentsResponses' })),
      parameters: optional(
        record(string(), maybeRef(lazy(() => parameterObject)), { typeName: 'ComponentsParameters' }),
      ),
      examples: optional(
        record(string(), maybeRef(lazy(() => openApiExampleObject)), { typeName: 'ComponentsExamples' }),
      ),
      requestBodies: optional(
        record(string(), maybeRef(lazy(() => requestBodyObject)), { typeName: 'ComponentsRequestBodies' }),
      ),
      headers: optional(record(string(), maybeRef(lazy(() => headerObject)), { typeName: 'ComponentsHeaders' })),
      securitySchemes: optional(
        record(string(), maybeRef(lazy(() => openApiSecuritySchemeObject)), { typeName: 'ComponentsSecuritySchemes' }),
      ),
      links: optional(record(string(), maybeRef(lazy(() => openApiLinkObject)), { typeName: 'ComponentsLinks' })),
      callbacks: optional(record(string(), maybeRef(lazy(() => callbackObject)), { typeName: 'ComponentsCallbacks' })),
      pathItems: optional(
        record(
          string(),
          lazy(() => pathItemObject),
          {
            typeName: 'ComponentsPathItems',
          },
        ),
      ),
    },
    { typeName: 'ComponentsObject' },
  )
}

export const openApiComponentsObject = createOpenApiComponentsObject(normalRef)
