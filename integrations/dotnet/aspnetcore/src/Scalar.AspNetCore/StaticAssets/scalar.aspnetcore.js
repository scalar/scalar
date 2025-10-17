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
 * Initialize Scalar with the given configuration
 *
 * @param {string} path - The current request path used to calculate the base URL
 * @param {boolean} useDynamicBaseServerUrl - When true, uses the current server URL as the base URL
 * @param {Object} configuration - Scalar configuration object
 * @param {Array<Object>} [configuration.sources=[]] - Array of OpenAPI source configurations
 * @param {string} [modulePath] - Optional path to the custom configuration script
 */
export const initialize = async (path, useDynamicBaseServerUrl, configuration = { sources: [] }, modulePath) => {
  const basePath = getBasePath(path)
  const httpUrlPattern = /^https?:\/\//i

  const normalizedConfig = {
    ...configuration,
    sources: configuration?.sources?.map((source) => ({ ...source })) || [],
  }

  // Construct full URLs for subdirectory hosting support if URLs are relative
  normalizedConfig.sources = normalizedConfig.sources.map((source) => {
    if (!source.url || httpUrlPattern.test(source.url)) {
      return source
    }

    return {
      ...source,
      url: new URL(source.url, `${window.location.origin}${basePath}/`).toString(),
    }
  })

  if (useDynamicBaseServerUrl) {
    normalizedConfig.baseServerURL = `${window.location.origin}${basePath}`
  }

  // Only load custom configuration if modulePath is provided
  if (modulePath) {
    // Normalize modulePath if it's a relative path
    const normalizedConfigPath = httpUrlPattern.test(modulePath)
      ? modulePath
      : new URL(modulePath, `${window.location.origin}${basePath}/`).toString()

    try {
      const customConfiguration = await import(normalizedConfigPath)
      Object.assign(normalizedConfig, customConfiguration.default)
    } catch (e) {
      console.error('Failed to load custom configuration', e)
    }
  }

  window.Scalar.createApiReference('#app', normalizedConfig)
}
