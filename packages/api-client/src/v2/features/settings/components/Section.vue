<script setup lang="ts">
defineSlots<{
  title?: () => string
  description?: () => string
  default: () => any
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <template v-if="$slots.title">
      <h3 class="font-bold">
        <slot name="title" />
      </h3>
    </template>

    <template v-if="$slots.description">
      <p class="text-c-2 mb-4 leading-[21px]">
        <slot name="description" />
      </p>
    </template>

    <slot />
  </div>
</template>
