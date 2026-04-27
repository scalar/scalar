/**
 * We should not use these exports anymore, but we need them for commonjs compatibility.
 */
export type {
  AnyApiReferenceConfiguration,
  ApiClientConfiguration,
  ApiReferenceConfiguration,
  ApiReferenceConfigurationRaw,
  ApiReferenceConfigurationWithMultipleSources,
  ApiReferenceConfigurationWithSource,
  ApiReferenceInstance,
  ApiReferencePlugin,
  AuthenticationConfiguration,
  BaseConfiguration,
  CreateApiReference,
  ExternalUrls,
  HtmlRenderingConfiguration,
  LifecycleHooks,
  SecurityScheme,
  SecuritySchemeApiKey,
  SecuritySchemeHttp,
  SecuritySchemeOauth2,
  SecuritySchemeOpenIdConnect,
  SourceConfiguration,
  SpecificationExtension,
  ViewComponent,
} from './api-reference'
export { isConfigurationWithSources } from './api-reference'
export { XScalarStability } from './legacy/index'
