import type { Plugin } from '@scalar/types/snippetz'

import { accumulateRepeatedValue, buildQueryString } from '@/libs/http'
import { objectToString } from '@/libs/php'

const escapePhpString = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

const quotePhpString = (value: string): string => `'${escapePhpString(value)}'`

const escapePhpObjectKey = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

const escapeObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => escapeObjectKeys(item))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce(
      (acc, [key, nestedValue]) => {
        acc[escapePhpObjectKey(key)] = escapeObjectKeys(nestedValue)
        return acc
      },
      {} as Record<string, unknown>,
    )
  }

  return value
}

const getCookieDomain = (url: string): string => {
  if (!url) {
    return 'localhost'
  }

  try {
    return new URL(url).hostname || 'localhost'
  } catch {
    return 'localhost'
  }
}

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

    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    const queryString = buildQueryString(normalizedRequest.queryString)
    const url = `${normalizedRequest.url ?? ''}${queryString}`

    const chain: string[] = []

    if (configuration?.auth?.username && configuration.auth.password) {
      chain.push(
        `withBasicAuth(${quotePhpString(configuration.auth.username)}, ${quotePhpString(configuration.auth.password)})`,
      )
    }

    if (normalizedRequest.headers?.length) {
      const headers: Record<string, string | string[]> = {}

      normalizedRequest.headers.forEach((header) => {
        accumulateRepeatedValue(headers, header.name, header.value)
      })

      chain.push(`withHeaders(${objectToString(escapeObjectKeys(headers))})`)
    }

    if (normalizedRequest.cookies?.length) {
      const cookies: Record<string, string | string[]> = {}

      normalizedRequest.cookies.forEach((cookie) => {
        accumulateRepeatedValue(cookies, cookie.name, cookie.value)
      })

      chain.push(
        `withCookies(${objectToString(escapeObjectKeys(cookies))}, ${quotePhpString(getCookieDomain(normalizedRequest.url ?? ''))})`,
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
        const formData: Record<string, string | string[]> = {}

        normalizedRequest.postData.params.forEach((param) => {
          accumulateRepeatedValue(formData, param.name, param.value ?? '')
        })

        chain.push('asForm()')
        payload = formData
      } else if (normalizedRequest.postData.mimeType === 'multipart/form-data' && normalizedRequest.postData.params) {
        const multipartData: Record<string, string | string[]> = {}

        normalizedRequest.postData.params.forEach((param) => {
          if (param.fileName !== undefined) {
            const args = [
              quotePhpString(param.name),
              `file_get_contents(${quotePhpString(param.fileName)})`,
              quotePhpString(param.fileName),
            ]

            if (param.contentType) {
              args.push(objectToString(escapeObjectKeys({ 'Content-Type': param.contentType })))
            }

            chain.push(`attach(${args.join(', ')})`)
          } else if (param.contentType) {
            chain.push(
              `attach(${quotePhpString(param.name)}, ${quotePhpString(param.value ?? '')}, null, ${objectToString(
                escapeObjectKeys({ 'Content-Type': param.contentType }),
              )})`,
            )
          } else {
            accumulateRepeatedValue(multipartData, param.name, param.value ?? '')
          }
        })

        if (Object.keys(multipartData).length > 0) {
          payload = multipartData
        }
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

    const requestCall = supportsDirectMethod
      ? payload !== undefined && requestMethod !== 'head'
        ? `${requestMethod}(${quotePhpString(url)}, ${objectToString(escapeObjectKeys(payload), 1)})`
        : `${requestMethod}(${quotePhpString(url)})`
      : payload !== undefined
        ? `send(${quotePhpString(normalizedRequest.method)}, ${quotePhpString(url)}, ${objectToString(escapeObjectKeys(payload), 1)})`
        : `send(${quotePhpString(normalizedRequest.method)}, ${quotePhpString(url)})`

    const expression =
      chain.length > 0
        ? [`Http::${chain[0]}`, ...chain.slice(1).map((method) => `  ->${method}`), `  ->${requestCall}`].join('\n')
        : `Http::${requestCall}`

    return `use Illuminate\\Support\\Facades\\Http;\n\n$response = ${expression};`
  },
}
