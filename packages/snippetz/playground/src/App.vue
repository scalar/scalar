<script setup lang="ts">
import { snippetz } from '@scalar/snippetz'
import { allPlugins as lazyPlugins } from '@scalar/snippetz/clients/lazy'
import { computed, ref, watchEffect } from 'vue'

const selectedClient = ref('shell/curl')
const generatedCode = ref('')
const isLoading = ref(false)

/** Tracks which lazy plugins have had their generator invoked */
const loadedPlugins = ref(new Set<string>())

const instance = snippetz(lazyPlugins)

/** All available client IDs */
const availableClients = computed(() =>
  instance.plugins().map((p) => `${p.target}/${p.client}`),
)

/** Generate the code snippet when the selected client changes */
watchEffect(async () => {
  const [target, client] = selectedClient.value.split('/') as [string, string]

  isLoading.value = true
  const result = await instance.print(target as any, client as any, {
    url: 'https://example.com/api/users',
    method: 'POST',
    headers: [{ name: 'Content-Type', value: 'application/json' }],
    postData: {
      mimeType: 'application/json',
      text: JSON.stringify({ name: 'John Doe', email: 'john@example.com' }),
    },
  })
  isLoading.value = false
  generatedCode.value = result ?? 'No output'

  if (result) {
    loadedPlugins.value.add(selectedClient.value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8 font-sans">
    <h1 class="mb-6 text-2xl font-bold">Scalar Snippetz</h1>

    <!-- Available plugins -->
    <div class="mb-6">
      <h2 class="mb-2 text-sm font-semibold text-gray-600">
        Plugins ({{ availableClients.length }})
      </h2>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="id in availableClients"
          :key="id"
          class="cursor-pointer rounded-full px-2 py-0.5 font-mono text-xs"
          :class="
            id === selectedClient
              ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-400'
              : loadedPlugins.has(id)
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          "
          @click="selectedClient = id">
          {{ id }}
        </span>
      </div>
    </div>

    <!-- Generated code -->
    <div class="relative">
      <div
        v-if="isLoading"
        class="absolute top-2 right-2 text-xs text-gray-400">
        Loading...
      </div>
      <pre
        class="overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm whitespace-pre-wrap text-green-300"
        >{{ generatedCode }}</pre
      >
    </div>
  </div>
</template>
