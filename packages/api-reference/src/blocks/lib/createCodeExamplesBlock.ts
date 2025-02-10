import { CodeExamplesBlock } from '@/blocks/components/CodeExamplesBlock'
import { type CreateBlockOptions, createBlock } from '@/blocks/lib/createBlock'

/**
 * Creates a new code examples embed
 *
 * @example
 * createCodeExampleBlock({
 *   element: document.getElementById('scalar-api-reference'),
 *   store: createStore({ url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json' }),
 *   location: getPointer(['paths', '/planets/1', 'get'])
 * })
 */
export function createCodeExamplesBlock(options: CreateBlockOptions) {
  return createBlock(CodeExamplesBlock, options)
}
