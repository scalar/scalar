import type { HarRequest, Plugin } from '@scalar/types/snippetz'

import { accumulateRepeatedValue, reduceQueryParams } from '@/libs/http'
import { LENGTH_CONSIDERED_AS_SHORT, formatPythonValue } from '@/plugins/python/requestsLike'

const indent = (value: string, prefix = '    '): string =>
  value
    .split('\n')
    .map((line) => (line.trim() === '' ? line : `${prefix}${line}`))
    .join('\n')

const formatRequestCall = (clientVar: string, method: string, url: string, args: string[]): string => {
  const urlParam = JSON.stringify(url)

  if (url.length > LENGTH_CONSIDERED_AS_SHORT) {
    return `${clientVar}.${method}(\n    ${[urlParam, ...args].join(',\n    ')}\n)`
  }

  if (args.length === 0) {
    return `${clientVar}.${method}(${urlParam})`
  }

  return `${clientVar}.${method}(${urlParam},\n    ${args.join(',\n    ')}\n)`
}

/**
 * python/aiohttp
 */
export const pythonAiohttp: Plugin = {
  target: 'python',
  client: 'aiohttp',
  title: 'aiohttp',
  generate(request, configuration) {
    const normalizedRequest: Partial<HarRequest> = {
      url: 'https://example.com',
      method: 'get',
      ...request,
    }

    const method = normalizedRequest.method?.toLowerCase() ?? 'get'
    const requestArgs: string[] = []
    const sessionArgs: string[] = []
    const setupLines: string[] = []

    if (normalizedRequest.headers?.length) {
      const headers = normalizedRequest.headers.reduce<Record<string, string>>((acc, header) => {
        if (!(header.name in acc)) {
          acc[header.name] = header.value
        }

        return acc
      }, {})

      requestArgs.push(`headers=${formatPythonValue(headers)}`)
    }

    if (normalizedRequest.queryString?.length) {
      requestArgs.push(`params=${formatPythonValue(reduceQueryParams(normalizedRequest.queryString))}`)
    }

    if (normalizedRequest.cookies?.length) {
      const cookies = Object.fromEntries(normalizedRequest.cookies.map((cookie) => [cookie.name, cookie.value]))
      sessionArgs.push(`cookies=${formatPythonValue(cookies)}`)
    }

    if (configuration?.auth?.username && configuration?.auth?.password) {
      sessionArgs.push(
        `auth=aiohttp.BasicAuth(${JSON.stringify(configuration.auth.username)}, ${JSON.stringify(configuration.auth.password)})`,
      )
    }

    if (normalizedRequest.postData) {
      const { mimeType, text, params } = normalizedRequest.postData

      if (mimeType === 'application/json' && text) {
        try {
          requestArgs.push(`json=${formatPythonValue(JSON.parse(text))}`)
        } catch {
          requestArgs.push(`data=${JSON.stringify(text)}`)
        }
      } else if (mimeType === 'application/octet-stream' && text) {
        requestArgs.push(`data=b"${text}"`)
      } else if (mimeType === 'multipart/form-data' && params) {
        setupLines.push('data = aiohttp.FormData()')

        params.forEach((param) => {
          if (param.fileName !== undefined) {
            const addFieldArgs = [
              JSON.stringify(param.name),
              `open(${JSON.stringify(param.fileName)}, "rb")`,
              `filename=${JSON.stringify(param.fileName)}`,
            ]

            if (param.contentType) {
              addFieldArgs.push(`content_type=${JSON.stringify(param.contentType)}`)
            }

            setupLines.push(`data.add_field(${addFieldArgs.join(', ')})`)

            return
          }

          if (param.contentType) {
            setupLines.push(
              `data.add_field(${JSON.stringify(param.name)}, ${JSON.stringify(param.value ?? '')}, content_type=${JSON.stringify(param.contentType)})`,
            )

            return
          }

          setupLines.push(`data.add_field(${JSON.stringify(param.name)}, ${JSON.stringify(param.value ?? '')})`)
        })

        requestArgs.push('data=data')
      } else if (mimeType === 'application/x-www-form-urlencoded' && params) {
        const formData: Record<string, string | string[]> = {}

        params.forEach((param) => {
          accumulateRepeatedValue(formData, param.name, param.value ?? '')
        })

        requestArgs.push(`data=${formatPythonValue(formData)}`)
      } else if (text) {
        requestArgs.push(`data=${JSON.stringify(text)}`)
      }
    }

    const sessionOpen =
      sessionArgs.length === 0
        ? 'async with aiohttp.ClientSession() as session:'
        : `async with aiohttp.ClientSession(\n    ${sessionArgs.join(',\n    ')}\n) as session:`
    const requestCall = formatRequestCall('await session', method, normalizedRequest.url ?? '', requestArgs)
    const bodyLines = [...setupLines, requestCall]

    return `${sessionOpen}\n${indent(bodyLines.join('\n'))}`
  },
}
