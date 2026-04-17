import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import { redirectToProxy, shouldUseProxy } from '@scalar/helpers/url/redirect-to-proxy'
import { encode as encodeBase64 } from 'js-base64'

import { buildRequestCookieHeader } from '@/request-example/builder/header/build-request-cookie-header'
import { applyAllowReservedToUrl } from '@/request-example/builder/helpers/apply-allow-reserved-to-url'
import type { RequestFactory } from '@/request-example/builder/request-factory'
import { resolveRequestFactoryUrl } from '@/request-example/builder/resolve-request-factory-url'
import { contextFunctions, isContextFunctionName } from '@/request-example/functions'
import type { XScalarCookie } from '@/schemas/extensions/general/x-scalar-cookies'

/**
 * The payload to build a request, useful when bypassing limitations of the browser Request object
 */
export type RequestPayload = [string, RequestInit]

/**
 * Built request response
 *
 * We no longer return a Request object, but a tuple of [url, init] that maps directly to the fetch() argument list so
 * we can do things that the browser doesn't allow like GET + body
 * */
export type BuildRequestResponse = {
  /** Create a new request payload object with the replaced values ready to be sent to the server */
  requestPayload: RequestPayload
  /** The abort controller */
  controller: AbortController
  /** The flag indicating if the request is being proxied */
  isUsingProxy: boolean
}

export const buildRequest = (
  request: RequestFactory,
  options: {
    envVariables: Record<string, string>
  },
): BuildRequestResponse => {
  /** Replace the value with the environment variable or context function */
  const replace = (value: string): string | null => {
    if (isContextFunctionName(value)) {
      return contextFunctions[value].fn() ?? null
    }
    return options.envVariables[value] ?? null
  }

  /** Create a new abort controller */
  const controller = new AbortController()

  /** Create a new headers object with the replaced values */
  const headers = (() => {
    const headers = new Headers()

    request.headers.forEach((value, key) => {
      headers.set(replaceEnvVariables(key, replace), replaceEnvVariables(value, replace))
    })

    return headers
  })()

  /** Create a new body object with the replaced values */
  const body: BodyInit | null = (() => {
    if (request.body?.mode === 'raw') {
      if (typeof request.body.value === 'string') {
        return replaceEnvVariables(request.body.value, replace)
      }
      return request.body.value
    }

    if (request.body?.mode === 'formdata') {
      const form = new FormData()

      request.body.value.forEach((item) => {
        if (item.type === 'text') {
          form.append(replaceEnvVariables(item.key, replace), replaceEnvVariables(item.value, replace))
          return
        }
        form.append(replaceEnvVariables(item.key, replace), item.value)
      })
      return form
    }

    if (request.body?.mode === 'urlencoded') {
      return new URLSearchParams(
        request.body.value.map((item) => [
          replaceEnvVariables(item.key, replace),
          replaceEnvVariables(item.value, replace),
        ]),
      )
    }

    return null
  })()

  const securityQueryParams = new URLSearchParams()
  const securityCookies: XScalarCookie[] = []

  /** Build the request security unless the consumer opted out via disableSecurity  */
  if (!request.options?.disableSecurity) {
    request.security.forEach((security) => {
      const name = replaceEnvVariables(security.name, replace)

      // Format the security value based on its authentication scheme.
      // - For 'basic': prefix with 'Basic' and base64-encode the value (username:password).
      // - For 'bearer': prefix with 'Bearer'.
      // - Otherwise: use the substituted value as is (for API keys, etc).
      const securityValue = (() => {
        const substitutedValue = replaceEnvVariables(security.value, replace)
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
        headers.append(name, securityValue)
        return
      }

      if (security.in === 'query') {
        securityQueryParams.append(name, securityValue)
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

  /** Resolve the request URL with the replaced values */
  const requestUrl = resolveRequestFactoryUrl(request, {
    envVariables: replace,
    securityQueryParams: securityQueryParams,
  })

  /** Check if the request should be proxied */
  const isUsingProxy = shouldUseProxy(request.proxyUrl, requestUrl)

  /** Create a new cookies array with the replaced values */
  const cookies: XScalarCookie[] = [...request.cookies, ...securityCookies].map((c) => ({
    ...c,
    name: replaceEnvVariables(c.name, replace),
    value: replaceEnvVariables(c.value, replace),
  }))

  /** Build the request cookie header */
  const cookieHeader = buildRequestCookieHeader({
    cookies,
    originalCookieHeader: headers.get('cookie'),
    url: requestUrl,
    useCustomCookieHeader: (isUsingProxy || request.options?.isElectron) ?? false,
  })

  /** Add the cookie header to the headers */
  if (cookieHeader) {
    headers.set(cookieHeader.name, cookieHeader.value)
  }

  /** Encode the URL with the allowed reserved query parameters */
  const encodedUrl = applyAllowReservedToUrl(requestUrl, request.allowedReservedQueryParameters ?? new Set())
  const finalUrl = isUsingProxy ? redirectToProxy(request.proxyUrl, encodedUrl) : encodedUrl

  return {
    requestPayload: [
      finalUrl,
      {
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
      },
    ],
    controller,
    isUsingProxy,
  }
}
