<script setup lang="ts">
import TreeView from '../components/TreeView.vue'

// Circular reference
const schema = {
  type: 'object',
  properties: {
    obj: { type: 'string' },
  },
}

schema.properties.obj = schema
</script>

<template>
  <div>
    <h1 class="mb-4 text-2xl font-bold">Circular Reference</h1>
  </div>
  <div>
    <TreeView :value="schema" />
  </div>
</template>
