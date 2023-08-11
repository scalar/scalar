export const getResponseFromProperties = (properties: Record<string, any>) => {
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
      response[name] = getResponseFromProperties(property.properties)

      return
    }

    // items: { properties: { … } }
    if (property.items?.properties !== undefined) {
      const children = getResponseFromProperties(property.items.properties)

      if (property?.type === 'array') {
        response[name] = [children]
      } else {
        response[name] = null
      }

      return
    }

    if (property.type === 'array') {
      response[name] = []
      return
    }

    response[name] = null
  })

  return response
}
