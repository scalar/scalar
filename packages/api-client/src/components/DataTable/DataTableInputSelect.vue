<script setup lang="ts">
import {
  ScalarButton,
  ScalarComboboxMultiselect,
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
    default?: string | number
    canAddCustomValue?: boolean
    type?: string
  }>(),
  { canAddCustomValue: true },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const options = computed(() => props.value ?? [])
const addingCustomValue = ref(false)
const customValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(customValue, (newValue) => {
  emit('update:modelValue', newValue)
})

const updateSelected = (value: string) => {
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
    emit('update:modelValue', '')
    addingCustomValue.value = false
  }
}

const isSelected = (value: string) => {
  return props.modelValue.toString() === value
}

watch(addingCustomValue, (newValue) => {
  if (newValue) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

const initialValue = computed(() => {
  return props.modelValue !== undefined ? props.modelValue : props.default
})

/** Currently selected array example values */
const selectedArrayOptions = computed(() => {
  const selectedValues = new Set(props.modelValue.toString().split(', '))
  return options.value
    .filter((option) => selectedValues.has(option))
    .map((option) => ({ id: option, label: option, value: option }))
})

/** Options for the array type */
const arrayOptions = computed(() =>
  options.value.map((option) => ({ id: option, label: option, value: option })),
)

/** Update the model value when the selected options change */
const updateSelectedOptions = (selectedOptions: any) => {
  const selectedValues = selectedOptions.map((option: any) => option.value)
  emit('update:modelValue', selectedValues.join(', '))
}
</script>

<template>
  <div
    class="pr-4 w-full has-[:focus-visible]:outline has-[:focus-visible]:rounded-[4px] -outline-offset-1">
    <template v-if="type === 'array'">
      <ScalarComboboxMultiselect
        :modelValue="selectedArrayOptions"
        :options="arrayOptions"
        @update:modelValue="updateSelectedOptions">
        <ScalarButton
          class="gap-1.5 font-normal h-full justify-start px-2 py-1.5 custom-scroll pr-6 outline-none"
          fullWidth
          variant="ghost">
          <span class="text-c-1 whitespace-nowrap">{{
            selectedArrayOptions.length > 0
              ? selectedArrayOptions.map((option) => option.label).join(', ')
              : 'Select a value'
          }}</span>
          <ScalarIcon
            icon="ChevronDown"
            size="md" />
        </ScalarButton>
      </ScalarComboboxMultiselect>
    </template>
    <template v-else-if="addingCustomValue">
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
        :value="initialValue">
        <ScalarButton
          class="gap-1.5 font-normal h-full justify-start px-2 py-1.5 outline-none"
          fullWidth
          variant="ghost">
          <span class="text-c-1">{{ initialValue || 'Select a value' }}</span>
          <ScalarIcon
            icon="ChevronDown"
            size="md" />
        </ScalarButton>
        <template #items>
          <ScalarDropdownItem
            v-for="option in options"
            :key="option"
            class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden"
            :value="option"
            @click="updateSelected(option)">
            <div
              class="flex items-center justify-center rounded-full p-[3px] w-4 h-4"
              :class="
                isSelected(option)
                  ? 'bg-c-accent text-b-1'
                  : 'shadow-border text-transparent'
              ">
              <ScalarIcon
                class="size-2.5"
                icon="Checkmark"
                thickness="3" />
            </div>
            {{ option }}
          </ScalarDropdownItem>

          <template v-if="canAddCustomValue">
            <ScalarDropdownDivider v-if="options.length" />
            <ScalarDropdownItem
              class="flex items-center gap-1.5"
              @click="addingCustomValue = true">
              <div class="flex items-center justify-center h-4 w-4">
                <ScalarIcon
                  icon="Add"
                  size="sm" />
              </div>
              <span>Add value</span>
            </ScalarDropdownItem>
          </template>
        </template>
      </ScalarDropdown>
    </template>
  </div>
</template>
