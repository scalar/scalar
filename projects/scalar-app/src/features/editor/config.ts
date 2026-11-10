import 'monaco-editor'

import { type MaybeRefOrGetter, toValue, watch } from 'vue'

import { ensureMonacoEnvironment } from './helpers/ensure-monaco-environment'
import { applyScalarTheme } from './helpers/theme/apply-scalar-theme'

/**
 * Configures the Monaco editor with custom Scala theme settings.
 * Applies the theme whenever the theme or dark mode value changes.
 * Uses the same Vite-managed workers in development and production.
 */
export const useMonacoEditorConfiguration = ({
  theme,
  darkMode,
}: {
  theme: MaybeRefOrGetter<string>
  darkMode: MaybeRefOrGetter<boolean>
}): void => {
  ensureMonacoEnvironment()

  // Watch for changes to theme or darkMode and apply the Scalar theme immediately.
  watch([() => toValue(theme), () => toValue(darkMode)], ([theme, darkMode]) => applyScalarTheme(theme, darkMode), {
    immediate: true,
  })
}
