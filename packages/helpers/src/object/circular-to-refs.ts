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
 * identity, extracts each circular schema into components/schemas with a
 * generated name, and replaces the back-references with **only** `$ref` and
 * `$ref-value` (no extra schema properties) so that TypeBox's Value.Cast picks
 * the reference branch of the schemaOrReference union.
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
  /** Maps each circular JS object to its assigned schema name */
  const circularNames = new Map<object, string>()
  /** Stores the processed (cycle-free) schema definitions keyed by name */
  const extractedSchemas = new Map<string, unknown>()
  let counter = 0

  /**
   * Walks the value tree depth-first. The `ancestors` set tracks the current
   * path from root so that a revisited object (by reference) signals a cycle.
   */
  const walk = (value: unknown, ancestors: Set<object>): unknown => {
    if (value === null || typeof value !== 'object') {
      return value
    }

    const obj = value as Record<string, unknown>

    // Cycle detected — this object is already an ancestor on the current path.
    // Return a clean reference object with ONLY $ref and $ref-value so that
    // TypeBox picks the reference union branch instead of trying to match it
    // as a schema object.
    if (ancestors.has(obj)) {
      if (!circularNames.has(obj)) {
        counter++
        circularNames.set(obj, `CircularRef${counter}`)
      }
      return {
        $ref: `#/components/schemas/${circularNames.get(obj)}`,
        ...extraProps,
      }
    }

    ancestors.add(obj)

    const result: unknown = Array.isArray(obj)
      ? obj.map((item) => walk(item, ancestors))
      : Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, walk(v, ancestors)]))

    ancestors.delete(obj)

    // If this object was identified as circular, store the clean copy for components/schemas
    const name = circularNames.get(obj)
    if (name !== undefined) {
      extractedSchemas.set(name, result)
    }

    return result
  }

  const result = walk(document, new Set()) as Record<string, unknown>

  // If cycles were found, inject the extracted schemas into components/schemas
  if (extractedSchemas.size > 0) {
    const components = (result.components ?? {}) as Record<string, unknown>
    const schemas = (components.schemas ?? {}) as Record<string, unknown>

    for (const [name, schema] of extractedSchemas) {
      schemas[name] = schema
    }

    components.schemas = schemas
    result.components = components
  }

  return result
}
