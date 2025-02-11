import { OperationBlock } from '@/blocks/components/OperationBlock'
import { type CreateBlockOptions, createBlock } from '@/blocks/lib/createBlock'

/**
 * Creates a operation embed
 *
 * @example
 * createOperationBlock({
 *   element: document.getElementById('scalar-api-reference'),
 *   store: createStore({ url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json' }),
 *   location: getPointer(['paths', '/planets/1', 'get'])
 * })
 */
export function createOperationBlock(options: CreateBlockOptions) {
  return createBlock(OperationBlock, options)
}
