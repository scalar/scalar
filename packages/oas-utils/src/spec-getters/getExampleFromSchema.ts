/** Hard limit for rendering circular references */
const MAX_LEVELS_DEEP = 5

const genericExampleValues: Record<string, string> = {
  // 'date-time': '1970-01-01T00:00:00Z',
  'date-time': new Date().toISOString(),
  // 'date': '1970-01-01',
  'date': new Date().toISOString().split('T')[0],
  'email': 'hello@example.com',
  'hostname': 'example.com',
  // https://tools.ietf.org/html/rfc6531#section-3.3
  'idn-email': 'jane.doe@example.com',
  // https://tools.ietf.org/html/rfc5890#section-2.3.2.3
  'idn-hostname': 'example.com',
  'ipv4': '127.0.0.1',
  'ipv6': '51d4:7fab:bfbf:b7d7:b2cb:d4b4:3dad:d998',
  'iri-reference': '/entitiy/1',
  // https://tools.ietf.org/html/rfc3987
  'iri': 'https://example.com/entity/123',
  'json-pointer': '/nested/objects',
  'password': 'super-secret',
  'regex': '/[a-z]/',
  // https://tools.ietf.org/html/draft-handrews-relative-json-pointer-01
  'relative-json-pointer': '1/nested/objects',
  // full-time in https://tools.ietf.org/html/rfc3339#section-5.6
  // 'time': '00:00:00Z',
  'time': new Date().toISOString().split('T')[1].split('.')[0],
  // either a URI or relative-reference https://tools.ietf.org/html/rfc3986#section-4.1
  'uri-reference': '../folder',
  'uri-template': 'https://example.com/{id}',
  'uri': 'https://example.com',
  'uuid': '123e4567-e89b-12d3-a456-426614174000',
  'object-id': '6592008029c8c3e4dc76256c',
}

/**
 * We can use the `format` to generate some random values.
 */
function guessFromFormat(schema: Record<string, any>, fallback: string = '') {
  return genericExampleValues[schema.format] ?? fallback
}

/** Map of all the results */
const resultCache = new WeakMap<Record<string, any>, any>()

/** Store result in the cache, and return the result */
function cache(schema: Record<string, any>, result: unknown) {
  // Avoid unnecessary WeakMap operations for primitive values
  if (typeof result !== 'object' || result === null) {
    return result
  }

  resultCache.set(schema, result)

  return result
}

/**
 * This function takes an OpenAPI schema and generates an example from it
 */
export const getExampleFromSchema = (
  schema: Record<string, any>,
  options?: {
    /**
     * The fallback string for empty string values.
     * @default ''
     */
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
    /**
     * Dynamic values to add to the example.
     */
    variables?: Record<string, any>
    /**
     * Whether to omit empty and optional properties.
     */
    omitEmptyAndOptionalProperties?: boolean
  },
  level: number = 0,
  parentSchema?: Record<string, any>,
  name?: string,
): any => {
  // Check if the result is already cached
  if (resultCache.has(schema)) {
    return resultCache.get(schema)
  }

  // Check whether it’s a circular reference
  if (level === MAX_LEVELS_DEEP + 1) {
    try {
      // Fails if it contains a circular reference
      JSON.stringify(schema)
    } catch {
      return '[Circular Reference]'
    }
  }

  // Sometimes, we just want the structure and no values.
  // But if `emptyString` is  set, we do want to see some values.
  const makeUpRandomData = !!options?.emptyString

  // Check if the property is read-only/write-only
  if (
    (options?.mode === 'write' && schema.readOnly) ||
    (options?.mode === 'read' && schema.writeOnly)
  ) {
    return undefined
  }

  // Use given variables as values
  if (schema['x-variable']) {
    const value = options?.variables?.[schema['x-variable']]

    // Return the value if it’s defined
    if (value !== undefined) {
      // Type-casting
      if (schema.type === 'number' || schema.type === 'integer') {
        return parseInt(value, 10)
      }

      return cache(schema, value)
    }
  }

  // Use the first example, if there’s an array
  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    return cache(schema, schema.examples[0])
  }

  // Use an example, if there’s one
  if (schema.example !== undefined) {
    return cache(schema, schema.example)
  }

  // Use a default value, if there’s one
  if (schema.default !== undefined) {
    return cache(schema, schema.default)
  }

  // enum: [ 'available', 'pending', 'sold' ]
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return cache(schema, schema.enum[0])
  }

  // Check if the property is required
  const isObjectOrArray =
    schema.type === 'object' ||
    schema.type === 'array' ||
    !!schema.allOf?.at?.(0) ||
    !!schema.anyOf?.at?.(0) ||
    !!schema.oneOf?.at?.(0)
  if (!isObjectOrArray && options?.omitEmptyAndOptionalProperties === true) {
    const isRequired =
      schema.required === true ||
      parentSchema?.required === true ||
      parentSchema?.required?.includes(name ?? schema.name)

    if (!isRequired) {
      return undefined
    }
  }

  // Object
  if (schema.type === 'object' || schema.properties !== undefined) {
    const response: Record<string, any> = {}

    // Regular properties
    if (schema.properties !== undefined) {
      for (const propertyName in schema.properties) {
        if (
          Object.prototype.hasOwnProperty.call(schema.properties, propertyName)
        ) {
          const property = schema.properties[propertyName]
          const propertyXmlTagName = options?.xml
            ? property.xml?.name
            : undefined

          response[propertyXmlTagName ?? propertyName] = getExampleFromSchema(
            property,
            options,
            level + 1,
            schema,
            propertyName,
          )

          if (
            typeof response[propertyXmlTagName ?? propertyName] === 'undefined'
          ) {
            delete response[propertyXmlTagName ?? propertyName]
          }
        }
      }
    }

    // Additional properties
    if (schema.additionalProperties !== undefined) {
      const anyTypeIsValid =
        // true
        schema.additionalProperties === true ||
        // or an empty object {}
        (typeof schema.additionalProperties === 'object' &&
          !Object.keys(schema.additionalProperties).length)

      if (anyTypeIsValid) {
        response['ANY_ADDITIONAL_PROPERTY'] = 'anything'
      } else if (schema.additionalProperties !== false) {
        response['ANY_ADDITIONAL_PROPERTY'] = getExampleFromSchema(
          schema.additionalProperties,
          options,
          level + 1,
        )
      }
    }

    if (schema.anyOf !== undefined) {
      Object.assign(
        response,
        getExampleFromSchema(schema.anyOf[0], options, level + 1),
      )
    } else if (schema.oneOf !== undefined) {
      Object.assign(
        response,
        getExampleFromSchema(schema.oneOf[0], options, level + 1),
      )
    } else if (schema.allOf !== undefined) {
      Object.assign(
        response,
        ...schema.allOf
          .map((item: Record<string, any>) =>
            getExampleFromSchema(item, options, level + 1, schema),
          )
          .filter((item: any) => item !== undefined),
      )
    }

    return cache(schema, response)
  }

  // Array
  if (schema.type === 'array' || schema.items !== undefined) {
    const itemsXmlTagName = schema?.items?.xml?.name
    const wrapItems = !!(options?.xml && schema.xml?.wrapped && itemsXmlTagName)

    if (schema.example !== undefined) {
      return cache(
        schema,
        wrapItems ? { [itemsXmlTagName]: schema.example } : schema.example,
      )
    }

    // Check whether the array has a anyOf, oneOf, or allOf rule
    if (schema.items) {
      // First handle allOf separately since it needs special handling
      if (schema.items.allOf) {
        // If the first item is an object type, merge all schemas
        if (schema.items.allOf[0].type === 'object') {
          const mergedExample = getExampleFromSchema(
            { type: 'object', allOf: schema.items.allOf },
            options,
            level + 1,
            schema,
          )

          return cache(
            schema,
            wrapItems
              ? [{ [itemsXmlTagName]: mergedExample }]
              : [mergedExample],
          )
        } else {
          // For non-objects (like strings), collect all examples
          const examples = schema.items.allOf
            .map((item: Record<string, any>) =>
              getExampleFromSchema(item, options, level + 1, schema),
            )
            .filter((item: any) => item !== undefined)

          return cache(
            schema,
            wrapItems
              ? examples.map((example: any) => ({ [itemsXmlTagName]: example }))
              : examples,
          )
        }
      }

      // Handle other rules (anyOf, oneOf)
      const rules = ['anyOf', 'oneOf']
      for (const rule of rules) {
        if (!schema.items[rule]) {
          continue
        }

        const schemas = schema.items[rule].slice(0, 1)
        const exampleFromRule = schemas
          .map((item: Record<string, any>) =>
            getExampleFromSchema(item, options, level + 1, schema),
          )
          .filter((item: any) => item !== undefined)

        return cache(
          schema,
          wrapItems
            ? [{ [itemsXmlTagName]: exampleFromRule }]
            : exampleFromRule,
        )
      }
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
    string: makeUpRandomData
      ? guessFromFormat(schema, options?.emptyString)
      : '',
    boolean: true,
    integer: schema.min ?? 1,
    number: schema.min ?? 1,
    array: [],
  }

  if (schema.type !== undefined && exampleValues[schema.type] !== undefined) {
    return cache(schema, exampleValues[schema.type])
  }

  const discriminateSchema = schema.oneOf || schema.anyOf
  // Check if property has the `oneOf` | `anyOf` key
  if (Array.isArray(discriminateSchema) && discriminateSchema.length > 0) {
    // Get the first item from the `oneOf` | `anyOf` array
    const firstOneOfItem = discriminateSchema[0]

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

    return cache(schema, example)
  }

  // Check if schema is a union type
  if (Array.isArray(schema.type)) {
    // Return null if the type is nullable
    if (schema.type.includes('null')) {
      return null
    }
    // Return an example for the first type in the union
    const exampleValue = exampleValues[schema.type[0]]
    if (exampleValue !== undefined) {
      return cache(schema, exampleValue)
    }
  }

  // Warn if the type is unknown …
  // console.warn(`[getExampleFromSchema] Unknown property type "${schema.type}".`)

  // … and just return null for now.
  return null
}
