<script setup lang="ts">
import { dereference, upgrade } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'
import { onMounted, ref, watch } from 'vue'

import OpenApiDocument from '../components/OpenApiDocument.vue'
import Timings from '../components/Timings.vue'
import { useTimings } from '../hooks/useTimings'

const content = ref<Record<string, unknown>>({})
const document = ref<OpenAPI.Document | undefined>(undefined)

const { timings, measure } = useTimings()

let index = 0

watch(
  () => content.value,
  async (value) => {
    if (!value || Object.keys(value).length === 0) {
      return
    }

    index++

    document.value = (await measure('dereference', async () => {
      const { schema } = await dereference(JSON.stringify(value))
      return schema
    })) as OpenAPI.Document
  },
  {
    deep: true,
    immediate: true,
  },
)

onMounted(async () => {
  const EXAMPLE_URL =
    'https://raw.githubusercontent.com/digitalocean/openapi/refs/heads/main/specification/DigitalOcean-public.v2.yaml'

  const fetchedContent = await measure('fetch', async () => {
    const response = await fetch(EXAMPLE_URL)
    return await response.text()
  })

  const { specification: document } = upgrade(fetchedContent)

  content.value = document
})
</script>

<template>
  <div class="m-4 max-w-xl">
    <h1 class="mb-4 text-2xl font-bold">dereference</h1>
    <div class="mb-4 flex flex-col gap-4">
      <p>Dereferencing the whole document.</p>
      <p>Doesn’t support external references.</p>
    </div>
    <OpenApiDocument :document="document" />
    <Timings :timings="timings" />
  </div>
</template>
