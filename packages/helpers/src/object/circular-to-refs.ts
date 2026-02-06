/**
 * OpenAPI component types that can contain circular references.
 * Each type maps to a section in `#/components/{type}`.
 */
const COMPONENT_PREFIXES = {
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
} as const

type ComponentType = keyof typeof COMPONENT_PREFIXES

/**
 * Lookup table for OpenAPI keys that change the component context.
 * Using an object lookup is faster than a switch statement for many keys.
 */
const KEY_TO_CONTEXT: Readonly<Record<string, ComponentType>> = {
  // Response context
  responses: 'responses',

  // Parameter context
  parameters: 'parameters',

  // Request body context
  requestBody: 'requestBodies',

  // Header context
  headers: 'headers',

  // Example context
  examples: 'examples',

  // Link context
  links: 'links',

  // Callback context
  callbacks: 'callbacks',

  // Security scheme context
  securitySchemes: 'securitySchemes',

  // Schema context (JSON Schema keywords)
  schema: 'schemas',
  items: 'schemas',
  additionalProperties: 'schemas',
  allOf: 'schemas',
  oneOf: 'schemas',
  anyOf: 'schemas',
  not: 'schemas',
  properties: 'schemas',
  patternProperties: 'schemas',

  // HTTP methods map to pathItems context
  get: 'pathItems',
  put: 'pathItems',
  post: 'pathItems',
  delete: 'pathItems',
  options: 'pathItems',
  head: 'pathItems',
  patch: 'pathItems',
  trace: 'pathItems',
}

/**
 * Determines the component context for a given OpenAPI key.
 * Returns the appropriate ComponentType or null to inherit parent context.
 */
const getContextForKey = (key: string): ComponentType | null => {
  // Fast path: direct lookup for known keys
  const context = KEY_TO_CONTEXT[key]
  if (context !== undefined) {
    return context
  }

  // Callback path expressions (keys containing '{$') or path templates have pathItem values
  if (key.includes('{$') || key.charCodeAt(0) === 47 /* '/' */) {
    return 'pathItems'
  }

  // No context change — inherit from parent
  return null
}

/** Metadata about a circular object: its component type and generated name */
type CircularMeta = {
  readonly type: ComponentType
  readonly name: string
}

/**
 * Detects and breaks circular JavaScript object references in an OpenAPI document tree.
 *
 * The legacy API client (via openapi-parser's dereference) resolved all $refs inline:
 * it deleted the $ref key and copied every property from the resolved target directly
 * onto the object. For self-referencing or mutually-referencing schemas this created
 * circular JS object graphs that cannot be serialized to JSON or validated by TypeBox.
 *
 * This function walks the object tree depth-first, detects cycles via reference identity,
 * extracts each circular component into the appropriate components section (schemas,
 * responses, parameters, etc.) with a generated name, and replaces ALL occurrences
 * (both first and back-references) with **only** `$ref` and any extra properties
 * (no extra schema properties) so that TypeBox's Value.Cast picks the reference branch
 * of the schemaOrReference union.
 *
 * Returns a new (deep-cloned) document with all cycles replaced. When no circular
 * references exist, the output is structurally identical to the input.
 *
 * @param document - The OpenAPI document to process
 * @param extraProps - Extra properties to add as siblings to the $ref (e.g., '$ref-value')
 * @returns A new document with circular references replaced by $ref pointers
 */
export const circularToRefs = (
  document: Record<string, unknown>,
  extraProps: Record<string, unknown> = {},
): Record<string, unknown> => {
  /**
   * Phase 1 structures:
   * - circularMeta: Maps circular objects to their component type and generated name
   * - objectContext: Records the context when an object is first encountered
   * - counters: Tracks unique naming counters per component type
   */
  const circularMeta = new Map<object, CircularMeta>()
  const objectContext = new Map<object, ComponentType>()
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

  /**
   * Phase 1: Identify all circular objects in the tree.
   *
   * We traverse depth-first, tracking ancestors in the current path. When we
   * encounter an object already in the ancestor set, we've found a cycle.
   * We record the circular object with its context and a generated name.
   *
   * @param value - Current value being traversed
   * @param ancestors - Set of objects in the current traversal path
   * @param context - Current OpenAPI component context
   */
  const identifyCircularObjects = (value: unknown, ancestors: Set<object>, context: ComponentType): void => {
    // Primitives and null cannot be circular
    if (value === null || typeof value !== 'object') {
      return
    }

    const obj = value as object

    // Cycle detected: this object is already in our ancestor chain
    if (ancestors.has(obj)) {
      // Only register once — use the context from when we first saw this object
      if (!circularMeta.has(obj)) {
        const componentType = objectContext.get(obj) ?? context
        const count = ++counters[componentType]
        circularMeta.set(obj, {
          type: componentType,
          name: `${COMPONENT_PREFIXES[componentType]}${count}`,
        })
      }
      return
    }

    // Record context on first encounter for accurate categorization
    if (!objectContext.has(obj)) {
      objectContext.set(obj, context)
    }

    // Add to ancestor chain and recurse
    ancestors.add(obj)

    if (Array.isArray(obj)) {
      for (const item of obj) {
        identifyCircularObjects(item, ancestors, context)
      }
    } else {
      // Objects: check each property, updating context as needed
      const record = obj as Record<string, unknown>
      for (const key of Object.keys(record)) {
        const newContext = getContextForKey(key) ?? context
        identifyCircularObjects(record[key], ancestors, newContext)
      }
    }

    // Remove from ancestor chain when backtracking
    ancestors.delete(obj)
  }

  /**
   * Phase 2 structures:
   * - extractedComponents: Stores processed (cycle-free) definitions by type and name
   * - processingSet: Tracks objects currently being processed to detect cycles during cloning
   */
  const extractedComponents = new Map<ComponentType, Map<string, unknown>>()

  /**
   * Creates a $ref object pointing to the extracted component.
   * Includes any extra properties (e.g., '$ref-value').
   */
  const createRefObject = (meta: CircularMeta): Record<string, unknown> => {
    const ref = { $ref: `#/components/${meta.type}/${meta.name}` }
    // Only spread if we have extra properties to add
    if (Object.keys(extraProps).length > 0) {
      return { ...ref, ...extraProps }
    }
    return ref
  }

  /**
   * Ensures a component type section exists in extractedComponents.
   * Returns the section map for the given type.
   */
  const getComponentSection = (type: ComponentType): Map<string, unknown> => {
    let section = extractedComponents.get(type)
    if (section === undefined) {
      section = new Map()
      extractedComponents.set(type, section)
    }
    return section
  }

  /**
   * Phase 2: Create a deep clone with circular references replaced by $refs.
   *
   * For circular objects, we:
   * 1. Return a $ref immediately if we're already processing this object (cycle in clone path)
   * 2. Extract the object's content to the components section
   * 3. Return a $ref in place of the original
   *
   * For non-circular objects, we simply deep clone.
   *
   * @param value - Current value being cloned
   * @param visited - Set of objects in the current clone path (cycle detection)
   * @param context - Current OpenAPI component context
   * @returns Cloned value with circular refs replaced
   */
  const cloneWithRefs = (value: unknown, visited: Set<object>, context: ComponentType): unknown => {
    // Primitives and null: return as-is (no cloning needed)
    if (value === null || typeof value !== 'object') {
      return value
    }

    const obj = value as object
    const meta = circularMeta.get(obj)

    // If this is a circular object and we're already visiting it in this path,
    // return a $ref to break the cycle
    if (visited.has(obj) && meta !== undefined) {
      return createRefObject(meta)
    }

    // Handle circular objects: extract to components and return $ref
    if (meta !== undefined) {
      const section = getComponentSection(meta.type)

      // Only process and extract if we haven't already
      if (!section.has(meta.name)) {
        // Mark as visited to detect self-references during extraction
        visited.add(obj)

        // Clone the object's contents
        const cloned = Array.isArray(obj) ? cloneArray(obj, visited, context) : cloneObject(obj, visited, context)

        visited.delete(obj)
        section.set(meta.name, cloned)
      }

      return createRefObject(meta)
    }

    // Non-circular object: deep clone normally
    visited.add(obj)
    const result = Array.isArray(obj) ? cloneArray(obj, visited, context) : cloneObject(obj, visited, context)
    visited.delete(obj)

    return result
  }

  /**
   * Clones an array, recursively processing each element.
   */
  const cloneArray = (arr: unknown[], visited: Set<object>, context: ComponentType): unknown[] =>
    arr.map((item) => cloneWithRefs(item, visited, context))

  /**
   * Clones an object, recursively processing each property.
   * Updates context based on property keys.
   */
  const cloneObject = (obj: object, visited: Set<object>, context: ComponentType): Record<string, unknown> => {
    const record = obj as Record<string, unknown>
    const result: Record<string, unknown> = {}

    for (const key of Object.keys(record)) {
      const newContext = getContextForKey(key) ?? context
      result[key] = cloneWithRefs(record[key], visited, newContext)
    }

    return result
  }

  // Execute Phase 1: identify all circular objects
  identifyCircularObjects(document, new Set(), 'schemas')

  // Execute Phase 2: clone with refs
  const result = cloneWithRefs(document, new Set(), 'schemas') as Record<string, unknown>

  // Inject extracted components into the result document
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
