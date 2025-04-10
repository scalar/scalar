import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

export type Configuration = Omit<
  Partial<ApiReferenceConfiguration>,
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
   * @default undefined (nuxt theme)
   */
  theme?: ApiReferenceConfiguration['theme']
}

export type Meta = {
  configuration: Configuration
  isOpenApiEnabled: boolean
}
