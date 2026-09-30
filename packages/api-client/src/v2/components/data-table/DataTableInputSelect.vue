<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarComboboxMultiselect } from '@scalar/components/combobox'
import {
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
} from '@scalar/components/dropdown'
import { ScalarIcon } from '@scalar/components/icon'
import { computed, nextTick, ref, watch } from 'vue'

import type { CodeInputModelValue } from '@/v2/components/code-input/CodeInput.vue'
import { useLocalization } from '@/v2/features/localization'

const {
  modelValue,
  value: enumValues,
  default: defaultValue,
  canAddCustomValue = true,
  type,
  arrayEncoding,
} = defineProps<{
  modelValue: CodeInputModelValue
  value?: unknown[]
  default?: CodeInputModelValue | undefined
  canAddCustomValue?: boolean
  type?: string | undefined
  /** Body arrays use JSON; parameter arrays use comma-separated text. */
  arrayEncoding?: 'json' | 'comma-separated'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const { translate } = useLocalization()

const options = computed(() => (enumValues ?? []).map(String))
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
  return modelValue.toString() === value
}

watch(addingCustomValue, (newValue) => {
  if (newValue) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

const initialValue = computed(() => {
  return modelValue !== undefined ? modelValue : defaultValue
})

/** Options for the array type */
const arrayOptions = computed(() =>
  (enumValues ?? []).map((option) => {
    const label = String(option)
    // JSON identities keep values such as 1 and '1' distinct.
    const id = arrayEncoding === 'json' ? JSON.stringify(option) : label
    return { id, label, value: arrayEncoding === 'json' ? option : label }
  }),
)

/** Filter the options by what is selected */
const selectedArrayOptions = computed(() => {
  const value = modelValue.toString()
  let values: unknown = value.split(',')
  if (arrayEncoding === 'json') {
    try {
      values = JSON.parse(value)
    } catch {
      values = []
    }
  }
  const selectedValues = new Set(
    Array.isArray(values)
      ? values.map((item) =>
          arrayEncoding === 'json' ? JSON.stringify(item) : String(item),
        )
      : [],
  )
  return arrayOptions.value.filter((option) => selectedValues.has(option.id))
})

/** Update the model value when the selected options change */
const updateSelectedOptions = (
  selectedOptions: { id: string; label: string; value: unknown }[],
): void => {
  const selectedValues = selectedOptions.map((option) => option.value)
  emit(
    'update:modelValue',
    arrayEncoding === 'json'
      ? JSON.stringify(selectedValues)
      : selectedValues.join(','),
  )
}
</script>

<template>
  <div
    class="group-[.alert]:outline-orange group-[.error]:outline-red w-full min-w-0 pr-10 -outline-offset-1 has-[:focus-visible]:rounded-[4px] has-[:focus-visible]:outline">
    <template v-if="type === 'array'">
      <ScalarComboboxMultiselect
        :modelValue="selectedArrayOptions"
        :options="arrayOptions"
        @update:modelValue="updateSelectedOptions">
        <ScalarButton
          class="custom-scroll h-full w-full min-w-0 justify-start gap-1.5 px-2 py-1.5 pr-6 font-normal outline-none"
          variant="ghost">
          <span class="text-c-1 truncate">{{
            selectedArrayOptions.length > 0
              ? selectedArrayOptions.map((option) => option.label).join(', ')
              : 'Select a value'
          }}</span>
          <ScalarIcon
            class="min-w-4"
            icon="ChevronDown"
            size="md" />
        </ScalarButton>
      </ScalarComboboxMultiselect>
    </template>
    <template v-else-if="addingCustomValue">
      <input
        ref="inputRef"
        v-model="customValue"
        class="text-c-1 w-full min-w-0 border-none px-2 py-1.5 outline-none"
        :placeholder="translate('apiClient.dataTableInputSelect.value')"
        type="text"
        @blur="handleBlur"
        @keyup.enter="addCustomValue" />
    </template>
    <template v-else>
      <ScalarDropdown
        resize
        :value="initialValue">
        <ScalarButton
          class="size-full justify-start gap-1.5 overflow-auto px-2 py-1.5 font-normal whitespace-nowrap outline-none"
          variant="ghost">
          <span class="text-c-1 overflow-hidden text-ellipsis">{{
            initialValue ?? 'Select a value'
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
              <span>{{
                translate('apiClient.dataTableInputSelect.addValue')
              }}</span>
            </ScalarDropdownItem>
          </template>
        </template>
      </ScalarDropdown>
    </template>
  </div>
</template>
