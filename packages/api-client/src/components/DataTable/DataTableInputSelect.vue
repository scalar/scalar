<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import { computed, nextTick, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    value?: string[]
    canAddCustomValue?: boolean
  }>(),
  { canAddCustomValue: true },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const options = computed(() => props.value ?? [])

const selected = ref<string>(props.modelValue.toString())
const addingCustomValue = ref(false)
const customValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(customValue, (newValue) => {
  emit('update:modelValue', newValue)
})

const updateSelected = (value: string) => {
  selected.value = value
  emit('update:modelValue', value)
  addingCustomValue.value = false
}

const addCustomValue = () => {
  if (customValue.value.trim()) {
    updateSelected(customValue.value)
    customValue.value = ''
  }
}

const handleBlur = () => {
  if (!customValue.value.trim()) {
    selected.value = ''
    addingCustomValue.value = false
  }
}

const isSelected = (value: string) => {
  return selected.value === value
}

watch(addingCustomValue, (newValue) => {
  if (newValue) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})
</script>

<template>
  <div class="w-full">
    <template v-if="addingCustomValue">
      <input
        ref="inputRef"
        v-model="customValue"
        class="border-none text-c-1 min-w-0 w-full px-2 py-1.5 outline-none"
        placeholder="Value"
        type="text"
        @blur="handleBlur"
        @keyup.enter="addCustomValue" />
    </template>
    <template v-else>
      <ScalarDropdown
        resize
        :value="selected">
        <ScalarButton
          class="gap-1.5 font-normal h-full justify-start px-2 py-1.5"
          fullWidth
          variant="ghost">
          <span class="text-c-1">{{ selected || 'Select a value' }}</span>
          <ScalarIcon
            icon="ChevronDown"
            size="xs" />
        </ScalarButton>
        <template #items>
          <ScalarDropdownItem
            v-for="option in options"
            :key="option"
            class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden"
            :value="option"
            @click="updateSelected(option)">
            <div
              class="flex items-center justify-center rounded-full p-[3px] w-4 h-4 group-hover/item:shadow-border"
              :class="
                isSelected(option) ? 'bg-blue text-b-1' : 'text-transparent'
              ">
              <ScalarIcon
                class="size-2.5"
                icon="Checkmark"
                thickness="3.5" />
            </div>
            {{ option }}
          </ScalarDropdownItem>
          <ScalarDropdownDivider />
          <ScalarDropdownItem
            v-if="canAddCustomValue"
            class="flex items-center gap-1.5"
            @click="addingCustomValue = true">
            <div class="flex items-center justify-center h-4 w-4">
              <ScalarIcon
                class="h-2.5"
                icon="Add" />
            </div>
            <span>Add value</span>
          </ScalarDropdownItem>
        </template>
      </ScalarDropdown>
    </template>
  </div>
</template>
