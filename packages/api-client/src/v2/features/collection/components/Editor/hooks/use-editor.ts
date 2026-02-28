import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'

import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution'
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding'
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding.css'
import 'monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css'

import { presets } from '@scalar/themes'
import { type MaybeRefOrGetter, toValue, watch } from 'vue'

import { applyScalarTheme } from '@/v2/features/collection/components/Editor/helpers/apply-scalar-theme'
import { configureLanguageSupport } from '@/v2/features/collection/components/Editor/helpers/configure-language-support'
import { ensureMonacoEnvironment } from '@/v2/features/collection/components/Editor/helpers/ensure-monaco-environment'
import { getJsonAstNodeFromPath } from '@/v2/features/collection/components/Editor/helpers/get-json-ast-node-from-path'
import { getYamlNodeRangeFromPath } from '@/v2/features/collection/components/Editor/helpers/get-yaml-node-range-from-path'
import type { JsonPath } from '@/v2/features/collection/components/Editor/helpers/json-ast'
import { ensureJsonPointerLinkSupport } from '@/v2/features/collection/components/Editor/helpers/json-pointer-links'
import { parseJsonPointerPath } from '@/v2/features/collection/components/Editor/helpers/json-pointer-path'

type MonacoEditorAction = {
  id: string
  label: string
  keybindings?: number[]
  run: () => void | Promise<void>
}

export type MonacoEditorLanguage = 'json' | 'yaml'
type OffsetRange = {
  startOffset: number
  endOffset: number
}

export const useEditor = ({
  element,
  value,
  onChange,
  actions,
  readOnly = false,
  isDarkMode = false,
  theme = presets.default.theme,
  language = 'json',
}: {
  element: HTMLElement
  value?: MaybeRefOrGetter<string>
  readOnly?: MaybeRefOrGetter<boolean>
  onChange?: (e: string) => void
  actions?: MonacoEditorAction[]
  isDarkMode?: MaybeRefOrGetter<boolean>
  theme?: MaybeRefOrGetter<string>
  language?: MonacoEditorLanguage
}) => {
  ensureMonacoEnvironment()

  const model = monaco.editor.createModel(toValue(value) ?? '', language)
  configureLanguageSupport(model.uri.toString())

  const editor = monaco.editor.create(element, {
    model,
    automaticLayout: true,
    folding: true,
    showFoldingControls: 'always',
    glyphMargin: true,
    lineNumbers: 'on',
    minimap: { enabled: false },
    overviewRulerLanes: 0,
    readOnly: toValue(readOnly),
    scrollbar: {
      useShadows: false,
      verticalScrollbarSize: 5,
    },
    scrollBeyondLastLine: false,
    guides: {
      indentation: true,
    },
    formatOnPaste: true,
    renderValidationDecorations: 'on',
    formatOnType: true,
    lineHeight: 20,
    renderLineHighlight: 'none',
    fontFamily: `'JetBrains Mono', monospace`,
  })

  editor.updateOptions({ insertSpaces: true, tabSize: 2 })

  let decorations: string[] = []

  actions?.forEach((action) => {
    editor.addAction({
      id: action.id,
      label: action.label,
      keybindings: action.keybindings,
      run: async () => {
        await action.run()
      },
    })
  })

  const offsetsToWholeLineRange = (startOffset: number, endOffset: number): monaco.Range => {
    const start = model.getPositionAt(startOffset)
    // Treat endOffset as exclusive to avoid highlighting an extra line when the
    // offset happens to fall on the first character of the next line.
    const inclusiveEndOffset = Math.max(startOffset, endOffset - 1)
    const end = model.getPositionAt(inclusiveEndOffset)

    const startLine = Math.max(1, start.lineNumber)
    const endLine = Math.max(startLine, end.lineNumber)

    return new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine))
  }

  const getPathOffsets = async (path: JsonPath): Promise<OffsetRange | null> => {
    if (model.getLanguageId() === 'yaml') {
      return getYamlNodeRangeFromPath(model.getValue(), path)
    }

    const node = await getJsonAstNodeFromPath(model, path)
    if (!node) {
      return null
    }

    return { startOffset: node.offset, endOffset: node.offset + node.length }
  }

  const runEditorAction = async (actionId: string): Promise<void> => {
    await editor.getAction(actionId)?.run()
  }

  const highlightOffsets = ({ startOffset, endOffset }: OffsetRange): void => {
    const range = offsetsToWholeLineRange(startOffset, endOffset)
    decorations = editor.deltaDecorations(decorations, [
      {
        range,
        options: {
          isWholeLine: true,
          className: 'json-focus-highlight',
        },
      },
    ])
  }

  const highlightPath = async (path: JsonPath) => {
    const offsets = await getPathOffsets(path)
    if (!offsets) {
      return
    }

    highlightOffsets(offsets)
  }

  const focusPath = async (path: JsonPath): Promise<void> => {
    const offsets = await getPathOffsets(path)
    if (!offsets) {
      return
    }

    const unfoldRange = offsetsToWholeLineRange(offsets.startOffset, offsets.endOffset)

    // fold all and unfold the target node
    await runEditorAction('editor.foldAll')

    editor.setSelection(unfoldRange)
    await runEditorAction('editor.unfoldRecursively')

    // Unfold based on the whole-line range so line-anchored folds open reliably.
    const position = model.getPositionAt(offsets.startOffset)
    editor.setPosition(position)
    editor.revealPositionNearTop(position)

    highlightOffsets(offsets)
  }

  const navigateToJsonPointer = async (pointer: string): Promise<void> => {
    const pointerPath = parseJsonPointerPath(pointer)
    if (!pointerPath) {
      return
    }

    await focusPath(pointerPath)
  }

  ensureJsonPointerLinkSupport(navigateToJsonPointer)

  editor.onDidChangeModelContent(() => {
    const newValue = editor.getValue()
    if (typeof newValue !== 'string') {
      return
    }

    onChange?.(newValue ?? '')
  })

  //--------------------------------------------------
  // Mirror the external value
  watch(
    () => toValue(value),
    (newValue) => {
      if (!newValue) {
        return
      }

      // If the value is the same, do not update the editor
      if (editor.getValue() === newValue) {
        return
      }

      editor.setValue(newValue)
    },
  )

  watch(
    [() => toValue(theme), () => toValue(isDarkMode)],
    async ([theme, isDarkMode]) => {
      await applyScalarTheme(theme, isDarkMode)
    },
    {
      immediate: true,
    },
  )

  //--------------------------------------------------
  // Read Only
  watch(
    () => toValue(readOnly),
    (nextReadOnly) => {
      editor?.updateOptions({ readOnly: nextReadOnly })
    },
  )

  const formatDocument = async (): Promise<void> => {
    await runEditorAction('editor.action.formatDocument')
  }

  const getValue = (): string => editor.getValue()

  const setValue = (nextValue: string): void => {
    editor.setValue(nextValue)
  }

  const hasTextFocus = (): boolean => editor.hasTextFocus()

  const setLanguage = (nextLanguage: MonacoEditorLanguage): void => {
    monaco.editor.setModelLanguage(model, nextLanguage)
  }

  const setCursorToMarker = (marker: monaco.editor.IMarker): void => {
    const lineNumber = Math.min(Math.max(marker.startLineNumber || 1, 1), model.getLineCount())
    const column = Math.min(Math.max(marker.startColumn || 1, 1), model.getLineMaxColumn(lineNumber))

    editor.setPosition({ lineNumber, column })
  }

  const dispose = (): void => {
    editor.dispose()
    model.dispose()
  }

  return {
    editor,
    model,
    highlightPath,
    focusPath,
    formatDocument,
    getValue,
    setValue,
    hasTextFocus,
    setLanguage,
    setCursorToMarker,
    dispose,
  }
}
