import { type MaybeRefOrGetter, toValue, watch } from 'vue'

import { ensureMonacoEnvironment } from './helpers/ensure-monaco-environment'
import { applyScalarTheme } from './helpers/theme/apply-scalar-theme'

import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution'
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding'
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding.css'
import 'monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css'

/**
 * Configures the Monaco editor with custom Scala theme settings.
 * Applies the theme whenever the theme or dark mode value changes.
 * In development mode, ensures Monaco environment is configured (worker setup handled by Vite config).
 */
export const useMonacoEditorConfiguration = ({
  theme,
  darkMode,
}: {
  theme: MaybeRefOrGetter<string>
  darkMode: MaybeRefOrGetter<boolean>
}): void => {
  // Ensure Monaco environment only in production to prevent worker misconfiguration.
  if (!import.meta.env.DEV) {
    ensureMonacoEnvironment()
  }

  // Watch for changes to theme or darkMode and apply the Scalar theme immediately.
  watch([() => toValue(theme), () => toValue(darkMode)], ([theme, darkMode]) => applyScalarTheme(theme, darkMode), {
    immediate: true,
  })
}
