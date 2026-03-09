import { type MaybeRefOrGetter, toValue, watch } from 'vue'

import { ensureMonacoEnvironment } from './helpers/ensure-monaco-environment'
import { applyScalarTheme } from './helpers/theme/apply-scalar-theme'

import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution'
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding'
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding.css'
import 'monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css'

export const useMonacoEditorConfiguration = ({
  theme,
  darkMode,
}: {
  theme: MaybeRefOrGetter<string>
  darkMode: MaybeRefOrGetter<boolean>
}): void => {
  // Don't configure monaco for dev environment
  // We will reply on vite config to handle workers
  if (import.meta.env.DEV) {
    ensureMonacoEnvironment()
  }

  // Apply scalar theme
  watch([() => toValue(theme), () => toValue(darkMode)], ([theme, darkMode]) => applyScalarTheme(theme, darkMode), {
    immediate: true,
  })
}
