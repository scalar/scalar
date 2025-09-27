import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ParameterObject,
  RequestBodyObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

export const getParameterContentValue = (parameter: ParameterObject) => {
  if ('content' in parameter && parameter.content) {
    const keys = Object.keys(parameter.content)

    if (keys.length !== 1) {
      return undefined
    }

    return parameter.content[keys[0]!]
  }

  return undefined
}

export const getSchema = (parameter: ParameterObject) => {
  if ('schema' in parameter && parameter.schema) {
    return getResolvedRef(parameter.schema)
  }

  if ('content' in parameter && parameter.content) {
    return getResolvedRef(parameter.content[Object.keys(parameter.content)[0] ?? '']?.schema)
  }

  return undefined
}

export const getExample = (parameter: ParameterObject, exampleKey: string) => {
  if ('examples' in parameter && parameter.examples) {
    return getResolvedRef(parameter.examples[exampleKey])
  }

  const content = getParameterContentValue(parameter)

  if (content?.examples) {
    return getResolvedRef(content.examples[exampleKey])
  }

  return undefined
}

export const getExampleFromBody = (requestBody: RequestBodyObject, contentType: string, exampleKey: string) => {
  return getResolvedRef(requestBody.content[contentType]?.examples?.[exampleKey])
}

/**
 * Checks if the value of a example parameter is the expected type or format
 * Returns an alert message if the value is not in the correct type or format, otherwise false
 */
export const parameterIsInvalid = (schema?: SchemaObject, value?: string | File | null) => {
  return computed(() => {
    if (!schema || !('type' in schema) || typeof value !== 'string') {
      return false
    }

    // Numbers and integers validation
    if (schema.type === 'integer' || schema.type === 'number') {
      const numberValue = Number(value)

      if (isNaN(numberValue)) {
        return 'Value must be a number (e.g., 42.5)'
      }

      if (schema.type === 'integer' && !Number.isInteger(numberValue)) {
        return 'Value must be a whole number (e.g., 42)'
      }

      if (schema.minimum !== undefined && numberValue < schema.minimum) {
        return `Value must be ${schema.minimum} or greater`
      }
      if (schema.maximum !== undefined && numberValue > schema.maximum) {
        return `Value must be ${schema.maximum} or less`
      }
    }

    // string validations
    if (schema.type === 'string' && schema.format) {
      if (schema.format === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) {
        return 'Please enter a valid date in YYYY-MM-DD format (e.g., 2024-03-20)'
      }
      if (
        schema.format === 'date-time' &&
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value ?? '')
      ) {
        return 'Please enter a valid date and time in RFC 3339 format (e.g., 2024-03-20T13:45:30Z)'
      }
      if (schema.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value ?? '')) {
        return 'Please enter a valid email address (e.g., user@example.com)'
      }
      if (schema.format === 'uri' && !/^[a-zA-Z][a-zA-Z0-9+.-]*:.+$/.test(value ?? '')) {
        return 'Please enter a valid URI (e.g., https://example.com)'
      }
    }

    return false
  })
}

/**
 * Checks if a Parameter is required and has an empty value
 */
export const hasEmptyRequiredParameter = (parameter: ParameterObject, exampleKey: string) => {
  const example = getExample(parameter, exampleKey)
  return parameter.required && example?.value
}

export const getFileName = (input: unknown) => {
  if (input instanceof File) {
    return input.name
  }
  return undefined
}
