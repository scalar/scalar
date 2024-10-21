<script setup lang="ts">
import { ScalarIcon, ScalarTooltip } from '@scalar/components'
import type { RequestExampleParameter } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

const props = defineProps<{ item: RequestExampleParameter }>()

const hasItemProperties = computed(
  () =>
    props.item.type ||
    props.item.format ||
    props.item.minimum ||
    props.item.maximum ||
    props.item.default,
)
</script>
<template>
  <ScalarTooltip
    align="start"
    class="w-full"
    :delay="0"
    side="left"
    triggerClass="before:absolute before:content-[''] before:bg-gradient-to-r before:from-transparent before:to-b-1 before:min-h-full before:right-[23px] before:w-3 absolute h-full right-0">
    <template #trigger>
      <div class="pl-1 pr-1.5 py-[9px]">
        <ScalarIcon
          class="text-c-3 group-hover/info:text-c-1"
          icon="Info"
          size="sm"
          thickness="1.5" />
      </div>
    </template>
    <template #content>
      <div
        class="grid gap-1.5 pointer-events-none min-w-48 w-content shadow-lg rounded bg-b-1 p-2 text-xxs leading-5 text-c-1">
        <div
          v-if="hasItemProperties"
          class="flex items-center text-c-2">
          <span v-if="props.item.type">{{ props.item.type }}</span>
          <span
            v-if="props.item.format"
            class="before:content-['·'] before:block before:mx-[0.5ch] flex"
            >{{ props.item.format }}</span
          >
          <span
            v-if="props.item.minimum"
            class="before:content-['·'] before:block before:mx-[0.5ch] flex whitespace-nowrap"
            >min: {{ props.item.minimum }}</span
          >
          <span
            v-if="props.item.maximum"
            class="before:content-['·'] before:block before:mx-[0.5ch] flex whitespace-nowrap"
            >max: {{ props.item.maximum }}</span
          >
          <span
            v-if="props.item.default"
            class="before:content-['·'] before:block before:mx-[0.5ch] flex whitespace-nowrap"
            >default: {{ props.item.default }}</span
          >
        </div>
        <span
          v-if="props.item.description"
          class="leading-snug text-pretty text-sm"
          :style="{ maxWidth: '16rem' }"
          >{{ props.item.description }}</span
        >
      </div>
    </template>
  </ScalarTooltip>
</template>
