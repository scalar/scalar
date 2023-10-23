/**
 * This function takes a properties object and generates an example response content.
 */
export const getExampleFromSchema = (
  schema: Record<string, any>,
  options?: {
    /**
     * The fallback string for empty string values.
     * @default ''
     **/
    emptyString: string
  },
  level: number = 0,
): any => {
  // Break an infinite loop
  if (level > 10) {
    return null
  }

  if (schema.type === 'array') {
    if (schema.example !== undefined) {
      return schema.example
    }

    if (schema.items.type === 'object') {
      return [getExampleFromSchema(schema.items, options, level + 1)]
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
    if (property.example !== undefined) {
      response[name] = property.example
      return
    }

    // default: 400
    if (property.default !== undefined) {
      response[name] = property.default
      return
    }

    // enum: [ 'available', 'pending', 'sold' ]
    if (property.enum !== undefined) {
      response[name] = property.enum[0]
      return
    }

    // properties: { … }
    if (property.properties !== undefined) {
      response[name] = getExampleFromSchema(property, options, level + 1)

      return
    }

    // items: { properties: { … } }
    if (property.items?.properties !== undefined) {
      const children = getExampleFromSchema(property.items, options, level + 1)

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
      string: options?.emptyString ?? '',
      boolean: true,
      integer: 1,
      number: property.min ?? 0,
      // TODO: Need to check the schema and add a default value
      object: {},
    }

    if (exampleValues[property.type] !== undefined) {
      response[name] = exampleValues[property.type]
      return
    }

    // Warn if the type is unknown …
    console.warn(
      `[getExampleFromSchema] Unknown property type "${property.type}" for property "${name}".`,
    )

    // … and just return null for now.
    response[name] = null
  })

  return response
}
