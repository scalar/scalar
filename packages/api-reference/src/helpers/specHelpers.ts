import type { Operation } from '@scalar/oas-utils'

import type { ContentSchema } from '../types'

type PropertyObject = {
  required?: string[]
  properties: {
    [key: string]: {
      type: string
      description?: string
    }
  }
}

function formatProperty(key: string, obj: PropertyObject): string {
  let output = key
  const isRequired = obj.required && obj.required.includes(key)
  output += isRequired ? ' REQUIRED ' : ' optional '

  // Check existence before accessing
  if (obj.properties[key]) {
    output += obj.properties[key].type
    if (obj.properties[key].description) {
      output += ' ' + obj.properties[key].description
    }
  }

  return output
}

function recursiveLogger(obj: ContentSchema): string[] {
  const results: string[] = ['Body']

  const properties = obj?.schema?.properties
  if (properties) {
    Object.keys(properties).forEach((key) => {
      if (!obj.schema) {
        return
      }

      results.push(formatProperty(key, obj.schema))

      const property = properties[key]
      const isNestedObject = property.type === 'object' && !!property.properties
      if (isNestedObject && property.properties) {
        Object.keys(property.properties).forEach((subKey) => {
          results.push(`${subKey} ${property.properties?.[subKey]?.type}`)
        })
      }
    })
  }

  return results
}

function extractRequestBody(operation: Operation): string[] | boolean {
  try {
    // Using optional chaining here as well
    const body =
      operation?.information?.requestBody?.content?.['application/json']
    if (!body) {
      throw new Error('Body not found')
    }

    return recursiveLogger(body)
  } catch (error) {
    return false
  }
}

export { formatProperty, recursiveLogger, extractRequestBody }
