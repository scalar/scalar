import { type Schema, array, intersection, object, optional, record, string } from '@scalar/validation'

import {
  XOriginalOasVersion,
  XScalarEnvironments,
  XScalarIcon,
  XScalarIsDirty,
  XScalarNavigation,
  XScalarOriginalDocumentHash,
  XScalarOriginalSourceUrl,
  XScalarRegistryMeta,
  XScalarWatchMode,
} from '@/extensions/document'
import {
  XPostResponse,
  XPreRequest,
  XScalarActiveEnvironment,
  XScalarCookies,
  XScalarOrder,
} from '@/extensions/general'
import { XScalarSelectedServer } from '@/extensions/server'
import { XTagGroups } from '@/extensions/tag'

import { createOpenApiComponentsObject } from './components'
import { openApiExternalDocumentationObject } from './external-documentation'
import { openApiInfoObject } from './info'
import { createOpenApiOperationSchemas } from './operation'
import { type MaybeRefFn, normalRef } from './reference'
import { openApiSecurityRequirementObject } from './security-requirement'
import { openApiServerObject } from './server'
import { openApiTagObject } from './tag'

/**
 * Builds the root OpenAPI 3.1 document schema.
 *
 * Wires sub-schemas from other `create*` factories with the same `maybeRef` so reference
 * handling stays consistent across the document.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createOpenApiDocumentSchema = (maybeRef: MaybeRefFn): Schema => {
  const components = createOpenApiComponentsObject(maybeRef)
  const { pathItemObject } = createOpenApiOperationSchemas(maybeRef)

  const openApiDocumentCore = object(
    {
      openapi: string({
        typeComment:
          'REQUIRED. This string MUST be the version number of the OpenAPI Specification that the OpenAPI Document uses. The openapi field SHOULD be used by tooling to interpret the OpenAPI Document. This is not related to the API info.version string.',
      }),
      info: openApiInfoObject,
      jsonSchemaDialect: optional(
        string({
          typeComment:
            'The default value for the $schema keyword within Schema Objects contained within this OAS document. This MUST be in the form of a URI.',
        }),
      ),
      servers: optional(
        array(openApiServerObject, {
          typeComment:
            'An array of Server Objects, which provide connectivity information to a target server. If the servers field is not provided, or is an empty array, the default value would be a Server Object with a url value of /.',
          typeName: 'OpenApiServers',
        }),
      ),
      paths: optional(
        record(string(), pathItemObject, {
          typeComment: 'The available paths and operations for the API.',
          typeName: 'PathsObject',
        }),
      ),
      webhooks: optional(
        record(string(), pathItemObject, {
          typeComment:
            'The incoming webhooks that MAY be received as part of this API and that the API consumer MAY choose to implement.',
          typeName: 'WebhooksObject',
        }),
      ),
      components: optional(components),
      security: optional(
        array(openApiSecurityRequirementObject, {
          typeComment:
            'A declaration of which security mechanisms can be used across the API. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request.',
          typeName: 'OpenApiSecurity',
        }),
      ),
      tags: optional(
        array(openApiTagObject, {
          typeComment:
            'A list of tags used by the OpenAPI Description with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools.',
        }),
      ),
      externalDocs: optional(openApiExternalDocumentationObject),
    },
    { typeName: 'OpenApiDocumentCore' },
  )

  const openapiExtensions = intersection(
    [
      XOriginalOasVersion,
      XScalarNavigation,
      XScalarOriginalSourceUrl,
      XTagGroups,
      XScalarEnvironments,
      XScalarSelectedServer,
      XScalarIcon,
      XScalarOrder,
      XScalarCookies,
      XScalarOriginalDocumentHash,
      XScalarIsDirty,
      XScalarActiveEnvironment,
      XScalarWatchMode,
      XScalarRegistryMeta,
      XPreRequest,
      XPostResponse,
    ],
    {
      typeName: 'OpenApiExtensions',
      typeComment: 'OpenAPI extensions shared by OpenAPI and AsyncAPI documents.',
    },
  )

  return intersection([openApiDocumentCore, openapiExtensions], {
    typeName: 'OpenApiDocument',
    typeComment: 'Root OpenAPI 3.1 document including Scalar workspace extensions (OpenApiExtensionsSchema).',
  })
}

export const defaultDocumentSchema = createOpenApiDocumentSchema(normalRef)
