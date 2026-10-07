<script setup lang="ts">
import { ExternalDocumentation } from '@scalar/blocks/shared'
import type { AsyncApiInfoObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { computed } from 'vue'

const { owner } = defineProps<{
  /** Documentation and tags stay with their owner, independently of navigation grouping. */
  owner?: Pick<AsyncApiInfoObject, 'externalDocs' | 'tags'>
}>()

const documentation = computed(() => {
  const direct = getResolvedRef(owner?.externalDocs)
  const tags =
    owner?.tags?.flatMap((tag) => {
      const resolved = getResolvedRef(tag)
      const value = getResolvedRef(resolved?.externalDocs)
      return value?.url ? [{ name: resolved?.name, value }] : []
    }) ?? []
  return [...(direct?.url ? [{ name: undefined, value: direct }] : []), ...tags]
})
</script>

<template>
  <div
    v-if="documentation.length"
    class="my-2 grid gap-2">
    <div
      v-for="(entry, index) in documentation"
      :key="index"
      class="min-w-0">
      <div
        v-if="entry.name"
        class="text-c-2 text-sm">
        {{ entry.name }}
      </div>
      <ExternalDocumentation :value="entry.value" />
    </div>
  </div>
</template>
