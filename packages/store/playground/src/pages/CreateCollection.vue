<script setup lang="ts">
import { dereference, upgrade } from '@scalar/openapi-parser'
import { waitFor } from '@test/utils/waitFor'
import { computed, ref, toRaw } from '@vue/reactivity'
import { computedAsync } from '@vueuse/core'
import { onMounted } from 'vue'

import { createWorkspace, localStoragePlugin } from '@/create-workspace'

import OpenApiDocument from '../components/OpenApiDocument.vue'
import Timings from '../components/Timings.vue'
import { useTimings } from '../hooks/useTimings'

const EXAMPLE_URL =
  'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json'

const workspace = createWorkspace({
  plugins: [
    // localStoragePlugin()
  ],
})

const content = ref<Record<string, unknown>>({})

const { timings, measure } = useTimings()

// Heavy work
onMounted(async () => {
  const data = (await measure('fetch', async () => {
    const response = await fetch(EXAMPLE_URL)
    return JSON.parse(await response.text())
  })) as Record<string, unknown>

  await measure('upgrade', async () => {
    const { specification } = upgrade(data)
    content.value = specification
  })

  // Initial data load
  await measure('load', async () => {
    await workspace.load('stripe', async () => {
      // Destructure to remove 'paths', then return the rest
      const { paths, ...rest } = content.value
      return { ...rest }
    })

    await waitFor(() => {
      return !!workspace.state.collections.stripe?.document?.info?.title
    })
  })

  // Simulate a slow network
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Ingest more data
  await measure('merge', async () => {
    workspace.merge('stripe', {
      paths: content.value.paths,
    })

    await waitFor(() => {
      return (
        Object.keys(workspace.state.collections.stripe?.document?.paths ?? {})
          .length === 391
      )
    })
  })
})

// Alias
const collections = computed(() => workspace.state.collections)
</script>
<template>
  <div class="m-4 max-w-xl">
    <h1 class="mb-4 text-2xl font-bold">createCollection</h1>
    <div class="mb-4 flex flex-col gap-4">
      <p>Loading the whole document in a magic proxy.</p>
      <p>Adding everything but the paths, and then adding the paths.</p>
    </div>
    <template
      v-for="collection in Object.keys(collections)"
      v-if="Object.keys(collections).length">
      <template v-if="collections[collection]">
        <OpenApiDocument :document="collections[collection].document" />
      </template>
    </template>
    <p v-else>Loading workspace…</p>

    <!-- <h2>Stripe (dereferenced)</h2>
    <template v-if="dereferencedCollection?.openapi">
      <p>{{ dereferencedCollection.openapi }}</p>
      <p>{{ dereferencedCollection.info?.title }}</p>
      <p>{{ Object.keys(dereferencedCollection.paths ?? {}).length }} paths</p>
    </template>
    <p v-else>Dereferencing...</p> -->

    <Timings :timings="timings" />
  </div>
</template>
