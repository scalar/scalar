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

  if (schema.type === 'string') {
    if (schema.example !== undefined) {
      return schema.example
    }

    return options?.emptyString ?? ''
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
    const itemsXmlTagName = property?.items?.xml?.name
    const wrapItems = options?.xml && property.xml?.wrapped && itemsXmlTagName
    const itemsExample = property.items
      ? getExampleFromSchema(property.items, options, level + 1)
      : []
    const formattedItemsExample = !itemsExample
      ? []
      : Array.isArray(itemsExample)
      ? itemsExample
      : [itemsExample]

    const exampleValues: Record<string, any> = {
      array: wrapItems
        ? { [itemsXmlTagName]: formattedItemsExample }
        : formattedItemsExample,
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

    // Check if property has the `oneOf` key
    if (Array.isArray(property.oneOf)) {
      // Get the first item from the `oneOf` array
      const firstOneOfItem = property.oneOf[0]

      // Return an example for the first item
      if (exampleValues[firstOneOfItem.type] !== undefined) {
        response[xmlTagName ?? name] = getExampleFromSchema(
          firstOneOfItem,
          options,
          level + 1,
        )
        return
      }
    }

    // Check if property has the `allOf` key
    if (Array.isArray(property.allOf)) {
      // Loop through all `allOf` schemas
      property.allOf.forEach((allOfItem: Record<string, any>) => {
        // Return an example from the schema
        const newExample = getExampleFromSchema(allOfItem, options, level + 1)

        // Merge or overwrite the example
        response[xmlTagName ?? name] =
          typeof newExample === 'object'
            ? {
                ...(response[xmlTagName ?? name] ?? {}),
                ...newExample,
              }
            : newExample
      })

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
