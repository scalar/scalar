<script setup lang="ts">
import { ScalarCodeBlock } from '@scalar/components'
import { computed, ref } from 'vue'

import { snippetz } from '../../src/snippetz'

const pluginsMap = {
  'node-undici': {
    target: 'node',
    client: 'undici',
  },
  'node-fetch': {
    target: 'node',
    client: 'fetch',
  },
  'js-fetch': {
    target: 'js',
    client: 'fetch',
  },
  'js-ofetch': {
    target: 'js',
    client: 'ofetch',
  },
  'node-ofetch': {
    target: 'node',
    client: 'ofetch',
  },
}
const pluginKeys = Object.keys(pluginsMap)

const plugin = ref('node-undici')
const url = ref('https://example.com')

const snippet = computed(() =>
  snippetz().print(
    // @ts-ignore
    pluginsMap[plugin.value].target,
    // @ts-ignore
    pluginsMap[plugin.value].client,
    {
      url: url.value,
    },
  ),
)
</script>

<template>
  <div>@scalar/snippetz</div>
  <div>
    request url:
    <input
      v-model="url"
      type="text" />
  </div>
  <div>
    Select target-client:
    <select v-model="plugin">
      <option
        v-for="key in pluginKeys"
        :key="key"
        :value="key">
        {{ key }}
      </option>
    </select>
  </div>
  <ScalarCodeBlock
    :content="snippet"
    lineNumbers>
  </ScalarCodeBlock>
</template>

<style scoped></style>
