export {
  type ApiClientConfiguration,
  type ApiReferenceConfiguration,
  type ApiReferenceConfigurationWithSources,
  type MultiReferenceConfiguration,
  type SpecConfiguration,
  apiClientConfigurationSchema,
  apiReferenceConfigurationSchema,
  apiReferenceConfigurationWithSourcesSchema,
  specConfigurationSchema,
  isConfigurationWithSources,
} from './api-reference-configuration.ts'

export {
  type HtmlRenderingConfiguration,
  htmlRenderingConfigurationSchema,
} from './html-rendering-configuration.ts'

export { migrateThemeVariables } from './helpers/migrate-theme-variables.ts'
