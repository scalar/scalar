<script lang="ts">
/**
 * Environment variables section for the collection.
 * Renders document or workspace environments and lets users set variables
 * that can be referenced in request inputs via {{ variable }}.
 */
export default {
  name: 'Environment',
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import { EnvironmentsList } from '@/v2/features/environments'
import Section from '@/v2/features/settings/components/Section.vue'

const { document, eventBus, collectionType, workspaceStore } =
  defineProps<CollectionProps>()

/** Document or workspace environments */
const environments = computed(
  () =>
    (collectionType === 'document'
      ? document['x-scalar-environments']
      : workspaceStore.workspace['x-scalar-environments']) ?? {},
)

const activeEnvironment = computed(() => {
  return workspaceStore.workspace['x-scalar-active-environment']
})
</script>

<template>
  <Section v-if="collectionType !== 'operation'">
    <template #title>Environment Variables</template>
    <template #description>
      Set environment variables at your collection level. Use
      <code
        v-pre
        class="font-code text-c-2">
        {{ variable }}
      </code>
      to add / search among the selected environment's variables in your request
      inputs.
    </template>
    <EnvironmentsList
      :activeEnvironment
      :collectionType
      :environments
      :eventBus />
  </Section>
</template>
