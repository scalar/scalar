import { getRaw } from '@scalar/json-magic/magic-proxy'
import { toRaw } from 'vue'

import { unpackDetectChangesProxy } from '@/helpers/detect-changes-proxy'
import { unpackOverridesProxy } from '@/helpers/overrides-proxy'

/**
 * Unpacks special vue reactivity & override & detect-changes & magic proxy from an input object or array,
 * returning the "raw" plain object or array.
 *
 * This function recursively traverses the input object or array, removing any proxies
 * (e.g. Vue reactivity proxies, magic proxies, override proxies, detect-changes proxies)
 * to obtain and return the underlying "raw" plain object or array.
 *
 * The recursion is controlled by the `depth` parameter. If `depth` is `null`, unlimited depth is allowed.
 * If a proxied object is detected and unwrapped at non-root level, a warning is logged.
 *
 * @param input - The object or array (possibly deeply nested or proxied) to recursively unwrap.
 * @param depth - Optional, limits recursion depth. `null` means unlimited depth (default is 1).
 * @returns - A plain object or array with all proxies removed up to the specified depth.
 */
export const unpackProxyObject = <T>(input: T, { depth = 0 }: { depth?: number | null } = {}): T => {
  // Internal DFS helper to recursively strip all known proxies (Vue, overrides, detect-changes, magic proxies)
  const dfs = (value: any, currentDepth: number = 0): any => {
    // Base case: non-objects (primitives, null) are returned as-is
    if (typeof value !== 'object' || value === null) {
      return value
    }

    // Compose all the proxy unwraps in order
    const raw = unpackDetectChangesProxy(toRaw(getRaw(unpackOverridesProxy(value))))

    // If we have reached the maximum depth, return the value (potentially still partially proxied)
    if (depth !== null && currentDepth >= depth) {
      return raw
    }

    // Show a warning if a nested value was a proxy (usually undesired, can cause subtle bugs)
    if (currentDepth !== 0 && raw !== value) {
      console.warn(
        '%c⚠ Warning:%c You tried to assign a proxied object (depth: %d).\n' +
          '%c💡 Tip:%c Pass a plain object instead — wrapping a proxy inside another proxy may cause weird bugs.\n' +
          '%c🔍 Debug Info:%c The problematic value is shown below:',
        // styles
        'background: #fdd835; color: #000; font-weight: bold; padding: 2px 4px; border-radius: 3px;',
        'color: inherit;',
        currentDepth,
        'color: #00bfa5; font-weight: bold;',
        'color: inherit;',
        'color: #03a9f4; font-weight: bold;',
        'color: inherit;',
        value,
        input,
      )

      // Collapsed trace group for cleaner output
      console.groupCollapsed('%c📜 Proxy assignment trace', 'color: #9c27b0; font-weight: bold;')
      console.trace({ value, raw })
      console.groupEnd()
    }

    // Recursively process all properties/entries to make sure we are not assigning proxies directly,
    // but are always assigning plain objects at any level.
    Object.entries(raw).forEach(([key, value]) => {
      const propertyResult = dfs(value, currentDepth + 1)
      const result = Reflect.set(raw, key, propertyResult)

      if (!result) {
        console.warn(
          '%c🚫 Readonly Property Error:%c Failed to set property "%s" on object.\n' +
            '%c💡 Tip:%c This property is readonly or non-configurable. You cannot unpack a readonly property — the value was not updated.\n' +
            '%c🔍 Debug Info:%c Property: %s | Value: %o | Object: %o',
          // styles
          'background: #f44336; color: #fff; font-weight: bold; padding: 2px 4px; border-radius: 3px;',
          'color: inherit;',
          key,
          'color: #00bfa5; font-weight: bold;',
          'color: inherit;',
          'color: #03a9f4; font-weight: bold;',
          'color: inherit;',
          key,
          propertyResult,
          raw,
        )
      }
    })

    return raw
  }

  return dfs(input)
}
