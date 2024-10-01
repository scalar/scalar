<script setup lang="ts">
import { computed, ref } from 'vue'

import { snippetz } from '../../src/snippetz'

const targets = ['node', 'js']
const clients = ['undici', 'fetch', 'ofetch']

const targetId = ref('node')
const clientId = ref('undici')
const url = ref('https://example.com')

const snippet = computed(() =>
  snippetz().print('node', 'undici', {
    url: 'https://example.com',
  }),
)
</script>

<template>
  <div>@scalar/snippetz</div>
  <div>{{ snippet }}</div>
</template>

<style scoped>
button {
  font-weight: bold;
}
</style>
