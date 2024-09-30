<script setup lang="ts">
import '@scalar/api-reference/style.css'
import { reactive, ref } from 'vue'

import { ApiReference, type ReferenceConfiguration } from '../../../src'
import { examples } from './examples'

/** OpenAPI document URL */
const url = ref<string>(examples[0].url)

/** Configuration */
const configuration = reactive<ReferenceConfiguration>({
  proxy: 'https://proxy.scalar.com',
  spec: {
    url,
  },
})

/** Pick a random example from the list */
function selectRandomExample() {
  // Get the index of the current item
  const currentIndex = examples.findIndex(
    (example) => example.url === url.value,
  )

  // Pick a random item, that’s not the current one
  let randomIndex: number

  do {
    randomIndex = Math.floor(Math.random() * examples.length)
  } while (randomIndex === currentIndex)

  // Update the selected item
  url.value = examples[randomIndex].url
}
</script>

<template>
  <header class="custom-header scalar-app">
    <div>
      <select v-model="url">
        <option
          v-for="(example, index) in examples"
          :key="index"
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
