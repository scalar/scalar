<script setup lang="ts">
import { dereference, upgrade } from '@scalar/openapi-parser'
import { waitFor } from '@test/utils/waitFor'
import { computed, ref, toRaw } from '@vue/reactivity'
import { computedAsync } from '@vueuse/core'
import { onMounted } from 'vue'

import { createWorkspace, localStoragePlugin } from '@/create-workspace'

const workspace = createWorkspace({
  plugins: [
    // localStoragePlugin()
  ],
})

const content = ref<Record<string, unknown>>({})

// Heavy work
onMounted(async () => {
  content.value = (await measure(`fetch('stripe')`, async () => {
    const response = await fetch(
      'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json',
    )

    return JSON.parse(await response.text())
  })) as Record<string, unknown>

  // Initial data load
  const start = performance.now()

  workspace.load('stripe', () => {
    // Destructure to remove 'paths', then return the rest
    const { paths, ...rest } = content.value

    return {
      ...rest,
    }
  })

  await waitFor(() => {
    return !!workspace.state.collections.stripe?.document?.info?.title
  })
  const end = performance.now()
  console.log(`load('stripe') ${Math.round(end - start)}ms`)

  // Ingest more data
  const start2 = performance.now()
  workspace.merge('stripe', {
    paths: content.value.paths,
  })
  await waitFor(() => {
    return !!Object.keys(
      workspace.state.collections.stripe?.document?.paths ?? {},
    ).length
  })

  const end2 = performance.now()
  console.log(`merge('stripe', { paths: {…} }) ${Math.round(end2 - start2)}ms`)
})

// TODO: This would be great to visually compare the performance, but Vue seems to always render both at once.
// const dereferencedCollection = computedAsync(async () => {
//   const start = performance.now()
//   const { specification: upgraded } = upgrade(toRaw(content.value))
//   const { schema } = await dereference(upgraded)
//   const end = performance.now()

//   console.log(
//     `upgrade('stripe') + dereference('stripe') ${Math.round(end - start)}ms`,
//   )

//   return schema
// })

// Alias
const collections = computed(() => workspace.state.collections)

// Performance measurement
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
    <h1>createWorkspace</h1>
    <template
      v-for="collection in Object.keys(collections)"
      v-if="Object.keys(collections).length">
      <h2>{{ collection }}</h2>
      <template v-if="collections[collection]">
        <p>OpenAPI {{ collections[collection].document?.openapi }}</p>
        <p>$.info.title: {{ collections.stripe.document?.info?.title }}</p>
        <p>
          {{ Object.keys(collections.stripe.document?.paths ?? {}).length }}
          paths
        </p>
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
  </div>
</template>
