import {
  type Schema,
  any,
  array,
  boolean,
  intersection,
  lazy,
  literal,
  object,
  optional,
  record,
  string,
  union,
} from '@scalar/validation'

import {
  XInternal,
  XOriginalOasVersion,
  XScalarEnvironments,
  XScalarIcon,
  XScalarIgnore,
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
import {
  XBadges,
  XCodeSamples,
  XDraftExamples,
  XScalarDisableParameters,
  XScalarSelectedContentType,
  XScalarStability,
} from '@/extensions/operation'
import { XGlobal } from '@/extensions/parameter'
import { XScalarSelectedServer } from '@/extensions/server'
import { XTagGroups } from '@/extensions/tag'
import { example } from '@/openapi/3.1/example'
import { externalDocs } from '@/openapi/3.1/external-docs'
import { info } from '@/openapi/3.1/info'
import { normalRef, recursiveRef } from '@/openapi/3.1/reference'
import { schema } from '@/openapi/3.1/schema'
import { securityRequirement } from '@/openapi/3.1/security-requirement'
import { securityScheme } from '@/openapi/3.1/security-schemes'
import { server } from '@/openapi/3.1/server'
import { tag } from '@/openapi/3.1/tag'

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

const components: Schema = lazy(() =>
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
      pathItems: optional(
        record(
          string(),
          lazy(() => pathItem),
          { typeName: 'ComponentsPathItems' },
        ),
      ),
    },
    { typeName: 'ComponentsObject' },
  ),
)

const headerBase = object(
  {
    description: optional(
      string({
        typeComment:
          'A brief description of the header. This could contain examples of use. CommonMark syntax MAY be used for rich text representation.',
      }),
    ),
    required: optional(
      boolean({ typeComment: 'Determines whether this header is mandatory. The default value is false.' }),
    ),
    deprecated: optional(
      boolean({
        typeComment:
          'Specifies that the header is deprecated and SHOULD be transitioned out of usage. Default value is false.',
      }),
    ),
  },
  { typeName: 'HeaderBase' },
)

const headerWithSchema: Schema = intersection([
  headerBase,
  object(
    {
      style: optional(
        string({
          typeComment:
            'Describes how the header value will be serialized. The default (and only legal value for headers) is "simple".',
        }),
      ),
      explode: optional(
        boolean({
          typeComment:
            'When this is true, header values of type array or object generate a single header whose value is a comma-separated list of the array items or key-value pairs of the map, see Style Examples.',
        }),
      ),
      schema: optional(normalRef(lazy(() => schema))),
      example: optional(any()),
      examples: optional(record(string(), recursiveRef(lazy(() => example)), { typeName: 'HeaderExamples' })),
    },
    { typeName: 'HeaderObjectWithSchema' },
  ),
])

const headerWithContent: Schema = intersection([
  headerBase,
  object(
    {
      content: optional(
        record(
          string(),
          lazy(() => mediaType),
          { typeName: 'HeaderContent' },
        ),
      ),
    },
    { typeName: 'HeaderObjectWithContent' },
  ),
])

const header: Schema = union([headerWithSchema, headerWithContent], { typeName: 'HeaderObject' })

const encoding: Schema = object(
  {
    contentType: optional(
      string({
        typeComment:
          'The Content-Type for encoding a specific property. The value is a comma-separated list, each element of which is either a specific media type (e.g. image/png) or a wildcard media type (e.g. image/*).',
      }),
    ),
    headers: optional(record(string(), recursiveRef(lazy(() => header)), { typeName: 'EncodingHeaders' })),
  },
  { typeName: 'EncodingObject' },
)

const mediaType: Schema = object(
  {
    schema: optional(normalRef(lazy(() => schema))),
    example: optional(any({ typeComment: 'Example of the media type.' })),
    examples: optional(record(string(), recursiveRef(lazy(() => example)), { typeName: 'MediaTypeExamples' })),
    encoding: optional(
      record(string(), encoding, {
        typeComment:
          'A map between a property name and its encoding information. The key, being the property name, MUST exist in the schema as a property.',
        typeName: 'MediaTypeEncoding',
      }),
    ),
  },
  { typeName: 'MediaTypeObject' },
)

const parameterWithSchema: Schema = intersection(
  [
    object({
      name: string({
        typeComment:
          'REQUIRED. The name of the parameter. Parameter names are case sensitive. If in is "path", the name field MUST correspond to a template expression occurring within the path field in the Paths Object.',
      }),
      in: union([literal('query'), literal('header'), literal('path'), literal('cookie')], {
        typeName: 'ParameterLocation',
        typeComment:
          'REQUIRED. The location of the parameter. Possible values are "query", "header", "path" or "cookie".',
      }),
      description: optional(
        string({
          typeComment:
            'A brief description of the parameter. This could contain examples of use. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      required: optional(
        boolean({
          typeComment:
            'Determines whether this parameter is mandatory. If the parameter location is "path", this field is REQUIRED and its value MUST be true.',
        }),
      ),
      deprecated: optional(
        boolean({
          typeComment:
            'Specifies that a parameter is deprecated and SHOULD be transitioned out of usage. Default value is false.',
        }),
      ),
      allowEmptyValue: optional(
        boolean({
          typeComment:
            'If true, clients MAY pass a zero-length string value in place of parameters that would otherwise be omitted entirely. This field is valid only for query parameters.',
        }),
      ),
      allowReserved: optional(
        boolean({
          typeComment:
            'When this is true, parameter values are serialized using reserved expansion, as defined by RFC6570. This field only applies to parameters with an in value of query. The default value is false.',
        }),
      ),
      style: optional(
        string({
          typeComment: 'Describes how the parameter value will be serialized (depending on the schema type).',
        }),
      ),
      explode: optional(
        boolean({
          typeComment:
            'When this is true, parameter values of type array or object generate separate parameters for each array item or object property.',
        }),
      ),
      schema: optional(normalRef(lazy(() => schema))),
      example: optional(any()),
      examples: optional(record(string(), recursiveRef(lazy(() => example)), { typeName: 'ParameterExamples' })),
    }),
    XGlobal,
    XInternal,
    XScalarIgnore,
  ],
  { typeName: 'ParameterObjectWithSchema' },
)

const parameterWithContent: Schema = intersection(
  [
    object({
      name: string({
        typeComment:
          'REQUIRED. The name of the parameter. Parameter names are case sensitive. If in is "path", the name field MUST correspond to a template expression occurring within the path field in the Paths Object.',
      }),
      in: union([literal('query'), literal('header'), literal('path'), literal('cookie')], {
        typeName: 'ParameterLocation',
        typeComment:
          'REQUIRED. The location of the parameter. Possible values are "query", "header", "path" or "cookie".',
      }),
      description: optional(
        string({
          typeComment:
            'A brief description of the parameter. This could contain examples of use. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      required: optional(
        boolean({
          typeComment:
            'Determines whether this parameter is mandatory. If the parameter location is "path", this field is REQUIRED and its value MUST be true.',
        }),
      ),
      deprecated: optional(
        boolean({
          typeComment:
            'Specifies that a parameter is deprecated and SHOULD be transitioned out of usage. Default value is false.',
        }),
      ),
      allowEmptyValue: optional(
        boolean({
          typeComment:
            'If true, clients MAY pass a zero-length string value in place of parameters that would otherwise be omitted entirely. This field is valid only for query parameters.',
        }),
      ),
      allowReserved: optional(
        boolean({
          typeComment:
            'When this is true, parameter values are serialized using reserved expansion, as defined by RFC6570. This field only applies to parameters with an in value of query. The default value is false.',
        }),
      ),
      content: optional(
        record(
          string(),
          lazy(() => mediaType),
          { typeName: 'ParameterContent' },
        ),
      ),
    }),
    XGlobal,
    XInternal,
    XScalarIgnore,
  ],
  { typeName: 'ParameterObjectWithContent' },
)

const parameter = union([parameterWithSchema, parameterWithContent], { typeName: 'ParameterObject' })

const requestBody: Schema = intersection(
  [
    object({
      description: optional(
        string({
          typeComment:
            'A brief description of the request body. This could contain examples of use. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      content: record(
        string(),
        lazy(() => mediaType),
        {
          typeComment:
            'REQUIRED. The content of the request body. The key is a media type or media type range and the value describes it.',
          typeName: 'RequestBodyContent',
        },
      ),
      required: optional(
        boolean({ typeComment: 'Determines if the request body is required in the request. Defaults to false.' }),
      ),
    }),
    XScalarSelectedContentType,
  ],
  { typeName: 'RequestBodyObject' },
)

const link = object(
  {
    operationRef: optional(
      string({
        typeComment:
          'A URI reference to an OAS operation. This field is mutually exclusive of the operationId field, and MUST point to an Operation Object.',
      }),
    ),
    operationId: optional(
      string({
        typeComment:
          'The name of an existing, resolvable OAS operation, as defined with a unique operationId. This field is mutually exclusive of the operationRef field.',
      }),
    ),
    parameters: optional(
      record(string(), any(), {
        typeComment:
          'A map representing parameters to pass to an operation as specified with operationId or identified via operationRef.',
        typeName: 'LinkParameters',
      }),
    ),
    requestBody: optional(
      any({
        typeComment: 'A literal value or {expression} to use as a request body when calling the target operation.',
      }),
    ),
    description: optional(
      string({
        typeComment: 'A description of the link. CommonMark syntax MAY be used for rich text representation.',
      }),
    ),
    server: optional(server),
  },
  { typeName: 'LinkObject' },
)

const response = object(
  {
    description: string({
      typeComment:
        'REQUIRED. A description of the response. CommonMark syntax MAY be used for rich text representation.',
    }),
    headers: optional(record(string(), recursiveRef(lazy(() => header)), { typeName: 'ResponseHeaders' })),
    content: optional(
      record(
        string(),
        lazy(() => mediaType),
        { typeName: 'ResponseContent' },
      ),
    ),
    links: optional(record(string(), recursiveRef(lazy(() => link)), { typeName: 'ResponseLinks' })),
  },
  { typeName: 'ResponseObject' },
)

const responsesObject: Schema = record(string(), recursiveRef(lazy(() => response)), {
  typeName: 'ResponsesObject',
})

const callback: Schema = record(string(), recursiveRef(lazy(() => pathItem)), {
  typeName: 'CallbackObject',
})

const operation: Schema = intersection(
  [
    object({
      tags: optional(
        array(string(), {
          typeComment:
            'A list of tags for API documentation control. Tags can be used for logical grouping of operations by resources or any other qualifier.',
          typeName: 'OperationTags',
        }),
      ),
      summary: optional(string({ typeComment: 'A short summary of what the operation does.' })),
      description: optional(
        string({
          typeComment:
            'A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      externalDocs: optional(externalDocs),
      operationId: optional(
        string({
          typeComment:
            'Unique string used to identify the operation. The id MUST be unique among all operations described in the API. The operationId value is case-sensitive.',
        }),
      ),
      parameters: optional(array(recursiveRef(lazy(() => parameter)), { typeName: 'OperationParameters' })),
      requestBody: optional(recursiveRef(lazy(() => requestBody))),
      responses: optional(lazy(() => responsesObject)),
      deprecated: optional(
        boolean({
          typeComment:
            'Declares this operation to be deprecated. Consumers SHOULD refrain from usage of the declared operation. Default value is false.',
        }),
      ),
      security: optional(array(securityRequirement, { typeName: 'OperationSecurity' })),
      servers: optional(array(server, { typeName: 'OperationServers' })),
      callbacks: optional(record(string(), recursiveRef(lazy(() => callback)), { typeName: 'OperationCallbacks' })),
    }),
    XBadges,
    XInternal,
    XScalarIgnore,
    XCodeSamples,
    XScalarStability,
    XScalarDisableParameters,
    XPostResponse,
    XPreRequest,
    XDraftExamples,
    XScalarSelectedServer,
  ],
  { typeName: 'OperationObject' },
)

const pathItem: Schema = object(
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

const openApiDocumentCore = object(
  {
    openapi: string({
      typeComment:
        'REQUIRED. This string MUST be the version number of the OpenAPI Specification that the OpenAPI Document uses. The openapi field SHOULD be used by tooling to interpret the OpenAPI Document. This is not related to the API info.version string.',
    }),
    info,
    jsonSchemaDialect: optional(
      string({
        typeComment:
          'The default value for the $schema keyword within Schema Objects contained within this OAS document. This MUST be in the form of a URI.',
      }),
    ),
    servers: optional(
      array(server, {
        typeComment:
          'An array of Server Objects, which provide connectivity information to a target server. If the servers field is not provided, or is an empty array, the default value would be a Server Object with a url value of /.',
        typeName: 'OpenApiServers',
      }),
    ),
    paths: optional(
      record(string(), pathItem, {
        typeComment: 'The available paths and operations for the API.',
        typeName: 'PathsObject',
      }),
    ),
    webhooks: optional(
      record(string(), pathItem, {
        typeComment:
          'The incoming webhooks that MAY be received as part of this API and that the API consumer MAY choose to implement.',
        typeName: 'WebhooksObject',
      }),
    ),
    components: optional(components),
    security: optional(
      array(securityRequirement, {
        typeComment:
          'A declaration of which security mechanisms can be used across the API. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request.',
        typeName: 'OpenApiSecurity',
      }),
    ),
    tags: optional(
      array(tag, {
        typeComment:
          'A list of tags used by the OpenAPI Description with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools.',
      }),
    ),
    externalDocs: optional(externalDocs),
  },
  { typeName: 'OpenApiDocumentCore' },
)

export const openApiSchema = intersection([openApiDocumentCore, openapiExtensions], {
  typeName: 'OpenApiDocument',
  typeComment: 'Root OpenAPI 3.1 document including Scalar workspace extensions (OpenApiExtensionsSchema).',
})
