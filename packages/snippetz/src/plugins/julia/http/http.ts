import type { HarRequest, Plugin, PluginConfiguration } from '@scalar/types/snippetz'

import { normalizeMethod } from '@/libs/http'
import { formatCollection, formatDict, formatPairVector, formatValue, indent, wrapInDoubleQuotes } from '@/libs/julia'

/** Verbs HTTP.jl exposes as `HTTP.<verb>(url, headers, body)` helpers. */
const VERBS_WITH_BODY = ['POST', 'PUT', 'PATCH', 'DELETE', 'QUERY']

/** Verbs HTTP.jl exposes as `HTTP.<verb>(url, headers)` helpers, without a body argument. */
const VERBS_WITHOUT_BODY = ['GET', 'HEAD', 'OPTIONS']

/** The indentation level of the arguments inside a multi-line request call. */
const ARGUMENT_LEVEL = 1

type Body = {
  /** The Julia expression for the request body. */
  value: string
  /** Additional packages the body expression needs. */
  packages: string[]
  /**
   * Whether HTTP.jl generates the `Content-Type` itself. `HTTP.Form` picks its own
   * multipart boundary, so passing the one from the request would break the body.
   */
  omitContentType: boolean
}

/**
 * Builds the Julia expression for a multipart part, using `HTTP.Multipart` for
 * file uploads and a plain string for everything else.
 */
const formatMultipartPart = (param: {
  name: string
  value?: string
  fileName?: string
  contentType?: string
}): string => {
  const name = wrapInDoubleQuotes(param.name)

  if (param.fileName === undefined) {
    return `${name} => ${wrapInDoubleQuotes(param.value ?? '')}`
  }

  const file = wrapInDoubleQuotes(param.fileName)
  const args = [file, `open(${file})`]

  if (param.contentType) {
    args.push(wrapInDoubleQuotes(param.contentType))
  }

  return `${name} => HTTP.Multipart(${args.join(', ')})`
}

/**
 * Turns the request body into a Julia expression.
 *
 * JSON payloads are rendered as `Dict`s so they can be edited without touching
 * the raw JSON, form bodies use the native types HTTP.jl knows how to encode
 * (`Dict` for url-encoded, `HTTP.Form` for multipart) and anything else is sent
 * as a plain string.
 */
const getBody = (postData: HarRequest['postData']): Body | undefined => {
  if (!postData) {
    return undefined
  }

  const { mimeType, text, params } = postData

  if (mimeType === 'application/json' && text) {
    try {
      return {
        value: `JSON.json(${formatValue(JSON.parse(text), ARGUMENT_LEVEL)})`,
        packages: ['JSON'],
        omitContentType: false,
      }
    } catch {
      // Not valid JSON, fall through and send the raw text
    }
  }

  if (mimeType === 'multipart/form-data' && params?.length) {
    return {
      value: formatCollection(params.map(formatMultipartPart), 'HTTP.Form([', '])', ARGUMENT_LEVEL),
      packages: [],
      omitContentType: true,
    }
  }

  if (mimeType === 'application/x-www-form-urlencoded' && params?.length) {
    return {
      value: formatDict(
        params.map((param) => ({ name: param.name, value: param.value ?? '' })),
        ARGUMENT_LEVEL,
      ),
      packages: [],
      omitContentType: false,
    }
  }

  if (!text) {
    return undefined
  }

  return { value: wrapInDoubleQuotes(text), packages: [], omitContentType: false }
}

/**
 * Assembles the request call, keeping it on a single line when the URL is the
 * only argument and spreading it over multiple lines otherwise.
 */
const buildCall = (callee: string, required: string[], optional: string[], keywords: string[]): string[] => {
  const positional = [...required, ...optional]

  if (optional.length === 0 && keywords.length === 0) {
    return [`response = ${callee}(${positional.join(', ')})`]
  }

  const lines = [`response = ${callee}(`]

  positional.forEach((argument, index) => {
    const isLast = index === positional.length - 1
    const separator = isLast ? (keywords.length ? ';' : '') : ','

    lines.push(`${indent(ARGUMENT_LEVEL, argument)}${separator}`)
  })

  keywords.forEach((keyword, index) => {
    lines.push(`${indent(ARGUMENT_LEVEL, keyword)}${index === keywords.length - 1 ? '' : ','}`)
  })

  lines.push(')')

  return lines
}

/**
 * julia/http
 */
export const juliaHttp: Plugin = {
  target: 'julia',
  client: 'http',
  title: 'HTTP.jl',
  generate(request?: Partial<HarRequest>, configuration?: PluginConfiguration): string {
    const normalizedRequest = {
      url: 'https://example.com',
      ...request,
    }

    const method = normalizeMethod(normalizedRequest.method)
    const body = getBody(normalizedRequest.postData)

    // Deduplicate headers, dropping the content type when HTTP.jl generates it
    const headers = new Map<string, string>()

    for (const header of normalizedRequest.headers ?? []) {
      if (!header.name || (body?.omitContentType && header.name.toLowerCase() === 'content-type')) {
        continue
      }

      headers.set(header.name, header.value ?? '')
    }

    const verb = [...VERBS_WITH_BODY, ...VERBS_WITHOUT_BODY].includes(method) ? method.toLowerCase() : undefined

    const callee = verb ? `HTTP.${verb}` : 'HTTP.request'
    const url = wrapInDoubleQuotes(normalizedRequest.url)
    const required = verb ? [url] : [wrapInDoubleQuotes(method), url]

    const optional: string[] = []
    const keywords: string[] = []

    if (headers.size) {
      optional.push(
        formatPairVector(
          [...headers].map(([name, value]) => ({ name, value })),
          ARGUMENT_LEVEL,
        ),
      )
    }

    if (body) {
      // The first positional argument after the URL is always the headers, both
      // for the verb helpers (`HTTP.post(url, headers, body)`) and for
      // `HTTP.request(method, url, headers, body)`. A body passed positionally
      // without headers in front of it would therefore be read as the headers
      // argument, so it has to go through the `body =` keyword instead.
      // `HTTP.get`, `HTTP.head` and `HTTP.options` never take a positional body.
      if (VERBS_WITHOUT_BODY.includes(method) || headers.size === 0) {
        keywords.push(`body = ${body.value}`)
      } else {
        optional.push(body.value)
      }
    }

    if (normalizedRequest.queryString?.length) {
      keywords.push(`query = ${formatPairVector(normalizedRequest.queryString, ARGUMENT_LEVEL)}`)
    }

    if (normalizedRequest.cookies?.length) {
      keywords.push(`cookies = ${formatDict(normalizedRequest.cookies, ARGUMENT_LEVEL)}`)
    }

    if (configuration?.auth?.username && configuration?.auth?.password) {
      const { username, password } = configuration.auth

      keywords.push(`basicauth = (${wrapInDoubleQuotes(username)}, ${wrapInDoubleQuotes(password)})`)
    }

    const packages = ['HTTP', ...(body?.packages ?? [])]

    return [
      ...packages.map((name) => `using ${name}`),
      '',
      ...buildCall(callee, required, optional, keywords),
      '',
      'println(String(response.body))',
    ].join('\n')
  },
}
