import { readonly } from 'vue'

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
    /**
     * Whether to show read-only/write-only properties. Otherwise all properties are shown.
     * @default undefined
     */
    mode?: 'read' | 'write'
  },
  level: number = 0,
): any => {
  // Break an infinite loop
  if (level > 10) {
    return null
  }

  // Check if the property is read-only
  if (options?.mode === 'write' && schema.readOnly) {
    return undefined
  }

  // Check if the property is write-only
  if (options?.mode === 'read' && schema.writeOnly) {
    return undefined
  }

  // Use an example, if there’s one
  if (schema.example !== undefined) {
    return schema.example
  }

  // Use a default value, if there’s one
  if (schema.default !== undefined) {
    return schema.default
  }

  // enum: [ 'available', 'pending', 'sold' ]
  if (schema.enum !== undefined) {
    return schema.enum[0]
  }

  // Object
  if (schema.type === 'object') {
    const response: Record<string, any> = {}

    if (schema.properties !== undefined) {
      Object.keys(schema.properties).forEach((name: string) => {
        const property = schema.properties[name]
        const propertyXmlTagName = options?.xml ? property.xml?.name : undefined

        response[propertyXmlTagName ?? name] = getExampleFromSchema(
          property,
          options,
          level + 1,
        )
      })
    }

    return response
  }

  // Array
  if (schema.type === 'array') {
    const itemsXmlTagName = schema?.items?.xml?.name
    const wrapItems = !!(options?.xml && schema.xml?.wrapped && itemsXmlTagName)

    if (schema.example !== undefined) {
      return wrapItems ? { [itemsXmlTagName]: schema.example } : schema.example
    }

    if (schema.items?.type) {
      const exampleFromSchema = getExampleFromSchema(
        schema.items,
        options,
        level + 1,
      )

      return wrapItems
        ? [{ [itemsXmlTagName]: exampleFromSchema }]
        : [exampleFromSchema]
    }

    return []
  }

  const exampleValues: Record<any, any> = {
    string: options?.emptyString ?? '',
    boolean: true,
    integer: schema.min ?? 1,
    number: schema.min ?? 1,
    array: [],
  }

  if (schema.type !== undefined && exampleValues[schema.type] !== undefined) {
    return exampleValues[schema.type]
  }

  // Check if property has the `oneOf` key
  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    // Get the first item from the `oneOf` array
    const firstOneOfItem = schema.oneOf[0]

    // Return an example for the first item
    return getExampleFromSchema(firstOneOfItem, options, level + 1)
  }

  // Check if schema has the `allOf` key
  if (Array.isArray(schema.allOf)) {
    let example: any = null

    // Loop through all `allOf` schemas
    schema.allOf.forEach((allOfItem: Record<string, any>) => {
      // Return an example from the schema
      const newExample = getExampleFromSchema(allOfItem, options, level + 1)

      // Merge or overwrite the example
      example =
        typeof newExample === 'object' && typeof example === 'object'
          ? {
              ...(example ?? {}),
              ...newExample,
            }
          : Array.isArray(newExample) && Array.isArray(example)
          ? [...(example ?? {}), ...newExample]
          : newExample
    })

    return example
  }

  // Warn if the type is unknown …
  console.warn(`[getExampleFromSchema] Unknown property type "${schema.type}".`)

  // … and just return null for now.
  return null
}
