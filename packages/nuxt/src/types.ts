import type { ReferenceConfiguration } from '@scalar/api-reference'

export type Configuration = Omit<
  ReferenceConfiguration,
  'layout' | 'isEditable' | 'onSpecUpdate'
> & {
  /**
   * Whether to show scalar in Nuxt DevTools
   *
   * @default true
   */
  devtools: boolean
}

export type Meta = {
  configuration: Configuration
  isOpenApiEnabled: boolean
}
