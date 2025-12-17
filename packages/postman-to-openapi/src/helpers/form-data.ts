import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { FormParameter } from '../types'

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
      if (descriptionText.includes('[required]')) {
        schema.required?.push(item.key)
      }
    }

    // Handle file type fields
    if (item.type === 'file') {
      property.format = 'binary'
    } else {
      property.example = item.value
    }

    schema.properties[item.key] = property
  })

  // Only keep required array if it has items
  if (schema.required?.length === 0) {
    delete schema.required
  }

  return schema
}
