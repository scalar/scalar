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
const COMPONENT_TYPES = Object.keys(COMPONENT_PREFIXES) as ComponentType[]

/**
 * Lookup table for OpenAPI keys that change the component context.
 * Using an object lookup is faster than a switch statement for many keys.
 */
const KEY_TO_CONTEXT: Readonly<Record<string, ComponentType>> = {
  responses: 'responses',
  parameters: 'parameters',
  requestBody: 'requestBodies',
  headers: 'headers',
  examples: 'examples',
  links: 'links',
  callbacks: 'callbacks',
  securitySchemes: 'securitySchemes',
  schema: 'schemas',
  items: 'schemas',
  additionalProperties: 'schemas',
  allOf: 'schemas',
  oneOf: 'schemas',
  anyOf: 'schemas',
  not: 'schemas',
  properties: 'schemas',
  patternProperties: 'schemas',
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
 * These container objects must remain maps in OpenAPI and cannot be replaced by a Reference Object.
 * When a cycle points to one of these containers, we lift the ref to a legal parent object.
 */
const NON_REFERENCE_CONTAINER_KEYS = new Set(['properties', 'patternProperties', 'responses'])

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

type NonReferenceContainerInfo = {
  readonly key: 'properties' | 'patternProperties' | 'responses'
  readonly owner: object
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
   * - existingComponentNames: Maps objects to their existing component names (if in components section)
   * - counters: Tracks unique naming counters per component type
   */
  const circularMeta = new Map<object, CircularMeta>()
  const objectContext = new Map<object, ComponentType>()
  const existingComponentNames = new Map<object, { type: ComponentType; name: string }>()
  const nonReferenceContainers = new WeakSet<object>()
  const nonReferenceContainerInfo = new WeakMap<object, NonReferenceContainerInfo>()
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
   * Pre-scan: Map existing components to their names.
   * This allows us to reference existing schemas instead of creating duplicates.
   */
  const scanExistingComponents = (doc: Record<string, unknown>): void => {
    const components = doc.components as Record<string, unknown> | undefined
    if (!components) {
      return
    }

    for (const componentType of COMPONENT_TYPES) {
      const section = components[componentType] as Record<string, unknown> | undefined
      if (!section) {
        continue
      }

      for (const [name, value] of Object.entries(section)) {
        if (value !== null && typeof value === 'object') {
          existingComponentNames.set(value as object, { type: componentType, name })
        }
      }
    }
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
      // Keep container maps as maps; we will lift refs on their entries during cloning.
      if (nonReferenceContainers.has(obj)) {
        return
      }

      // Only register once — use existing name if available, otherwise generate new one
      if (!circularMeta.has(obj)) {
        const existing = existingComponentNames.get(obj)
        if (existing) {
          // Use the existing component name
          circularMeta.set(obj, existing)
        } else {
          // Generate a new name
          const componentType = objectContext.get(obj) ?? context
          const count = ++counters[componentType]
          circularMeta.set(obj, {
            type: componentType,
            name: `${COMPONENT_PREFIXES[componentType]}${count}`,
          })
        }
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
        const child = record[key]
        if (
          NON_REFERENCE_CONTAINER_KEYS.has(key) &&
          child !== null &&
          typeof child === 'object' &&
          !Array.isArray(child)
        ) {
          nonReferenceContainers.add(child as object)
          nonReferenceContainerInfo.set(child as object, {
            key: key as NonReferenceContainerInfo['key'],
            owner: obj,
          })
        }

        const newContext = getContextForKey(key) ?? context
        identifyCircularObjects(child, ancestors, newContext)
      }
    }

    // Remove from ancestor chain when backtracking
    ancestors.delete(obj)
  }

  /** Stores processed (cycle-free) definitions by type and name */
  const extractedComponents = new Map<ComponentType, Map<string, unknown>>()

  /** Precompute whether we have extra props to avoid repeated Object.keys calls */
  const hasExtraProps = Object.keys(extraProps).length > 0

  /** Creates a $ref object pointing to the extracted component */
  const createRefObject = (meta: CircularMeta): Record<string, unknown> => {
    const ref = { $ref: `#/components/${meta.type}/${meta.name}` }
    return hasExtraProps ? { ...ref, ...extraProps } : ref
  }

  /** Gets or creates the target section for extracted components. */
  const getOrCreateExtractedSection = (type: ComponentType): Map<string, unknown> => {
    const existing = extractedComponents.get(type)
    if (existing !== undefined) {
      return existing
    }

    const section = new Map<string, unknown>()
    extractedComponents.set(type, section)
    return section
  }

  /** Ensures an object has component metadata so it can be referenced legally. */
  const ensureMeta = (obj: object, fallbackType: ComponentType): CircularMeta => {
    const existingMeta = circularMeta.get(obj)
    if (existingMeta !== undefined) {
      return existingMeta
    }

    const existingName = existingComponentNames.get(obj)
    if (existingName !== undefined) {
      circularMeta.set(obj, existingName)
      return existingName
    }

    const count = ++counters[fallbackType]
    const meta: CircularMeta = {
      type: fallbackType,
      name: `${COMPONENT_PREFIXES[fallbackType]}${count}`,
    }
    circularMeta.set(obj, meta)
    return meta
  }

  /** Lifts illegal container self-cycles to a legal reference target. */
  const createLiftedRefForContainer = (container: object): Record<string, unknown> | undefined => {
    const info = nonReferenceContainerInfo.get(container)
    if (info === undefined) {
      return undefined
    }

    if (info.key === 'properties' || info.key === 'patternProperties') {
      const meta = ensureMeta(info.owner, 'schemas')
      return createRefObject(meta)
    }

    // responses map values must be Response Object or Reference Object.
    // Lift self-cycle to the first concrete response entry.
    const responses = container as Record<string, unknown>
    for (const value of Object.values(responses)) {
      if (value !== null && typeof value === 'object' && value !== container) {
        const meta = ensureMeta(value as object, 'responses')
        return createRefObject(meta)
      }
    }

    return undefined
  }

  /**
   * Phase 2: Create a deep clone with circular references replaced by $refs.
   * For circular objects, we extract to components and return $ref.
   * For non-circular objects, we simply deep clone.
   */
  const cloneWithRefs = (value: unknown, visited: Set<object>, context: ComponentType): unknown => {
    if (value === null || typeof value !== 'object') {
      return value
    }

    const obj = value as object
    const meta = circularMeta.get(obj)

    // If this is a circular object and we're already visiting it, return a $ref to break the cycle
    if (meta !== undefined) {
      if (visited.has(obj)) {
        return createRefObject(meta)
      }

      // Check if this object already exists in components section
      const isExistingComponent = existingComponentNames.has(obj)

      if (isExistingComponent) {
        // Do not extract — it already exists in components.
        // Just clone it in place and replace circular back-references with $ref
        visited.add(obj)
        const cloned = Array.isArray(obj) ? cloneArray(obj, visited, context) : cloneObject(obj, visited, context)
        visited.delete(obj)
        return cloned
      }

      // Get or create the section for this component type
      const section = getOrCreateExtractedSection(meta.type)

      // Only process and extract if we haven't already
      if (!section.has(meta.name)) {
        visited.add(obj)
        const cloned = Array.isArray(obj) ? cloneArray(obj, visited, context) : cloneObject(obj, visited, context)
        visited.delete(obj)
        section.set(meta.name, cloned)
      }

      return createRefObject(meta)
    }

    // Non-circular object: track traversal path to handle cycles that are intentionally
    // not extracted (for container maps where we lift refs to legal targets).
    if (visited.has(obj)) {
      return undefined
    }

    visited.add(obj)
    const cloned = Array.isArray(obj) ? cloneArray(obj, visited, context) : cloneObject(obj, visited, context)
    visited.delete(obj)

    // This object may become referenceable while cloning children (e.g. lifting
    // a container self-cycle to the parent object). If so, extract it now.
    const lateMeta = circularMeta.get(obj)
    if (lateMeta !== undefined) {
      if (existingComponentNames.has(obj)) {
        return cloned
      }

      const section = getOrCreateExtractedSection(lateMeta.type)

      if (!section.has(lateMeta.name)) {
        section.set(lateMeta.name, cloned)
      }

      return createRefObject(lateMeta)
    }

    return cloned
  }

  /**
   * Clones an array, recursively processing each element.
   */
  const cloneArray = (arr: unknown[], visited: Set<object>, context: ComponentType): unknown[] => {
    const result: unknown[] = []
    for (const item of arr) {
      const clonedItem = cloneWithRefs(item, visited, context)
      if (clonedItem !== undefined) {
        result.push(clonedItem)
      }
    }
    return result
  }

  /**
   * Clones an object, recursively processing each property.
   * Updates context based on property keys.
   */
  const cloneObject = (obj: object, visited: Set<object>, context: ComponentType): Record<string, unknown> => {
    const record = obj as Record<string, unknown>
    const result: Record<string, unknown> = {}

    for (const key of Object.keys(record)) {
      const newContext = getContextForKey(key) ?? context
      const value = record[key]
      const clonedValue = cloneWithRefs(value, visited, newContext)
      if (clonedValue !== undefined) {
        result[key] = clonedValue
        continue
      }

      // If a value loops back to its parent container map, lift to a legal reference target.
      if (value === obj && nonReferenceContainers.has(obj)) {
        const liftedRef = createLiftedRefForContainer(obj)
        if (liftedRef !== undefined) {
          result[key] = liftedRef
        }
      }
    }

    return result
  }

  // Execute Pre-scan: map existing components
  scanExistingComponents(document)

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
