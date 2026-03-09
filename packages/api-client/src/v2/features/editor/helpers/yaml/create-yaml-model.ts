import * as monaco from 'monaco-editor'

import { configureYaml } from '@/v2/features/editor/helpers/configure-language-support'
import type { EditorModel, Path } from '@/v2/features/editor/helpers/model'
import { getYamlNodeRangeFromPath } from '@/v2/features/editor/helpers/yaml/get-yaml-node-range-from-path'

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
