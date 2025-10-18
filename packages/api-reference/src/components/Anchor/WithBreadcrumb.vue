<script setup lang="ts">
import { ScalarIconLink } from '@scalar/icons'

const { breadcrumb } = defineProps<{
  breadcrumb?: string[]
}>()

const emit = defineEmits<{
  (e: 'copyAnchorUrl', id: string): void
}>()
</script>

<template>
  <template v-if="breadcrumb && breadcrumb.length > 0">
    <div
      :id="breadcrumb.join('.')"
      class="relative scroll-mt-24">
      <!-- Content -->
      <slot />
      <button
        class="text-c-3 hover:text-c-1 absolute -top-2 -left-4.5 flex h-[calc(100%+16px)] w-4.5 cursor-pointer items-center justify-center pr-1.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        type="button"
        @click="() => emit('copyAnchorUrl', breadcrumb.join('.'))">
        <!-- Copy button -->
        <ScalarIconLink
          class="size-3"
          weight="bold" />
        <span class="sr-only">
          <slot name="sr-label">Copy link to <slot /></slot>
        </span>
      </button>
    </div>
  </template>
  <template v-else>
    <slot />
  </template>
</template>
