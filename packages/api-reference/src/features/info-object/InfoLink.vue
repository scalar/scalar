<script setup lang="ts">
import { ScalarIconLink } from '@scalar/icons'

defineProps<{
  name: string
  url: string
}>()
</script>

<template>
  <div
    class="group flex items-center last:border-r-0 xl:border-r xl:first:ml-auto">
    <a
      class="text-c-1 hover:bg-b-2 mr-2 flex min-h-7 min-w-7 items-center rounded-lg border px-2 py-1 no-underline group-last:mr-0 xl:border-none"
      :href="url"
      target="_blank"
      rel="noopener noreferrer">
      <ScalarIconLink
        weight="bold"
        class="size-3 text-current" />
      <span class="ml-1 empty:hidden">{{ name }}</span>
    </a>
  </div>
</template>
