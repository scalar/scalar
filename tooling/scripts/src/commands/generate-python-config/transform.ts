import {
  FIELD_RENAMES,
  PYTHON_ONLY_CONFIG_FIELDS,
  SERIALIZATION_ALIASES,
  SKIP_FIELDS,
  SKIP_SOURCE_FIELDS,
} from './field-overrides'
import type { JsonSchema, SchemaMap } from './json-schema-types'
import type { EnumDef, FieldDef, ModelDef } from './types'

// ---------------------------------------------------------------------------
// Name helpers
// ---------------------------------------------------------------------------

/** Convert camelCase to snake_case */
export function camelToSnake(s: string): string {
  // Handle leading underscore
  const prefix = s.startsWith('_') ? '_' : ''
  const rest = s.startsWith('_') ? s.slice(1) : s

  return (
    prefix +
    rest
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z\d])([A-Z])/g, '$1_$2')
      .replace(/-/g, '_')
      .toLowerCase()
  )
}

/** Convert a camelCase enum value to UPPER_SNAKE_CASE member name */
export function toEnumMemberName(value: string): string {
  return camelToSnake(value).toUpperCase()
}

// ---------------------------------------------------------------------------
// Type mapping
// ---------------------------------------------------------------------------

/** Known enum schemas we detect by their values */
const ENUM_REGISTRY: Record<string, string> = {}

function registerEnum(def: EnumDef): void {
  // Register each set of values so we can look up the Python class name later
  const key = def.members.map((m) => m.value).join(',')
  ENUM_REGISTRY[key] = def.className
}

function lookupEnumClass(values: string[]): string | undefined {
  const key = values.join(',')
  return ENUM_REGISTRY[key]
}

/** Map a JSON Schema property to a Python type string */
function jsonSchemaToPython(schema: JsonSchema, fieldName: string): string {
  // Handle anyOf (optional wrappers, unions)
  if (schema.anyOf) {
    const nonNull = schema.anyOf.filter((s) => !(s.type === 'null' || (s.const !== undefined && s.const === null)))

    // If there is a non-null default, the field is not truly Optional —
    // it always has a value, the Optional just means it can be omitted from input.
    const hasNonNullDefault = schema.default !== undefined && schema.default !== null

    if (nonNull.length === 1) {
      const inner = jsonSchemaToPython(nonNull[0], fieldName)
      return hasNonNullDefault ? inner : `Optional[${inner}]`
    }
    const types = nonNull.map((s) => jsonSchemaToPython(s, fieldName))
    return hasNonNullDefault ? `Union[${types.join(', ')}]` : `Optional[Union[${types.join(', ')}]]`
  }

  // Handle enum
  if (schema.enum) {
    const values = schema.enum.filter((v): v is string => typeof v === 'string')
    const enumClass = lookupEnumClass(values)
    if (enumClass) {
      return enumClass
    }
    // Inline literal union for small enums not in registry
    if (values.length <= 3) {
      return `Literal[${values.map((v) => `"${v}"`).join(', ')}]`
    }
    return 'str'
  }

  // Handle const
  if (schema.const !== undefined) {
    if (typeof schema.const === 'string') return 'str'
    if (typeof schema.const === 'boolean') return 'bool'
    if (typeof schema.const === 'number') return 'float'
    return 'str'
  }

  // Handle type
  if (schema.type === 'string') return 'str'
  if (schema.type === 'boolean') return 'bool'
  if (schema.type === 'number') return 'float'
  if (schema.type === 'integer') return 'int'

  if (schema.type === 'array') {
    if (schema.items) {
      const itemType = jsonSchemaToPython(schema.items, fieldName)
      return `List[${itemType}]`
    }
    return 'List[Any]'
  }

  if (schema.type === 'object') {
    if (schema.properties) {
      // Named object — check if it maps to a known model
      return 'Dict[str, Any]'
    }
    return 'Dict[str, Any]'
  }

  // Fallback
  return 'Any'
}

/** Determine the Python default value string from a JSON Schema */
function getDefaultValue(schema: JsonSchema, pythonType: string): { value: string; useFactory: boolean } {
  const hasDefault = schema.default !== undefined

  // Optional types default to None
  if (pythonType.startsWith('Optional[')) {
    if (hasDefault && schema.default !== null) {
      return formatDefault(schema.default, pythonType)
    }
    return { value: 'None', useFactory: false }
  }

  if (hasDefault) {
    return formatDefault(schema.default, pythonType)
  }

  // Types that need factories
  if (pythonType.startsWith('List[') || pythonType.startsWith('Dict[')) {
    const empty = pythonType.startsWith('List[') ? 'list' : 'dict'
    return { value: empty, useFactory: true }
  }

  // Bool defaults
  if (pythonType === 'bool') return { value: 'False', useFactory: false }
  if (pythonType === 'str') return { value: '""', useFactory: false }

  return { value: 'None', useFactory: false }
}

function formatDefault(value: unknown, pythonType: string): { value: string; useFactory: boolean } {
  if (value === null) return { value: 'None', useFactory: false }
  if (value === true) return { value: 'True', useFactory: false }
  if (value === false) return { value: 'False', useFactory: false }
  if (typeof value === 'number') return { value: String(value), useFactory: false }
  if (typeof value === 'string') {
    // Check if it maps to an enum member
    if (pythonType in ENUM_DEFAULT_MAP) {
      return { value: ENUM_DEFAULT_MAP[pythonType], useFactory: false }
    }
    return { value: `"${value}"`, useFactory: false }
  }
  if (Array.isArray(value) && value.length === 0) return { value: 'list', useFactory: true }
  if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
    return { value: 'dict', useFactory: true }
  }
  return { value: `"${String(value)}"`, useFactory: false }
}

/** Map of Python type -> default value for known enum types */
const ENUM_DEFAULT_MAP: Record<string, string> = {}

function registerEnumDefault(pythonType: string, defaultValue: string): void {
  ENUM_DEFAULT_MAP[pythonType] = defaultValue
}

// ---------------------------------------------------------------------------
// Schema → FieldDef
// ---------------------------------------------------------------------------

function schemaToField(jsKey: string, schema: JsonSchema): FieldDef | null {
  const pythonName = FIELD_RENAMES[jsKey] ?? camelToSnake(jsKey)
  const pythonType = jsonSchemaToPython(schema, jsKey)
  const { value: defaultValue, useFactory } = getDefaultValue(schema, pythonType)
  const jsAlias = SERIALIZATION_ALIASES[pythonName] ?? jsKey

  return {
    name: pythonName,
    jsKey: jsAlias,
    pythonType,
    defaultValue,
    useFactory,
    description: schema.description ?? '',
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type TransformResult = {
  enums: EnumDef[]
  models: ModelDef[]
  config: ModelDef
}

export function transformSchemas(
  apiReferenceFields: SchemaMap,
  sourceFields: SchemaMap,
  _htmlRenderingFields: SchemaMap,
): TransformResult {
  // -----------------------------------------------------------------------
  // 1. Extract enums
  // -----------------------------------------------------------------------
  const enums: EnumDef[] = []

  // Theme enum
  const themeSchema = apiReferenceFields['theme']
  if (themeSchema) {
    const themeValues = extractEnumValues(themeSchema)
    if (themeValues.length > 0) {
      const themeDef: EnumDef = {
        className: 'Theme',
        members: themeValues.map((v) => ({
          memberName: toEnumMemberName(v),
          value: v,
        })),
      }
      enums.push(themeDef)
      registerEnum(themeDef)
      registerEnumDefault('Theme', 'Theme.DEFAULT')
    }
  }

  // Layout enum
  const layoutSchema = apiReferenceFields['layout']
  if (layoutSchema) {
    const layoutValues = extractEnumValues(layoutSchema)
    if (layoutValues.length > 0) {
      const layoutDef: EnumDef = {
        className: 'Layout',
        members: layoutValues.map((v) => ({
          memberName: toEnumMemberName(v),
          value: v,
        })),
      }
      enums.push(layoutDef)
      registerEnum(layoutDef)
      registerEnumDefault('Layout', 'Layout.MODERN')
    }
  }

  // SearchHotKey enum
  const searchHotKeySchema = apiReferenceFields['searchHotKey']
  if (searchHotKeySchema) {
    const searchValues = extractEnumValues(searchHotKeySchema)
    if (searchValues.length > 0) {
      const searchDef: EnumDef = {
        className: 'SearchHotKey',
        members: searchValues.map((v) => ({
          memberName: v.toUpperCase(),
          value: v,
        })),
      }
      enums.push(searchDef)
      registerEnum(searchDef)
      registerEnumDefault('SearchHotKey', 'SearchHotKey.K')
    }
  }

  // DocumentDownloadType enum
  const docDownloadSchema = apiReferenceFields['documentDownloadType']
  if (docDownloadSchema) {
    const docValues = extractEnumValues(docDownloadSchema)
    if (docValues.length > 0) {
      const docDef: EnumDef = {
        className: 'DocumentDownloadType',
        members: docValues.map((v) => ({
          memberName: toEnumMemberName(v),
          value: v,
        })),
      }
      enums.push(docDef)
      registerEnum(docDef)
      registerEnumDefault('DocumentDownloadType', 'DocumentDownloadType.BOTH')
    }
  }

  // -----------------------------------------------------------------------
  // 2. Build AgentConfig model from source.agent
  // -----------------------------------------------------------------------
  const agentFields: FieldDef[] = []

  const agentFieldDescriptions: Record<string, string> = {
    key: 'Agent Scalar key for production. Required for Agent beyond localhost.',
    disabled: 'Set to True to disable Agent Scalar entirely.',
  }

  // The agent field is wrapped in optional → anyOf, so unwrap to get the object schema
  const agentSchemaRaw = sourceFields['agent']
  const agentObjectSchema = unwrapToObject(agentSchemaRaw)

  if (agentObjectSchema?.properties) {
    for (const [key, prop] of Object.entries(agentObjectSchema.properties as SchemaMap)) {
      if (key === 'hideAddApi') continue // JS-only UI feature
      const field = schemaToField(key, prop)
      if (field) {
        // Agent fields are all optional
        if (!field.pythonType.startsWith('Optional[')) {
          field.pythonType = `Optional[${field.pythonType}]`
          field.defaultValue = 'None'
        }
        if (agentFieldDescriptions[key]) {
          field.description = agentFieldDescriptions[key]
        }
        agentFields.push(field)
      }
    }
  }

  const agentModel: ModelDef = {
    className: 'AgentConfig',
    docstring:
      'Agent Scalar configuration: AI chat in the API reference.\nUse key for production; use disabled=True to turn off Agent entirely.\nSee: https://scalar.com/products/api-references/configuration#agent-scalar',
    forbidExtra: true,
    fields: agentFields,
    imports: [],
  }

  // -----------------------------------------------------------------------
  // 3. Build OpenAPISource model
  // -----------------------------------------------------------------------
  const sourceFieldDefs: FieldDef[] = []

  // Add title and slug manually (they exist in sourceConfigurationSchema but need descriptions)
  sourceFieldDefs.push({
    name: 'title',
    jsKey: 'title',
    pythonType: 'Optional[str]',
    defaultValue: 'None',
    useFactory: false,
    description: "Display name for the API. If not provided, will fallback to 'API #1', 'API #2', etc.",
  })
  sourceFieldDefs.push({
    name: 'slug',
    jsKey: 'slug',
    pythonType: 'Optional[str]',
    defaultValue: 'None',
    useFactory: false,
    description: 'URL identifier for the API. If not provided, will be auto-generated from the title or index.',
  })

  for (const [key, prop] of Object.entries(sourceFields)) {
    if (SKIP_SOURCE_FIELDS.has(key)) continue
    if (key === 'title' || key === 'slug') continue // Already added above
    if (key === 'agent') {
      // Add agent as typed reference
      sourceFieldDefs.push({
        name: 'agent',
        jsKey: 'agent',
        pythonType: 'Optional[AgentConfig]',
        defaultValue: 'None',
        useFactory: false,
        description: 'Optional Agent Scalar config for this source (key, disabled). See configuration docs.',
      })
      continue
    }

    const field = schemaToField(key, prop as JsonSchema)
    if (!field) continue

    // Override specific source fields
    if (key === 'default') {
      field.pythonType = 'bool'
      field.defaultValue = 'False'
      field.description = 'Whether this source should be the default when multiple sources are provided.'
    }

    // Source fields: url and content are Optional
    if (key === 'url') {
      field.pythonType = 'Optional[str]'
      field.defaultValue = 'None'
      field.description = 'URL to the OpenAPI document (JSON or YAML). Mutually exclusive with content.'
    }
    if (key === 'content') {
      field.pythonType = 'Optional[Union[str, Dict[str, Any]]]'
      field.defaultValue = 'None'
      field.description = 'Direct OpenAPI content as string (JSON/YAML) or dictionary. Mutually exclusive with url.'
    }

    sourceFieldDefs.push(field)
  }

  const sourceModel: ModelDef = {
    className: 'OpenAPISource',
    docstring: 'Configuration for a single OpenAPI source',
    forbidExtra: true,
    fields: sourceFieldDefs,
    imports: [],
  }

  // -----------------------------------------------------------------------
  // 4. Build ScalarConfig
  // -----------------------------------------------------------------------
  const configFields: FieldDef[] = []

  // Start with Python-only fields at the top
  for (const pyField of PYTHON_ONLY_CONFIG_FIELDS) {
    configFields.push(pyField)
  }

  // Descriptions for auto-generated fields
  const configDescriptions: Record<string, string> = {
    layout: "The layout to use for Scalar. Default is 'modern'.",
    showSidebar: 'A boolean to show the sidebar. Default is True which means the sidebar is shown.',
    hideDownloadButton: 'A boolean to hide the download button. @deprecated Use document_download_type instead.',
    documentDownloadType:
      "Sets the file type of the document to download, set to 'none' to hide the download button. Default is 'both'.",
    hideTestRequestButton:
      "Whether to show the 'Test Request' button. Default is False which means the test request button is shown.",
    hideModels: 'A boolean to hide all models. Default is False which means all models are shown.',
    hideSearch: 'Whether to show the sidebar search bar. Default is False which means the search bar is shown.',
    hideDarkModeToggle:
      'Whether to show the dark mode toggle. Default is False which means the dark mode toggle is shown.',
    hideClientButton:
      'Whether to show the client button from the reference sidebar and modal. Default is False which means the client button is shown.',
    customCss: 'Custom CSS string to apply to the API reference. Default is empty string.',
    withDefaultFonts:
      'Whether to use default fonts (Inter and JetBrains Mono). Default is True which means default fonts are used.',
    defaultOpenAllTags:
      'A boolean to open all tags by default. Default is False which means all tags are closed by default.',
    expandAllModelSections:
      'Whether to expand all model sections by default. Default is False which means model sections are closed by default.',
    expandAllResponses:
      'Whether to expand all response sections by default. Default is False which means response sections are closed by default.',
    orderRequiredPropertiesFirst:
      'Whether to order required properties first in schema objects. Default is True which means required properties are shown first.',
    persistAuth:
      'Whether to persist authentication credentials in local storage. Default is False which means authentication is not persisted.',
    telemetry:
      'Whether to enable telemetry. Only tracks whether a request was sent through the API client. Default is True.',
    theme: "The theme to use for Scalar. Default is 'default'.",
    baseServerURL:
      'If you want to prefix all relative servers with a base URL, you can do so here. Default is empty string.',
  }

  // Add fields from apiReferenceConfigurationSchema
  for (const [key, prop] of Object.entries(apiReferenceFields)) {
    if (SKIP_FIELDS.has(key)) continue

    const field = schemaToField(key, prop as JsonSchema)
    if (!field) continue

    // Apply descriptions from the map
    if (configDescriptions[key]) {
      field.description = configDescriptions[key]
    }

    // Special handling for specific fields
    if (key === 'hiddenClients') {
      field.pythonType = 'Union[bool, Dict[str, Union[bool, List[str]]], List[str]]'
      field.defaultValue = 'list'
      field.useFactory = true
      field.description =
        'A dictionary with the keys being the target names and the values being a boolean to hide all clients of the target or a list clients. Default is [] which means no clients are hidden.'
    }

    if (key === 'servers') {
      field.pythonType = 'List[Dict[str, Any]]'
      field.defaultValue = 'list'
      field.useFactory = true
      field.description =
        "List of OpenAPI Server Objects. Each item must have a required 'url' (string) and may have optional 'description' (string) and 'variables' (map)."
    }

    if (key === 'authentication') {
      field.pythonType = 'Dict[str, Any]'
      field.defaultValue = 'dict'
      field.useFactory = true
      field.description =
        'A dictionary of additional authentication information. Default is {} which means no authentication information is provided.'
    }

    // String fields that should default to "" instead of None
    if (key === 'baseServerURL' || key === 'customCss') {
      field.pythonType = 'str'
      field.defaultValue = '""'
    }

    if (key === 'darkMode') {
      field.pythonType = 'Optional[bool]'
      field.defaultValue = 'None'
      field.description =
        'Whether dark mode is on or off initially (light mode). Default is None which means the dark mode is not set.'
    }

    if (key === 'forceDarkModeState') {
      field.pythonType = 'Optional[str]'
      field.defaultValue = 'None'
      field.description =
        "Force dark mode state to always be this state no matter what. Can be 'dark' or 'light'. Default is None."
    }

    if (key === 'showDeveloperTools') {
      field.pythonType = 'Literal["always", "localhost", "never"]'
      field.defaultValue = '"localhost"'
      field.description =
        "Control the visibility of developer tools. Options are 'always', 'localhost', or 'never'. Default is 'localhost'."
    }

    if (key === 'searchHotKey') {
      field.pythonType = 'SearchHotKey'
      field.defaultValue = 'SearchHotKey.K'
      field.description = "The hotkey to use for search. Default is 'k' (e.g. CMD+k)."
    }

    if (key === '_integration') {
      field.pythonType = 'Optional[str]'
      field.defaultValue = 'None'
      field.description = 'The integration type. Default is None.'
    }

    if (key === 'hideDownloadButton') {
      field.pythonType = 'bool'
      field.defaultValue = 'False'
    }

    configFields.push(field)
  }

  const configModel: ModelDef = {
    className: 'ScalarConfig',
    docstring: 'Configuration for Scalar API Reference',
    forbidExtra: true,
    fields: configFields,
    imports: [
      { from: '.enums', names: ['DocumentDownloadType', 'Layout', 'SearchHotKey', 'Theme'] },
      { from: '.models', names: ['AgentConfig', 'OpenAPISource'] },
    ],
  }

  return {
    enums,
    models: [agentModel, sourceModel],
    config: configModel,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Unwrap anyOf/optional wrappers to find the underlying object schema */
function unwrapToObject(schema: JsonSchema | undefined): JsonSchema | undefined {
  if (!schema) return undefined
  if (schema.type === 'object') return schema
  if (schema.anyOf) {
    for (const sub of schema.anyOf) {
      const result = unwrapToObject(sub)
      if (result) return result
    }
  }
  return undefined
}

/** Extract string enum values from a JSON Schema, handling anyOf/default wrappers */
function extractEnumValues(schema: JsonSchema): string[] {
  if (schema.enum) {
    return schema.enum.filter((v): v is string => typeof v === 'string')
  }

  if (schema.anyOf) {
    for (const sub of schema.anyOf) {
      const vals = extractEnumValues(sub)
      if (vals.length > 0) return vals
    }
  }

  if (schema.oneOf) {
    for (const sub of schema.oneOf) {
      const vals = extractEnumValues(sub)
      if (vals.length > 0) return vals
    }
  }

  return []
}
