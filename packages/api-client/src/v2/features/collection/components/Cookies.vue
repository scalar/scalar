<script setup lang="ts">
import { computed } from 'vue'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import { CookiesTable } from '@/v2/features/global-cookies'

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
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-2">
      <div class="flex flex-col gap-2">
        <div class="flex h-8 items-center">
          <h3 class="font-bold">Cookies</h3>
        </div>
        <p class="text-c-2 mb-4 text-sm">
          Manage your collection's cookies here.<br />Cookies allow you to store
          and send key-value data with your API requests—often used for things
          like session tokens, authentication, and saving user preferences.<br />
        </p>
      </div>
    </div>
    <CookiesTable
      :cookies="cookies"
      :eventBus="eventBus"
      :collectionType="collectionType" />
  </div>
</template>
