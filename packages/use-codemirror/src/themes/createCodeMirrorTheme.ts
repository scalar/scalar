/**
 * This file is copied from @uiw/codemirror-themes.
 * We've had issues with the import (something to do with CJS/ESM).
 *
 * @see https://github.com/uiwjs/react-codemirror
 * @see https://github.com/scalar/scalar/issues/4222
 */
import { HighlightStyle, type TagStyle, syntaxHighlighting } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

type StyleSpec = {
  [propOrSelector: string]: string | number | StyleSpec | null
}

export type CreateThemeOptions = {
  /**
   * Theme inheritance. Determines which styles CodeMirror will apply by default.
   */
  theme: Theme
  /**
   * Settings to customize the look of the editor, like background, gutter, selection and others.
   */
  settings: Settings
  /** Syntax highlighting styles. */
  styles: TagStyle[]
}

type Theme = 'light' | 'dark'

export type Settings = {
  /** Editor background color. */
  background?: string
  /** Editor background image. */
  backgroundImage?: string
  /** Default text color. */
  foreground?: string
  /** Caret color. */
  caret?: string
  /** Selection background. */
  selection?: string
  /** Selection match background. */
  selectionMatch?: string
  /** Background of highlighted lines. */
  lineHighlight?: string
  /** Gutter background. */
  gutterBackground?: string
  /** Text color inside gutter. */
  gutterForeground?: string
  /** Text active color inside gutter. */
  gutterActiveForeground?: string
  /** Gutter right border color. */
  gutterBorder?: string
  /** set editor font */
  fontFamily?: string
  /** set editor font size */
  fontSize?: StyleSpec['fontSize']
}

/**
 * Creates a CodeMirror theme from a set of options.
 */
export const createCodeMirrorTheme = ({ theme, settings = {}, styles = [] }: CreateThemeOptions): Extension => {
  const themeOptions: Record<string, StyleSpec> = {
    '.cm-gutters': {},
  }
  const baseStyle: StyleSpec = {}
  if (settings.background) {
    baseStyle.backgroundColor = settings.background
  }
  if (settings.backgroundImage) {
    baseStyle.backgroundImage = settings.backgroundImage
  }
  if (settings.foreground) {
    baseStyle.color = settings.foreground
  }
  if (settings.fontSize) {
    baseStyle.fontSize = settings.fontSize
  }
  if (settings.background || settings.foreground) {
    themeOptions['&'] = baseStyle
  }

  if (settings.fontFamily) {
    themeOptions['&.cm-editor .cm-scroller'] = {
      fontFamily: settings.fontFamily,
    }
  }
  if (settings.gutterBackground && themeOptions['.cm-gutters']) {
    themeOptions['.cm-gutters'].backgroundColor = settings.gutterBackground
  }
  if (settings.gutterForeground && themeOptions['.cm-gutters']) {
    themeOptions['.cm-gutters'].color = settings.gutterForeground
  }
  if (settings.gutterBorder && themeOptions['.cm-gutters']) {
    themeOptions['.cm-gutters'].borderRightColor = settings.gutterBorder
  }

  if (settings.caret) {
    themeOptions['.cm-content'] = {
      caretColor: settings.caret,
    }
    themeOptions['.cm-cursor, .cm-dropCursor'] = {
      borderLeftColor: settings.caret,
    }
  }
  const activeLineGutterStyle: StyleSpec = {}
  if (settings.gutterActiveForeground) {
    activeLineGutterStyle.color = settings.gutterActiveForeground
  }
  if (settings.lineHighlight) {
    themeOptions['.cm-activeLine'] = {
      backgroundColor: settings.lineHighlight,
    }
    activeLineGutterStyle.backgroundColor = settings.lineHighlight
  }
  themeOptions['.cm-activeLineGutter'] = activeLineGutterStyle

  if (settings.selection) {
    themeOptions[
      '&.cm-focused .cm-selectionBackground, & .cm-line::selection, & .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection'
    ] = {
      background: settings.selection + ' !important',
    }
  }
  if (settings.selectionMatch) {
    themeOptions['& .cm-selectionMatch'] = {
      backgroundColor: settings.selectionMatch,
    }
  }
  const themeExtension = EditorView.theme(themeOptions, {
    dark: theme === 'dark',
  })

  const highlightStyle = HighlightStyle.define(styles)
  const extension = [themeExtension, syntaxHighlighting(highlightStyle)]

  return extension
}
