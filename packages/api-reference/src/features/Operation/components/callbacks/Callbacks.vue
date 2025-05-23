<script setup lang="ts">
import type { Collection, Operation } from '@scalar/oas-utils/entities/spec'

import type { Schemas } from '@/features/Operation/types/schemas'

import Callback from './Callback.vue'

const { callbacks, collection, schemas } = defineProps<{
  callbacks: Operation['callbacks']
  collection: Collection
  schemas?: Schemas
}>()
</script>

<template>
  <div class="mt-6 gap-3">
    <div class="text-c-1 my-3 text-lg font-medium">Callbacks</div>

    <!-- Loop over names -->
    <template
      v-for="(callbackUrls, name) in callbacks"
      :key="name">
      <!-- Loop over methods -->
      <template v-for="(methods, url) in callbackUrls">
        <Callback
          v-for="(callback, method) in methods"
          :callback="callback"
          :collection="collection"
          :method="method"
          :name="name"
          :schemas="schemas"
          :url="url" />
      </template>
    </template>
  </div>
</template>
