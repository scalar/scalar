<script setup lang="ts">
import { ScalarIcon, ScalarTooltip } from '@scalar/components'
import type { RequestExampleParameter } from '@scalar/oas-utils/entities/spec'

import { parameterIsInvalid } from '../libs/request'

const { item } = defineProps<{ item: RequestExampleParameter }>()
</script>
<template>
  <ScalarTooltip
    align="start"
    class="w-full pr-px"
    :delay="0"
    side="left"
    triggerClass="before:absolute before:content-[''] before:bg-gradient-to-r before:from-transparent before:to-b-1 group-[.alert]:before:to-b-alert group-[.error]:before:to-b-danger before:min-h-[calc(100%-4px)] before:pointer-events-none before:right-[23px] before:top-0.5 before:w-3 absolute h-full right-0 -outline-offset-1">
    <template #trigger>
      <div
        class="bg-b-1 mr-0.25 pl-1 pr-1.5 group-[.alert]:bg-transparent group-[.error]:bg-transparent">
        <ScalarIcon
          :class="
            parameterIsInvalid(item).value
              ? 'text-orange brightness-[.9]'
              : 'text-c-3 group-hover/info:text-c-1'
          "
          :icon="parameterIsInvalid(item).value ? 'Alert' : 'Info'"
          size="sm"
          thickness="1.5" />
      </div>
    </template>
    <template #content>
      <div
        class="w-content bg-b-1 text-xxs text-c-1 pointer-events-none grid min-w-48 gap-1.5 rounded p-2 leading-5 shadow-lg">
        <div
          v-if="parameterIsInvalid(item).value"
          class="text-error-1">
          {{ parameterIsInvalid(item).value }}
        </div>
        <div
          v-else-if="
            item.type ||
            item.format ||
            item.minimum ||
            item.maximum ||
            item.default
          "
          class="schema text-c-2 flex items-center">
          <span v-if="item.type">{{ item.type }}</span>
          <span v-if="item.format">{{ item.format }}</span>
          <span v-if="item.minimum">min: {{ item.minimum }}</span>
          <span v-if="item.maximum">max: {{ item.maximum }}</span>
          <span v-if="item.default">default: {{ item.default }}</span>
        </div>
        <span
          v-if="item.description && !parameterIsInvalid(item).value"
          class="text-pretty text-sm leading-snug"
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
