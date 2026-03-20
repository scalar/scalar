import { replaceEnvVariables, replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { encode as encodeBase64 } from 'js-base64'

import type { RequestFactory } from '@/request-example/builder/request-factory'

export const buildRequest = (
  request: RequestFactory,
  options: {
    envVariables: Record<string, string>
    serverVariables: Record<string, string>
  },
) => {
  const controller = new AbortController()

  const requestUrl = (() => {
    if (request.proxy.isUsingProxy) {
      return replacePathVariables(
        replaceEnvVariables(request.proxy.proxiedUrl, options.envVariables),
        options.serverVariables,
      )
    }
    return replacePathVariables(replaceEnvVariables(request.url, options.envVariables), options.serverVariables)
  })()

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

  const urlParams = new URLSearchParams()

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
      urlParams.append(security.name, security.value)
      return
    }

    if (security.in === 'cookie') {
      // Skip the cookie header, should already be set in the request object header
      return
    }
  })

  // TODO: handle url params diffrently here so we can update the final url with the resolved url params

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
