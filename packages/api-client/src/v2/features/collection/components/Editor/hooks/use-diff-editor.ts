import * as monaco from 'monaco-editor'

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

import type { MonacoEditorLanguage } from './use-editor'

type MonacoDiffEditorAction = {
  id: string
  label: string
  keybindings?: number[]
  run: () => void | Promise<void>
}

export const useDiffEditor = ({
  element,
  originalValue,
  modifiedValue,
  onChange,
  actions,
  readOnly = false,
  isDarkMode = false,
  theme = presets.default.theme,
  language = 'json',
}: {
  element: HTMLElement
  originalValue?: MaybeRefOrGetter<string>
  modifiedValue?: MaybeRefOrGetter<string>
  readOnly?: MaybeRefOrGetter<boolean>
  onChange?: (value: string) => void
  actions?: MonacoDiffEditorAction[]
  isDarkMode?: MaybeRefOrGetter<boolean>
  theme?: MaybeRefOrGetter<string>
  language?: MaybeRefOrGetter<MonacoEditorLanguage>
}) => {
  ensureMonacoEnvironment()

  const originalModel = monaco.editor.createModel(toValue(originalValue) ?? '', toValue(language))
  const modifiedModel = monaco.editor.createModel(toValue(modifiedValue) ?? '', toValue(language))

  configureLanguageSupport(originalModel.uri.toString())
  configureLanguageSupport(modifiedModel.uri.toString())

  const editor = monaco.editor.createDiffEditor(element, {
    originalEditable: false,
    automaticLayout: true,
    renderSideBySide: true,
    readOnly: toValue(readOnly),
    minimap: { enabled: false },
    overviewRulerLanes: 0,
    scrollbar: {
      useShadows: false,
      verticalScrollbarSize: 5,
    },
    scrollBeyondLastLine: false,
    lineHeight: 20,
    renderValidationDecorations: 'on',
    renderOverviewRuler: false,
    fontFamily: `'JetBrains Mono', monospace`,
  })

  editor.setModel({
    original: originalModel,
    modified: modifiedModel,
  })

  editor.getOriginalEditor().updateOptions({ insertSpaces: true, tabSize: 2 })
  editor.getModifiedEditor().updateOptions({ insertSpaces: true, tabSize: 2 })

  let suppressedChangeEvents = 0

  actions?.forEach((action) => {
    editor.getModifiedEditor().addAction({
      id: action.id,
      label: action.label,
      keybindings: action.keybindings,
      run: async () => {
        await action.run()
      },
    })
  })

  editor.getModifiedEditor().onDidChangeModelContent(() => {
    if (suppressedChangeEvents > 0) {
      suppressedChangeEvents -= 1
      return
    }

    const nextValue = modifiedModel.getValue()
    if (typeof nextValue !== 'string') {
      return
    }

    onChange?.(nextValue)
  })

  watch(
    () => toValue(originalValue),
    (nextValue) => {
      if (typeof nextValue !== 'string') {
        return
      }

      if (originalModel.getValue() === nextValue) {
        return
      }

      originalModel.setValue(nextValue)
    },
  )

  watch(
    () => toValue(modifiedValue),
    (nextValue) => {
      if (typeof nextValue !== 'string') {
        return
      }

      if (modifiedModel.getValue() === nextValue) {
        return
      }

      setModifiedValue(nextValue, true)
    },
  )

  watch(
    [() => toValue(theme), () => toValue(isDarkMode)],
    async ([nextTheme, nextDarkMode]) => {
      await applyScalarTheme(nextTheme, nextDarkMode)
    },
    {
      immediate: true,
    },
  )

  watch(
    () => toValue(readOnly),
    (nextReadOnly) => {
      editor.updateOptions({ readOnly: nextReadOnly })
      editor.getModifiedEditor().updateOptions({ readOnly: nextReadOnly })
    },
  )

  watch(
    () => toValue(language),
    (nextLanguage) => {
      monaco.editor.setModelLanguage(originalModel, nextLanguage)
      monaco.editor.setModelLanguage(modifiedModel, nextLanguage)
    },
  )

  const runEditorAction = async (actionId: string): Promise<void> => {
    await editor.getModifiedEditor().getAction(actionId)?.run()
  }

  const formatDocument = async (): Promise<void> => {
    await runEditorAction('editor.action.formatDocument')
  }

  const getOriginalValue = (): string => originalModel.getValue()
  const getModifiedValue = (): string => modifiedModel.getValue()

  const setOriginalValue = (nextValue: string): void => {
    originalModel.setValue(nextValue)
  }

  const setModifiedValue = (nextValue: string, isProgrammaticUpdate = false): void => {
    if (isProgrammaticUpdate) {
      suppressedChangeEvents += 1
    }

    modifiedModel.setValue(nextValue)
  }

  const hasTextFocus = (): boolean =>
    editor.getOriginalEditor().hasTextFocus() || editor.getModifiedEditor().hasTextFocus()

  const setLanguage = (nextLanguage: MonacoEditorLanguage): void => {
    monaco.editor.setModelLanguage(originalModel, nextLanguage)
    monaco.editor.setModelLanguage(modifiedModel, nextLanguage)
  }

  const dispose = (): void => {
    editor.dispose()
    originalModel.dispose()
    modifiedModel.dispose()
  }

  return {
    editor,
    originalModel,
    modifiedModel,
    formatDocument,
    getOriginalValue,
    getModifiedValue,
    setOriginalValue,
    setModifiedValue,
    hasTextFocus,
    setLanguage,
    dispose,
  }
}
