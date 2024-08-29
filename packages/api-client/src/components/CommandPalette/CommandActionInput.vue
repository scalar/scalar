<script setup lang="ts">
import { nanoid } from 'nanoid'
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

defineOptions({ inheritAttrs: false })

const id = nanoid

const input = ref<HTMLInputElement | null>(null)
onMounted(() => {
  input.value?.focus()
})

const model = computed<string>({
  get: () => props.modelValue ?? '',
  set: (v) => emit('update:modelValue', v),
})
</script>
<template>
  <label
    class="absolute w-full h-full opacity-0 cursor-text"
    :for="id"></label>
  <input
    :id="id"
    ref="input"
    v-model="model"
    autocomplete="off"
    class="border-transparent outline-none w-full pl-8 text-sm min-h-8 py-1.5"
    data-form-type="other"
    data-lpignore="true"
    v-bind="$attrs" />
</template>
