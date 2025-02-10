import { SchemaBlock } from '@/blocks/components/SchemaBlock'
import { type CreateBlockOptions, createBlock } from '@/blocks/lib/createBlock'

/**
 * Creates a operation embed
 *
 * @example
 * createSchemaBlock({
 *   element: document.getElementById('scalar-api-reference'),
 *   store: createStore({ url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json' }),
 *   location: getPointer(['components', 'schemas', 'User'])
 * })
 */
export function createSchemaBlock(options: CreateBlockOptions) {
  return createBlock(SchemaBlock, options)
}
