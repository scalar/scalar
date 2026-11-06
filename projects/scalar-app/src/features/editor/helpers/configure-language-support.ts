import * as monaco from 'monaco-editor'
import { configureMonacoYaml } from 'monaco-yaml'

import { openApiEditorSchema } from '../schemas/openapi-editor-schema'
import YamlWorker from './yaml.worker?worker'

const OPENAPI_JSON_SCHEMA_URI = 'inmemory://model/scalar/openapi-json-schema'

/**
 * Configures JSON language support for the given model URI
 *
 * @param globPattern - The glob pattern to match the files to configure language support for
 */
export const configureJson = (globPattern: string): void => {
  const defaults = monaco.json.jsonDefaults
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
  // TODO: Remove this adapter when monaco-yaml supports Monaco 0.56+ workers.
  // monaco-yaml still passes createData to the removed pre-0.56 worker API.
  // Send it before Monaco starts its RPC handshake with the explicitly supplied worker.
  const yamlMonaco = {
    ...monaco,
    editor: {
      ...monaco.editor,
      createWebWorker: <T extends object>({
        createData,
      }: Partial<monaco.editor.IInternalWebWorkerOptions> & {
        createData?: unknown
      }): monaco.editor.MonacoWebWorker<T> => {
        const worker = new YamlWorker()
        worker.postMessage(createData)
        return monaco.editor.createWebWorker<T>({ worker })
      },
    },
  }

  configureMonacoYaml(yamlMonaco, {
    enableSchemaRequest: false,
    validate: true,
    format: { enable: true },
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
