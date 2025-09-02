<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { ScalarIconChat } from '@scalar/icons'

const emit = defineEmits<{
  (e: 'click'): void
}>()

function handleClick() {
  emit('click')
}
</script>

<template>
  <ScalarButton @click="handleClick">
    <template #icon><ScalarIconChat class="size-full" /></template>
    Open Agent
  </ScalarButton>
</template>
