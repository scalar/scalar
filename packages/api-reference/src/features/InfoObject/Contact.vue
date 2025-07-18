<script setup lang="ts">
import { cva } from '@scalar/components'
import { ScalarIconEnvelopeSimple } from '@scalar/icons'
import { type OpenAPIV3_1 } from '@scalar/openapi-types'

const variants = cva({
  base: 'text-c-1 mr-2 flex min-h-7 min-w-7 items-center rounded-lg border px-2 py-1 group-last:mr-0 xl:border-none',
  variants: {
    link: {
      true: 'no-underline hover:bg-b-2',
    },
  },
})

defineProps<{
  value?: OpenAPIV3_1.ContactObject
}>()
</script>

<template>
  <template v-if="value">
    <div
      class="group flex items-center last:border-r-0 xl:border-r xl:first:ml-auto">
      <a
        v-if="value?.email"
        :class="variants({ link: true })"
        :href="`mailto:${value?.email}`">
        <ScalarIconEnvelopeSimple
          weight="bold"
          class="size-3 text-current" />
        <span class="ml-1 empty:hidden">{{ value.name }}</span>
      </a>
      <span
        v-else-if="value?.name"
        :class="variants({ link: false })">
        {{ value.name }}
      </span>
    </div>
  </template>
</template>
