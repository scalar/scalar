<script setup lang="ts">
import { ScalarIconLink } from '@scalar/icons'

defineProps<{
  name: string
  url: string
}>()
</script>

<template>
  <div
    class="group narrow:border-r-0 narrow:first:ml-0 flex items-center border-r first:ml-auto last:border-r-0">
    <a
      class="text-c-1 hover:bg-b-2 narrow:border mr-2 flex min-h-7 min-w-7 items-center rounded-lg px-2 py-1 no-underline group-last:mr-0"
      :href="url"
      rel="noopener noreferrer"
      target="_blank">
      <ScalarIconLink
        class="size-3 text-current"
        weight="bold" />
      <span class="ml-1 empty:hidden">{{ name }}</span>
    </a>
  </div>
</template>
