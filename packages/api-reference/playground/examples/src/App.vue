<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'

import { ApiReference, type ReferenceConfiguration } from '../../../src'

const LIST_OF_OPENAPI_EXAMPLES =
  'https://raw.githubusercontent.com/scalar/awesome-openapi/refs/heads/main/data/openapi-document-urls.json'

/** OpenAPI document URL */
const url = ref<string | undefined>('')

/** Store the fetched list of URLs */
const urls = reactive<
  {
    url: string
    name: string
  }[]
>([])

/** Fetch example URLs */
onMounted(async () => {
  const response = await fetch(LIST_OF_OPENAPI_EXAMPLES)

  if (response.ok) {
    const data = await response.json()
    Object.assign(urls, data)

    // Set the URL to the first entry in the fetched list
    if (urls.length > 0) {
      url.value = urls[0].url
    }
  } else {
    console.error('Failed to fetch example URLs:', response.statusText)
  }
})

/** Configuration */
const configuration = reactive<ReferenceConfiguration>({
  proxyUrl: 'https://proxy.scalar.com',
  spec: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
})

/** Pick a random example from the list */
function selectRandomExample() {
  // Get the index of the current item
  const currentIndex = urls.findIndex((example) => example.url === url.value)

  // Pick a random item, that’s not the current one
  let randomIndex: number

  do {
    randomIndex = Math.floor(Math.random() * urls.length)
  } while (randomIndex === currentIndex)

  // Update the selected item
  url.value = urls[randomIndex].url
}

/** Update configuration when URL changes */
watch(url, (newUrl) => {
  Object.assign(configuration, {
    spec: {
      url: newUrl,
    },
  })
})
</script>

<template>
  <header class="custom-header scalar-app">
    <div>
      <select v-model="url">
        <option
          v-for="example in urls"
          :key="example.url"
          :value="example.url">
          {{ example.name }}
        </option>
      </select>
      <button
        type="button"
        @click="selectRandomExample">
        Random
      </button>
    </div>
    <nav>
      <a
        href="https://github.com/scalar/scalar/issues/new/choose"
        target="_blank">
        New GitHub Issue
      </a>
    </nav>
  </header>
  <ApiReference :configuration="configuration" />
</template>

<style scoped>
:root {
  --scalar-custom-header-height: 100px;
}
.custom-header {
  height: var(--scalar-custom-header-height);
  background-color: var(--scalar-background-1);
  box-shadow: inset 0 -1px 0 var(--scalar-border-color);
  color: var(--scalar-color-1);
  font-size: var(--scalar-font-size-2);
  font-size: var(--scalar-font-size-2);
  position: sticky;
  justify-content: space-between;
  top: 0;
  z-index: 100;
  padding: 10px;
}

.custom-header {
  display: flex;
  align-items: center;
  gap: 18px;
}

.custom-header a:hover {
  color: var(--scalar-color-2);
}

select {
  padding: 5px 0 5px 5px;
}

button {
  padding: 5px 20px;
  display: inline-block;
}
</style>
