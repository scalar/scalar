// responseHelpers.ts
import { parse as jsoncParse } from 'jsonc-parser'

/**
 * Parses the response from a Postman collection.
 */
export function parseResponse(
  responses: any[],
  events: any[],
  responseHeaders: boolean,
) {
  if (responses && Array.isArray(responses) && responses.length > 0) {
    return parseResponseFromExamples(responses, responseHeaders)
  }
  return { responses: parseResponseFromEvents(events) }
}

/**
 * Parses response information from events.
 */
function parseResponseFromEvents(events: any[] = []) {
  let status = 200
  const test = events.find((event) => event.listen === 'test')

  if (test) {
    const script = test.script.exec.join()
    const result = script.match(
      /\.response\.code\)\.to\.eql\((\d{3})\)|\.to\.have\.status\((\d{3})\)/,
    )
    status = result ? result[1] || result[2] : status
  }

  return {
    [status]: {
      description: 'Successful response',
      content: {
        'application/json': {},
      },
    },
  }
}

/**
 * Parses response information from response examples.
 */
function parseResponseFromExamples(responses: any[], responseHeaders: boolean) {
  const statusCodeMap = responses.reduce(
    (
      statusMap: any,
      {
        name,
        code,
        status: description,
        header,
        body,
        _postman_previewlanguage: language,
      },
    ) => {
      if (!statusMap[code]) {
        statusMap[code] = {
          description,
          header,
          bodies: { [language]: [{ name, body }] },
        }
      } else if (!statusMap[code].bodies[language]) {
        statusMap[code].bodies[language] = [{ name, body }]
      } else {
        statusMap[code].bodies[language].push({ name, body })
      }
      return statusMap
    },
    {},
  )

  const parsedResponses = Object.entries(statusCodeMap).reduce(
    (parsed, [status, { description, header, bodies }]) => {
      parsed[status] = {
        description,
        ...parseResponseHeaders(header, responseHeaders),
        ...parseContent(bodies),
      }
      return parsed
    },
    {},
  )

  return { responses: parsedResponses }
}

/**
 * Parses content information from response bodies.
 */
function parseContent(bodiesByLanguage: any) {
  const content = Object.entries(bodiesByLanguage).reduce(
    (accContent, [language, bodies]) => {
      if (language === 'json') {
        accContent['application/json'] = {
          schema: { type: 'object' },
          ...parseExamples(bodies, 'json'),
        }
      } else {
        accContent['text/plain'] = {
          schema: { type: 'string' },
          ...parseExamples(bodies, 'text'),
        }
      }
      return accContent
    },
    {},
  )
  return { content }
}

/**
 * Parses examples from response bodies.
 */
function parseExamples(bodies: any[], language: string) {
  if (bodies.length > 1) {
    return {
      examples: bodies.reduce((examples, { name: summary, body }, i) => {
        examples[`example-${i}`] = {
          summary,
          value: safeSampleParse(body, summary, language),
        }
        return examples
      }, {}),
    }
  }

  const { body, name } = bodies[0]
  return {
    example: safeSampleParse(body, name, language),
  }
}

/**
 * Safely parses the response sample based on the language.
 */
function safeSampleParse(body: string, name: string, language: string) {
  if (language === 'json') {
    const errors = []
    const parsedBody = jsoncParse(body?.trim() ? body : '{}', errors)
    if (errors.length > 0) {
      throw new Error(`Error parsing response example "${name}"`)
    }
    return parsedBody
  }
  return body
}

/**
 * Parses response headers from a header array.
 */
export function parseResponseHeaders(
  headerArray: any[] | undefined,
  responseHeaders: boolean,
): any {
  if (!responseHeaders || !Array.isArray(headerArray)) {
    return {}
  }

  const headers = headerArray.reduce((acc: any, { key, value }: any) => {
    acc[key] = {
      schema: {
        type: inferType(value),
        example: value,
      },
    }
    return acc
  }, {})

  return Object.keys(headers).length > 0 ? { headers } : {}
}

/**
 * Infers the type of a value.
 */
function inferType(value: string): string {
  if (/^\d+$/.test(value)) return 'integer'
  if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(value)) return 'number'
  if (/^(true|false)$/.test(value)) return 'boolean'
  return 'string'
}
