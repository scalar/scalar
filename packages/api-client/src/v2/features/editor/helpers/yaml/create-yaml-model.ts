import * as monaco from 'monaco-editor'

import { configureYaml } from '@/v2/features/editor/helpers/configure-language-support'
import type { EditorModel, Path } from '@/v2/features/editor/helpers/model'
import { getYamlNodeRangeFromPath } from '@/v2/features/editor/helpers/yaml/get-yaml-node-range-from-path'

/**
 * Creates a YAML model for use in the Monaco editor.
 *
 * @param value - The initial YAML string value for the model.
 * @returns An object containing the Monaco model and a method to get a range from a YAML path.
 *
 * The created model is configured for YAML language support.
 * The `getRangeFromPath` method returns a Monaco Range object indicating the text range
 * that corresponds to a given path in the YAML document, or null if the path is not found.
 */
export const createYamlModel = (value?: string): EditorModel => {
  const model = monaco.editor.createModel(value ?? '', 'yaml')

  // Configure language support
  configureYaml(model.uri.toString())

  return {
    model,
    getRangeFromPath: (path: Path) => {
      const range = getYamlNodeRangeFromPath(model.getValue(), path)
      if (!range) {
        return null
      }

      const start = model.getPositionAt(range.startOffset)
      const end = model.getPositionAt(range.endOffset)

      return new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column)
    },
  }
}
