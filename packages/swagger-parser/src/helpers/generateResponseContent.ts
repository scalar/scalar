/**
 * This function takes a properties object and generates an example response content.
 */
export const generateResponseContent = (properties: Record<string, any>) => {
  const response: Record<string, any> = {}

  if (typeof properties !== 'object') {
    return response
  }

  Object.keys(properties).forEach((name: string) => {
    const property = properties[name]

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
      response[name] = generateResponseContent(property.properties)

      return
    }

    // items: { properties: { … } }
    if (property.items?.properties !== undefined) {
      const children = generateResponseContent(property.items.properties)

      if (property?.type === 'array') {
        response[name] = [children]
      } else {
        response[name] = null
      }

      return
    }

    // Set an example value based on the type
    const exampleValues: Record<string, any> = {
      array: [],
      string: '',
      boolean: true,
      integer: 1,
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
