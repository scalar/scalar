<script setup lang="ts">
import { cva, cx, ScalarListbox } from '@scalar/components'
import {
  getHttpMethodInfo,
  REQUEST_METHODS,
} from '@scalar/helpers/http/http-info'
import type { RequestMethod } from '@scalar/oas-utils/entities/spec'
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

const method = computed(() => getHttpMethodInfo(props.method))
const methodOptions = Object.entries(REQUEST_METHODS).map(([id]) => ({
  id: id as RequestMethod,
  label: id.toUpperCase(),
  color: getHttpMethodInfo(id).colorClass,
}))
const selectedMethod = computed({
  get: () => methodOptions.find(({ id }) => id === props.method),
  set: (opt) => opt?.id && emit('change', opt.id),
})

const variants = cva({
  base: 'text-center font-code text-3xs justify-center items-center flex',
  variants: {
    isSquare: {
      true: 'px-2.5 whitespace-nowrap font-bold border-r h-fit m-auto',
      false: 'rounded-full',
    },
    isEditable: {
      true: 'http-bg-gradient rounded-md border border-r',
      false: 'cursor-auto',
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
    class="font-code scalar-client mt-1 text-sm"
    :options="methodOptions">
    <div
      class="h-full"
      :class="{ 'pointer-events-none': !isEditable }">
      <button
        class="relative h-full"
        :class="cx(variants({ isSquare, isEditable }), method.colorClass)"
        type="button">
        <span>{{ httpLabel }}</span>
      </button>
    </div>
  </ScalarListbox>
  <!-- Display only -->
  <div
    v-else
    class="relative gap-1 whitespace-nowrap"
    :class="cx(variants({ isSquare, isEditable }), method.colorClass)"
    type="button">
    {{ method.short }}
  </div>
</template>
<style scoped>
.http-bg-gradient {
  background: linear-gradient(rgba(255, 255, 255, 0.75), rgba(0, 0, 0, 0.035));
}
.http-bg-gradient:hover {
  background: linear-gradient(rgba(0, 0, 0, 0.035), rgba(255, 255, 255, 0.75));
}
.dark-mode .http-bg-gradient {
  background: linear-gradient(rgba(255, 255, 255, 0.035), rgba(0, 0, 0, 0.15));
}
.dark-mode .http-bg-gradient:hover {
  background: linear-gradient(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.035));
}
</style>
