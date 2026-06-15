import type { ThemeRegistrationRaw } from '@shikijs/types'

/**
 * A Shiki theme that paints tokens with Scalar's CSS variables instead of
 * hard-coded colors.
 *
 * Shiki normally emits inline styles with literal hex colors, which would break
 * Scalar's theming (light/dark mode and user themes all flow through CSS
 * variables). By using `var(--scalar-color-*)` as the token colors, every
 * highlighted token reuses the same variables that the rest of the UI relies
 * on, so themes keep working without any extra CSS.
 *
 * TextMate scopes and highlight.js token names do not map one-to-one, so this is
 * a best-effort mapping that keeps the existing Scalar palette and overall look.
 */
export const scalarTheme: ThemeRegistrationRaw = {
  name: 'scalar',
  type: 'dark',
  // Background is handled by the surrounding code block, and the default text
  // color matches the previous `code.hljs` color.
  bg: 'transparent',
  fg: 'var(--scalar-color-2)',
  settings: [
    {
      scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
      settings: { foreground: 'var(--scalar-color-3)', fontStyle: 'italic' },
    },
    {
      scope: ['constant.numeric', 'constant.character.numeric', 'constant.other.numeric'],
      settings: { foreground: 'var(--scalar-color-orange)' },
    },
    {
      scope: ['string', 'string.quoted', 'string.template', 'string.regexp', 'constant.other.symbol'],
      settings: { foreground: 'var(--scalar-color-blue)' },
    },
    {
      scope: ['constant.language', 'constant.language.boolean', 'support.constant', 'keyword.other.unit'],
      settings: { foreground: 'var(--scalar-color-green)' },
    },
    {
      scope: ['keyword', 'keyword.control', 'storage', 'storage.type', 'storage.modifier'],
      settings: { foreground: 'var(--scalar-color-purple)' },
    },
    {
      scope: ['keyword.operator'],
      settings: { foreground: 'var(--scalar-color-2)' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call', 'variable.function'],
      settings: { foreground: 'var(--scalar-color-orange)' },
    },
    {
      scope: ['entity.name.class', 'entity.name.type', 'support.class', 'support.type', 'entity.other.inherited-class'],
      settings: { foreground: 'var(--scalar-color-1)' },
    },
    {
      scope: ['variable', 'variable.other', 'variable.parameter', 'meta.definition.variable'],
      settings: { foreground: 'var(--scalar-color-1)' },
    },
    {
      scope: ['variable.language', 'support.variable', 'meta.template.expression'],
      settings: { foreground: 'var(--scalar-color-blue)' },
    },
    {
      scope: ['entity.name.tag', 'punctuation.definition.tag'],
      settings: { foreground: 'var(--scalar-color-blue)' },
    },
    {
      scope: ['entity.other.attribute-name'],
      settings: { foreground: 'var(--scalar-color-1)' },
    },
    {
      scope: ['meta.tag', 'meta.preprocessor', 'keyword.other.preprocessor', 'entity.name.section'],
      settings: { foreground: 'var(--scalar-color-blue)' },
    },
    {
      scope: ['markup.inserted', 'meta.diff.header.to-file', 'punctuation.definition.inserted'],
      settings: { foreground: 'var(--scalar-color-green)' },
    },
    {
      scope: ['markup.deleted', 'meta.diff.header.from-file', 'punctuation.definition.deleted'],
      settings: { foreground: 'var(--scalar-color-red)' },
    },
    {
      scope: ['markup.heading', 'markup.bold', 'entity.name.section'],
      settings: { foreground: 'var(--scalar-color-blue)', fontStyle: 'bold' },
    },
    {
      scope: ['markup.italic'],
      settings: { fontStyle: 'italic' },
    },
    {
      scope: ['markup.underline.link', 'string.other.link'],
      settings: { foreground: 'var(--scalar-color-blue)' },
    },
  ],
}

/** The registered name used to reference the Scalar theme when highlighting. */
export const SCALAR_THEME_NAME = 'scalar'
