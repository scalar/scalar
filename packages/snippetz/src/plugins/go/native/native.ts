import type { Plugin } from '@scalar/types/snippetz'

import { buildQueryString } from '@/libs/http'

type HeaderPair = {
  name: string
  value: string
}

type BodySection = {
  imports: Set<string>
  setupLines: string[]
  requestBody: string
  needsMultipartContentTypeHeader: boolean
}

const goString = (value: string): string => JSON.stringify(value)

const normalizeMethod = (method?: string): string => (method || 'GET').toUpperCase()

const normalizeUrl = (url: string): string => {
  if (!url) {
    return ''
  }

  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.pathname === '/' && !parsedUrl.search && !parsedUrl.hash) {
      return parsedUrl.origin
    }

    return parsedUrl.toString()
  } catch {
    return url
  }
}

const joinUrlAndQuery = (url: string, queryString?: Array<{ name: string; value: string }>): string => {
  const query = buildQueryString(queryString)

  if (!query) {
    return url
  }

  if (!url) {
    return query
  }

  return `${url}${url.includes('?') ? '&' : '?'}${query.slice(1)}`
}

const collectHeaders = (
  headers?: Array<{ name: string; value: string }>,
  cookies?: Array<{ name: string; value: string }>,
): HeaderPair[] => {
  const dedupedHeaders = new Map<string, string>()

  headers?.forEach((header) => {
    if (header.name) {
      dedupedHeaders.set(header.name, header.value ?? '')
    }
  })

  if (cookies?.length) {
    const cookieHeader = cookies
      .map((cookie) => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`)
      .join('; ')
    dedupedHeaders.set('Cookie', cookieHeader)
  }

  return Array.from(dedupedHeaders.entries()).map(([name, value]) => ({ name, value }))
}

const toPrettyJson = (text?: string): string => {
  if (text === undefined) {
    return ''
  }

  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

const buildBodySection = (postData?: {
  mimeType?: string
  text?: string
  params?: Array<{ name: string; value?: string; fileName?: string }>
}): BodySection => {
  const imports = new Set<string>()

  if (!postData) {
    return {
      imports,
      setupLines: [],
      requestBody: 'nil',
      needsMultipartContentTypeHeader: false,
    }
  }

  if (postData.mimeType === 'application/x-www-form-urlencoded' && postData.params?.length) {
    imports.add('net/url')
    imports.add('strings')

    return {
      imports,
      setupLines: ['postData := url.Values{}', ...postData.params.map((param) => `postData.Set(${goString(param.name)}, ${goString(param.value ?? '')})`)],
      requestBody: 'strings.NewReader(postData.Encode())',
      needsMultipartContentTypeHeader: false,
    }
  }

  if (postData.mimeType === 'multipart/form-data' && postData.params?.length) {
    imports.add('bytes')
    imports.add('mime/multipart')

    const setupLines: string[] = ['payload := &bytes.Buffer{}', 'writer := multipart.NewWriter(payload)']
    const hasFile = postData.params.some((param) => param.fileName !== undefined)

    if (hasFile) {
      imports.add('os')
      imports.add('io')
    }

    postData.params.forEach((param) => {
      setupLines.push('')

      if (param.fileName !== undefined) {
        setupLines.push(`part, _ := writer.CreateFormFile(${goString(param.name)}, ${goString(param.fileName)})`)
        setupLines.push('')
        setupLines.push(`f, _ := os.Open(${goString(param.fileName)})`)
        setupLines.push('defer f.Close()')
        setupLines.push('')
        setupLines.push('_, _ = io.Copy(part, f)')
      } else {
        setupLines.push(`_ = writer.WriteField(${goString(param.name)}, ${goString(param.value ?? '')})`)
      }
    })

    setupLines.push('writer.Close()')

    return {
      imports,
      setupLines,
      requestBody: 'payload',
      needsMultipartContentTypeHeader: true,
    }
  }

  imports.add('strings')
  const payload = postData.mimeType === 'application/json' ? toPrettyJson(postData.text) : postData.text ?? ''

  return {
    imports,
    setupLines: [`payload := strings.NewReader(${goString(payload)})`],
    requestBody: 'payload',
    needsMultipartContentTypeHeader: false,
  }
}

const buildImports = (bodyImports: Set<string>): string[] => {
  return Array.from(new Set(['fmt', 'io', 'net/http', ...bodyImports])).sort()
}

/**
 * go/native
 */
export const goNative: Plugin = {
  target: 'go',
  client: 'native',
  title: 'NewRequest',
  generate(request, configuration) {
    if (!request) {
      return ''
    }

    const method = normalizeMethod(request.method)
    const fullUrl = normalizeUrl(joinUrlAndQuery(request.url ?? '', request.queryString))
    const headers = collectHeaders(request.headers, request.cookies)
    const bodySection = buildBodySection(request.postData)
    const imports = buildImports(bodySection.imports)

    const lines: string[] = [
      'package main',
      '',
      'import (',
      ...imports.map((entry) => `\t${goString(entry)}`),
      ')',
      '',
      'func main() {',
      `\turl := ${goString(fullUrl)}`,
      '',
      ...bodySection.setupLines.map((line) => (line ? `\t${line}` : '')),
    ]

    if (bodySection.setupLines.length) {
      lines.push('')
    }

    lines.push(`\treq, _ := http.NewRequest(${goString(method)}, url, ${bodySection.requestBody})`)
    lines.push('')

    if (bodySection.needsMultipartContentTypeHeader) {
      lines.push('\treq.Header.Set("Content-Type", writer.FormDataContentType())')
    }

    if (configuration?.auth?.username && configuration?.auth?.password) {
      lines.push(`\treq.SetBasicAuth(${goString(configuration.auth.username)}, ${goString(configuration.auth.password)})`)
    }

    headers.forEach((header) => {
      lines.push(`\treq.Header.Add(${goString(header.name)}, ${goString(header.value)})`)
    })

    if (bodySection.needsMultipartContentTypeHeader || headers.length || (configuration?.auth?.username && configuration.auth.password)) {
      lines.push('')
    }

    lines.push('\tres, _ := http.DefaultClient.Do(req)')
    lines.push('')
    lines.push('\tdefer res.Body.Close()')
    lines.push('\tbody, _ := io.ReadAll(res.Body)')
    lines.push('')
    lines.push('\tfmt.Println(res)')
    lines.push('\tfmt.Println(string(body))')
    lines.push('')
    lines.push('}')

    return lines.join('\n')
  },
}
