<script setup lang="ts">
import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import DocumentScriptsEditors from '@/v2/features/collection/components/DocumentScriptsEditors.vue'
import Section from '@/v2/features/settings/components/Section.vue'

const { document, eventBus, collectionType } = defineProps<CollectionProps>()

const handleUpdateExtension = (payload: Record<string, unknown>) => {
  eventBus.emit('document:update:extension', payload)
}
</script>

<template>
  <Section v-if="collectionType === 'document'">
    <template #title>Pre-request &amp; Post-response Scripts</template>
    <template #description>
      Scripts at the document level run for every request in this document.
      Operation-level scripts (in the request editor) run in addition to these.
    </template>
    <DocumentScriptsEditors
      :document="document"
      @update:extension="handleUpdateExtension" />
  </Section>
</template>
