/**
 * Extracts the base path from the current URL by removing a specified suffix.
 * This is useful for handling subdirectory deployments where the application
 * might not be hosted at the root path.
 *
 * Example:
 * - URL: /my-app/docs/
 * - Suffix: /docs/
 * - Result: /my-app
 *
 * @param {string} suffix - The URL suffix to remove (can be empty)
 * @returns {string} The normalized base path with no trailing slash
 */
export const getBasePath = (suffix) => {
  const path = window.location.pathname
  if (path.endsWith(suffix)) {
    return path.slice(0, -suffix.length)
  }
  return ''
}

/**
 * Initializes the Scalar API reference documentation viewer.
 * This function handles two deployment scenarios:
 *
 * 1. Relative paths: When OpenAPI specs are hosted alongside the application
 * 2. Absolute paths: When OpenAPI specs are served from specific routes
 *
 * The function ensures URLs are correctly constructed regardless of whether
 * the application is hosted in a subdirectory or at the root path.
 *
 * @param {string} path - The current request path used to calculate the base URL
 * @param {boolean} isOpenApiRoutePatternUrl - When true, treats OpenAPI URLs as absolute paths
 *                                            When false, prepends the base path to make URLs relative
 * @param {boolean} useDynamicBaseServerUrl - When true, uses the current server URL as the base URL
 * @param {Object} configuration - Scalar configuration object
 * @param {Array<Object>} [configuration.sources=[]] - Array of OpenAPI source configurations
 */
export const initialize = (
  path,
  isOpenApiRoutePatternUrl,
  useDynamicBaseServerUrl,
  configuration = { sources: [] },
) => {
  const basePath = getBasePath(path)

  const normalizedConfig = {
    ...configuration,
    sources: configuration?.sources?.map((source) => ({ ...source })) || [],
  }

  if (!isOpenApiRoutePatternUrl) {
    // Construct full URLs for subdirectory hosting support
    normalizedConfig.sources = normalizedConfig.sources.map((source) => {
      if (!source.url) {
        return source
      }

      return {
        ...source,
        url: new URL(source.url, `${window.location.origin}${basePath}/`).toString(),
      }
    })
  }

  if (useDynamicBaseServerUrl) {
    normalizedConfig.baseServerURL = `${window.location.origin}${basePath}`
  }

  Scalar.createApiReference('#app', normalizedConfig)
}
