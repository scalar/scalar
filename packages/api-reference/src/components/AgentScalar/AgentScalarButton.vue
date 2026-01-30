<script setup lang="ts">
import { ScalarIconSparkle } from '@scalar/icons'

const showAgenScalar = defineModel<boolean>({ default: false })

const handleClick = () => (showAgenScalar.value = !showAgenScalar.value)
</script>

<template>
  <button
    class="bg-sidebar-b-search text-sidebar-c-2 hover:text-sidebar-c-1 flex items-center gap-1.5 rounded border px-2 text-base whitespace-nowrap"
    type="button"
    @click="handleClick">
    <ScalarIconSparkle />
    Ask AI
  </button>
</template>
