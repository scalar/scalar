<script setup lang="ts">
import { computed } from 'vue'

import type { CollectionPropsDocument } from '@/v2/features/app/helpers/routes'
import { EnvironmentsList } from '@/v2/features/environments'

const { document, eventBus, type, workspaceStore } =
  defineProps<CollectionPropsDocument>()

/** Document or workspace environments */
const environments = computed(
  () =>
    (type === 'document'
      ? document['x-scalar-environments']
      : workspaceStore.workspace['x-scalar-environments']) ?? {},
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-2">
      <div class="flex flex-col gap-2">
        <div class="flex h-8 items-center">
          <h3 class="font-bold">Environment Variables</h3>
        </div>
        <p class="text-c-2 mb-4 text-sm">
          Set environment variables at your collection level. Use
          <code
            v-pre
            class="font-code text-c-2">
            {{ variable }}
          </code>
          to add / search among the selected environment's variables in your
          request inputs.
        </p>
      </div>
    </div>

    <EnvironmentsList
      :environments="environments"
      :eventBus="eventBus"
      :type="type" />
  </div>
</template>
