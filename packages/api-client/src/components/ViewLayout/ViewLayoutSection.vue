<script setup lang="ts">
import { useBindCx } from '@scalar/components'

const { cx } = useBindCx()
</script>

<template>
  <section
    v-bind="
      cx('xl:custom-scroll bg-b-1 flex flex-1 flex-col xl:h-full xl:min-w-0')
    ">
    <div
      v-if="$slots.title"
      class="bg-b-1 z-1 sticky top-0 flex min-h-11 items-center border-b px-2.5 text-sm font-medium xl:rounded-none">
      <slot name="title" />
    </div>
    <slot />
  </section>
</template>
