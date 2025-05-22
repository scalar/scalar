<script setup lang="ts">
import type {
  Collection,
  Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'

import type { Schemas } from '@/features/Operation/types/schemas'

import CallbackName from './CallbackName.vue'

const { callbacks, collection, parentId, schemas, server } = defineProps<{
  callbacks: Operation['callbacks']
  collection: Collection
  parentId: string
  schemas?: Schemas
  server: Server | undefined
}>()
</script>

<template>
  <div class="mt-6 gap-3">
    <div class="text-c-1 text-lg font-medium">Callbacks</div>

    <!-- Loop over names -->
    <div class="mt-4 flex flex-col gap-4">
      <CallbackName
        v-for="(urlMap, name) in callbacks"
        :key="name"
        :parentId="parentId"
        :collection="collection"
        :schemas="schemas"
        :server="server"
        :callbackUrls="urlMap"
        :name="name" />
    </div>
  </div>
</template>
