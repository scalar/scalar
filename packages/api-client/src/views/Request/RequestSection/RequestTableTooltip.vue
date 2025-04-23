<script setup lang="ts">
import { ScalarTooltip } from '@scalar/components'
import { ScalarIconInfo, ScalarIconWarning } from '@scalar/icons'
import type { RequestExampleParameter } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

import { parameterIsInvalid } from '../libs/request'

const { item } = defineProps<{ item: RequestExampleParameter }>()

const isInvalid = computed(() => !!parameterIsInvalid(item).value)
</script>
<template>
  <ScalarTooltip
    align="start"
    class="w-full pr-px"
    :delay="0"
    side="left"
    triggerClass="py-1">
    <template #trigger>
      <div
        :aria-label="isInvalid ? 'Input is invalid' : 'More Information'"
        class="bg-b-1 px-1 group-[.alert]:bg-transparent group-[.error]:bg-transparent"
        :role="isInvalid ? 'alert' : 'none'">
        <ScalarIconWarning
          v-if="isInvalid"
          class="text-orange size-3.5 brightness-[.9]" />
        <ScalarIconInfo
          v-else
          class="text-c-2 hover:text-c-1 size-3.5" />
      </div>
    </template>
    <template #content>
      <div
        class="w-content bg-b-1 text-xxs text-c-1 pointer-events-none grid min-w-48 gap-1.5 rounded p-2 leading-5 shadow-lg">
        <div
          v-if="isInvalid"
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
          v-if="item.description && !isInvalid"
          class="text-pretty text-sm leading-snug"
          :style="{ maxWidth: '16rem' }">
          {{ item.description }}
        </span>
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
