<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string | number
  enum?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const options = computed(() => props.enum ?? [])

const selected = ref<string>(props.modelValue.toString())
const addingCustomValue = ref(false)
const customValue = ref('')

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
</script>

<template>
  <div class="w-full">
    <template v-if="addingCustomValue">
      <input
        v-model="customValue"
        class="border-none focus:text-c-1 text-c-2 min-w-0 w-full px-2 py-1.5 outline-none"
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
          <span>{{ selected || 'Select a value' }}</span>
          <ScalarIcon
            v-if="!selected"
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
              class="flex items-center justify-center rounded-full p-[3px] group-hover/item:shadow-border"
              :class="
                isSelected(option) ? 'bg-blue text-b-1' : 'text-transparent'
              ">
              <ScalarIcon
                class="size-2.5 stroke-[1.75]"
                icon="Checkmark" />
            </div>
            {{ option }}
          </ScalarDropdownItem>
          <ScalarDropdownDivider />
          <ScalarDropdownItem
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
