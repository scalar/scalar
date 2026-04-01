import {
  type Schema,
  any,
  array,
  boolean,
  intersection,
  lazy,
  literal,
  number,
  object,
  optional,
  record,
  string,
  union,
} from '@scalar/validation'

import { extensions } from '@/schemas/extensions'
import { XInternal } from '@/schemas/extensions/document/x-internal'
import { XScalarEnvironments } from '@/schemas/extensions/document/x-scalar-environments'
import { XScalarIcon } from '@/schemas/extensions/document/x-scalar-icon'
import { XScalarIgnore } from '@/schemas/extensions/document/x-scalar-ignore'
import { XScalarIsDirty } from '@/schemas/extensions/document/x-scalar-is-dirty'
import { XScalarOriginalDocumentHash } from '@/schemas/extensions/document/x-scalar-original-document-hash'
import { XScalarRegistryMeta } from '@/schemas/extensions/document/x-scalar-registry-meta'
import { XScalarSdkInstallation } from '@/schemas/extensions/document/x-scalar-sdk-installation'
import { XScalarWatchMode } from '@/schemas/extensions/document/x-scalar-watch-mode'
import { XTags } from '@/schemas/extensions/document/x-tags'
import { XDisabled } from '@/schemas/extensions/example/x-disabled'
import { XPostResponse } from '@/schemas/extensions/general/x-post-response'
import { XPreRequest } from '@/schemas/extensions/general/x-pre-request'
import { XScalarActiveEnvironment } from '@/schemas/extensions/general/x-scalar-active-environment'
import { XScalarCookies } from '@/schemas/extensions/general/x-scalar-cookies'
import { XScalarOrder } from '@/schemas/extensions/general/x-scalar-order'
import { XBadges } from '@/schemas/extensions/operation/x-badge'
import { XCodeSamples } from '@/schemas/extensions/operation/x-code-samples'
import { XDraftExamples } from '@/schemas/extensions/operation/x-draft-examples'
import { XScalarDisableParameters } from '@/schemas/extensions/operation/x-scalar-disable-parameters'
import { XScalarSelectedContentType } from '@/schemas/extensions/operation/x-scalar-selected-content-type'
import { XScalarStability } from '@/schemas/extensions/operation/x-scalar-stability'
import { XGlobal } from '@/schemas/extensions/parameter/x-global'
import { XAdditionalPropertiesName } from '@/schemas/extensions/schema/x-additional-properties-name'
import { XEnumDescriptions } from '@/schemas/extensions/schema/x-enum-descriptions'
import { XEnumVarNames } from '@/schemas/extensions/schema/x-enum-varnames'
import { XExamples } from '@/schemas/extensions/schema/x-examples'
import { XVariable } from '@/schemas/extensions/schema/x-variable'
import { XDefaultScopes } from '@/schemas/extensions/security/x-default-scopes'
import { XScalarCredentialsLocation } from '@/schemas/extensions/security/x-scalar-credentials-location'
import { XScalarSecurityBody } from '@/schemas/extensions/security/x-scalar-security-body'
import { XScalarSecurityQuery } from '@/schemas/extensions/security/x-scalar-security-query'
import { XScalarAuthUrl, XScalarTokenUrl } from '@/schemas/extensions/security/x-scalar-security-secrets'
import { XTokenName } from '@/schemas/extensions/security/x-tokenName'
import { XusePkce } from '@/schemas/extensions/security/x-use-pkce'
import { XScalarSelectedServer } from '@/schemas/extensions/server/x-scalar-selected-server'
import { XDisplayName } from '@/schemas/extensions/tag/x-display-name'
import { XTagGroups } from '@/schemas/extensions/tag/x-tag-groups'

export const generateSchema = (maybeRef: (inner: Schema) => Schema) => {
  const contact = object(
    {
      name: optional(string({ typeComment: 'The name of the contact.' })),
      url: optional(string({ typeComment: 'The URI for the contact information. This MUST be in the form of a URI.' })),
      email: optional(
        string({
          typeComment:
            'The email address of the contact person/organization. This MUST be in the form of an email address.',
        }),
      ),
    },
    { typeName: 'ContactObject' },
  )
  const license = object(
    {
      name: optional(string({ typeComment: 'REQUIRED. The license name used for the API.' })),
      identifier: optional(
        string({
          typeComment:
            'An SPDX license expression for the API. The identifier field is mutually exclusive of the url field.',
        }),
      ),
      url: optional(
        string({
          typeComment:
            'A URI for the license used for the API. This MUST be in the form of a URI. The url field is mutually exclusive of the identifier field.',
        }),
      ),
    },
    { typeName: 'LicenseObject' },
  )

  const info = intersection([
    object(
      {
        title: string({ typeComment: 'REQUIRED. The title of the API.' }),
        version: string({
          typeComment:
            'REQUIRED. The version of the OpenAPI Document (which is distinct from the OpenAPI Specification version or the version of the API being described or the version of the OpenAPI Description).',
        }),
        summary: optional(string({ typeComment: 'A short summary of the API.' })),
        description: optional(
          string({
            typeComment: 'A description of the API. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        termsOfService: optional(
          string({ typeComment: 'A URI for the Terms of Service for the API. This MUST be in the form of a URI.' }),
        ),
        contact: optional(contact),
        license: optional(license),
      },
      { typeName: 'InfoObject' },
    ),
    XScalarSdkInstallation,
  ])

  const serverVariable = object(
    {
      enum: optional(
        array(string(), {
          typeComment:
            'An enumeration of string values to be used if the substitution options are from a limited set. The array MUST NOT be empty.',
        }),
      ),
      default: optional(
        string({
          typeComment: `The default value to use for substitution, which SHALL be sent if an alternate value is not supplied. If the enum is defined, the value MUST exist in the enum\'s values. Note that this behavior is different from the Schema Object's default keyword, which documents the receiver's behavior rather than inserting the value into the data.`,
        }),
      ),
      description: optional(
        string({
          typeComment:
            'An optional description for the server variable. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
    },
    { typeName: 'ServerVariableObject' },
  )

  const servers = object(
    {
      url: string({
        typeComment:
          'REQUIRED. A URL to the target host. This URL supports Server Variables and MAY be relative, to indicate that the host location is relative to the location where the document containing the Server Object is being served. Variable substitutions will be made when a variable is named in {braces}.',
      }),
      description: optional(
        string({
          typeComment:
            'An optional string describing the host designated by the URL. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      variables: optional(
        record(string(), serverVariable, {
          typeComment: `A map between a variable name and its value. The value is used for substitution in the server's URL template.`,
        }),
      ),
    },
    { typeName: 'ServerObject' },
  )

  const externalDocs = object(
    {
      url: string({
        typeComment: 'REQUIRED. The URI for the target documentation. This MUST be in the form of a URI.',
      }),
      description: optional(
        string({
          typeComment:
            'A description of the target documentation. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
    },
    { typeName: 'ExternalDocumentationObject' },
  )

  const tag = intersection([
    object(
      {
        name: string({ typeComment: 'REQUIRED. The name of the tag.' }),
        description: optional(
          string({
            typeComment: 'A description for the tag. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        externalDocs: optional(externalDocs),
      },
      { typeName: 'TagObject' },
    ),
    XDisplayName,
    XInternal,
    XScalarIgnore,
    XScalarOrder,
  ])

  const securityRequirement = record(string(), array(string()), {
    typeName: 'SecurityRequirementObject',
    typeComment:
      'Lists the required security schemes to execute this operation. An empty object ({}) indicates anonymous access is supported.',
  })

  const xml = object(
    {
      name: optional(
        string({
          typeComment:
            'Replaces the name of the element/attribute used for the described schema property. When defined within items, it will affect the name of the individual XML elements within the list. When defined alongside type being "array" (outside the items), it will affect the wrapping element if and only if wrapped is true. If wrapped is false, it will be ignored.',
        }),
      ),
      namespace: optional(
        string({
          typeComment: 'The URI of the namespace definition. Value MUST be in the form of a non-relative URI.',
        }),
      ),
      prefix: optional(string({ typeComment: 'The prefix to be used for the name.' })),
      attribute: optional(
        boolean({
          typeComment:
            'Declares whether the property definition translates to an attribute instead of an element. Default value is false.',
        }),
      ),
      wrapped: optional(
        boolean({
          typeComment:
            'MAY be used only for an array definition. Signifies whether the array is wrapped (for example, <books><book/><book/></books>) or unwrapped (<book/><book/>). Default value is false. The definition takes effect only when defined alongside type being "array" (outside the items).',
        }),
      ),
    },
    { typeName: 'XMLObject' },
  )

  const discriminatorObject = object(
    {
      propertyName: string({
        typeComment:
          'REQUIRED. The name of the property in the payload that will hold the discriminating value. This property SHOULD be required in the payload schema, as the behavior when the property is absent is undefined.',
      }),
      mapping: optional(
        record(string(), string(), {
          typeComment: 'An object to hold mappings between payload values and schema names or URI references.',
        }),
      ),
    },
    { typeName: 'DiscriminatorObject' },
  )

  const schemaExtensionObjects = [
    XScalarIgnore,
    XInternal,
    XVariable,
    XExamples,
    XEnumDescriptions,
    XEnumVarNames,
    XAdditionalPropertiesName,
    XTags,
  ] as const

  const coreSchemaProperties = object({
    name: optional(string({ typeComment: 'Schema name (extension).' })),
    title: optional(string({ typeComment: 'A title for the schema.' })),
    description: optional(string({ typeComment: 'A description of the schema.' })),
    default: optional(any({ typeComment: 'Default value for the schema.' })),
    enum: optional(array(any(), { typeComment: 'Array of allowed values.', typeName: 'JsonSchemaEnum' })),
    const: optional(any({ typeComment: 'Constant value that must match exactly.' })),
    contentMediaType: optional(string({ typeComment: 'Media type for content validation.' })),
    contentEncoding: optional(string({ typeComment: 'Content encoding.' })),
    contentSchema: optional(maybeRef(lazy((): Schema => schema))),
    deprecated: optional(boolean({ typeComment: 'Whether the schema is deprecated.' })),
    discriminator: optional(discriminatorObject),
    readOnly: optional(boolean({ typeComment: 'Whether the schema is read-only.' })),
    writeOnly: optional(boolean({ typeComment: 'Whether the schema is write-only.' })),
    xml: optional(xml),
    externalDocs: optional(externalDocs),
    example: optional(
      any({
        typeComment:
          'A free-form field to include an example of an instance for this schema. Deprecated in favor of the JSON Schema examples keyword.',
      }),
    ),
    examples: optional(
      array(any(), {
        typeComment:
          'An array of examples of valid instances for this schema. This keyword follows the JSON Schema Draft 2020-12 specification.',
        typeName: 'SchemaExamplesArray',
      }),
    ),
    allOf: optional(array(maybeRef(lazy((): Schema => schema)), { typeName: 'SchemaObjectAllOf' })),
    oneOf: optional(array(maybeRef(lazy((): Schema => schema)), { typeName: 'SchemaObjectOneOf' })),
    anyOf: optional(array(maybeRef(lazy((): Schema => schema)), { typeName: 'SchemaObjectAnyOf' })),
    not: optional(maybeRef(lazy((): Schema => schema))),
  })

  const schemaScalarMarker = object({
    __scalar_: string({ typeComment: 'Internal marker for schema object disambiguation.' }),
  })

  const numericSchema: Schema = object(
    {
      type: union([literal('number'), literal('integer')]),
      format: optional(string({ typeComment: 'Different subtypes.' })),
      multipleOf: optional(number({ typeComment: 'Number must be a multiple of this value.' })),
      maximum: optional(number({ typeComment: 'Maximum value (inclusive).' })),
      exclusiveMaximum: optional(number({ typeComment: 'Maximum value (exclusive).' })),
      minimum: optional(number({ typeComment: 'Minimum value (inclusive).' })),
      exclusiveMinimum: optional(number({ typeComment: 'Minimum value (exclusive).' })),
    },
    { typeName: 'NumberSchemaObject' },
  )

  const stringSchema = object(
    {
      type: literal('string'),
      format: optional(string({ typeComment: 'Different subtypes.' })),
      maxLength: optional(number({ typeComment: 'Maximum string length.' })),
      minLength: optional(number({ typeComment: 'Minimum string length.' })),
      pattern: optional(string({ typeComment: 'Regular expression pattern.' })),
    },
    { typeName: 'StringSchemaObject' },
  )

  const objectSchema = object(
    {
      type: literal('object'),
      maxProperties: optional(number({ typeComment: 'Maximum number of properties.' })),
      minProperties: optional(number({ typeComment: 'Minimum number of properties.' })),
      properties: optional(
        record(string(), maybeRef(lazy((): Schema => schema)), { typeName: 'SchemaObjectProperties' }),
      ),
      required: optional(array(string(), { typeName: 'SchemaObjectRequired' })),
      additionalProperties: optional(
        union([boolean(), maybeRef(lazy((): Schema => schema))], {
          typeName: 'SchemaObjectAdditionalProperties',
        }),
      ),
      patternProperties: optional(
        record(string(), maybeRef(lazy((): Schema => schema)), { typeName: 'SchemaObjectPatternProperties' }),
      ),
      propertyNames: optional(maybeRef(lazy((): Schema => schema))),
    },
    { typeName: 'ObjectSchemaObject' },
  )

  const arraySchema = object(
    {
      type: literal('array'),
      maxItems: optional(number({ typeComment: 'Maximum number of items in array.' })),
      minItems: optional(number({ typeComment: 'Minimum number of items in array.' })),
      uniqueItems: optional(boolean({ typeComment: 'Whether array items must be unique.' })),
      items: optional(maybeRef(lazy((): Schema => schema))),
      prefixItems: optional(
        array(maybeRef(lazy((): Schema => schema)), { typeComment: 'Schema for tuple validation.' }),
      ),
    },
    { typeName: 'ArraySchemaObject' },
  )

  const schemaTypeMulti = union(
    [
      literal('null'),
      literal('boolean'),
      literal('string'),
      literal('number'),
      literal('integer'),
      literal('object'),
      literal('array'),
    ],
    { typeName: 'SchemaObjectMultiTypeKeywords' },
  )

  const otherTypeSchema = object(
    {
      type: union([literal('null'), literal('boolean'), array(schemaTypeMulti)], {
        typeName: 'SchemaObjectOtherTypeKeyword',
      }),
    },
    { typeName: 'MultiTypeSchemaObject' },
  )

  const schema: Schema = intersection(
    [
      coreSchemaProperties,
      ...schemaExtensionObjects,
      union([schemaScalarMarker, otherTypeSchema, numericSchema, stringSchema, objectSchema, arraySchema]),
    ],
    { typeName: 'SchemaObject' },
  )

  const securitySchemeBase = object({
    description: optional(
      string({
        typeComment: 'A description for security scheme. CommonMark syntax MAY be used for rich text representation.',
      }),
    ),
  })

  const apiKeySecurityScheme = object(
    {
      ...securitySchemeBase.properties,
      type: literal('apiKey'),
      name: string({ typeComment: 'REQUIRED. The name of the header, query or cookie parameter to be used.' }),
      in: union([literal('query'), literal('header'), literal('cookie')], {
        typeComment: 'REQUIRED. The location of the API key. Valid values are "query", "header", or "cookie".',
      }),
    },
    { typeName: 'ApiKeySecuritySchemeObject' },
  )

  const httpSecurityScheme = object(
    {
      ...securitySchemeBase.properties,
      type: literal('http'),
      scheme: union([literal('basic'), literal('bearer')], {
        typeName: 'HttpSecuritySchemeScheme',
        typeComment:
          'REQUIRED. The name of the HTTP Authentication scheme to be used in the Authorization header as defined in RFC7235.',
      }),
      bearerFormat: optional(
        string({
          typeComment:
            'A hint to the client to identify how the bearer token is formatted. Bearer tokens are usually generated by an authorization server, so this information is primarily for documentation purposes.',
        }),
      ),
    },
    { typeName: 'HttpSecuritySchemeObject' },
  )

  const oauthFlowExtensionObjects = [
    XScalarSecurityQuery,
    XScalarSecurityBody,
    XTokenName,
    XScalarAuthUrl,
    XScalarTokenUrl,
  ] as const

  const oauthFlowCore = object(
    {
      refreshUrl: string({
        typeComment:
          'The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS.',
      }),
      scopes: record(string(), string(), {
        typeComment:
          'REQUIRED. The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. The map MAY be empty.',
        typeName: 'OAuthFlowScopes',
      }),
    },
    { typeName: 'OAuthFlowBaseCore' },
  )

  const implicitOAuth2Flow = intersection([
    oauthFlowCore,
    ...oauthFlowExtensionObjects,
    object(
      {
        authorizationUrl: string({
          typeComment:
            'REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS.',
        }),
      },
      { typeName: 'ImplicitOAuthFlowObject' },
    ),
  ])

  const passwordOAuth2Flow = intersection([
    oauthFlowCore,
    ...oauthFlowExtensionObjects,
    object(
      {
        tokenUrl: string({
          typeComment:
            'REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS.',
        }),
      },
      { typeName: 'PasswordOAuthFlowObject' },
    ),
    XScalarCredentialsLocation,
  ])

  const clientCredentialsOAuth2Flow = intersection([
    oauthFlowCore,
    ...oauthFlowExtensionObjects,
    object(
      {
        tokenUrl: string({
          typeComment:
            'REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS.',
        }),
      },
      { typeName: 'ClientCredentialsOAuthFlowObject' },
    ),
    XScalarCredentialsLocation,
  ])

  const authorizationCodeOAuth2Flow = intersection([
    oauthFlowCore,
    ...oauthFlowExtensionObjects,
    object(
      {
        authorizationUrl: string({
          typeComment:
            'REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS.',
        }),
        tokenUrl: string({
          typeComment:
            'REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS.',
        }),
      },
      { typeName: 'AuthorizationCodeOAuthFlowObject' },
    ),
    XusePkce,
    XScalarCredentialsLocation,
  ])

  const oauth2Flows = object(
    {
      implicit: optional(implicitOAuth2Flow),
      password: optional(passwordOAuth2Flow),
      clientCredentials: optional(clientCredentialsOAuth2Flow),
      authorizationCode: optional(authorizationCodeOAuth2Flow),
    },
    { typeName: 'OAuthFlowsObject' },
  )

  const oauth2SecurityScheme = intersection([
    object(
      {
        ...securitySchemeBase.properties,
        type: literal('oauth2'),
        flows: oauth2Flows,
      },
      { typeName: 'OAuth2SecuritySchemeObject' },
    ),
    XDefaultScopes,
  ])

  const openIdConnectSecurityScheme = object(
    {
      ...securitySchemeBase.properties,
      type: literal('openIdConnect'),
      openIdConnectUrl: string({
        typeComment: 'REQUIRED. Well-known URL to discover the [[OpenID-Connect-Discovery]] provider metadata.',
      }),
    },
    { typeName: 'OpenIdConnectSecuritySchemeObject' },
  )

  const securityScheme = union(
    [apiKeySecurityScheme, httpSecurityScheme, oauth2SecurityScheme, openIdConnectSecurityScheme],
    { typeName: 'SecuritySchemeObject' },
  )

  const components: Schema = object(
    {
      schemas: optional(record(string(), maybeRef(schema), { typeName: 'ComponentsSchemas' })),
      responses: optional(
        record(string(), maybeRef(lazy((): Schema => response)), { typeName: 'ComponentsResponses' }),
      ),
      parameters: optional(
        record(string(), maybeRef(lazy((): Schema => parameter)), { typeName: 'ComponentsParameters' }),
      ),
      examples: optional(record(string(), maybeRef(lazy((): Schema => example)), { typeName: 'ComponentsExamples' })),
      requestBodies: optional(
        record(string(), maybeRef(lazy((): Schema => requestBody)), { typeName: 'ComponentsRequestBodies' }),
      ),
      headers: optional(record(string(), maybeRef(lazy((): Schema => header)), { typeName: 'ComponentsHeaders' })),
      securitySchemes: optional(
        record(string(), maybeRef(lazy((): Schema => securityScheme)), { typeName: 'ComponentsSecuritySchemes' }),
      ),
      links: optional(record(string(), maybeRef(lazy((): Schema => link)), { typeName: 'ComponentsLinks' })),
      callbacks: optional(
        record(string(), maybeRef(lazy((): Schema => callback)), { typeName: 'ComponentsCallbacks' }),
      ),
      pathItems: optional(
        record(
          string(),
          lazy((): Schema => pathItem),
          { typeName: 'ComponentsPathItems' },
        ),
      ),
    },
    { typeName: 'ComponentsObject' },
  )

  const example = intersection([
    object(
      {
        summary: optional(string({ typeComment: 'Short description for the example.' })),
        description: optional(
          string({
            typeComment:
              'Long description for the example. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        value: optional(
          any({
            typeComment: 'Embedded literal example. The value field and externalValue field are mutually exclusive.',
          }),
        ),
        externalValue: optional(
          string({
            typeComment:
              'A URI that identifies the literal example. The value field and externalValue field are mutually exclusive.',
          }),
        ),
      },
      { typeName: 'ExampleObject' },
    ),
    XDisabled,
  ])

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
        schema: optional(maybeRef(lazy((): Schema => schema))),
        example: optional(any()),
        examples: optional(record(string(), maybeRef(lazy((): Schema => example)), { typeName: 'HeaderExamples' })),
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
            lazy((): Schema => mediaType),
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
      headers: optional(record(string(), maybeRef(lazy((): Schema => header)), { typeName: 'EncodingHeaders' })),
    },
    { typeName: 'EncodingObject' },
  )

  const mediaType: Schema = object(
    {
      schema: optional(maybeRef(lazy((): Schema => schema))),
      example: optional(any({ typeComment: 'Example of the media type.' })),
      examples: optional(record(string(), maybeRef(lazy((): Schema => example)), { typeName: 'MediaTypeExamples' })),
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

  const parameterWithSchema: Schema = intersection([
    object(
      {
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
        schema: optional(maybeRef(lazy((): Schema => schema))),
        example: optional(any()),
        examples: optional(record(string(), maybeRef(lazy((): Schema => example)), { typeName: 'ParameterExamples' })),
      },
      { typeName: 'ParameterObjectWithSchema' },
    ),
    XGlobal,
    XInternal,
    XScalarIgnore,
  ])

  const parameterWithContent: Schema = intersection([
    object(
      {
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
            lazy((): Schema => mediaType),
            { typeName: 'ParameterContent' },
          ),
        ),
      },
      { typeName: 'ParameterObjectWithContent' },
    ),
    XGlobal,
    XInternal,
    XScalarIgnore,
  ])

  const parameter = union([parameterWithSchema, parameterWithContent], { typeName: 'ParameterObject' })

  const requestBody: Schema = intersection([
    object(
      {
        description: optional(
          string({
            typeComment:
              'A brief description of the request body. This could contain examples of use. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        content: record(
          string(),
          lazy((): Schema => mediaType),
          {
            typeComment:
              'REQUIRED. The content of the request body. The key is a media type or media type range and the value describes it.',
            typeName: 'RequestBodyContent',
          },
        ),
        required: optional(
          boolean({ typeComment: 'Determines if the request body is required in the request. Defaults to false.' }),
        ),
      },
      { typeName: 'RequestBodyObject' },
    ),
    XScalarSelectedContentType,
  ])

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
      server: optional(servers),
    },
    { typeName: 'LinkObject' },
  )

  const response = object(
    {
      description: string({
        typeComment:
          'REQUIRED. A description of the response. CommonMark syntax MAY be used for rich text representation.',
      }),
      headers: optional(record(string(), maybeRef(lazy((): Schema => header)), { typeName: 'ResponseHeaders' })),
      content: optional(
        record(
          string(),
          lazy((): Schema => mediaType),
          { typeName: 'ResponseContent' },
        ),
      ),
      links: optional(record(string(), maybeRef(lazy((): Schema => link)), { typeName: 'ResponseLinks' })),
    },
    { typeName: 'ResponseObject' },
  )

  const responsesObject: Schema = record(string(), maybeRef(lazy((): Schema => response)), {
    typeName: 'ResponsesObject',
  })

  const callback: Schema = record(string(), maybeRef(lazy((): Schema => pathItem)), {
    typeName: 'CallbackObject',
  })

  const operation: Schema = intersection([
    object(
      {
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
        parameters: optional(array(maybeRef(lazy((): Schema => parameter)), { typeName: 'OperationParameters' })),
        requestBody: optional(maybeRef(lazy((): Schema => requestBody))),
        responses: optional(lazy((): Schema => responsesObject)),
        deprecated: optional(
          boolean({
            typeComment:
              'Declares this operation to be deprecated. Consumers SHOULD refrain from usage of the declared operation. Default value is false.',
          }),
        ),
        security: optional(array(securityRequirement, { typeName: 'OperationSecurity' })),
        servers: optional(array(servers, { typeName: 'OperationServers' })),
        callbacks: optional(
          record(string(), maybeRef(lazy((): Schema => callback)), { typeName: 'OperationCallbacks' }),
        ),
      },
      { typeName: 'OperationObject' },
    ),
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
  ])

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
      get: optional(maybeRef(lazy((): Schema => operation))),
      put: optional(maybeRef(lazy((): Schema => operation))),
      post: optional(maybeRef(lazy((): Schema => operation))),
      delete: optional(maybeRef(lazy((): Schema => operation))),
      patch: optional(maybeRef(lazy((): Schema => operation))),
      connect: optional(maybeRef(lazy((): Schema => operation))),
      options: optional(maybeRef(lazy((): Schema => operation))),
      head: optional(maybeRef(lazy((): Schema => operation))),
      trace: optional(maybeRef(lazy((): Schema => operation))),
      servers: optional(array(servers, { typeName: 'PathItemServers' })),
      parameters: optional(array(maybeRef(lazy((): Schema => parameter)), { typeName: 'PathItemParameters' })),
    },
    { typeName: 'PathItemObject' },
  )

  const openApiExtensionsPartial = object(
    {
      'x-original-oas-version': optional(
        string({ typeComment: 'Original OpenAPI Specification version of the source document.' }),
      ),
      'x-scalar-original-source-url': optional(
        string({
          typeComment: 'Original document source URL when loading a document from an external source.',
        }),
      ),
      [extensions.document.navigation]: optional(
        any({
          typeComment:
            'Client navigation tree (TraversedDocument) for this OpenAPI description. Matches TraversedDocumentObjectRef in strict schemas.',
        }),
      ),
    },
    { typeName: 'OpenApiExtensionsPartial' },
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
        array(servers, {
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

  const openapi = intersection(
    [
      openApiDocumentCore,
      openApiExtensionsPartial,
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
      typeName: 'OpenApiDocument',
      typeComment: 'Root OpenAPI 3.1 document including Scalar workspace extensions (OpenApiExtensionsSchema).',
    },
  )

  return openapi
}
