import * as monaco from 'monaco-editor'

import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding'
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding.css'
import 'monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css'

import { presets } from '@scalar/themes'
import { type MaybeRefOrGetter, toValue, watch } from 'vue'

import { applyScalarScheme } from '@/v2/features/collection/components/Editor/hooks/use-editor/helpers/apply-scalar-scheme'
import { parseJsonPointerPath } from '@/v2/features/collection/components/Editor/hooks/use-editor/helpers/json-pointer-path'

import { applyOpenApiJsonSchemaToModel } from './helpers/apply-openapi-json-schema'
import { ensureMonacoEnvironment } from './helpers/ensure-monaco-environment'
import { getJsonAstNodeFromPath } from './helpers/get-json-ast-node-from-path'
import type { JsonPath } from './helpers/json-path'
import { ensureJsonPointerLinkSupport } from './helpers/json-pointer-links'
import { nodeToWholeLineRange } from './helpers/node-range'

export type MonacoEditorAction = {
  id: string
  label: string
  keybindings?: number[]
  run: () => void | Promise<void>
}

export const useJsonEditor = ({
  element,
  value,
  onChange,
  actions,
  readOnly = false,
  isDarkMode = false,
  theme = presets.default.theme,
}: {
  element: HTMLElement
  value?: MaybeRefOrGetter<string>
  readOnly?: MaybeRefOrGetter<boolean>
  onChange?: (e: string) => void
  actions?: MonacoEditorAction[]
  isDarkMode?: MaybeRefOrGetter<boolean>
  theme?: MaybeRefOrGetter<string>
}) => {
  ensureMonacoEnvironment()

  const model = monaco.editor.createModel(toValue(value) ?? '', 'json')
  applyOpenApiJsonSchemaToModel(model.uri.toString())

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

  const highlightNode = (node: monaco.languages.json.ASTNode) => {
    const range = nodeToWholeLineRange(model, node)

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
    const node = await getJsonAstNodeFromPath(model, path)
    if (!node) {
      return
    }

    highlightNode(node)
  }

  const focusPath = async (path: JsonPath) => {
    const node = await getJsonAstNodeFromPath(model, path)
    if (!node) {
      return
    }

    const unfoldRange = nodeToWholeLineRange(model, node)

    // fold all and unfold the target node
    await editor.getAction('editor.foldAll')?.run()

    editor.setSelection(unfoldRange)
    await editor.getAction('editor.unfoldRecursively')?.run()

    // Unfold based on the whole-line range so line-anchored folds open reliably.
    editor.setPosition(model.getPositionAt(node.offset))
    editor.revealPositionNearTop(model.getPositionAt(node.offset))

    highlightNode(node)
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
      await applyScalarScheme(theme, isDarkMode)
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
    dispose,
  }
}
