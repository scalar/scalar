import { type InjectionKey, type ShallowRef, inject, onServerPrefetch, shallowRef, watch } from 'vue'

import {
  type AsyncApiSchemaResourceResolver,
  createAsyncApiSchemaResourceResolver,
} from './async-api-schema-resources/resolver'
import type { AsyncApiSchemaResources } from './async-api-schema-resources/resources'

/** Share the current document's authenticated loader and cache across expanded native schemas. */
export const ASYNC_API_SCHEMA_RESOURCES: InjectionKey<() => AsyncApiSchemaResourceResolver> =
  Symbol('async-api-schema-resources')

/** This scope is mounted by expanded message/model slots, so collapsed schemas never fetch. */
export const useAsyncApiSchemaResources = (
  input: () => { format: string; value: unknown; resources?: AsyncApiSchemaResources },
): ShallowRef<AsyncApiSchemaResources | undefined> => {
  const fallback = createAsyncApiSchemaResourceResolver()
  const resolver = inject(ASYNC_API_SCHEMA_RESOURCES, () => fallback)
  const resolved = shallowRef<AsyncApiSchemaResources>()
  let pending: Promise<void> | undefined
  watch(
    input,
    ({ format, value, resources }, _old, onCleanup) => {
      let current = true
      onCleanup(() => {
        current = false
      })
      resolved.value = resources?.deferred ? undefined : resources
      pending = resolver()(format, value, resources).then((result) => {
        if (current) resolved.value = result
      })
    },
    { immediate: true, deep: true, flush: 'sync' },
  )
  onServerPrefetch(() => pending)
  return resolved
}
