import { getRaw } from '@scalar/json-magic/magic-proxy'
import { toRaw } from 'vue'

import { unpackDetectChangesProxy } from '@/helpers/detect-changes-proxy'
import { unpackOverridesProxy } from '@/helpers/overrides-proxy'

/**
 * Unpacks special vue reactivity & override & detect-changes & magic proxy from an input object or array,
 * returning the "raw" plain object or array.
 */
export const unpackProxyObject = <T extends object | Array<unknown>>(input: T): T =>
  unpackDetectChangesProxy(toRaw(getRaw(unpackOverridesProxy(input))))
