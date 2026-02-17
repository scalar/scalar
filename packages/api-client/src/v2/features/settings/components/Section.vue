<script setup lang="ts">
const slots = defineSlots<{
  title?: () => string
  description?: () => string
  actions?: () => unknown
  default: () => unknown
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-if="slots.title || slots.description"
      class="flex items-start justify-between gap-2">
      <div class="flex flex-col gap-2">
        <div
          v-if="slots.title"
          class="flex h-8 items-center">
          <h3 class="font-bold">
            <slot name="title" />
          </h3>
        </div>

        <p
          v-if="slots.description"
          class="text-c-2 mb-4 text-sm">
          <slot name="description" />
        </p>
      </div>

      <slot
        v-if="slots.actions"
        name="actions" />
    </div>

    <slot />
  </div>
</template>
