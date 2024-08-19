<script setup lang="ts">
import { ScalarIcon, ScalarListbox } from '@scalar/components'
import { getHttpMethodInfo } from '@scalar/oas-utils/helpers'
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

const method = computed(() => getHttpMethodInfo(props.method))

const methodOptions = Object.entries(REQUEST_METHODS).map(
  ([id, { short }]) => ({
    id: id as RequestMethod,
    label: id.charAt(0) + id.toLowerCase().slice(1),
  }),
)
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
      true: 'px-0 http-bg-gradient rounded-md border-1/2 border-r-1/2',
      false: 'cusor-pointer',
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
        class="relative h-full"
        :class="cx(variants({ isSquare, isEditable }), method.color)"
        type="button">
        <span>{{ httpLabel }}</span>
      </button>
    </div>
  </ScalarListbox>
  <!-- Display only -->
  <div
    v-else
    class="relative gap-1 whitespace-nowrap"
    :class="cx(variants({ isSquare, isEditable }), method.color)"
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
