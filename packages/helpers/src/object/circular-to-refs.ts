/** OpenAPI component types that can hold circular references */
type ComponentType =
  | 'schemas'
  | 'responses'
  | 'parameters'
  | 'examples'
  | 'requestBodies'
  | 'headers'
  | 'securitySchemes'
  | 'links'
  | 'callbacks'
  | 'pathItems'

/** Maps component type to its naming prefix */
const COMPONENT_PREFIXES: Record<ComponentType, string> = {
  schemas: 'CircularSchema',
  responses: 'CircularResponse',
  parameters: 'CircularParameter',
  examples: 'CircularExample',
  requestBodies: 'CircularRequestBody',
  headers: 'CircularHeader',
  securitySchemes: 'CircularSecurityScheme',
  links: 'CircularLink',
  callbacks: 'CircularCallback',
  pathItems: 'CircularPathItem',
}

/**
 * Updates the context based on the current key being traversed.
 * Returns the new context if the key changes it, otherwise returns null to inherit parent context.
 */
const getContextFromKey = (key: string): ComponentType | null => {
  switch (key) {
    case 'responses':
      return 'responses'
    case 'parameters':
      return 'parameters'
    case 'requestBody':
      return 'requestBodies'
    case 'headers':
      return 'headers'
    case 'examples':
      return 'examples'
    case 'links':
      return 'links'
    case 'callbacks':
      return 'callbacks'
    case 'securitySchemes':
      return 'securitySchemes'
    case 'schema':
    case 'items':
    case 'additionalProperties':
    case 'allOf':
    case 'oneOf':
    case 'anyOf':
    case 'not':
    case 'properties':
    case 'patternProperties':
      return 'schemas'
    default:
      // For path items (HTTP methods)
      if (['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(key)) {
        return 'pathItems'
      }
      // Callback path expressions (keys containing '{$') have pathItem values
      if (key.includes('{$') || key.startsWith('/')) {
        return 'pathItems'
      }
      // Return null to inherit parent context
      return null
  }
}

/**
 * Detects and breaks circular JavaScript object references in a document tree.
 *
 * The legacy API client (via openapi-parser's dereference) resolved all $refs
 * inline: it deleted the $ref key and copied every property from the resolved
 * target directly onto the object. For self-referencing or mutually-referencing
 * schemas this created circular JS object graphs that cannot be serialised to
 * JSON or validated by TypeBox.
 *
 * This function walks the object tree depth-first, detects cycles via reference
 * identity, extracts each circular component into the appropriate components section
 * (schemas, responses, parameters, etc.) with a generated name, and replaces ALL
 * occurrences (both first and back-references) with **only** `$ref` and `$ref-value`
 * (no extra schema properties) so that TypeBox's Value.Cast picks the reference
 * branch of the schemaOrReference union.
 *
 * Returns a new (deep-cloned) document with all cycles replaced. When no
 * circular references exist the output is structurally identical to the input.
 *
 * @param document - The document to process
 * @param extraRefSiblings - Extra properties to add as siblings to the $ref, we use
 *                   it to add a '$ref-value' as our typebox schema requires it
 */
export const circularToRefs = (
  document: Record<string, unknown>,
  extraProps: Record<string, unknown> = {},
): Record<string, unknown> => {
  /** Maps each circular JS object to its component type and name */
  const circularInfo = new Map<object, { type: ComponentType; name: string }>()
  /** Stores the processed (cycle-free) definitions keyed by component type and name */
  const extractedComponents = new Map<ComponentType, Map<string, unknown>>()
  /** Counter per component type for unique naming */
  const counters: Record<ComponentType, number> = {
    schemas: 0,
    responses: 0,
    parameters: 0,
    examples: 0,
    requestBodies: 0,
    headers: 0,
    securitySchemes: 0,
    links: 0,
    callbacks: 0,
    pathItems: 0,
  }

  /** Maps objects to their context (component type) when first encountered */
  const objectContext = new Map<object, ComponentType>()

  /**
   * Phase 1: Walk the tree to identify all circular objects.
   * We don't modify anything yet, just mark objects that participate in cycles.
   * Context is passed down and updated when we enter specific OpenAPI keys.
   */
  const identifyCircular = (value: unknown, ancestors: Set<object>, context: ComponentType): void => {
    if (value === null || typeof value !== 'object') {
      return
    }

    const obj = value as Record<string, unknown>

    // Cycle detected — mark this object as circular using its ORIGINAL context
    if (ancestors.has(obj)) {
      if (!circularInfo.has(obj)) {
        // Use the context from when we first saw this object
        const componentType = objectContext.get(obj) ?? context
        counters[componentType]++
        const name = `${COMPONENT_PREFIXES[componentType]}${counters[componentType]}`
        circularInfo.set(obj, { type: componentType, name })
      }
      return
    }

    // Record the context when we first encounter this object
    if (!objectContext.has(obj)) {
      objectContext.set(obj, context)
    }

    ancestors.add(obj)

    if (Array.isArray(obj)) {
      for (const item of obj) {
        identifyCircular(item, ancestors, context)
      }
    } else {
      for (const [key, v] of Object.entries(obj)) {
        // Update context if this key changes it, otherwise inherit current context
        const newContext = getContextFromKey(key) ?? context
        identifyCircular(v, ancestors, newContext)
      }
    }

    ancestors.delete(obj)
  }

  /**
   * Phase 2: Walk the tree and create a deep clone with all circular objects
   * replaced by $refs. For circular objects, we also create the extracted component.
   */
  const cloneWithRefs = (value: unknown, visited: Set<object>, context: ComponentType): unknown => {
    if (value === null || typeof value !== 'object') {
      return value
    }

    const obj = value as Record<string, unknown>

    // If this object is circular and we've already visited it in this path,
    // return a $ref to prevent infinite recursion
    if (visited.has(obj)) {
      const info = circularInfo.get(obj)
      if (info) {
        return {
          $ref: `#/components/${info.type}/${info.name}`,
          ...extraProps,
        }
      }
    }

    // If this object is circular, return a $ref and process its content separately
    const info = circularInfo.get(obj)
    if (info) {
      // Process the circular object's content (for extraction to components)
      if (!extractedComponents.has(info.type)) {
        extractedComponents.set(info.type, new Map())
      }

      // Only process if we haven't already
      if (!extractedComponents.get(info.type)!.has(info.name)) {
        visited.add(obj)

        const cloned: unknown = Array.isArray(obj)
          ? obj.map((item) => cloneWithRefs(item, visited, context))
          : Object.fromEntries(
              Object.entries(obj).map(([k, v]) => [k, cloneWithRefs(v, visited, getContextFromKey(k) ?? context)]),
            )

        visited.delete(obj)

        extractedComponents.get(info.type)!.set(info.name, cloned)
      }

      return {
        $ref: `#/components/${info.type}/${info.name}`,
        ...extraProps,
      }
    }

    // Non-circular object: deep clone normally
    visited.add(obj)

    const result: unknown = Array.isArray(obj)
      ? obj.map((item) => cloneWithRefs(item, visited, context))
      : Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, cloneWithRefs(v, visited, getContextFromKey(k) ?? context)]),
        )

    visited.delete(obj)

    return result
  }

  // Phase 1: Identify all circular objects (start with 'schemas' as default context)
  identifyCircular(document, new Set(), 'schemas')

  // Phase 2: Clone with refs
  const result = cloneWithRefs(document, new Set(), 'schemas') as Record<string, unknown>

  // If cycles were found, inject the extracted components into their respective sections
  if (extractedComponents.size > 0) {
    const components = (result.components ?? {}) as Record<string, unknown>

    for (const [componentType, items] of extractedComponents) {
      const section = (components[componentType] ?? {}) as Record<string, unknown>
      for (const [name, component] of items) {
        section[name] = component
      }
      components[componentType] = section
    }

    result.components = components
  }

  return result
}
