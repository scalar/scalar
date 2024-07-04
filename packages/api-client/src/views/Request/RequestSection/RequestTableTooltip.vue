<script setup lang="ts">
import { ScalarIcon, ScalarTooltip } from '@scalar/components'
import type { RequestExampleParameter } from '@scalar/oas-utils/entities/workspace/spec'

defineProps<{ item: RequestExampleParameter }>()
</script>
<template>
  <ScalarTooltip
    align="start"
    class="w-64"
    :delay="0"
    side="left"
    triggerClass="p-[7px]">
    <template #trigger>
      <ScalarIcon
        class="ml-1 text-c-3 group-hover/info:text-c-1"
        icon="Info"
        size="sm" />
    </template>
    <template #content>
      <div
        class="grid gap-1.5 pointer-events-none min-w-48 w-content shadow-lg rounded bg-b-1 z-100 p-2 text-xxs leading-5 z-10 text-c-1">
        <div class="flex items-center text-c-2">
          <span v-if="item.type">{{ item.type }}</span>
          <span
            v-if="item.format"
            class="before:content-['·'] before:block before:mx-[0.5ch] flex"
            >{{ item.format }}</span
          >
          <span
            v-if="item.default"
            class="before:content-['·'] before:block before:mx-[0.5ch] flex whitespace-pre"
            >default: {{ item.default }}</span
          >
        </div>
        <span class="leading-snug text-pretty text-sm">{{
          item.description
        }}</span>
      </div>
    </template>
  </ScalarTooltip>
</template>
