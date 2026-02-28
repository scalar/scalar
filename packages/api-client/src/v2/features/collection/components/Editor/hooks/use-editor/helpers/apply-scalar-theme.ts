import * as monaco from 'monaco-editor'

import { loadCssVariables } from '@/v2/features/collection/components/Editor/hooks/use-editor/helpers/load-css-variables'

const THEME_NAME = 'scalar-theme'

export const applyScalarTheme = async (theme: string, isDarkMode: boolean) => {
  const allVars = await loadCssVariables(theme)

  const vars = isDarkMode ? allVars.dark : allVars.light

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

  const colors = Object.fromEntries(
    Object.entries(varsMap)
      .filter(([_, cssVar]) => !!vars[cssVar])
      .map(([prop, cssVar]) => [prop, vars[cssVar]]),
  )

  monaco.editor.defineTheme(THEME_NAME, {
    base: isDarkMode ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: '', foreground: vars['--scalar-color-3'] },
      {
        token: 'comment',
        foreground: vars['--scalar-color-2'],
        fontStyle: 'italic',
      },
      {
        token: 'keyword',
        foreground: vars['--scalar-color-accent'],
        fontStyle: 'bold',
      },
      { token: 'number', foreground: vars['--scalar-color-purple'] },
      { token: 'string', foreground: vars['--scalar-color-2'] },
      { token: 'delimiter', foreground: vars['--scalar-color-3'] },
    ],
    colors,
  })

  monaco.editor.setTheme(THEME_NAME)
}
