/**
 * This file contains a collection of plugins used for the bundler.
 * Plugins defined here can extend or modify the behavior of the bundling process,
 * such as adding lifecycle hooks or custom processing logic.
 */
import { isLocalRef } from '@/helpers/general'
import type { LifecyclePlugin } from '@scalar/json-magic/bundle'

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

      const loader = context.loaders.find((it) => it.validate(externalValue))

      // We can not process the external value
      if (!loader) {
        return
      }

      if (!cache.has(externalValue)) {
        cache.set(externalValue, loader.exec(externalValue))
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
      const { path, resolutionCache, parentNode } = context
      const ref = node['$ref']

      // Only process nodes that have a $ref property as a string
      if (typeof ref !== 'string') {
        return
      }

      // Can not resolve top level refs
      if (!parentNode || !path.length) {
        return
      }

      const loader = context.loaders.find((it) => it.validate(ref))

      // Can not load the external ref
      if (!loader) {
        return
      }

      // Support resolving $ref on the info object
      if (path[0] === 'info') {
        // Use the cache to avoid duplicate fetches
        if (!resolutionCache.has(ref)) {
          resolutionCache.set(ref, loader.exec(ref))
        }

        const result = await resolutionCache.get(ref)

        if (result?.ok) {
          // Replace the ref with the resolved data
          parentNode[path.at(-1)!] = result.data
        }
      }
    },
  }
}

/**
 * Lifecycle plugin to restore original $ref values after processing.
 *
 * This plugin is intended to be used as a "lifecycle" plugin in the bundling process.
 * It operates in the `onAfterNodeProcess` hook, and its main purpose is to restore
 * the original $ref values for external references that may have been replaced or
 * rewritten during the bundling process.
 *
 * How it works:
 * - For each node processed, if the node contains a $ref property (as a string),
 *   and the root document contains an "x-ext-urls" mapping object,
 *   the plugin will attempt to restore the original $ref value.
 * - The "x-ext-urls" object is expected to be a mapping from the rewritten $ref
 *   (e.g., a hashed or compressed reference) back to the original external URL or path.
 * - If a mapping exists for the current $ref, the plugin replaces the $ref value
 *   with the original value from the mapping. If no mapping exists (e.g., for local refs),
 *   the $ref value is left unchanged.
 *
 * This is useful for scenarios where you want to present or export the bundled document
 * with the original external $ref values, rather than the internal or rewritten ones.
 *
 * @returns {LifecyclePlugin} The plugin object for use in the bundler.
 */
export const restoreOriginalRefs = (): LifecyclePlugin => {
  return {
    type: 'lifecycle',
    onBeforeNodeProcess: (node, context) => {
      const ref = node['$ref']
      const root = context.rootNode
      const extUrls = root['x-ext-urls']

      // Only process if $ref is a string and x-ext-urls is a valid object
      if (typeof ref !== 'string' || typeof extUrls !== 'object' || extUrls === null || !isLocalRef(ref)) {
        return
      }

      // Working with local refs

      const segments = ref.split('/')
      const key = segments.at(-1) ?? ''

      // Replace the $ref with the original version from the mapping,
      // or keep the current version if there is no mapping (e.g., for local refs)
      node['$ref'] = (extUrls as Record<string, string>)[key] ?? ref
    },
  }
}

/**
 * Lifecycle plugin to automatically add missing "type" fields to OpenAPI/JSON Schema nodes.
 *
 * This plugin is intended for use as a "lifecycle" plugin during the bundling process.
 * It ensures that schema objects are explicitly typed, improving compatibility with OpenAPI tools and validators.
 *
 * Behavior:
 * - If a schema object has a "properties" field but no "type", it sets "type" to "object".
 *   This is required for schemas that define properties but omit the type.
 *
 * - If a schema object contains any array-related keywords ("items", "prefixItems", "minItems", "maxItems", or "uniqueItems")
 *   and lacks a "type", it sets "type" to "array". This clarifies the intent for array schemas missing an explicit type.
 *
 * - If a schema object has a "pattern" field but no "type", it sets "type" to "string".
 *   This ensures that pattern constraints are only applied to string-typed schemas.
 *
 * Usage:
 *   Add this plugin to the bundler to automatically fix schemas missing "type: object", "type: array", or "type: string"
 *   when defining properties, array-related keywords, or pattern constraints.
 *
 * Examples:
 *   // Before:
 *   { properties: { foo: { type: "string" } } }
 *   // After:
 *   { type: "object", properties: { foo: { type: "string" } } }
 *
 *   // Before:
 *   { items: { type: "string" } }
 *   // After:
 *   { type: "array", items: { type: "string" } }
 *
 *   // Before:
 *   { pattern: "^[a-z]+$" }
 *   // After:
 *   { type: "string", pattern: "^[a-z]+$" }
 */
export const cleanUp = (): LifecyclePlugin => {
  return {
    type: 'lifecycle',
    onBeforeNodeProcess: (node) => {
      // If the node has "properties" but no "type", set "type" to "object"
      if ('properties' in node && !('type' in node)) {
        node['type'] = 'object'
      }

      // Set type to 'array' for schemas that have array-related keywords but are missing a type
      const arrayKeywords = ['items', 'prefixItems', 'minItems', 'maxItems', 'uniqueItems']
      if (arrayKeywords.some((it) => Object.hasOwn(node, it)) && !('type' in node)) {
        node['type'] = 'array'
      }

      // If the node has "pattern" but no "type", set "type" to "string"
      if ('pattern' in node && !('type' in node)) {
        node['type'] = 'string'
      }

      // Convert required: null to required: [] for object schemas
      if ('required' in node && node.required === null && 'properties' in node) {
        node.required = []
      }
    },
  }
}
