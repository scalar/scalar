<script setup lang="ts">
import { ScalarPopover } from '@scalar/components'
import { ScalarIconInfo, ScalarIconWarning } from '@scalar/icons'
import type { RequestExampleParameter } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

import { parameterIsInvalid } from '../libs/request'

const { item } = defineProps<{ item: RequestExampleParameter }>()

const isInvalid = computed(() => !!parameterIsInvalid(item).value)
</script>
<template>
  <ScalarPopover
    teleport
    :offset="4"
    placement="left">
    <button
      type="button"
      :aria-label="isInvalid ? 'Input is invalid' : 'More Information'"
      class="text-c-2 hover:text-c-1 hover:bg-b-2 rounded p-1"
      :role="isInvalid ? 'alert' : 'none'">
      <ScalarIconWarning
        v-if="isInvalid"
        class="text-orange size-3.5 brightness-90 hover:brightness-75" />
      <ScalarIconInfo
        v-else
        class="text-c-2 hover:text-c-1 size-3.5" />
    </button>
    <template #popover>
      <div
        class="w-content text-xxs text-c-1 grid min-w-48 gap-1.5 rounded px-1.5 pt-2 pb-1.5 leading-none">
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
          class="text-sm leading-snug text-pretty"
          :style="{ maxWidth: '16rem' }">
          {{ item.description }}
        </span>
      </div>
    </template>
  </ScalarPopover>
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
