<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Path, PathValue } from '@scalar/object-utils/nested'
import { useId } from 'vue'

import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { type EnvVariable } from '@/store'

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

  // ------- To be removed -------
  environment: Environment
  envVariables: EnvVariable[]
}>()

const id = useId()
</script>
<template>
  <ViewLayoutSection class="last:rounded-b-lg">
    <template
      v-if="title || $slots.title"
      #title>
      <span v-if="title">{{ title }}</span>
      <slot
        v-else
        name="title" />
    </template>
    <div class="flex flex-1 flex-col gap-1.5">
      <DataTable
        v-if="Object.keys(data).length > 0"
        class="rounded-b-lg"
        :columns="['']">
        <DataTableRow
          v-for="(option, index) in options"
          :key="index"
          :class="{ 'border-t': index === 0 }">
          <DataTableInput
            :id="id"
            class="pr-9"
            :envVariables="envVariables"
            :environment="environment"
            lineWrapping
            :modelValue="data[option.key] ?? ''"
            :placeholder="option.placeholder"
            @update:modelValue="onUpdate(option.key as Path<Cookie>, $event)">
            <template #default>
              <label :for="id">
                {{ option.label }}
              </label>
            </template>
            <template
              v-if="option.key === 'description'"
              #icon>
              <div
                class="centered-y bg-b-2 flex-center absolute right-1 z-1 rounded px-1 py-0.5">
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
