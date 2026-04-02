import {
  getConfiguration as _getConfiguration,
  getScriptTags as _getScriptTags,
  renderApiReference,
} from '@scalar/client-side-rendering'
import type { ApiReferenceConfigurationWithSource, HtmlRenderingConfiguration } from '@scalar/types/api-reference'

/** @deprecated Use `@scalar/client-side-rendering` instead. */
export type { HtmlRenderingConfiguration }

/**
 * The HTML document to render the Scalar API reference.
 *
 * @deprecated Use `renderApiReference` from `@scalar/client-side-rendering` instead.
 */
export const getHtmlDocument = (givenConfiguration: Partial<HtmlRenderingConfiguration>, customTheme = ''): string => {
  const { cdn, pageTitle, ...config } = givenConfiguration

  return renderApiReference({ config, pageTitle, cdn }, customTheme)
}

/**
 * The script tags to load the @scalar/api-reference package from the CDN.
 *
 * @deprecated Use `getScriptTags` from `@scalar/client-side-rendering` instead.
 */
export function getScriptTags(configuration: Partial<ApiReferenceConfigurationWithSource>, cdn?: string): string {
  return _getScriptTags(configuration as Record<string, unknown>, cdn)
}

/**
 * The configuration to pass to the @scalar/api-reference package.
 *
 * @deprecated Use `getConfiguration` from `@scalar/client-side-rendering` instead.
 */
export const getConfiguration = (
  givenConfiguration: Partial<ApiReferenceConfigurationWithSource>,
): Partial<ApiReferenceConfigurationWithSource> => {
  return _getConfiguration(
    givenConfiguration as Record<string, unknown>,
  ) as Partial<ApiReferenceConfigurationWithSource>
}
