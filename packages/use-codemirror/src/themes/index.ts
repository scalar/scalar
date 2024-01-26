import { tags as t } from '@lezer/highlight'
import { createTheme } from '@uiw/codemirror-themes'

export const customTheme = createTheme({
  theme: 'light',
  settings: {
    background: 'var(--theme-background-2, var(--default-theme-background-2))',
    foreground: 'var(--theme-color-1, var(--default-theme-color-1))',
    caret: 'var(--theme-color-1, var(--default-theme-color-1))',
    selection: 'var(--theme-background-3, var(--default-theme-background-3))',
    selectionMatch: '#e3dcce',
    gutterBackground:
      'var(--theme-background-2, var(--default-theme-background-2))',
    gutterForeground: 'var(--theme-color-3, var(--default-theme-color-3))',
    gutterBorder: 'transparent',
    lineHighlight:
      'var(--theme-background-3, var(--default-theme-background-3))',
    fontFamily: 'var(--theme-font-code, var(--default-theme-font-code))',
  },
  styles: [
    {
      tag: [t.standard(t.tagName), t.tagName],
      color: 'var(--theme-color-purple, var(--default-theme-color-purple))',
    },
    {
      tag: [t.comment],
      color: 'var(--theme-color-3, var(--default-theme-color-3))',
    },
    {
      tag: [t.className],
      color: 'var(--theme-color-orange, var(--default-theme-color-orange))',
    },
    {
      tag: [t.variableName, t.propertyName, t.attributeName],
      color: 'var(--theme-color-1, var(--default-theme-color-1))',
    },
    {
      tag: [t.operator],
      color: 'var(--theme-color-2, var(--default-theme-color-2))',
    },
    {
      tag: [t.keyword, t.typeName, t.typeOperator],
      color: 'var(--theme-color-green, var(--default-theme-color-green))',
    },
    {
      tag: [t.string],
      color: 'var(--theme-color-blue, var(--default-theme-color-blue))',
    },
    {
      tag: [t.bracket, t.regexp, t.meta],
      color: 'var(--theme-color-3, var(--default-theme-color-3))',
    },
    {
      tag: [t.number],
      color: 'var(--theme-color-blue, var(--default-theme-color-blue))',
    },
    {
      tag: [t.name, t.quote],
      color: 'var(--theme-color-3, var(--default-theme-color-3))',
    },
    {
      tag: [t.heading],
      color: 'var(--theme-color-3, var(--default-theme-color-3))',
      fontWeight: 'bold',
    },
    {
      tag: [t.emphasis],
      color: 'var(--theme-color-3, var(--default-theme-color-3))',
      fontStyle: 'italic',
    },
    {
      tag: [t.deleted],
      color: 'var(--theme-color-3, var(--default-theme-color-3))',
      backgroundColor: 'transparent',
    },
    {
      tag: [t.atom, t.bool, t.special(t.variableName)],
      color: 'var(--theme-color-3, var(--default-theme-color-3))',
    },
    {
      tag: [t.url, t.escape, t.regexp, t.link],
      color: 'var(--theme-color-1, var(--default-theme-color-1))',
    },
    { tag: t.link, textDecoration: 'underline' },
    { tag: t.strikethrough, textDecoration: 'line-through' },
    {
      tag: t.invalid,
      color: 'var(--theme-color-3, var(--default-theme-color-3))',
    },
  ],
})
