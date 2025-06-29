<script setup lang="ts">
import { useBindCx } from '@scalar/components'

defineOptions({ inheritAttrs: false })

const { cx } = useBindCx()
</script>

<template>
  <section
    v-bind="
      cx('xl:custom-scroll bg-b-1 flex flex-1 flex-col xl:h-full xl:min-w-0')
    ">
    <div
      v-if="$slots.title"
      class="request-response-header bg-b-1 -mb-1/2 sticky top-0 z-1 flex min-h-11 items-center border-b px-2.5 text-base font-medium xl:rounded-none">
      <slot name="title" />
    </div>
    <slot />
  </section>
</template>
