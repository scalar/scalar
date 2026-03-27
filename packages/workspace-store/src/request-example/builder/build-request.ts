import { replaceEnvVariables, replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { mergeUrls } from '@scalar/helpers/url/merge-urls'
import { redirectToProxy, shouldUseProxy } from '@scalar/helpers/url/redirect-to-proxy'
import { encode as encodeBase64 } from 'js-base64'

import { buildRequestCookieHeader } from '@/request-example/builder/header/build-request-cookie-header'
import { applyAllowReservedToUrl } from '@/request-example/builder/helpers/apply-allow-reserved-to-url'
import type { RequestFactory } from '@/request-example/builder/request-factory'
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

  const securityUrlParams = new URLSearchParams()
  const securityCookies: XScalarCookie[] = []

  // Build the request security
  request.security.forEach((security) => {
    const name = replaceEnvVariables(security.name, options.envVariables)
    const securityValue = replaceEnvVariables(security.value, options.envVariables)

    if (security.in === 'header') {
      // Build the value for the header
      const buildValue = (() => {
        if (security.type === 'basic') {
          return `Basic ${encodeBase64(securityValue)}`
        }

        if (security.type === 'bearer') {
          return `Bearer ${securityValue}`
        }

        return securityValue
      })()

      // Set the header
      headers.set(security.name, buildValue)
      return
    }

    if (security.in === 'query') {
      securityUrlParams.append(name, securityValue)
      return
    }

    if (security.in === 'cookie') {
      securityCookies.push({
        name: name,
        value: securityValue,
        isDisabled: false,
      })
      return
    }
  })

  const requestUrl = (() => {
    // construct replaced path variables
    const pathVariables = Object.fromEntries(
      Object.entries(request.path.variables).map(([key, value]) => [
        key,
        encodeURIComponent(replaceEnvVariables(value, options.envVariables)),
      ]),
    )

    const baseUrl = replaceEnvVariables(request.baseUrl, options.envVariables)
    const path = replacePathVariables(request.path.raw, pathVariables)

    const mergedUrl = mergeUrls(baseUrl, path)

    // Replace the path variables with the environment variables and server variables
    const url = new URL(mergedUrl, window.location.origin ?? 'http://localhost:3000')

    // Merge security query params
    request.security.forEach((security) => {
      if (security.in === 'query') {
        url.searchParams.set(security.name, security.value)
      }
    })

    // Replace the query params with the environment variables
    for (const [key, value] of request.query.params.entries()) {
      url.searchParams.set(
        replaceEnvVariables(key, options.envVariables),
        replaceEnvVariables(value, options.envVariables),
      )
    }
    return url.toString()
  })()

  const isUsingProxy = shouldUseProxy(request.proxy.proxyUrl, requestUrl)

  const cookies: XScalarCookie[] = [...request.cookies.list, ...securityCookies]
    .map((c) => ({
      ...c,
      name: replaceEnvVariables(c.name, options.envVariables),
      value: replaceEnvVariables(c.value, options.envVariables),
    }))
    .filter((c) => !c.isDisabled)

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
  const finalUrl = isUsingProxy ? redirectToProxy(request.proxy.proxyUrl, encodedUrl) : encodedUrl

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
  }
}
