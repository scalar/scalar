import { Type } from '@scalar/typebox'

export const AppearanceSchema = Type.Partial(
  Type.Object({
    layout: Type.Union([Type.Literal('modern'), Type.Literal('classic')]),
    theme: Type.String(),
    favicon: Type.String(),
    initialColorMode: Type.Union([Type.Literal('auto'), Type.Literal('dark'), Type.Literal('light')]),
    forceColorMode: Type.Union([Type.Literal('dark'), Type.Literal('light')]),
    css: Type.String(),
    loadDefaultFonts: Type.Boolean(),
  }),
)

export type Appearance = {
  layout?: 'modern' | 'classic'
  theme?: string
  favicon?: string
  initialColorMode?: 'auto' | 'dark' | 'light'
  forceColorMode?: 'dark' | 'light'
  css?: string
  loadDefaultFonts?: boolean
}

export const defaultAppearance: Required<Appearance> = {
  layout: 'modern',
  theme: 'default',
  favicon: '',
  initialColorMode: 'auto',
  forceColorMode: 'dark',
  css: '',
  loadDefaultFonts: true,
}
