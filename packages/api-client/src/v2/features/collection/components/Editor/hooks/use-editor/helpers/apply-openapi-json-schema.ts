import * as monaco from 'monaco-editor'

import openApiJsonSchema from '@/v2/features/collection/components/Editor/schemas/openapi-3.2-schema.json'

const OPENAPI_JSON_SCHEMA_URI = 'inmemory://model/scalar/openapi-json-schema'

export const applyOpenApiJsonSchemaToModel = (modelUri: string): void => {
  const defaults = monaco.languages.json.jsonDefaults
  const current = defaults.diagnosticsOptions

  const existingSchemas = current.schemas ?? []
  const schemas = [
    ...existingSchemas.filter((s) => s.uri !== OPENAPI_JSON_SCHEMA_URI),
    {
      uri: OPENAPI_JSON_SCHEMA_URI,
      fileMatch: [modelUri],
      schema: openApiJsonSchema,
    },
  ]

  defaults.setDiagnosticsOptions({
    ...current,
    validate: true,
    enableSchemaRequest: false,
    schemas,
  })
}
