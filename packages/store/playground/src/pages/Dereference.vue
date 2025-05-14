<script setup lang="ts">
import { dereference, upgrade } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'
import { onMounted, ref } from 'vue'

import OpenApiDocument from '../components/OpenApiDocument.vue'

const document = ref<OpenAPI.Document | undefined>(undefined)

onMounted(async () => {
  const EXAMPLE_URL =
    'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json'

  const content = await fetch(EXAMPLE_URL).then((res) => res.json())

  const specification = (await measure('upgrade', async () => {
    const { specification: upgraded } = upgrade(content)

    return upgraded
  })) as OpenAPI.Document

  document.value = (await measure(`dereference('stripe')`, async () => {
    const { paths, ...rest } = specification
    const { schema } = await dereference(rest)

    return schema
  })) as OpenAPI.Document

  document.value = (await measure(
    `dereference('stripe', { paths: {…} })`,
    async () => {
      const { schema } = await dereference(specification)

      return schema
    },
  )) as OpenAPI.Document
})

async function measure(name: string, fn: () => Promise<unknown>) {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  const duration = Math.round(end - start)

  console.log(`${name} ${duration}ms`)

  return result
}
</script>

<template>
  <div>
    <h1 class="mb-4 text-2xl font-bold">Dereference</h1>
  </div>
  <div>
    <OpenApiDocument :document="document" />
  </div>
</template>
