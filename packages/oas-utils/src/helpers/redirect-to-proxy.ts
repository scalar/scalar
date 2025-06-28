import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import { isRelativePath } from '@scalar/helpers/url/is-relative-path'

/**
 * Redirects the request to a proxy server with a given URL. But not for:
 *
 * - Relative URLs
 * - URLs that seem to point to a local IP (except the proxy is on the same domain)
 * - URLs that don't look like a domain
 **/
export function redirectToProxy(proxyUrl?: string, url?: string): string {
  try {
    if (!shouldUseProxy(proxyUrl, url)) {
      return url ?? ''
    }

    // Create new URL object from url
    const newUrl = new URL(url)

    // Add temporary domain for relative proxy URLs
    //
    // Q: Why isn't proxyUrl type guarded?
    // A: Type guarding works for one parameter only (as of now).
    //
    // Q: Why do we need to add http://localhost to relative proxy URLs?
    // A: Because the `new URL()` would otherwise fail.
    //
    const temporaryProxyUrl = isRelativePath(proxyUrl as string) ? `http://localhost${proxyUrl}` : (proxyUrl as string)

    // Rewrite the URL with the proxy
    newUrl.href = temporaryProxyUrl

    // Add the original URL as a query parameter
    newUrl.searchParams.append('scalar_url', url)

    // Remove the temporary domain if we added it, but only from the start of the URL
    const result = isRelativePath(proxyUrl as string)
      ? newUrl.toString().replace(/^http:\/\/localhost/, '')
      : newUrl.toString()

    return result
  } catch {
    return url ?? ''
  }
}

/**
 * Returns false for requests to localhost, relative URLs, if no proxy is defined …
 **/
export function shouldUseProxy(proxyUrl?: string, url?: string): url is string {
  try {
    // ❌ We don't have a proxy URL or the URL
    if (!proxyUrl || !url) {
      return false
    }

    // ❌ Request to relative URLs (won't be blocked by CORS anyway)
    if (isRelativePath(url)) {
      return false
    }

    // ✅ Proxy URL is on the same domain (e.g. /proxy)
    // It's more likely (not guaranteed, though) that the proxy has access to local domains.
    if (isRelativePath(proxyUrl)) {
      return true
    }

    // ✅ Proxy URL is local
    if (isLocalUrl(proxyUrl)) {
      return true
    }

    // ❌ Requests to localhost
    // We won't reach them from a (likely remote) proxy.
    if (isLocalUrl(url)) {
      return false
    }

    // ✅ Seems fine (e.g. remote proxy + remote URL)
    return true
  } catch {
    return false
  }
}
