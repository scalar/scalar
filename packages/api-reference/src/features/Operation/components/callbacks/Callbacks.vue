<script setup lang="ts">
import type {
  Collection,
  Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'

import type { Schemas } from '@/features/Operation/types/schemas'

import Callback from './Callback.vue'

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
      <div
        v-for="(callbackUrls, name) in callbacks"
        class="flex flex-col gap-2"
        :key="name">
        <div class="text-c-1 text-lg font-medium">
          {{ name }}
        </div>

        <!-- Loop over methods -->
        <div class="flex flex-col gap-3">
          <template v-for="(methods, url) in callbackUrls">
            <Callback
              v-for="(callback, method) in methods"
              :callback="callback"
              :collection="collection"
              :method="method"
              :parentId="parentId"
              :schemas="schemas"
              :server="server"
              :url="url" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
