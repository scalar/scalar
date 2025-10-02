<script lang="ts" setup>
import { ScalarFloatingBackdrop, ScalarPopover } from '@scalar/components'
import { ScalarIconCaretDown, ScalarIconInfo } from '@scalar/icons'
</script>
<template>
  <ScalarPopover
    class="max-h-[inherit] max-w-[inherit] p-0 text-base"
    placement="bottom-end"
    teleport>
    <template #default="{ open }">
      <slot
        name="button"
        :open>
        <button
          class="text-c-2 hover:text-c-1 hover:bg-b-2 flex items-center gap-1 rounded px-2 py-2.25 text-base leading-none">
          <slot name="label" />
          <ScalarIconCaretDown
            class="transition-transform"
            :class="{ 'rotate-180': open }" />
        </button>
      </slot>
    </template>
    <template #popover="props">
      <div class="custom-scroll bg-b-1 flex flex-col gap-7 rounded-lg p-7 pb-6">
        <slot v-bind="props" />
      </div>
      <div class="text-c-2 flex items-center justify-center gap-1 p-2 text-sm">
        <ScalarIconInfo class="size-3.5 shrink-0" />
        <div>
          <slot name="info">
            "<slot name="label" />" will only appear when running on localhost.
          </slot>
        </div>
      </div>
    </template>
    <template #backdrop>
      <ScalarFloatingBackdrop class="bg-b-2 rounded-lg" />
    </template>
  </ScalarPopover>
</template>
