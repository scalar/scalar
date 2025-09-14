<script lang="ts" setup>
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed } from 'vue'

import ApiReferenceToolbarConfig from '@/features/toolbar/ApiReferenceToolbarConfig.vue'
import ApiReferenceToolbarShare from '@/features/toolbar/ApiReferenceToolbarShare.vue'

defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')

const showToolbar = computed<boolean>(() => {
  if (!window) {
    return false
  }
  return window.location.hostname === 'localhost'
})
</script>
<template>
  <header
    v-if="showToolbar"
    class="api-reference-toolbar h-header bg-b-1 sticky top-0 z-10 flex justify-center border-b px-15">
    <div
      class="flex max-w-(--refs-content-max-width) flex-1 items-center justify-end">
      <ApiReferenceToolbarShare :configuration />
      <ApiReferenceToolbarConfig
        :configuration
        v-model:overrides="overrides" />
    </div>
  </header>
</template>
