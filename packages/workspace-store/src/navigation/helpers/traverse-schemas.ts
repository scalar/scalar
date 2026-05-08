import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { getTag } from '@/navigation/helpers/get-tag'
import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import type { XInternal } from '@/schemas/extensions/document/x-internal'
import type { XScalarIgnore } from '@/schemas/extensions/document/x-scalar-ignore'
import type { ParentTag, TraversedSchema } from '@/schemas/navigation'
import type { OpenApiDocument, SchemaObject } from '@/schemas/v3.1/strict/openapi-document'

/** Returns true when an entity is marked as hidden from navigation via x-internal or x-scalar-ignore. */
const isHidden = (entity: (XInternal & XScalarIgnore) | undefined) =>
  Boolean(entity?.['x-internal'] || entity?.['x-scalar-ignore'])

/** Creates a traversed schema entry from an OpenAPI schema object.
 *
 * @param ref - JSON pointer reference to the schema in the OpenAPI document
 * @param name - Name of the schema, defaults to 'Unknown'
 * @param entriesMap - Map to store schema IDs and titles for mobile header navigation
 * @param getModelId - Function to generate unique IDs for schemas
 * @returns A traversed schema entry with ID, title, name and reference
 */
const createSchemaEntry = ({
  ref,
  name,
  generateId,
  parentTag,
  _schema,
  parentId,
}: {
  ref: string
  name: string
  generateId: TraverseSpecOptions['generateId']
  parentTag?: ParentTag
  _schema?: SchemaObject
  parentId: string
}): TraversedSchema => {
  const id = generateId({ name, type: 'model', parentTag, parentId, schema: _schema })
  const schema = getResolvedRef(_schema)

  // Use schema.title if available, otherwise fall back to name
  // @see https://json-schema.org/draft/2020-12/json-schema-core#section-4.3.5
  const title = (schema && 'title' in schema && (schema.title as string)) || name

  const entry = {
    id,
    title,
    name,
    ref,
    type: 'model',
  } satisfies TraversedSchema

  return entry
}

/** Traverses the schemas in an OpenAPI document to build an array of model entries.
 *
 * This function processes each schema in components.schemas to:
 * - Filter out internal schemas (marked with x-internal) and schemas to ignore (marked with x-scalar-ignore)
 * - Create model entries with unique references and IDs
 * - Store model IDs and titles for mobile header navigation
 */
export const traverseSchemas = ({
  document,
  tagsMap,
  generateId,
  documentId,
}: {
  document: OpenApiDocument
  /** Map of tagNames and their entries */
  tagsMap: TagsMap
  generateId: TraverseSpecOptions['generateId']
  documentId: string
}): TraversedSchema[] => {
  const schemas = document.components?.schemas ?? {}
  const untagged: TraversedSchema[] = []

  // biome-ignore lint/suspicious/useGuardForIn: we do have an if statement after de-ref
  for (const name in schemas) {
    if (!Object.hasOwn(schemas, name)) {
      continue
    }

    // The schema may be a $ref wrapper with sibling x-internal / x-scalar-ignore extensions.
    // getResolvedRef returns only the dereferenced content, so we need to check the wrapper too.
    const wrapper = schemas[name] as (XInternal & XScalarIgnore) | undefined
    const schema = getResolvedRef(schemas[name])

    if (isHidden(wrapper) || isHidden(schema)) {
      continue
    }

    const ref = `#/components/schemas/${name}`

    // Add to tags
    if (schema?.['x-tags']) {
      schema['x-tags'].forEach((tagName: string) => {
        const { tag, id: tagId } = getTag({ tagsMap, name: tagName, documentId, generateId })
        tagsMap.get(tagName)?.entries.push(
          createSchemaEntry({
            ref,
            name,
            generateId,
            parentTag: { tag, id: tagId },
            parentId: documentId,
          }),
        )
      })
    }
    // Add to untagged
    else {
      untagged.push(
        createSchemaEntry({
          ref,
          name,
          generateId,
          _schema: getResolvedRef(schemas[name]),
          parentId: documentId,
        }),
      )
    }
  }

  return untagged
}
