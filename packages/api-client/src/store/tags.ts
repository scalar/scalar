import type { Tag } from '@scalar/oas-utils/entities/spec'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

import { LS_KEYS } from './local-storage'

/** Create cookie mutators for the workspace */
export function createStoreTags(useLocalStorage: boolean) {
  const tags = reactive<Record<string, Tag>>({})

  const tagMutators = mutationFactory(
    tags,
    reactive({}),
    useLocalStorage && LS_KEYS.TAG,
  )

  return {
    tags,
    tagMutators,
  }
}
