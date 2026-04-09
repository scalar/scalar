import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import { redirectToProxy, shouldUseProxy } from '@scalar/helpers/url/redirect-to-proxy'
import { encode as encodeBase64 } from 'js-base64'

import { buildRequestCookieHeader } from '@/request-example/builder/header/build-request-cookie-header'
import { applyAllowReservedToUrl } from '@/request-example/builder/helpers/apply-allow-reserved-to-url'
import type { RequestFactory } from '@/request-example/builder/request-factory'
import { resolveRequestFactoryUrl } from '@/request-example/builder/resolve-request-factory-url'
import type { XScalarCookie } from '@/schemas/extensions/general/x-scalar-cookies'

export const buildRequest = (
  request: RequestFactory,
  options: {
    envVariables: Record<string, string>
  },
) => {
  const controller = new AbortController()

  const headers = (() => {
    const variables = options.envVariables
    const headers = new Headers()

    request.headers.forEach((value, key) => {
      headers.set(replaceEnvVariables(key, variables), replaceEnvVariables(value, variables))
    })

    return headers
  })()

  const body: BodyInit | null = (() => {
    const variables = options.envVariables
    if (request.body?.mode === 'raw') {
      if (typeof request.body.value === 'string') {
        return replaceEnvVariables(request.body.value, variables)
      }
      return request.body.value
    }

    if (request.body?.mode === 'formdata') {
      const form = new FormData()

      request.body.value.forEach((item) => {
        if (item.type === 'text') {
          form.append(replaceEnvVariables(item.key, variables), replaceEnvVariables(item.value, variables))
          return
        }
        form.append(replaceEnvVariables(item.key, variables), item.value)
      })
      return form
    }

    if (request.body?.mode === 'urlencoded') {
      return new URLSearchParams(
        request.body.value.map((item) => [
          replaceEnvVariables(item.key, variables),
          replaceEnvVariables(item.value, variables),
        ]),
      )
    }

    return null
  })()

  const securityQueryParams = new URLSearchParams()
  const securityCookies: XScalarCookie[] = []

  // Build the request security unless the consumer opted out via disableSecurity
  if (!request.options?.disableSecurity) {
    request.security.forEach((security) => {
      const name = replaceEnvVariables(security.name, options.envVariables)

      // Format the security value based on its authentication scheme.
      // - For 'basic': prefix with 'Basic' and base64-encode the value (username:password).
      // - For 'bearer': prefix with 'Bearer'.
      // - Otherwise: use the substituted value as is (for API keys, etc).
      const securityValue = (() => {
        const substitutedValue = replaceEnvVariables(security.value, options.envVariables)
        if (security.format === 'basic') {
          return `Basic ${encodeBase64(substitutedValue)}`
        }

        if (security.format === 'bearer') {
          return `Bearer ${substitutedValue}`
        }

        return substitutedValue
      })()

      if (security.in === 'header') {
        // Set the header (use replaced header name so {{ env }} placeholders work)
        headers.set(name, securityValue)
        return
      }

      if (security.in === 'query') {
        securityQueryParams.set(name, securityValue)
        return
      }

      if (security.in === 'cookie') {
        securityCookies.push({
          name: name,
          value: securityValue,
          isDisabled: false,
        })
      }
    })
  }

  const requestUrl = resolveRequestFactoryUrl(request, {
    envVariables: options.envVariables,
    securityQueryParams: securityQueryParams,
  })

  const isUsingProxy = shouldUseProxy(request.proxyUrl, requestUrl)

  const cookies: XScalarCookie[] = [...request.cookies, ...securityCookies].map((c) => ({
    ...c,
    name: replaceEnvVariables(c.name, options.envVariables),
    value: replaceEnvVariables(c.value, options.envVariables),
  }))

  const cookieHeader = buildRequestCookieHeader({
    cookies,
    originalCookieHeader: headers.get('cookie'),
    url: requestUrl,
    useCustomCookieHeader: (isUsingProxy || request.options?.isElectron) ?? false,
  })

  // Add the cookie header to the headers
  if (cookieHeader) {
    headers.set(cookieHeader.name, cookieHeader.value)
  }

  // final url
  const encodedUrl = applyAllowReservedToUrl(requestUrl, request.allowedReservedQueryParameters ?? new Set())
  const finalUrl = isUsingProxy ? redirectToProxy(request.proxyUrl, encodedUrl) : encodedUrl

  return {
    request: new Request(finalUrl, {
      /**
       * Ensure that all methods are uppercased (though only needed for patch)
       *
       * @see https://github.com/whatwg/fetch/issues/50
       */
      method: request.method.toUpperCase(),
      headers,
      body,
      cache: request.cache,
      signal: controller.signal,
    }),
    controller,
    isUsingProxy,
  }
}
