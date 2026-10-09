import * as monaco from 'monaco-editor'
import { configureMonacoYaml } from 'monaco-yaml'

import { openApiEditorSchema } from '../schemas/openapi-editor-schema'

const OPENAPI_JSON_SCHEMA_URI = 'inmemory://model/scalar/openapi-json-schema'

/**
 * Configures JSON language support for the given model URI
 *
 * @param globPattern - The glob pattern to match the files to configure language support for
 */
export const configureJson = (globPattern: string): void => {
  const defaults = monaco.languages.json.jsonDefaults
  const current = defaults.diagnosticsOptions

  const existingSchemas = current.schemas ?? []
  const schemas = [
    ...existingSchemas.filter((schema) => schema.uri !== OPENAPI_JSON_SCHEMA_URI),
    {
      uri: OPENAPI_JSON_SCHEMA_URI,
      fileMatch: [globPattern],
      schema: openApiEditorSchema,
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
 * @param globPattern - The glob pattern to match the files to configure language support for
 */
export const configureYaml = (globPattern: string): void => {
  configureMonacoYaml(monaco, {
    enableSchemaRequest: false,
    validate: true,
    format: true,
    completion: true,
    hover: true,
    schemas: [
      {
        // If YAML file is opened matching this glob
        fileMatch: [globPattern],
        schema: openApiEditorSchema,
        uri: OPENAPI_JSON_SCHEMA_URI,
      },
    ],
  })
}
