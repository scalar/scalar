import { replaceTemplateVariables } from '@/libs/string-template'
import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type { RequestExample } from '@scalar/oas-utils/entities/spec'
import { shouldUseProxy } from '@scalar/oas-utils/helpers'

/**
 * The %x2F ("/") character is considered a directory separator, and subdirectories match as well.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
 */
const defaultPath = '/'

/**
 * The SameSite attribute lets servers specify whether/when cookies are sent with cross-site requests.
 *
 * None specifies that cookies are sent on both originating and cross-site requests.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#controlling_third-party_cookies_with_samesite
 */
const defaultSameSite = 'None'

/**
 * Set all cookie params and workspace level cookies that are applicable
 */
export function setRequestCookies({
  example,
  env,
  globalCookies,
  serverUrl,
  proxyUrl,
}: {
  example: RequestExample
  env: object
  globalCookies: Cookie[]
  serverUrl: string
  proxyUrl?: string
}): {
  cookieParams: Cookie[]
} {
  const cookieParams: Cookie[] = []

  // Handle domain with or without leading dot
  const defaultDomain = determineCookieDomain(
    // TODO: Should we do this in the parent function? We have this logic there anyway.
    proxyUrl && shouldUseProxy(proxyUrl, serverUrl)
      ? proxyUrl
      : (serverUrl ?? 'http://localhost'),
  )

  // Process local cookies
  example.parameters.cookies.forEach((c) => {
    if (c.enabled) {
      cookieParams.push({
        uid: c.key,
        name: c.key,
        value: replaceTemplateVariables(c.value, env),
        domain: defaultDomain,
        path: defaultPath,
        secure: true,
        sameSite: defaultSameSite,
      })
    }
  })

  // Process global cookies
  globalCookies.forEach((c) => {
    const { name, value, ...params } = c

    // // We only attach global cookies relevant to the current domain
    // const hasDomainMatch =
    //   params.domain === defaultDomain ||
    //   (params.domain?.startsWith('.') && domain.endsWith(params.domain ?? ''))

    // if (hasDomainMatch) {
    cookieParams.push({
      uid: name,
      name,
      value,
      // TODO: What’s with params.domain?
      domain: defaultDomain,
      path: params.path,
      // expires: params.expires ? new Date(params.expires) : undefined,
      // httpOnly: params.httpOnly,
      secure: params.secure,
      // TODO: What’s with params.sameSite?
      sameSite: defaultSameSite,
    })
    // }
  })

  return {
    cookieParams,
  }
}

/**
 * If the Set-Cookie header does not specify a Domain attribute, the cookies are available on the server that sets it
 * but not on its subdomains. Therefore, specifying Domain is less restrictive than omitting it.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
 */
const determineCookieDomain = (url: string) => {
  return 'localhost:5065'
  // const domain = new URL(url).hostname
  // // TODO: Can’t prefix IPs
  // return domain.startsWith('.') ? domain : `.${domain}`
}
