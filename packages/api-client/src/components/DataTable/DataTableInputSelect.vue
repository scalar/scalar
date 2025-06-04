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
    default?: string | number | undefined
    canAddCustomValue?: boolean
    type?: string | undefined
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
  }
}

const handleBlur = () => {
  if (!customValue.value.trim()) {
    emit('update:modelValue', '')
  }
  addingCustomValue.value = false
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
    class="group-[.alert]:outline-orange group-[.error]:outline-red w-full pr-10 -outline-offset-1 has-[:focus-visible]:rounded-[4px] has-[:focus-visible]:outline">
    <template v-if="type === 'array'">
      <ScalarComboboxMultiselect
        :modelValue="selectedArrayOptions"
        :options="arrayOptions"
        @update:modelValue="updateSelectedOptions">
        <ScalarButton
          class="custom-scroll h-full justify-start gap-1.5 px-2 py-1.5 pr-6 font-normal outline-none"
          fullWidth
          variant="ghost">
          <span class="text-c-1 whitespace-nowrap">{{
            selectedArrayOptions.length > 0
              ? selectedArrayOptions.map((option) => option.label).join(', ')
              : 'Select a value'
          }}</span>
          <ScalarIcon
            icon="ChevronDown"
            size="md"
            class="min-w-4" />
        </ScalarButton>
      </ScalarComboboxMultiselect>
    </template>
    <template v-else-if="addingCustomValue">
      <input
        ref="inputRef"
        v-model="customValue"
        class="text-c-1 w-full min-w-0 border-none px-2 py-1.5 outline-none"
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
          class="h-full justify-start gap-1.5 overflow-auto px-2 py-1.5 font-normal whitespace-nowrap outline-none"
          fullWidth
          variant="ghost">
          <span class="text-c-1 overflow-hidden text-ellipsis">{{
            initialValue || 'Select a value'
          }}</span>
          <ScalarIcon
            icon="ChevronDown"
            size="md" />
        </ScalarButton>
        <template #items>
          <ScalarDropdownItem
            v-for="option in options"
            :key="option"
            class="group/item flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap"
            :value="option"
            @click="updateSelected(option)">
            <div
              class="flex h-4 w-4 items-center justify-center rounded-full p-[3px]"
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
            <span class="overflow-hidden text-ellipsis">{{ option }}</span>
          </ScalarDropdownItem>
          <template v-if="canAddCustomValue">
            <ScalarDropdownDivider v-if="options.length" />
            <ScalarDropdownItem
              class="flex items-center gap-1.5"
              @click="addingCustomValue = true">
              <div class="flex h-4 w-4 items-center justify-center">
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
