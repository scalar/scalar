<script setup lang="ts">
import type {
  Collection,
  Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'

import Callback from '@/features/Operation/components/Callback.vue'
import type { Schemas } from '@/features/Operation/types/schemas'

const { callbacks, collection, layout, parentId, schemas, server } =
  defineProps<{
    callbacks: Operation['callbacks']
    collection: Collection
    layout: 'modern' | 'classic'
    parentId: string
    schemas?: Schemas
    server: Server | undefined
  }>()
</script>

<template>
  <!-- Loop over names -->
  <div v-for="(urlMap, name) in callbacks">
    <!-- Loop over urls -->
    <div v-for="(callbackMap, url) in urlMap">
      <!-- Loop over methods -->
      <div v-for="(callback, method) in callbackMap">
        <Callback
          :callback="callback"
          :collection="collection"
          :layout="layout"
          :method="method"
          :name="name"
          :parentId="parentId"
          :schemas="schemas"
          :server="server"
          :url="url" />
      </div>
    </div>
  </div>
</template>
