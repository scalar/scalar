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

const workspace = createWorkspace({
  plugins: [
    // localStoragePlugin()
  ],
})

const content = ref<Record<string, unknown>>({})

const { timings, measure } = useTimings()

// Heavy work
onMounted(async () => {
  // Initial data load
  await measure('load', async () => {
    await workspace.load('foobar', async () => {
      return {
        openapi: '3.1.1',
        info: {
          title: 'Foobar',
          version: '1.0.0',
        },
        paths: {
          '/foo': {
            $ref: '#/components/pathItems/foobar',
          },
          '/foobar': {
            $ref: '#/components/pathItems/foobar',
          },
          '/barfoo': {
            $ref: '#/components/pathItems/foobar',
          },
        },
      }
    })
  })

  // Simulate a slow network
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await measure('merge', async () => {
    await workspace.merge('foobar', {
      components: {
        pathItems: {
          foobar: {
            get: {
              summary: 'Get a foobar',
              responses: {
                '200': {
                  description: 'A successful response',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  })
})

// Alias
const collections = computed(() => workspace.state.collections)
</script>
<template>
  <div class="m-4 max-w-xl">
    <h1 class="mb-4 text-2xl font-bold">
      External References (Async fetching)
    </h1>
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
