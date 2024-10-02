// requestAndBodyHelpers.ts
import { parse } from 'jsonc-parser'

/**
 * Parses the request body based on the method and body mode.
 */
export function parseBody(body: any = {}, method: string) {
  if (['GET', 'DELETE'].includes(method)) return {}

  const { mode, raw, options = { raw } } = body

  if (mode === 'raw') {
    return parseRawBody(options, raw)
  }

  if (mode === 'file') {
    return {
      requestBody: {
        content: {
          'text/plain': {},
        },
      },
    }
  }

  if (mode === 'formdata') {
    return {
      requestBody: {
        content: {
          'multipart/form-data': parseFormData(body.formdata),
        },
      },
    }
  }

  if (mode === 'urlencoded') {
    return {
      requestBody: {
        content: {
          'application/x-www-form-urlencoded': parseFormData(body.urlencoded),
        },
      },
    }
  }

  return {}
}

/**
 * Parses the raw body content based on its language.
 */
function parseRawBody(options: any, raw: string) {
  const { raw: { language } = {} } = options

  if (language === 'json') {
    return {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              example: safelyParseJSON(raw),
            },
          },
        },
      },
    }
  }

  if (language === 'text') {
    return {
      requestBody: {
        content: {
          'text/plain': {
            schema: {
              type: 'string',
              example: raw,
            },
          },
        },
      },
    }
  }

  return {
    requestBody: {
      content: {
        '*/*': {
          schema: {
            type: 'string',
            example: JSON.stringify(raw),
          },
        },
      },
    },
  }
}

/**
 * Parses form data into an OpenAPI-compatible format.
 */
function parseFormData(data: any[]) {
  return data.reduce(
    (obj, { key, type, description, value }) => {
      const { schema } = obj

      if (isRequired(description)) {
        schema.required = schema.required || []
        schema.required.push(key)
      }

      schema.properties = schema.properties || {}
      schema.properties[key] = {
        type: inferType(value),
        ...(description
          ? { description: description.replace(/ ?\[required\] ?/gi, '') }
          : {}),
        ...(value ? { example: value } : {}),
        ...(type === 'file' ? { format: 'binary' } : {}),
      }

      return obj
    },
    {
      schema: {
        type: 'object',
      },
    },
  )
}

/**
 * Safely parses a JSON string and returns the result or the original string if parsing fails.
 */
function safelyParseJSON(raw: string) {
  if (!raw) return ''
  const errors = []
  const result = parse(raw, errors)
  return errors.length > 0 ? raw : result
}

/**
 * Checks if a text indicates that a field is required.
 */
function isRequired(text: string) {
  return /\[required\]/gi.test(text)
}

/**
 * Infers the type of a given value.
 */
function inferType(value: string): string {
  if (/^\d+$/.test(value)) return 'integer'
  if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(value)) return 'number'
  if (/^(true|false)$/i.test(value)) return 'boolean'
  return 'string'
}
