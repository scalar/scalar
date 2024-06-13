<script setup lang="ts">
import { ScalarIcon, ScalarListbox } from '@scalar/components'
import {
  REQUEST_METHODS,
  type RequestMethod,
  getRequest,
} from '@scalar/oas-utils/helpers'
import { cva, cx } from 'cva'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    isSquare?: boolean
    method: string
    isEditable?: boolean
  }>(),
  { isSquare: false, isDisable: false, isEditable: false },
)

const emit = defineEmits<{
  (e: 'change', value: RequestMethod): void
}>()

const method = computed(() => getRequest(props.method))

const methodOptions = Object.entries(REQUEST_METHODS).map(
  ([id, { short }]) => ({ id: id as RequestMethod, label: short }),
)
const selectedMethod = computed({
  get: () => methodOptions.find(({ id }) => id === props.method),
  set: (opt) => opt?.id && emit('change', opt.id),
})

const variants = cva({
  base: 'text-center font-code text-3xs justify-center items-center flex',
  variants: {
    isSquare: {
      true: 'px-2.5 rounded-md bg-mix-transparent bg-mix-amount-90 dark:bg-mix-amount-80 hover:bg-mix-b-2',
      false: 'rounded-full',
    },
    isEditable: {
      true: 'px-0',
    },
  },
})

const httpLabel = computed(() => method.value.short)
</script>
<template>
  <!-- Dropdown select -->
  <ScalarListbox
    v-if="isEditable"
    v-model="selectedMethod"
    :options="methodOptions">
    <div
      class="h-full"
      :class="{ 'pointer-events-none': !isEditable }">
      <button
        class="relative h-full cursor-pointer gap-1"
        :class="
          cx(
            variants({ isSquare, isEditable }),
            method.color,
            isSquare && method.backgroundColor,
          )
        "
        type="button">
        <span>{{ httpLabel }}</span>
        <ScalarIcon
          v-if="isEditable"
          :class="method.color"
          icon="ChevronDown"
          size="xs" />
      </button>
    </div>
  </ScalarListbox>
  <!-- Display only -->
  <div
    v-else
    class="relative cursor-pointer gap-1"
    :class="
      cx(
        variants({ isSquare, isEditable }),
        method.color,
        isSquare && method.backgroundColor,
      )
    "
    type="button">
    {{ method.short }}
  </div>
</template>
