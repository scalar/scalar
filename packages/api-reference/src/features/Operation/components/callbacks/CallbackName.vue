<script setup lang="ts">
import type {
  Collection,
  Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { ref } from 'vue'

import type { Schemas } from '@/features/Operation/types/schemas'

import Callback from './Callback.vue'

const { collection, name, parentId, schemas, server } = defineProps<{
  callbackUrls: NonNullable<Operation['callbacks']>[string]
  collection: Collection
  name: string
  parentId: string
  schemas?: Schemas
  server: Server | undefined
}>()

const open = ref(false)
</script>

<template>
  <div>
    <!-- Title -->
    <div
      @click.stop="open = !open"
      class="text-c-1 text-md cursor-pointer font-medium">
      {{ name }}
    </div>

    <!-- Body -->
    <div
      v-if="open"
      class="flex flex-col gap-2">
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
</template>
