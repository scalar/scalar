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

    document.value = (await measure(`dereference ${index}`, async () => {
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

  // const fetchedContent = await measure('fetch', async () => {
  //   return await fetch(EXAMPLE_URL).then((res) => res.json())
  // })

  const response = await fetch(EXAMPLE_URL)
  const fetchedContent = await response.text()
  // const specification = (await measure('upgrade', async () => {
  //   const { specification: upgraded } = upgrade(fetchedContent)

  //   return upgraded
  // })) as OpenAPI.Document
  const { specification } = upgrade(fetchedContent)

  // Add everything but the paths
  const { paths, ...rest } = specification

  content.value = {
    ...rest,
    paths: {},
  }

  // Simulate a slow network
  // await new Promise((resolve) => setTimeout(resolve, 1000))

  // Add the paths back in
  content.value = {
    ...content.value,
    paths: specification.paths,
  }
})
</script>

<template>
  <div class="m-4 max-w-xl">
    <h1 class="mb-4 text-2xl font-bold">dereference</h1>
    <div class="mb-4 flex flex-col gap-4">
      <p>Dereferencing the document without the paths.</p>
      <p>And then dereferencing the whole document with the paths.</p>
    </div>
    <OpenApiDocument :document="document" />
    <Timings :timings="timings" />
  </div>
</template>
