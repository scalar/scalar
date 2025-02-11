import { ExampleResponsesBlock } from '@/blocks/components/ExampleResponsesBlock'
import { type CreateBlockOptions, createBlock } from '@/blocks/lib/createBlock'

/**
 * Creates a new example responses embed
 *
 * @example
 * createExampleResponsesBlock({
 *   element: document.getElementById('scalar-api-reference'),
 *   store: createStore({ url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json' }),
 *   location: getPointer(['paths', '/planets/1', 'get'])
 * })
 */
export function createExampleResponsesBlock(options: CreateBlockOptions) {
  return createBlock(ExampleResponsesBlock, options)
}
