/**
 * Fields to skip entirely from apiReferenceConfigurationSchema — JS-only
 * (functions, custom types, deprecated, etc.)
 */
export const SKIP_FIELDS = new Set([
  // Functions / callbacks
  'onRequestSent',
  'onSpecUpdate',
  'onServerChange',
  'onDocumentSelect',
  'onLoaded',
  'onBeforeRequest',
  'onShowMore',
  'onSidebarClick',
  'fetch',
  'redirect',
  'generateHeadingSlug',
  'generateModelSlug',
  'generateTagSlug',
  'generateOperationSlug',
  'generateWebhookSlug',
  // Complex JS-only types
  'plugins',
  'metaData',
  'defaultHttpClient',
  'pathRouting',
  'mcp',
  // Deprecated fields
  'proxy',
  'spec',
  'showToolbar',
  // Sorters that accept functions
  'tagsSorter',
  'operationsSorter',
  // Fields handled as Python-only with different names
  'proxyUrl', // → scalar_proxy_url
  'favicon', // → scalar_favicon_url
  // Fields that overlap with Python-only source fields
  'url',
  'content',
  'slug',
  'title',
  // Not relevant for Python
  'isEditable',
  'isLoading',
  'showOperationId',
  'defaultOpenFirstTag',
  'orderSchemaPropertiesBy',
  'operationTitleSource',
])

/**
 * Fields to skip from sourceConfigurationSchema when building OpenAPISource
 * (deprecated or JS-only)
 */
export const SKIP_SOURCE_FIELDS = new Set(['spec'])

/**
 * Rename map: JS camelCase key -> Python snake_case name
 * Only entries that do NOT follow the standard camelToSnake conversion.
 */
export const FIELD_RENAMES: Record<string, string> = {
  _integration: 'integration',
}

/**
 * Serialization alias overrides: Python field name -> JS key for serialization
 * Only entries where the alias differs from what camelCase would produce.
 */
export const SERIALIZATION_ALIASES: Record<string, string> = {
  integration: '_integration',
}

/**
 * Python-only fields that do not exist in the Zod schemas.
 * These are appended to the generated ScalarConfig.
 */
export const PYTHON_ONLY_CONFIG_FIELDS = [
  {
    name: 'openapi_url',
    jsKey: 'openapi_url',
    pythonType: 'Optional[str]',
    defaultValue: 'None',
    useFactory: false,
    description:
      'The OpenAPI URL that Scalar should load and use. If content or sources are provided, this parameter is ignored.',
  },
  {
    name: 'title',
    jsKey: 'title',
    pythonType: 'Optional[str]',
    defaultValue: 'None',
    useFactory: false,
    description: "The HTML <title> content, normally shown in the browser tab. Defaults to 'Scalar' if not provided.",
  },
  {
    name: 'content',
    jsKey: 'content',
    pythonType: 'Optional[Union[str, Dict[str, Any]]]',
    defaultValue: 'None',
    useFactory: false,
    description:
      'Directly pass an OpenAPI/Swagger document as a string (JSON or YAML) or as a dictionary. If sources are provided, this parameter is ignored.',
  },
  {
    name: 'sources',
    jsKey: 'sources',
    pythonType: 'Optional[List[OpenAPISource]]',
    defaultValue: 'None',
    useFactory: false,
    description:
      'Add multiple OpenAPI documents to render all of them. Each source can have a title, slug, url, content, and default flag.',
  },
  {
    name: 'scalar_js_url',
    jsKey: 'scalar_js_url',
    pythonType: 'str',
    defaultValue: '"https://cdn.jsdelivr.net/npm/@scalar/api-reference"',
    useFactory: false,
    description: 'The URL to use to load the Scalar JavaScript. It is normally set to a CDN URL.',
  },
  {
    name: 'scalar_proxy_url',
    jsKey: 'scalar_proxy_url',
    pythonType: 'str',
    defaultValue: '""',
    useFactory: false,
    description: 'The URL to use to set the Scalar Proxy.',
  },
  {
    name: 'scalar_favicon_url',
    jsKey: 'scalar_favicon_url',
    pythonType: 'str',
    defaultValue: '""',
    useFactory: false,
    description: 'The URL of the favicon to use. It is normally shown in the browser tab.',
  },
  {
    name: 'agent',
    jsKey: 'agent',
    pythonType: 'Optional[AgentConfig]',
    defaultValue: 'None',
    useFactory: false,
    description: 'Agent Scalar config: set to AgentConfig(disabled=True) to disable Agent entirely.',
  },
  {
    name: 'overrides',
    jsKey: 'overrides',
    pythonType: 'Dict[str, Any]',
    defaultValue: 'dict',
    useFactory: true,
    description:
      'A dictionary of additional configuration overrides to pass to Scalar. Default is {} which means no overrides are provided.',
  },
]
