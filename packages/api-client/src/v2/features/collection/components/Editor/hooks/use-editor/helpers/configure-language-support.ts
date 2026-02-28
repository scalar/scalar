import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import { configureMonacoYaml } from 'monaco-yaml'

import openApiJsonSchema from '@/v2/features/collection/components/Editor/schemas/openapi-3.1-schema.json'

const OPENAPI_JSON_SCHEMA_URI = 'inmemory://model/scalar/openapi-json-schema'

/**
 * Configures JSON language support for the given model URI
 *
 * @param modelUri - The URI of the model to configure language support for
 */
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

/**
 * Configures YAML language support for the given model URI
 *
 * @param modelUri - The URI of the model to configure language support for
 */
export const configureYaml = (modelUri: string): void => {
  configureMonacoYaml(monaco, {
    enableSchemaRequest: false,
    validate: true,
    format: true,
    completion: true,
    hover: true,
    schemas: [
      {
        // If YAML file is opened matching this glob
        fileMatch: [modelUri],
        schema: openApiJsonSchema,
        uri: OPENAPI_JSON_SCHEMA_URI,
      },
    ],
  })
}

/**
 * Configures both JSON and YAML language support for the given model URI
 *
 * @param modelUri - The URI of the model to configure language support for
 */
export const configureLanguageSupport = (modelUri: string): void => {
  confugureJson(modelUri)
  configureYaml(modelUri)
}
