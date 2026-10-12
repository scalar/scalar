import { isObject } from '@scalar/helpers/object/is-object'
import type { LifecyclePlugin } from '@scalar/json-magic/bundle'

const dataKeys = new Set(['example', 'examples', 'default', 'enum', 'const'])
const maps = new Set([
  'channels',
  'operations',
  'messages',
  'schemas',
  'properties',
  'patternProperties',
  '$defs',
  'definitions',
  'parameters',
  'servers',
  'variables',
  'securitySchemes',
  'messageTraits',
  'operationTraits',
  'correlationIds',
  'replies',
  'replyAddresses',
  'dependencies',
  'serverBindings',
  'channelBindings',
  'operationBindings',
  'messageBindings',
])

/** Keep literal data outside the generic bundler's reference walk, including in loaded files. */
export const preserveData = (): LifecyclePlugin => {
  const mapNodes = new WeakSet<object>()
  const hidden = new WeakMap<object, [string, PropertyDescriptor][]>()
  return {
    type: 'lifecycle',
    onBeforeNodeProcess: (node) => {
      // Keys in maps are user-defined names, so a schema named "examples" is not example data.
      if (mapNodes.has(node)) {
        return
      }
      for (const key of maps) {
        const value = node[key]
        if (isObject(value)) {
          mapNodes.add(value)
        }
      }
      const fields = Object.keys(node).filter(
        (key) => dataKeys.has(key) || (key.startsWith('x-') && key !== 'x-ext' && key !== 'x-ext-urls'),
      )
      const descriptors = fields.flatMap((key): [string, PropertyDescriptor][] => {
        const descriptor = Object.getOwnPropertyDescriptor(node, key)
        if (!descriptor?.configurable) {
          return []
        }
        // Non-enumerable data remains available to the loader, but not to its reference traversal.
        Object.defineProperty(node, key, { ...descriptor, enumerable: false })
        return [[key, descriptor]]
      })
      hidden.set(node, descriptors)
    },
    onAfterNodeProcess: (node) => {
      for (const [key, descriptor] of hidden.get(node) ?? []) {
        Object.defineProperty(node, key, descriptor)
      }
      hidden.delete(node)
    },
  }
}
