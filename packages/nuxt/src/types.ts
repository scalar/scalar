import type { ReferenceConfiguration } from '@scalar/api-reference'

export type Configuration = Omit<
  ReferenceConfiguration,
  'layout' | 'isEditable' | 'onSpecUpdate' | 'theme'
> & {
  /**
   * Whether to show scalar in Nuxt DevTools
   *
   * @default true
   */
  devtools: boolean
  /**
   * The theme to use for the reference
   *
   * @default 'nuxt'
   */
  theme?: ReferenceConfiguration['theme'] | 'nuxt'
}

export type Meta = {
  configuration: Configuration
  isOpenApiEnabled: boolean
}
