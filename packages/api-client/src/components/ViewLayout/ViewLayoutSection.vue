<script setup lang="ts">
import { nanoid } from 'nanoid'

const id = nanoid()
</script>
<template>
  <section
    :aria-labelledby="id"
    class="flex xl:min-w-0 xl:flex-1 flex-col xl:custom-scroll bg-b-1">
    <div
      :id="id"
      class="xl:min-h-header py-2.5 flex items-center border-b px-4 xl:px-6 text-sm font-medium sticky top-0 bg-b-1 z-20 rounded-t xl:rounded-none">
      <slot name="title" />
    </div>
    <slot />
  </section>
</template>
