import * as monaco from 'monaco-editor'
import { configureMonacoYaml } from 'monaco-yaml'

import openApiJsonSchema from '@/v2/features/collection/components/Editor/schemas/openapi-3.1-schema.json'

const OPENAPI_JSON_SCHEMA_URI = 'inmemory://model/scalar/openapi-json-schema'

export const confugureJson = (modelUri: string): void => {
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

export const configureYaml = (modelUri: string): void => {
  configureMonacoYaml(monaco, {
    enableSchemaRequest: true,
    schemas: [
      {
        // If YAML file is opened matching this glob
        fileMatch: [modelUri],
        schema: openApiJsonSchema,
        // Then this schema will be downloaded from the internet and used.
        uri: OPENAPI_JSON_SCHEMA_URI,
      },
    ],
  })
}

export const configureLanguageSupport = (modelUri: string): void => {
  confugureJson(modelUri)
  configureYaml(modelUri)
}
