import * as monaco from 'monaco-editor'
import { type MaybeRefOrGetter, toValue, watch } from 'vue'

import type { EditorModel, Path } from '@/v2/features/editor/helpers/model'

const HIGHLIGHT_DECORATION_CLASS = 'json-focus-highlight'

type MonacoEditorAction = {
  id: string
  label: string
  keybindings?: number[]
  run: () => void | Promise<void>
}

/**
 * Creates and manages a Monaco editor instance.
 *
 * @param element - The HTML element to mount the editor into.
 * @param onChange - A callback function to handle changes to the editor's value.
 * @param actions - An array of actions to add to the editor.
 * @param readOnly - Whether the editor should be read-only.
 * @param model - The editor model to use.
 * @returns An object containing the editor instance, model, and utility functions.
 */
export const useEditor = ({
  element,
  onChange,
  actions,
  readOnly = false,
  model,
}: {
  element: HTMLElement
  readOnly?: MaybeRefOrGetter<boolean>
  onChange?: (e: string) => void
  actions?: MonacoEditorAction[]
  /** Editor model provided from outside; must implement EditorModel (model + getRangeFromPath). */
  model: MaybeRefOrGetter<EditorModel>
}) => {
  const currentModel = () => toValue(model)

  const editor = monaco.editor.create(element, {
    model: currentModel().model,
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

  watch(model, (newModel) => {
    editor.setModel(toValue(newModel).model)
  })

  let highlightDecorations: string[] = []
  let suppressedChangeEvents = 0

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

  const runEditorAction = async (actionId: string): Promise<void> => {
    await editor.getAction(actionId)?.run()
  }

  /**
   * Highlights the range at the given path using the model's getRangeFromPath.
   * Replaces any previous path highlight.
   */
  const highlightPath = async (path: Path): Promise<void> => {
    const range = await Promise.resolve(currentModel().getRangeFromPath(path))
    if (!range) {
      return
    }

    highlightDecorations = editor.deltaDecorations(highlightDecorations, [
      {
        range,
        options: {
          className: HIGHLIGHT_DECORATION_CLASS,
        },
      },
    ])
  }

  /**
   * Focuses the editor on the range at the given path: folds all, unfolds the target,
   * reveals it near the top, and highlights it using the model's getRangeFromPath.
   */
  const focusPath = async (path: Path): Promise<void> => {
    const range = await Promise.resolve(currentModel().getRangeFromPath(path))
    if (!range) {
      return
    }

    const monacoModel = currentModel().model
    const unfoldRange = new monaco.Range(
      range.startLineNumber,
      1,
      range.endLineNumber,
      monacoModel.getLineMaxColumn(range.endLineNumber),
    )

    await runEditorAction('editor.foldAll')
    editor.setSelection(unfoldRange)
    await runEditorAction('editor.unfoldRecursively')

    const position = { lineNumber: range.startLineNumber, column: range.startColumn }
    editor.setPosition(position)
    editor.revealPositionNearTop(position)

    await highlightPath(path)
  }

  editor.onDidChangeModelContent(() => {
    if (suppressedChangeEvents > 0) {
      suppressedChangeEvents -= 1
      return
    }

    const newValue = editor.getValue()
    if (typeof newValue !== 'string') {
      return
    }

    onChange?.(newValue ?? '')
  })

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

  const setValue = (nextValue: string, isProgrammaticUpdate = false): void => {
    if (isProgrammaticUpdate) {
      suppressedChangeEvents += 1
    }

    editor.setValue(nextValue)
  }

  const hasTextFocus = (): boolean => editor.hasTextFocus()

  const dispose = (): void => {
    editor.dispose()
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
