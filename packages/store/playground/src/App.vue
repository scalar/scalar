<script setup lang="ts">
import { dereference, upgrade } from '@scalar/openapi-parser'
import { waitFor } from '@test/utils/waitFor'
import { computed, reactive, ref, toRaw } from '@vue/reactivity'
import { computedAsync } from '@vueuse/core'
import { onMounted } from 'vue'

import { createWorkspace, localStoragePlugin } from '@/create-workspace'

const EXAMPLE_URL =
  'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json'

const workspace = createWorkspace({
  plugins: [
    // localStoragePlugin()
  ],
})

const content = ref<Record<string, unknown>>({})

// Benchmarks for comparison
const benchmarks = {
  upgrade: 80,
  fetch: 42,
  load: 200,
  merge: 1306,
}

// Reactive object to store perf results
const perfResults = reactive<{
  upgrade?: number
  fetch?: number
  load?: number
  merge?: number
}>({})

// Helper to calculate delta and percent
function getPerfDelta(key: keyof typeof benchmarks) {
  const current = perfResults[key]
  const baseline = benchmarks[key]
  if (current == null || baseline == null) {
    return { delta: 0, percent: 0 }
  }
  const delta = current - baseline
  const percent = (delta / baseline) * 100
  return { delta, percent }
}

// Heavy work
onMounted(async () => {
  const data = (await measure(`fetch('stripe')`, async () => {
    const response = await fetch(EXAMPLE_URL)
    return JSON.parse(await response.text())
  })) as Record<string, unknown>

  await measure(`upgrade('stripe')`, async () => {
    const { specification } = upgrade(data)
    content.value = specification
  })

  // Initial data load
  await measure(`load('stripe')`, async () => {
    await workspace.load('stripe', async () => {
      // Destructure to remove 'paths', then return the rest
      const { paths, ...rest } = content.value
      return { ...rest }
    })

    await waitFor(() => {
      return !!workspace.state.collections.stripe?.document?.info?.title
    })
  })

  // Ingest more data
  await measure(`merge('stripe', { paths: {…} })`, async () => {
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

  if (name.startsWith('upgrade')) {
    perfResults.upgrade = duration
  }
  if (name.startsWith('fetch')) {
    perfResults.fetch = duration
  }
  if (name.startsWith('load')) {
    perfResults.load = duration
  }
  if (name.startsWith('merge')) {
    perfResults.merge = duration
  }

  return result
}
</script>
<template>
  <div class="m-4 max-w-xl">
    <h1 class="mb-4 text-2xl font-bold">createWorkspace</h1>
    <template
      v-for="collection in Object.keys(collections)"
      v-if="Object.keys(collections).length">
      <h2 class="mb-2 text-xl font-semibold">{{ collection }}</h2>
      <template v-if="collections[collection]">
        <table class="border text-sm text-gray-700">
          <tbody>
            <tr>
              <td class="border px-2 py-1 font-bold">OpenAPI</td>
              <td class="border px-2 py-1">
                {{ collections[collection].document?.openapi }}
              </td>
            </tr>
            <tr>
              <td class="border px-2 py-1 font-bold">$.info.title</td>
              <td class="border px-2 py-1">
                {{ collections[collection].document?.info?.title }}
              </td>
            </tr>
            <tr>
              <td class="border px-2 py-1 font-bold">Paths</td>
              <td class="border px-2 py-1">
                {{
                  Object.keys(collections[collection].document?.paths ?? {})
                    .length
                }}
              </td>
            </tr>
            <tr>
              <td class="border px-2 py-1 font-bold">
                resolved $ref's in paths
              </td>
              <td class="border px-2 py-1">
                {{
                  !!collections[collection].document?.paths?.['/v1/accounts']
                    ?.get?.responses?.['200']?.content?.['application/json']
                    ?.schema?.type
                    ? 'yes'
                    : 'no'
                }}
              </td>
            </tr>
          </tbody>
        </table>
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

    <h2 class="mb-2 mt-8 font-bold">Benchmarks</h2>
    <table class="min-w-full border text-sm">
      <thead>
        <tr>
          <th class="border px-2 py-1 text-left">Step</th>
          <th class="border px-2 py-1">Benchmark</th>
          <th class="border px-2 py-1">Current</th>
          <th class="border px-2 py-1">Δ (ms)</th>
          <th class="border px-2 py-1">% Change</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="key in ['upgrade', 'fetch', 'load', 'merge']"
          :key="key">
          <td class="border px-2 py-1">
            <span v-if="key === 'upgrade'">upgrade('stripe')</span>
            <span v-else-if="key === 'fetch'">fetch('stripe')</span>
            <span v-else-if="key === 'load'">load('stripe')</span>
            <span v-else>merge('stripe', { paths: {…} })</span>
          </td>
          <td class="border px-2 py-1 text-center">{{ benchmarks[key] }}ms</td>
          <td class="border px-2 py-1 text-center">
            <span v-if="perfResults[key] != null"
              >{{ perfResults[key] }}ms</span
            >
            <span v-else>–</span>
          </td>
          <td class="border px-2 py-1 text-center">
            <span v-if="perfResults[key] != null">
              {{ getPerfDelta(key).delta > 0 ? '+' : ''
              }}{{ getPerfDelta(key).delta }}ms
            </span>
            <span v-else>–</span>
          </td>
          <td class="border px-2 py-1 text-center">
            <span
              v-if="perfResults[key] != null"
              :class="{
                'text-green-600': getPerfDelta(key).percent < 0,
                'text-red-600': getPerfDelta(key).percent > 0,
              }">
              {{ getPerfDelta(key).percent > 0 ? '+' : ''
              }}{{ getPerfDelta(key).percent.toFixed(1) }}%
            </span>
            <span v-else>–</span>
          </td>
        </tr>
        <tr>
          <td class="border px-2 py-1 font-bold">Total</td>
          <td class="border px-2 py-1 text-center font-bold">
            {{ Object.values(benchmarks).reduce((a, b) => a + b, 0) }}ms
          </td>
          <td class="border px-2 py-1 text-center font-bold">
            <span v-if="Object.values(perfResults).every((r) => r != null)">
              {{
                Object.values(perfResults).reduce((a, b) => a + (b ?? 0), 0)
              }}ms
            </span>
            <span v-else>–</span>
          </td>
          <td class="border px-2 py-1 text-center font-bold">
            <span v-if="Object.values(perfResults).every((r) => r != null)">
              {{
                Object.values(getPerfDelta).reduce((a, b) => a + b.delta, 0) > 0
                  ? '+'
                  : ''
              }}{{
                Object.values(getPerfDelta).reduce((a, b) => a + b.delta, 0)
              }}ms
            </span>
            <span v-else>–</span>
          </td>
          <td class="border px-2 py-1 text-center font-bold">
            <span
              v-if="Object.values(perfResults).every((r) => r != null)"
              :class="{
                'text-green-600':
                  Object.values(getPerfDelta).reduce(
                    (a, b) => a + b.percent,
                    0,
                  ) < 0,
                'text-red-600':
                  Object.values(getPerfDelta).reduce(
                    (a, b) => a + b.percent,
                    0,
                  ) > 0,
              }">
              {{
                Object.values(getPerfDelta).reduce((a, b) => a + b.percent, 0) >
                0
                  ? '+'
                  : ''
              }}{{
                Object.values(getPerfDelta)
                  .reduce((a, b) => a + b.percent, 0)
                  .toFixed(1)
              }}%
            </span>
            <span v-else>–</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
