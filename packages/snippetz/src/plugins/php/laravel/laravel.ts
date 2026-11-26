import type { Plugin } from '@scalar/types/snippetz'

import { accumulateRepeatedValue, hasRepeatedName, joinUrlAndQuery, normalizeMethod } from '@/libs/http'
import { Raw, getCookieDomain, objectToString, quotePhpString } from '@/libs/php'

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
    const multipartParams = postData?.mimeType === 'multipart/form-data' ? postData.params : undefined
    const isContentType = (name: string): boolean => name.toLowerCase() === 'content-type'
    // Laravel encodes form arrays with indexed names, so repeated fields are sent with withBody(), which sets the
    // Content-Type itself and would duplicate a header whose name is spelled differently.
    const repeatedFormContentType =
      postData?.mimeType === 'application/x-www-form-urlencoded' && hasRepeatedName(postData.params)
        ? normalizedRequest.headers?.find(({ name }) => isContentType(name))?.value || postData.mimeType
        : undefined
    // Guzzle needs to set the Content-Type with the boundary it generates for structured multipart parts.
    const generatesContentType = multipartParams !== undefined || repeatedFormContentType !== undefined
    const requestHeaders = normalizedRequest.headers?.filter(
      ({ name }) => !generatesContentType || !isContentType(name),
    )

    if (requestHeaders?.length) {
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

    if (postData && !multipartParams) {
      if (postData.mimeType === 'application/json') {
        if (postData.text) {
          try {
            payload = JSON.parse(postData.text)
          } catch {
            chain.push(`withBody(${quotePhpString(postData.text)}, 'application/json')`)
          }
        }
      } else if (postData.mimeType === 'application/x-www-form-urlencoded' && postData.params) {
        const fields = postData.params.map(({ name, value }) => [name, value ?? ''])

        if (repeatedFormContentType !== undefined) {
          chain.push(
            `withBody(${quotePhpString(new URLSearchParams(fields).toString())}, ${quotePhpString(repeatedFormContentType)})`,
          )
        } else {
          chain.push('asForm()')
          payload = Object.fromEntries(fields)
        }
      } else if (postData.mimeType === 'application/octet-stream') {
        chain.push(`withBody(${quotePhpString(postData.text ?? '')}, 'application/octet-stream')`)
      } else if (postData.text) {
        try {
          payload = JSON.parse(postData.text)
        } catch {
          chain.push(`withBody(${quotePhpString(postData.text)}, ${quotePhpString(postData.mimeType || 'text/plain')})`)
        }
      }
    }

    const requestMethod = normalizedRequest.method.toLowerCase()
    const supportsDirectMethod = ['delete', 'get', 'head', 'patch', 'post', 'put'].includes(requestMethod)

    let requestCall: string
    if (multipartParams) {
      // Explicit parts preserve request order and falsey values on older Laravel releases.
      // Passing them as a send() option also keeps the multipart body on DELETE.
      const multipart = multipartParams.map(({ name, value, fileName, contentType }) => ({
        name,
        contents: fileName === undefined ? (value ?? '') : new Raw(`file_get_contents(${quotePhpString(fileName)})`),
        ...(fileName === undefined ? {} : { filename: fileName }),
        ...(contentType ? { headers: { 'Content-Type': contentType } } : {}),
      }))
      chain.push('asMultipart()')
      requestCall = `send(${quotePhpString(normalizedRequest.method)}, ${quotePhpString(url)}, ${objectToString({ multipart }, 1)})`
    } else if (supportsDirectMethod) {
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
