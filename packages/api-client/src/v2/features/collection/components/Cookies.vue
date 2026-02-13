<script setup lang="ts">
import { computed } from 'vue'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import { CookiesTable } from '@/v2/features/global-cookies'
import Section from '@/v2/features/settings/components/Section.vue'

const { collectionType, eventBus, document, workspaceStore } =
  defineProps<CollectionProps>()

const cookies = computed(() => {
  return (
    (collectionType === 'document'
      ? document['x-scalar-cookies']
      : workspaceStore.workspace['x-scalar-cookies']) ?? []
  )
})
</script>

<template>
  <Section>
    <template #title>Cookies</template>
    <template #description>
      Manage your collection's cookies here.<br />Cookies allow you to store and
      send key-value data with your API requests—often used for things like
      session tokens, authentication, and saving user preferences.<br />
    </template>
    <CookiesTable
      :collectionType="collectionType"
      :cookies="cookies"
      :eventBus="eventBus" />
  </Section>
</template>
