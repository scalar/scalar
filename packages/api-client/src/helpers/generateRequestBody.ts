import type { RequestBody } from '../types'

/**
 * This function takes a properties object and generates an example requestBody.
 */
export function getRequestBody(requestBody?: RequestBody) {
  if (!requestBody?.content['application/json']?.schema) return '{}'

  const body = generateRequestBody(
    requestBody.content['application/json']?.schema,
    0,
    false,
  )

  return JSON.stringify(body || {}, null, 2)
}

/**
 * This function takes a properties object and generates an example requestBody.
 */
export const generateRequestBody = (
  schema: Record<string, any>,
  level: number = 0,
  includeExample: boolean = true,
) => {
  // Break an infinite loop
  if (level > 10) {
    return null
  }

  if (schema.type === 'array') {
    if (schema.example !== undefined && includeExample) {
      return schema.example
    }

    return []
  }

  const response: Record<string, any> | any[] = {}

  if (typeof schema.properties !== 'object') {
    return response
  }

  Object.keys(schema.properties).forEach((name: string) => {
    const property = schema.properties[name]

    // example: 'Dogs'
    if (property.example !== undefined && includeExample) {
      response[name] = property.example
      return
    }

    // enum: [ 'available', 'pending', 'sold' ]
    if (property.enum !== undefined && includeExample) {
      response[name] = property.enum[0]
      return
    }

    // properties: { … }
    if (property.properties !== undefined) {
      response[name] = generateRequestBody(property, level + 1, includeExample)

      return
    }

    // items: { properties: { … } }
    if (property.items?.properties !== undefined) {
      const children = generateRequestBody(
        property.items,
        level + 1,
        includeExample,
      )

      if (property?.type === 'array') {
        response[name] = [children]
      } else {
        response[name] = null
      }

      return
    }

    // Set an example value based on the type
    const exampleValues: Record<string, any> = {
      // TODO: Need to check the schema and add a default value
      array: [],
      string: '',
      boolean: true,
      integer: 1,
      number: 0,
      // TODO: Need to check the schema and add a default value
      object: {},
    }

    if (exampleValues[property.type] !== undefined) {
      response[name] = exampleValues[property.type]
      return
    }

    // Warn if the type is unknown …
    console.warn(
      `[generateResponseContent] Unknown property type "${property.type}" for property "${name}".`,
    )

    // … and just return null for now.
    response[name] = null
  })

  return response
}
