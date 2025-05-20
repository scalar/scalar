<script setup lang="ts">
import { ref } from '@vue/reactivity'
import { onMounted } from 'vue'

import { createCollection, type Collection } from '@/create-collection'

import OpenApiDocument from '../components/OpenApiDocument.vue'
import Timings from '../components/Timings.vue'
import { useTimings } from '../hooks/useTimings'

const { timings, measure } = useTimings()

const collection = ref<Collection | undefined>(undefined)

onMounted(async () => {
  await measure('fetch + load', async () => {
    collection.value = await createCollection({
      url: 'https://raw.githubusercontent.com/digitalocean/openapi/refs/heads/main/specification/DigitalOcean-public.v2.yaml',
    })
  })
})
</script>
<template>
  <div class="m-4 max-w-xl">
    <h1 class="mb-4 text-2xl font-bold">createCollection</h1>
    <div class="mb-4 flex flex-col gap-4">
      <p>Loading the whole document in a magic proxy.</p>
      <p>Supports external references.</p>
    </div>

    <template v-if="collection">
      <OpenApiDocument :document="collection.document" />
    </template>
    <p v-else>Loading workspace…</p>

    <Timings :timings="timings" />
  </div>
</template>
