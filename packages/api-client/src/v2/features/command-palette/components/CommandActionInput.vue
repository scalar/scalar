<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
  autofocus?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'onDelete', event: KeyboardEvent): void
}>()

defineOptions({ inheritAttrs: false })

const input = ref<HTMLInputElement | null>(null)
onMounted(() =>
  nextTick(() => {
    if (!props.autofocus) {
      input.value?.focus()
    }
  }),
)

const model = computed<string>({
  get: () => props.modelValue ?? '',
  set: (v) => emit('update:modelValue', v),
})

/** Re-emits enter as a submit event for the form  */
function handleEnter(event: KeyboardEvent) {
  if (event.shiftKey || !event.target) {
    return
  }
  event.preventDefault()
  const target = event.target as HTMLTextAreaElement
  const submitEvent = new Event('submit', { cancelable: true })
  target.form?.dispatchEvent(submitEvent)
}

/** Emits a back event if the input is empty */
function handleBack(event: KeyboardEvent) {
  if (model.value !== '') {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  emit('onDelete', event)
}
</script>
<template>
  <textarea
    id="command-action-input"
    ref="input"
    v-model="model"
    class="min-h-8 w-full flex-1 resize-none border border-transparent py-1.5 pl-8.5 text-sm outline-none focus:border-b-1"
    :placeholder="props.placeholder ?? ''"
    wrap="hard"
    v-bind="$attrs"
    @keydown.delete="handleBack($event)"
    @keydown.enter="handleEnter($event)" />
</template>
