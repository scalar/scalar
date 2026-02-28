import * as monaco from 'monaco-editor'

import { loadCssVariables } from '@/v2/features/collection/components/Editor/hooks/use-editor/helpers/load-css-variables'

const THEME_NAME = 'scalar-theme'

/**
 * Applies a custom Scalar theme to the Monaco editor.
 *
 * This function loads CSS variables for either dark or light mode, maps the colors to Monaco's editor theme keys,
 * and then applies the new theme. Theme color tokens are resolved from CSS custom properties.
 *
 * Example usage:
 *
 *   await applyScalarTheme('scalar', true);  // Apply dark mode
 *   await applyScalarTheme('scalar', false); // Apply light mode
 *
 * @param theme - The theme string key to load variables for (e.g. 'scalar').
 * @param isDarkMode - Whether to use dark or light variables.
 */
export const applyScalarTheme = async (theme: string, isDarkMode: boolean) => {
  // Load all CSS variables for the given theme
  const allVars = await loadCssVariables(theme)

  // Pick variables for dark or light mode
  const vars = isDarkMode ? allVars.dark : allVars.light

  /**
   * Map Monaco editor theme keys to CSS variable names.
   */
  const varsMap = {
    'editor.background': '--scalar-background-1',
    'editor.foreground': '--scalar-color-1',
    'editorLineNumber.foreground': '--scalar-color-3',
    'editorLineNumber.activeForeground': '--scalar-color-1',
    'editorLineHighlight.background': '--scalar-background-2',
    'editorCursor.foreground': '--scalar-color-1',
    'editorCursor.background': '--scalar-background-1',
    'editor.selectionBackground': '--scalar-background-3',
    'editor.inactiveSelectionBackground': '--scalar-background-3',
    'editorIndentGuide.background': '--scalar-background-3',
    'editorIndentGuide.activeBackground': '--scalar-background-2',
    'editorWhitespace.foreground': '--scalar-border-color',
    'editorBracketMatch.background': '--scalar-background-3',
    'editorBracketMatch.border': '--scalar-color-accent',
    'editor.selectionHighlightBackground': '--scalar-background-3',
    'editor.hoverHighlightBackground': '--scalar-background-3',
    'editorLink.activeForeground': '--scalar-color-3',
    'editorOverviewRuler.border': '--scalar-border-color',
  }

  /**
   * Build a colors object for Monaco from the variable map.
   * Only assign if the variable exists in the loaded vars.
   */
  const colors = Object.fromEntries(
    Object.entries(varsMap)
      .filter(([_, cssVar]) => !!vars[cssVar])
      .map(([prop, cssVar]) => [prop, vars[cssVar]]),
  )

  // Define the theme in Monaco using the chosen variables.
  monaco.editor.defineTheme(THEME_NAME, {
    base: isDarkMode ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      // Default text
      { token: '', foreground: vars['--scalar-color-3'] },
      // Comments
      {
        token: 'comment',
        foreground: vars['--scalar-color-2'],
        fontStyle: 'italic',
      },
      // Keywords
      {
        token: 'keyword',
        foreground: vars['--scalar-color-accent'],
        fontStyle: 'bold',
      },
      // Numbers
      { token: 'number', foreground: vars['--scalar-color-purple'] },
      // Strings
      { token: 'string', foreground: vars['--scalar-color-2'] },
      // Delimiters (punctuation)
      { token: 'delimiter', foreground: vars['--scalar-color-3'] },
    ],
    colors,
  })

  // Finally, set the theme
  monaco.editor.setTheme(THEME_NAME)
}
