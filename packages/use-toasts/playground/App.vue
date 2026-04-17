<script setup lang="ts">
import '@scalar/themes/style.css'

import { ScalarToasts, useToasts } from '../src'

const { toast } = useToasts()
</script>

<template>
  <button
    type="button"
    @click="toast('This is an info toast')">
    Info
  </button>
  <button
    type="button"
    @click="toast('Something went wrong', 'error')">
    Error
  </button>
  <button
    type="button"
    @click="toast('Be careful', 'warn')">
    Warning
  </button>
  <button
    type="button"
    @click="
      toast('File uploaded', 'info', {
        description: 'Your file has been uploaded successfully.',
      })
    ">
    With description
  </button>
  <ScalarToasts />
</template>

<style scoped>
button {
  display: inline-block;
  padding: 0.5rem 1rem;
  margin: 1rem;
  background-color: var(--scalar-background-1);
  border-radius: var(--scalar-radius-lg);
}
</style>
