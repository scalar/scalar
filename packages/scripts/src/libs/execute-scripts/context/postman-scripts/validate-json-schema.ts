export const validateJsonSchema = (data: any, schema: any): boolean => {
  if (schema.type === 'object') {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error(`Expected object but got ${typeof data}`)
    }

    if (schema.required) {
      for (const prop of schema.required) {
        if (!(prop in data)) {
          throw new Error(`Missing required property: ${prop}`)
        }
      }
    }

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries<any>(schema.properties)) {
        if (key in data) {
          validateJsonSchema(data[key], propSchema)
        }
      }
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(data)) {
      throw new Error(`Expected array but got ${typeof data}`)
    }
    if (schema.items) {
      for (const item of data) {
        validateJsonSchema(item, schema.items)
      }
    }
  } else if (schema.type === 'string') {
    if (typeof data !== 'string') {
      throw new Error(`Expected string but got ${typeof data}`)
    }
  } else if (schema.type === 'number') {
    if (typeof data !== 'number') {
      throw new Error(`Expected number but got ${typeof data}`)
    }
  } else if (schema.type === 'boolean') {
    if (typeof data !== 'boolean') {
      throw new Error(`Expected boolean but got ${typeof data}`)
    }
  }
  return true
}
