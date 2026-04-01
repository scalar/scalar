/**
 * We should not use these exports anymore, but we need them for commonjs compatibility.
 */
export type {
  AnyApiReferenceConfiguration,
  ApiClientConfiguration,
  ApiClientPlugin,
  ApiReferenceConfiguration,
  ApiReferenceConfigurationRaw,
  ApiReferenceConfigurationWithMultipleSources,
  ApiReferenceConfigurationWithSource,
  ApiReferenceInstance,
  ApiReferencePlugin,
  AuthenticationConfiguration,
  CreateApiReference,
  ExternalUrls,
  HtmlRenderingConfiguration,
  SourceConfiguration,
  SpecificationExtension,
  ViewComponent,
} from './api-reference/index'
export {
  apiClientConfigurationSchema,
  apiClientPluginSchema,
  apiReferenceConfigurationSchema,
  apiReferenceConfigurationWithSourceSchema,
  hooksSchema,
  htmlRenderingConfigurationSchema,
  isConfigurationWithSources,
  sourceConfigurationSchema,
} from './api-reference/index'
export { XScalarStability } from './legacy/index'
