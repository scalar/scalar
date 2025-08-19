import type { ApiReferenceConfigurationWithSources } from '@scalar/types'
import type { DocumentConfiguration } from '@scalar/workspace-store/client'

/**
 * Maps a partial ApiReferenceConfigurationWithSources object to a DocumentConfiguration
 * for use in the API Reference. This function transforms configuration options
 * into the expected structure for the 'x-scalar-reference-config' property.
 *
 * @param config - Partial configuration object for the API Reference
 * @returns DocumentConfiguration object with mapped settings
 */
export const mapConfiguration = (config: Partial<ApiReferenceConfigurationWithSources>) => {
  return {
    'x-scalar-reference-config': {
      title: config.title,
      slug: config.slug,
      getOperationId: config.generateOperationSlug,
      getHeadingId: config.generateHeadingSlug,
      getTagId: config.generateTagSlug,
      getModelId: config.generateModelSlug,
      getWebhookId: config.generateWebhookSlug,
      tagSort: config.tagsSorter,
      operationsSorter: config.operationsSorter,
      features: {
        // Feature toggles for UI elements and behaviors
        showModels: !config.hideModels,
        expandAllTagSections: config.defaultOpenAllTags,
        persistAuthenticationState: config.persistAuth,
        showDarkModeToggle: !config.hideDarkModeToggle,
        showDownload: !config.hideDownloadButton,
        showSearch: !config.hideSearch,
        showSidebar: config.showSidebar,
        showTestRequestButton: !config.hideTestRequestButton,
      },
      appearance: {
        // Appearance-related configuration
        css: config.customCss,
        favicon: config.favicon,
        forceColorMode: config.forceDarkModeState,
        initialColorMode: config.darkMode ? 'dark' : undefined,
        layout: config.layout,
        loadDefaultFonts: config.withDefaultFonts,
        theme: config.theme,
      },
      routing: {
        // Routing configuration
        basePath: config.pathRouting?.basePath,
      },
      settings: {
        // Miscellaneous settings
        proxyUrl: config.proxyUrl,
        searchKey: config.searchHotKey,
      },
    },
  } satisfies DocumentConfiguration
}
