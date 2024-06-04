<script setup lang="ts">
import { nanoid } from 'nanoid'

const id = nanoid()
</script>
<template>
  <section
    :aria-labelledby="id"
    class="flex min-w-0 flex-1 flex-col overflow-y-scroll border-b last:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0">
    <div
      :id="id"
      class="min-h-header h-header flex items-center border-b px-6 text-sm font-medium">
      <slot name="title" />
    </div>
    <slot />
  </section>
</template>
