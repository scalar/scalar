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
    emptyString?: string
    /**
     * Whether to use the XML tag names as keys
     * @default false
     */
    xml?: boolean
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
    const xmlTagName = options?.xml ? property.xml?.name : undefined

    // example: 'Dogs'
    if (property.example !== undefined) {
      response[xmlTagName ?? name] = property.example
      return
    }

    // default: 400
    if (property.default !== undefined) {
      response[xmlTagName ?? name] = property.default
      return
    }

    // enum: [ 'available', 'pending', 'sold' ]
    if (property.enum !== undefined) {
      response[xmlTagName ?? name] = property.enum[0]
      return
    }

    // properties: { … }
    if (property.properties !== undefined) {
      response[xmlTagName ?? name] = getExampleFromSchema(
        property,
        options,
        level + 1,
      )

      return
    }

    // items: { properties: { … } }
    if (property.items?.properties !== undefined) {
      const children = getExampleFromSchema(property.items, options, level + 1)

      if (property?.type === 'array') {
        response[xmlTagName ?? name] = [children]
      } else {
        response[xmlTagName ?? name] = null
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
      response[xmlTagName ?? name] = exampleValues[property.type]
      return
    }

    // Warn if the type is unknown …
    console.warn(
      `[getExampleFromSchema] Unknown property type "${property.type}" for property "${name}".`,
    )

    // … and just return null for now.
    response[xmlTagName ?? name] = null
  })

  return response
}
