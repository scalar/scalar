const OLD_PROXY_URL = 'https://api.scalar.com/request-proxy'
const NEW_PROXY_URL = 'https://proxy.scalar.com'

export function migrateProxyUrl(configuration: Record<string, unknown>): Record<string, unknown> {
  if (configuration.proxy) {
    console.warn(
      `[DEPRECATED] You’re using the deprecated 'proxy' attribute, rename it to 'proxyUrl' or update the package.`,
    )

    if (!configuration.proxyUrl) {
      configuration.proxyUrl = configuration.proxy
    }

    delete configuration.proxy
  }

  if (configuration.proxyUrl === OLD_PROXY_URL) {
    console.warn(`[DEPRECATED] Warning: configuration.proxyUrl points to our old proxy (${OLD_PROXY_URL}).`)

    console.warn(`[DEPRECATED] We are overwriting the value and use the new proxy URL (${NEW_PROXY_URL}) instead.`)

    console.warn(
      `[DEPRECATED] Action Required: You should manually update your configuration to use the new URL (${NEW_PROXY_URL}). Read more: https://github.com/scalar/scalar`,
    )

    configuration.proxyUrl = NEW_PROXY_URL
  }

  return configuration
}
