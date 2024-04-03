import { tags as t } from '@lezer/highlight'
import { createTheme } from '@uiw/codemirror-themes'

export const customTheme = createTheme({
  theme: 'light',
  settings: {
    background: 'var(--scalar-background-2)',
    foreground: 'var(--scalar-color-1)',
    caret: 'var(--scalar-color-1)',
    // Selection likely needs a hardcoded color due to it not accepting variables
    selection: 'rgba(151, 183, 205, 0.2)',
    selectionMatch: '#e3dcce',
    gutterBackground: 'var(--scalar-background-2)',
    gutterForeground: 'var(--scalar-color-3)',
    gutterBorder: 'transparent',
    lineHighlight: 'var(--scalar-background-3)',
    fontFamily: 'var(--scalar-font-code)',
  },
  styles: [
    {
      tag: [t.standard(t.tagName), t.tagName],
      color: 'var(--scalar-color-purple)',
    },
    {
      tag: [t.comment],
      color: 'var(--scalar-color-3)',
    },
    {
      tag: [t.className],
      color: 'var(--scalar-color-orange)',
    },
    {
      tag: [t.variableName, t.propertyName, t.attributeName],
      color: 'var(--scalar-color-1)',
    },
    {
      tag: [t.operator],
      color: 'var(--scalar-color-2)',
    },
    {
      tag: [t.keyword, t.typeName, t.typeOperator],
      color: 'var(--scalar-color-green)',
    },
    {
      tag: [t.string],
      color: 'var(--scalar-color-blue)',
    },
    {
      tag: [t.bracket, t.regexp, t.meta],
      color: 'var(--scalar-color-3)',
    },
    {
      tag: [t.number],
      color: 'var(--scalar-color-blue)',
    },
    {
      tag: [t.name, t.quote],
      color: 'var(--scalar-color-3)',
    },
    {
      tag: [t.heading],
      color: 'var(--scalar-color-3)',
      fontWeight: 'bold',
    },
    {
      tag: [t.emphasis],
      color: 'var(--scalar-color-3)',
      fontStyle: 'italic',
    },
    {
      tag: [t.deleted],
      color: 'var(--scalar-color-3)',
      backgroundColor: 'transparent',
    },
    {
      tag: [t.atom, t.bool, t.special(t.variableName)],
      color: 'var(--scalar-color-3)',
    },
    {
      tag: [t.url, t.escape, t.regexp, t.link],
      color: 'var(--scalar-color-1)',
    },
    { tag: t.link, textDecoration: 'underline' },
    { tag: t.strikethrough, textDecoration: 'line-through' },
    {
      tag: t.invalid,
      color: 'var(--scalar-color-3)',
    },
  ],
})
