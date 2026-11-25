import type { Plugin } from '@scalar/types/snippetz'

import { accumulateRepeatedValue, hasRepeatedName, joinUrlAndQuery, normalizeMethod } from '@/libs/http'
import { getCookieDomain, objectToString, quotePhpString } from '@/libs/php'

/**
 * php/laravel
 */
export const phpLaravel: Plugin = {
  target: 'php',
  client: 'laravel',
  title: 'Laravel HTTP Client',
  generate(request, configuration) {
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    normalizedRequest.method = normalizeMethod(normalizedRequest.method)

    const url = joinUrlAndQuery(normalizedRequest.url ?? '', normalizedRequest.queryString)

    const chain: string[] = []

    if (configuration?.auth?.username && configuration.auth.password) {
      chain.push(
        `withBasicAuth(${quotePhpString(configuration.auth.username)}, ${quotePhpString(configuration.auth.password)})`,
      )
    }

    const postData = normalizedRequest.postData
    const isContentType = (name: string): boolean => name.toLowerCase() === 'content-type'
    // Laravel encodes form arrays with indexed names, so repeated fields are sent with withBody(), which sets the
    // Content-Type itself and would duplicate a header whose name is spelled differently.
    const repeatedFormContentType =
      postData?.mimeType === 'application/x-www-form-urlencoded' && hasRepeatedName(postData.params)
        ? normalizedRequest.headers?.find(({ name }) => isContentType(name))?.value || postData.mimeType
        : undefined
    const requestHeaders =
      normalizedRequest.headers?.filter(({ name }) => repeatedFormContentType === undefined || !isContentType(name)) ??
      []

    if (requestHeaders.length) {
      const headers: Record<string, string | string[]> = {}

      requestHeaders.forEach((header) => {
        accumulateRepeatedValue(headers, header.name, header.value)
      })

      chain.push(`withHeaders(${objectToString(headers)})`)
    }

    if (normalizedRequest.cookies?.length) {
      const cookies: Record<string, string | string[]> = {}

      normalizedRequest.cookies.forEach((cookie) => {
        accumulateRepeatedValue(cookies, cookie.name, cookie.value)
      })

      chain.push(
        `withCookies(${objectToString(cookies)}, ${quotePhpString(getCookieDomain(normalizedRequest.url ?? ''))})`,
      )
    }

    let payload: unknown

    if (normalizedRequest.postData) {
      if (normalizedRequest.postData.mimeType === 'application/json') {
        if (normalizedRequest.postData.text) {
          try {
            payload = JSON.parse(normalizedRequest.postData.text)
          } catch {
            chain.push(`withBody(${quotePhpString(normalizedRequest.postData.text)}, 'application/json')`)
          }
        }
      } else if (
        normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded' &&
        normalizedRequest.postData.params
      ) {
        const fields = normalizedRequest.postData.params.map(({ name, value }) => [name, value ?? ''])

        if (repeatedFormContentType !== undefined) {
          chain.push(
            `withBody(${quotePhpString(new URLSearchParams(fields).toString())}, ${quotePhpString(repeatedFormContentType)})`,
          )
        } else {
          chain.push('asForm()')
          payload = Object.fromEntries(fields)
        }
      } else if (normalizedRequest.postData.mimeType === 'multipart/form-data' && normalizedRequest.postData.params) {
        // A payload is sent as JSON without a file, encodes repeated names as `name[0]` and moves ahead of the files,
        // so every part is its own attach() call in request order.
        normalizedRequest.postData.params.forEach((param) => {
          const args =
            param.fileName !== undefined
              ? [
                  quotePhpString(param.name),
                  `file_get_contents(${quotePhpString(param.fileName)})`,
                  quotePhpString(param.fileName),
                ]
              : [quotePhpString(param.name), quotePhpString(param.value ?? ''), ...(param.contentType ? ['null'] : [])]

          if (param.contentType) {
            args.push(objectToString({ 'Content-Type': param.contentType }))
          }

          chain.push(`attach(${args.join(', ')})`)
        })
      } else if (normalizedRequest.postData.mimeType === 'application/octet-stream') {
        chain.push(`withBody(${quotePhpString(normalizedRequest.postData.text ?? '')}, 'application/octet-stream')`)
      } else if (normalizedRequest.postData.text) {
        try {
          payload = JSON.parse(normalizedRequest.postData.text)
        } catch {
          chain.push(
            `withBody(${quotePhpString(normalizedRequest.postData.text)}, ${quotePhpString(normalizedRequest.postData.mimeType || 'text/plain')})`,
          )
        }
      }
    }

    const requestMethod = normalizedRequest.method.toLowerCase()
    const supportsDirectMethod = ['delete', 'get', 'head', 'patch', 'post', 'put'].includes(requestMethod)

    let requestCall: string
    if (supportsDirectMethod) {
      requestCall =
        payload !== undefined && requestMethod !== 'head'
          ? `${requestMethod}(${quotePhpString(url)}, ${objectToString(payload, 1)})`
          : `${requestMethod}(${quotePhpString(url)})`
    } else {
      requestCall =
        payload !== undefined
          ? `send(${quotePhpString(normalizedRequest.method)}, ${quotePhpString(url)}, ${objectToString(payload, 1)})`
          : `send(${quotePhpString(normalizedRequest.method)}, ${quotePhpString(url)})`
    }

    const expression =
      chain.length > 0
        ? [`Http::${chain[0]}`, ...chain.slice(1).map((method) => `  ->${method}`), `  ->${requestCall}`].join('\n')
        : `Http::${requestCall}`

    return `use Illuminate\\Support\\Facades\\Http;\n\n$response = ${expression};`
  },
}
