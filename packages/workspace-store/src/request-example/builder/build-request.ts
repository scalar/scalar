import { replaceEnvVariables, replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { redirectToProxy } from '@scalar/helpers/url/redirect-to-proxy'
import { encode as encodeBase64 } from 'js-base64'

import type { RequestFactory } from '@/request-example/builder/request-factory'

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

  // Build the request security
  request.security.forEach((security) => {
    if (security.in === 'header') {
      // Build the value for the header
      const value = (() => {
        if (security.type === 'basic') {
          return `Basic ${encodeBase64(security.value)}`
        }

        if (security.type === 'bearer') {
          return `Bearer ${security.value}`
        }

        return security.value
      })()

      // Set the header
      headers.set(security.name, value)
      return
    }

    if (security.in === 'query') {
      securityUrlParams.append(security.name, security.value)
      return
    }

    if (security.in === 'cookie') {
      // Skip the cookie header, should already be set in the request object header
      return
    }
  })

  const requestUrl = (() => {
    // Replace the path variables with the environment variables and server variables
    const url = new URL(
      replacePathVariables(replaceEnvVariables(request.url, options.envVariables), request.path.variables),
      window.location.origin ?? 'http://localhost:3000',
    )

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
    if (!request.proxy.isUsingProxy) {
      return url.toString()
    }
    return redirectToProxy(request.proxy.proxyUrl, url.toString())
  })()

  return {
    request: new Request(requestUrl, {
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
