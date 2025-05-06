<script setup lang="ts">
import { computed } from '@vue/reactivity'

import { createWorkspace } from '@/create-workspace'

const workspace = createWorkspace()

workspace.load('galaxy', async () => {
  const response = await fetch(
    'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  )

  return response.json()
})

workspace.load('stripe', async () => {
  const response = await fetch(
    'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json',
  )

  return response.json()
})

const collections = computed(() => workspace.state.collections)
</script>
<template>
  <div>
    <h1>Scalar Store</h1>
    {{ collections.galaxy?.document?.info?.title }}
  </div>
</template>
