/**
 * This file contains a collection of plugins used for the bundler.
 * Plugins defined here can extend or modify the behavior of the bundling process,
 * such as adding lifecycle hooks or custom processing logic.
 */
import type { LifecyclePlugin } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

/**
 * A lifecycle plugin that adds a `$status` property to nodes during resolution.
 * - Sets `$status` to 'loading' when resolution starts.
 * - Sets `$status` to 'error' if resolution fails.
 * - Removes `$status` when resolution succeeds.
 */
export const loadingStatus = (): LifecyclePlugin => {
  return {
    type: 'lifecycle',
    onResolveStart: (node) => {
      node['$status'] = 'loading'
    },
    onResolveError: (node) => {
      node['$status'] = 'error'
    },
    onResolveSuccess: (node) => {
      delete node['$status']
    },
  }
}

/**
 * Lifecycle plugin to resolve and embed external content referenced by an 'externalValue' property in a node.
 *
 * When a node contains an 'externalValue' property (as a string), this plugin will:
 *   - Fetch the external resource (such as a URL or file) using the fetchUrls plugin.
 *   - If the fetch is successful, assign the fetched data to the node's 'value' property.
 *
 * This is useful for inlining external content (like examples or schemas) into the OpenAPI document during bundling.
 *
 * @param node - The node being processed, which may contain an 'externalValue' property.
 */
export const externalValueResolver = (): LifecyclePlugin => {
  return {
    type: 'lifecycle',
    onAfterNodeProcess: async (node, context) => {
      const externalValue = node['externalValue']
      const cache = context.resolutionCache

      // Only process if 'externalValue' is a string
      if (typeof externalValue !== 'string') {
        return
      }

      if (!cache.has(externalValue)) {
        cache.set(externalValue, fetchUrls().exec(externalValue))
      }

      const result = await cache.get(externalValue)

      // If fetch is successful, assign the data to the node's 'value' property
      if (result?.ok) {
        node['value'] = result.data
      }
    },
  }
}

/**
 * Lifecycle plugin to resolve $ref on any object, including non-standard locations like the info object.
 * 
 * This plugin will:
 *   - Detect if a node contains a $ref property (as a string).
 *   - If the node is under the 'info' path, attempt to resolve the reference using fetchUrls.
 *   - Replace the node's properties with the resolved data if successful.
 * 
 * Note: This currently only supports refs on the 'info' object and does not handle primitive types.
 */
export const refsEverywhere = (): LifecyclePlugin => {
  return {
    type: 'lifecycle',
    onBeforeNodeProcess: async (node, context) => {
      // Only process nodes that have a $ref property as a string
      if (!('$ref' in node) || typeof node['$ref'] !== 'string') {
        return
      }

      const ref = node['$ref']
      const { path, resolutionCache } = context

      // Support resolving $ref on the info object
      if (path[0] === 'info') {
        // Use the cache to avoid duplicate fetches
        if (!resolutionCache.has(ref)) {
          resolutionCache.set(ref, fetchUrls().exec(ref))
        }

        const result = await resolutionCache.get(ref)

        if (result?.ok) {
          delete node['$ref']
          // TODO: handle primitive types (going to need access to the parent node)
          Object.assign(node, result.data)
        }
      }
    },
  }
}
