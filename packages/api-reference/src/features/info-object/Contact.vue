<script setup lang="ts">
import { ScalarIconEnvelopeSimple, ScalarIconLink } from '@scalar/icons'
import { cva } from '@scalar/use-hooks/useBindCx'
import type { ContactObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

defineProps<{
  value?: ContactObject
}>()

const variants = cva({
  base: 'text-c-1 mr-2 flex min-h-7 min-w-7 items-center rounded-lg px-2 py-1 group-last:mr-0 narrow:border',
  variants: {
    link: {
      true: 'no-underline hover:bg-b-2',
    },
  },
})
</script>

<template>
  <template v-if="value">
    <!-- Each link gets its own wrapper so the dividers render between them -->
    <div
      v-if="value.email"
      class="group narrow:border-r-0 narrow:first:ml-0 flex items-center border-r first:ml-auto last:border-r-0">
      <a
        :class="variants({ link: true })"
        :href="`mailto:${value.email}`">
        <ScalarIconEnvelopeSimple
          class="size-3 text-current"
          weight="bold" />
        <span class="ml-1 empty:hidden">{{ value.name }}</span>
      </a>
    </div>
    <div
      v-if="value.url"
      class="group narrow:border-r-0 narrow:first:ml-0 flex items-center border-r first:ml-auto last:border-r-0">
      <a
        :class="variants({ link: true })"
        :href="value.url"
        rel="noopener noreferrer"
        target="_blank">
        <ScalarIconLink
          class="size-3 text-current"
          weight="bold" />
        <!-- Avoid repeating the name when the email link already shows it -->
        <span class="ml-1 empty:hidden">{{
          value.email ? '' : value.name
        }}</span>
      </a>
    </div>
    <div
      v-else-if="!value.email && value.name"
      class="group narrow:border-r-0 narrow:first:ml-0 flex items-center border-r first:ml-auto last:border-r-0">
      <span :class="variants({ link: false })">
        {{ value.name }}
      </span>
    </div>
  </template>
</template>
