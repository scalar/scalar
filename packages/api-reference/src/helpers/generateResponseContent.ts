/**
 * This function takes a properties object and generates an example response content.
 */
export const generateResponseContent = (schema: Record<string, any>) => {
  if (schema.type === 'array') {
    if (schema.example !== undefined) {
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
    if (property.example !== undefined) {
      response[name] = property.example
      return
    }

    // enum: [ 'available', 'pending', 'sold' ]
    if (property.enum !== undefined) {
      response[name] = property.enum[0]
      return
    }

    // properties: { … }
    if (property.properties !== undefined) {
      response[name] = generateResponseContent(property)

      return
    }

    // items: { properties: { … } }
    if (property.items?.properties !== undefined) {
      const children = generateResponseContent(property.items)

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
