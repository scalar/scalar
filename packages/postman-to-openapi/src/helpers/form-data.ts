import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { FormParameter } from '@/types'

/** Defines the field as an own property, so a field named `__proto__` is kept instead of replacing the prototype. */
export const setFormFieldSchema = (
  properties: Record<string, OpenAPIV3_1.SchemaObject>,
  key: string,
  property: OpenAPIV3_1.SchemaObject,
): void => {
  Object.defineProperty(properties, key, { value: property, enumerable: true, writable: true, configurable: true })
}

/** Lists a field in `required` once, so repeated Postman keys do not duplicate it. */
export const addRequiredFormField = (required: string[], key: string): void => {
  if (!required.includes(key)) {
    required.push(key)
  }
}

/**
 * Processes form data parameters from a Postman request and converts them into an OpenAPI schema.
 * Handles file uploads, required fields, and descriptions.
 */
export function processFormDataSchema(formdata: FormParameter[]): OpenAPIV3_1.SchemaObject {
  const schema: OpenAPIV3_1.SchemaObject = {
    type: 'object',
    properties: {},
    required: [],
  }

  formdata.forEach((item: FormParameter) => {
    if (!schema.properties) {
      return
    }

    const property: OpenAPIV3_1.SchemaObject = {
      type: 'string',
    }

    // Add description if present, handling both string and object descriptions
    if (item.description) {
      const descriptionText = typeof item.description === 'string' ? item.description : item.description.content || ''

      property.description = descriptionText.replace(' [required]', '')

      // If [required] was present, add to required array
      if (descriptionText.includes('[required]') && schema.required) {
        addRequiredFormField(schema.required, item.key)
      }
    }

    // Handle file type fields
    if (item.type === 'file') {
      property.format = 'binary'
    } else {
      property.example = item.value
    }

    // Add x-scalar-disabled extension if parameter is disabled
    if (item.disabled === true) {
      property['x-scalar-disabled'] = true
    }

    setFormFieldSchema(schema.properties, item.key, property)
  })

  // Only keep required array if it has items
  if (schema.required?.length === 0) {
    delete schema.required
  }

  return schema
}
