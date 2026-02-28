import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'

import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution'
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding'
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding.css'
import 'monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css'

import { presets } from '@scalar/themes'
import { type MaybeRefOrGetter, toValue, watch } from 'vue'

import { applyScalarTheme } from '@/v2/features/collection/components/Editor/hooks/use-editor/helpers/apply-scalar-theme'
import { getYamlNodeRangeFromPath } from '@/v2/features/collection/components/Editor/hooks/use-editor/helpers/get-yaml-node-range-from-path'
import { parseJsonPointerPath } from '@/v2/features/collection/components/Editor/hooks/use-editor/helpers/json-pointer-path'

import { configureLanguageSupport } from './helpers/configure-language-support'
import { ensureMonacoEnvironment } from './helpers/ensure-monaco-environment'
import { getJsonAstNodeFromPath } from './helpers/get-json-ast-node-from-path'
import type { JsonPath } from './helpers/json-path'
import { ensureJsonPointerLinkSupport } from './helpers/json-pointer-links'

export type MonacoEditorAction = {
  id: string
  label: string
  keybindings?: number[]
  run: () => void | Promise<void>
}

export type MonacoEditorLanguage = 'json' | 'yaml'

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

  const getPathOffsets = async (path: JsonPath): Promise<{ startOffset: number; endOffset: number } | null> => {
    if (model.getLanguageId() === 'yaml') {
      return getYamlNodeRangeFromPath(model.getValue(), path)
    }

    const node = await getJsonAstNodeFromPath(model, path)
    if (!node) {
      return null
    }

    return { startOffset: node.offset, endOffset: node.offset + node.length }
  }

  const highlightOffsets = (startOffset: number, endOffset: number) => {
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

    highlightOffsets(offsets.startOffset, offsets.endOffset)
  }

  const focusPath = async (path: JsonPath) => {
    const offsets = await getPathOffsets(path)
    if (!offsets) {
      return
    }

    const unfoldRange = offsetsToWholeLineRange(offsets.startOffset, offsets.endOffset)

    // fold all and unfold the target node
    await editor.getAction('editor.foldAll')?.run()

    editor.setSelection(unfoldRange)
    await editor.getAction('editor.unfoldRecursively')?.run()

    // Unfold based on the whole-line range so line-anchored folds open reliably.
    editor.setPosition(model.getPositionAt(offsets.startOffset))
    editor.revealPositionNearTop(model.getPositionAt(offsets.startOffset))

    highlightOffsets(offsets.startOffset, offsets.endOffset)
  }

  const navigateToJsonPointer = async (pointer: string) => {
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

  const formatDocument = async () => {
    await editor.getAction('editor.action.formatDocument')?.run()
  }

  const getValue = () => editor.getValue()

  const setValue = (nextValue: string) => {
    editor.setValue(nextValue)
  }

  const hasTextFocus = () => editor.hasTextFocus()

  const setLanguage = (nextLanguage: MonacoEditorLanguage) => {
    monaco.editor.setModelLanguage(model, nextLanguage)
  }

  const setCursorToMarker = (marker: monaco.editor.IMarker) => {
    const lineNumber = Math.min(Math.max(marker.startLineNumber || 1, 1), model.getLineCount())
    const column = Math.min(Math.max(marker.startColumn || 1, 1), model.getLineMaxColumn(lineNumber))

    editor.setPosition({ lineNumber, column })
  }

  const dispose = () => {
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
