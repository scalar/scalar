<script setup lang="ts">
import { ScalarIcon, ScalarTooltip } from '@scalar/components'
import type { RequestExampleParameter } from '@scalar/oas-utils/entities/spec'

defineProps<{ item: RequestExampleParameter }>()
</script>
<template>
  <ScalarTooltip
    align="start"
    class="w-full pr-px"
    :delay="0"
    side="left"
    triggerClass="before:absolute before:content-[''] before:bg-gradient-to-r before:from-transparent before:to-b-1 before:min-h-[calc(100%-4px)] before:pointer-events-none before:right-[23px] before:top-0.5 before:w-3 absolute h-full right-0 -outline-offset-1">
    <template #trigger>
      <div class="bg-b-1 pl-1 pr-1.5 mr-0.25">
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
        <div class="schema flex items-center text-c-2">
          <span v-if="item.type">{{ item.type }}</span>
          <span v-if="item.format">{{ item.format }}</span>
          <span v-if="item.minimum">min: {{ item.minimum }}</span>
          <span v-if="item.maximum">max: {{ item.maximum }}</span>
          <span v-if="item.default">default: {{ item.default }}</span>
        </div>
        <span
          v-if="item.description"
          class="leading-snug text-pretty text-sm"
          :style="{ maxWidth: '16rem' }"
          >{{ item.description }}</span
        >
      </div>
    </template>
  </ScalarTooltip>
</template>
<style scoped>
.schema > span:not(:first-child)::before {
  content: '·';
  display: block;
  margin: 0 0.5ch;
}

.schema > span {
  display: flex;
  white-space: nowrap;
}
</style>
