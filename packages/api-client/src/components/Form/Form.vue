<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { useId } from 'vue'

import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'

defineProps<{
  title?: string
  options: {
    key: string
    label: string
    placeholder: string
  }[]
  data: Record<string, any>
  onUpdate: (key: string, value: any) => void
}>()

const id = useId()
</script>
<template>
  <ViewLayoutSection>
    <template
      v-if="title || $slots.title"
      #title>
      <span v-if="title">{{ title }}</span>
      <slot
        v-else
        name="title" />
    </template>
    <div class="custom-scroll flex flex-1 flex-col gap-1.5">
      <DataTable
        v-if="Object.keys(data).length > 0"
        :columns="['']">
        <DataTableRow
          v-for="(option, index) in options"
          :key="index"
          :class="{ 'border-t': index === 0 }">
          <DataTableInput
            :id="id"
            :modelValue="data[option.key] ?? ''"
            :placeholder="option.placeholder"
            @update:modelValue="onUpdate(option.key, $event)">
            <template #default>
              <label :for="id">
                {{ option.label }}
              </label>
            </template>
            <template
              #icon
              v-if="option.key === 'description'">
              <div class="bg-b-2 flex-center border-l px-2">
                <ScalarIcon
                  icon="Markdown"
                  size="lg" />
              </div>
            </template>
          </DataTableInput>
        </DataTableRow>
      </DataTable>
    </div>
  </ViewLayoutSection>
</template>
