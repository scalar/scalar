import { tags as t } from '@lezer/highlight'
import { createTheme } from '@uiw/codemirror-themes'

export const lightTheme = createTheme({
  theme: 'light',
  settings: {
    background: 'var(--theme-background-2)',
    foreground: 'var(--theme-color-1)',
    caret: '#93abdc',
    selection: '#e3dcce',
    selectionMatch: '#e3dcce',
    gutterBackground: 'var(--theme-background-2)',
    gutterForeground: 'var(--theme-color-2)',
    gutterBorder: 'transparent',
    lineHighlight: '#EFEFEF',
    fontFamily: 'var(--theme-font-code)',
  },
  styles: [
    { tag: [t.comment, t.bracket], color: '#b6ad9a' },
    {
      tag: [t.atom, t.number, t.keyword, t.link, t.attributeName, t.quote],
      color: '#063289',
    },
    {
      tag: [t.emphasis, t.heading, t.tagName, t.propertyName, t.variableName],
      color: '#2d2006',
    },
    { tag: [t.typeName, t.url, t.string], color: '#896724' },
    { tag: [t.operator, t.string], color: '#1659df' },
    { tag: [t.propertyName], color: '#b29762' },
    { tag: [t.unit, t.punctuation], color: '#063289' },
  ],
})

export const darkTheme = createTheme({
  theme: 'dark',
  settings: {
    background: 'var(--theme-background-2)',
    foreground: 'var(--theme-color-1)',
    caret: '#ffad5c',
    selection: 'rgba(255, 255, 255, 0.1)',
    gutterBackground: 'var(--theme-background-2)',
    gutterForeground: 'var(--theme-color-2)',
    lineHighlight: '#36334280',
    fontFamily: 'var(--theme-font-code)',
  },
  styles: [
    { tag: [t.comment, t.bracket], color: '#6c6783' },
    {
      tag: [t.atom, t.number, t.keyword, t.link, t.attributeName, t.quote],
      color: '#ffcc99',
    },
    {
      tag: [
        t.emphasis,
        t.heading,
        t.tagName,
        t.propertyName,
        t.className,
        t.variableName,
      ],
      color: '#eeebff',
    },
    { tag: [t.typeName, t.url], color: '#7a63ee' },
    { tag: t.operator, color: '#ffad5c' },
    { tag: t.string, color: '#ffb870' },
    { tag: [t.propertyName], color: '#9a86fd' },
    { tag: [t.unit, t.punctuation], color: '#e09142' },
  ],
})
