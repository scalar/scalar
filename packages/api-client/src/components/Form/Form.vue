<script setup lang="ts">
import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type { Path, PathValue } from '@scalar/object-utils/nested'

import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useActiveEntities } from '@/store/active-entities'

defineProps<{
  title?: string
  options: {
    key: string
    label: string
    placeholder: string
  }[]
  data: Record<string, any>
  onUpdate: <P extends Path<Cookie>>(
    key: P,
    value: NonNullable<PathValue<Cookie, P>>,
  ) => void
}>()

const { activeEnvVariables, activeEnvironment, activeWorkspace } =
  useActiveEntities()
</script>
<template>
  <ViewLayoutSection>
    <template #title>
      <span v-if="title">{{ title }}</span>
      <slot
        v-else
        name="title" />
    </template>
    <div class="custom-scroll flex flex-1 flex-col gap-1.5">
      <DataTable
        v-if="Object.keys(data).length > 0 && activeWorkspace"
        :columns="['']">
        <DataTableRow
          v-for="(option, index) in options"
          :key="index"
          :class="{ 'border-t': index === 0 }">
          <DataTableInput
            :envVariables="activeEnvVariables"
            :environment="activeEnvironment"
            :modelValue="data[option.key] ?? ''"
            :placeholder="option.placeholder"
            :workspace="activeWorkspace"
            @update:modelValue="onUpdate(option.key as Path<Cookie>, $event)">
            {{ option.label }}
          </DataTableInput>
        </DataTableRow>
      </DataTable>
    </div>
  </ViewLayoutSection>
</template>
