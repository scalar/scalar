export function normalizeSchema(schema: any): any {
  if (!schema) {
    return schema
  }
  // Normalize oneOf, anyOf, allOf with a single item
  for (const rule of ['oneOf', 'anyOf', 'allOf']) {
    if (Array.isArray(schema[rule])) {
      const { [rule]: _, ...value } = schema
      value[rule] = schema[rule].map(normalizeSchema)

      if (value[rule].length === 1) {
        Object.assign(value, value[rule][0])
        delete value[rule]
        return value
      }
      return value
    }
  }
  // Normalize single-value enums to const
  if (Array.isArray(schema.enum) && schema.enum.length == 1) {
    const { enum: _, ...value } = schema
    value.const = schema.enum[0]
    return value
  }
  // Recurse into object properties
  if (schema.type === 'object') {
    const value = { ...schema }
    for (const key of Object.keys(value.properties)) {
      value.properties[key] = normalizeSchema(value.properties[key])
    }
    return value
  }
  // Recurse into array items schema
  if (schema.type === 'array') {
    return { ...schema, items: normalizeSchema(schema.items) }
  }
  return schema
}
