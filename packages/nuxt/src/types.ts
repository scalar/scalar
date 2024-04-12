import { type ReferenceConfiguration } from '@scalar/api-reference'

export type Configuration = Omit<
  ReferenceConfiguration,
  'layout' | 'isEditable' | 'onSpecUpdate'
>

export type Meta = {
  configuration: Configuration
  isOpenApiEnabled: boolean
}
