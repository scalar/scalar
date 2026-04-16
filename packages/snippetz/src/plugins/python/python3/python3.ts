import type { HarRequest, Plugin } from '@scalar/types/snippetz'

import { accumulateRepeatedValue, buildQueryString, normalizeRequest } from '@/libs/http'
import { formatPythonValue } from '@/plugins/python/requestsLike'

const createBasicAuthToken = (value: string): string => {
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(value)
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64')
  }

  throw new Error('Could not encode basic auth credentials')
}

const parseRequestUrl = (url: string): URL => {
  if (!url) {
    return new URL('https://example.com')
  }

  try {
    return new URL(url)
  } catch {
    return new URL(url, 'https://example.com')
  }
}

const mergeQueryString = (url: URL, queryString: HarRequest['queryString'] = []): string => {
  if (!queryString.length) {
    return url.search
  }

  const serializedQuery = buildQueryString(queryString)

  if (!url.search) {
    return serializedQuery
  }

  return `${url.search}&${serializedQuery.slice(1)}`
}

const formatBytesLiteral = (value: string): string => {
  const escaped = JSON.stringify(value).slice(1, -1)
  return `b"${escaped}"`
}

type BodyGenerationResult = {
  payloadLines: string[]
  payloadVariable?: string
}

const buildRequestBody = (
  request: ReturnType<typeof normalizeRequest>,
  headers: Record<string, string>,
  imports: Set<string>,
): BodyGenerationResult => {
  const postData = request.postData

  if (!postData) {
    return {
      payloadLines: [],
    }
  }

  const { mimeType, text, params } = postData

  if (mimeType === 'application/json' && text) {
    try {
      const parsed = JSON.parse(text)
      imports.add('import json')

      return {
        payloadLines: [`payload = json.dumps(${formatPythonValue(parsed, 0)})`],
        payloadVariable: 'payload',
      }
    } catch {
      return {
        payloadLines: [`payload = ${JSON.stringify(text)}`],
        payloadVariable: 'payload',
      }
    }
  }

  if (mimeType === 'application/octet-stream' && text) {
    return {
      payloadLines: [`payload = ${formatBytesLiteral(text)}`],
      payloadVariable: 'payload',
    }
  }

  if (mimeType === 'application/x-www-form-urlencoded' && params) {
    imports.add('import urllib.parse')
    const formData: Record<string, string | string[]> = {}

    params.forEach((param) => {
      accumulateRepeatedValue(formData, param.name, param.value ?? '')
    })

    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }

    return {
      payloadLines: [`payload = urllib.parse.urlencode(${formatPythonValue(formData, 0)}, doseq=True)`],
      payloadVariable: 'payload',
    }
  }

  if (mimeType === 'multipart/form-data' && params) {
    const payloadLines = ['boundary = "----ScalarSnippetzBoundary"', 'data_list = []']

    params.forEach((param) => {
      payloadLines.push('data_list.append("--" + boundary)')

      if (param.fileName !== undefined) {
        payloadLines.push(
          `data_list.append(${JSON.stringify(`Content-Disposition: form-data; name="${param.name}"; filename="${param.fileName}"`)})`,
        )
      } else {
        payloadLines.push(`data_list.append(${JSON.stringify(`Content-Disposition: form-data; name="${param.name}"`)})`)
      }

      if (param.contentType) {
        payloadLines.push(`data_list.append(${JSON.stringify(`Content-Type: ${param.contentType}`)})`)
      }

      payloadLines.push('data_list.append("")')

      if (param.fileName !== undefined) {
        payloadLines.push(`data_list.append(open(${JSON.stringify(param.fileName)}, "rb").read().decode("latin-1"))`)
      } else {
        payloadLines.push(`data_list.append(${JSON.stringify(param.value ?? '')})`)
      }
    })

    payloadLines.push('data_list.append("--" + boundary + "--")')
    payloadLines.push('data_list.append("")')
    payloadLines.push('payload = "\\r\\n".join(data_list)')

    headers['Content-Type'] = 'multipart/form-data; boundary=----ScalarSnippetzBoundary'

    return {
      payloadLines,
      payloadVariable: 'payload',
    }
  }

  if (text) {
    try {
      const parsed = JSON.parse(text)
      imports.add('import json')

      return {
        payloadLines: [`payload = json.dumps(${formatPythonValue(parsed, 0)})`],
        payloadVariable: 'payload',
      }
    } catch {
      return {
        payloadLines: [`payload = ${JSON.stringify(text)}`],
        payloadVariable: 'payload',
      }
    }
  }

  return {
    payloadLines: [],
  }
}

/**
 * python/python3
 */
export const pythonPython3: Plugin = {
  target: 'python',
  client: 'python3',
  title: 'http.client',
  generate(request, configuration) {
    const normalizedRequest = normalizeRequest({
      url: 'https://example.com',
      ...request,
    })
    const parsedUrl = parseRequestUrl(normalizedRequest.url)
    const queryString = mergeQueryString(parsedUrl, normalizedRequest.queryString)
    const path = `${parsedUrl.pathname || '/'}${queryString}`
    const headers = normalizedRequest.headers?.reduce<Record<string, string>>((acc, header) => {
      if (!(header.name in acc)) {
        acc[header.name] = header.value
      }

      return acc
    }, {})

    const preparedHeaders = headers ?? {}

    if (normalizedRequest.cookies?.length) {
      const cookieHeader = normalizedRequest.cookies
        .map((cookie) => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`)
        .join('; ')

      if (preparedHeaders.Cookie) {
        preparedHeaders.Cookie = `${preparedHeaders.Cookie}; ${cookieHeader}`
      } else {
        preparedHeaders.Cookie = cookieHeader
      }
    }

    if (configuration?.auth?.username && configuration.auth.password) {
      const authValue = createBasicAuthToken(`${configuration.auth.username}:${configuration.auth.password}`)
      preparedHeaders.Authorization = `Basic ${authValue}`
    }

    const imports = new Set(['import http.client'])
    const setupLines: string[] = []
    const bodyResult = buildRequestBody(normalizedRequest, preparedHeaders, imports)

    setupLines.push(...bodyResult.payloadLines)

    if (Object.keys(preparedHeaders).length) {
      setupLines.push(`headers = ${formatPythonValue(preparedHeaders, 0)}`)
    }

    const requestArguments = [JSON.stringify(normalizedRequest.method), JSON.stringify(path)]

    if (bodyResult.payloadVariable) {
      requestArguments.push(`body=${bodyResult.payloadVariable}`)
    }

    if (Object.keys(preparedHeaders).length) {
      requestArguments.push('headers=headers')
    }

    const requestCall =
      requestArguments.length <= 2
        ? `conn.request(${requestArguments.join(', ')})`
        : `conn.request(\n    ${requestArguments.join(',\n    ')},\n)`

    const lines = [
      ...imports,
      '',
      `conn = http.client.${parsedUrl.protocol === 'https:' ? 'HTTPSConnection' : 'HTTPConnection'}(${JSON.stringify(parsedUrl.host)})`,
      ...(setupLines.length ? ['', ...setupLines] : []),
      '',
      requestCall,
      '',
      'response = conn.getresponse()',
      'print(response.read().decode())',
      '',
      'conn.close()',
    ]

    return lines.join('\n')
  },
}
