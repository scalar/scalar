<script setup lang="ts">
import { ScalarCodeBlock } from '@scalar/components'
import { computed, ref } from 'vue'

import type { ClientId, TargetId } from '../../src/core'
import { snippetz } from '../../src/snippetz'

const targets: TargetId[] = ['node', 'js']
const clients: ClientId[] = ['undici', 'fetch', 'ofetch']

const targetId = ref(targets[0])
const clientId = ref(clients[0])
const url = ref('https://example.com')

const snippet = computed(() =>
  snippetz().print(targetId.value, clientId.value, {
    url: 'https://example.com',
  }),
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
    Target:
    <select v-model="targetId">
      <option
        v-for="target in targets"
        :key="target"
        :value="target">
        {{ target }}
      </option>
    </select>
  </div>
  <div>
    Client:
    <select v-model="targetId">
      <option
        v-for="client in clients"
        :key="client"
        :value="client">
        {{ client }}
      </option>
    </select>
  </div>
  <ScalarCodeBlock v-bind="{ content: snippet }"></ScalarCodeBlock>
</template>

<style scoped></style>
