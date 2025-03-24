export {
  type ApiClientConfiguration,
  type ApiReferenceConfiguration,
  type ApiReferenceConfigurationWithSources,
  type AnyApiReferenceConfiguration,
  type SpecConfiguration,
  apiClientConfigurationSchema,
  apiReferenceConfigurationSchema,
  specConfigurationSchema,
  isConfigurationWithSources,
} from './api-reference-configuration.ts'

export {
  type HtmlRenderingConfiguration,
  htmlRenderingConfigurationSchema,
} from './html-rendering-configuration.ts'

export { migrateThemeVariables } from './helpers/migrate-theme-variables.ts'
