<script setup lang="ts">
import {
  ScalarButton,
  ScalarCombobox,
  ScalarErrorBoundary,
  ScalarIcon,
  ScalarListbox,
} from '@scalar/components'

import { OperationCodeSample } from '@/v2/blocks/operation-code-sample'
import type { OperationCodeSampleProps } from '@/v2/blocks/operation-code-sample/components/OperationCodeSample.vue'
import { CodeInput } from '@/v2/components/code-input'
import { DataTable, DataTableRow } from '@/v2/components/data-table'
import { CollapsibleSection } from '@/v2/components/layout'

const props = defineProps<OperationCodeSampleProps>()
</script>

<template>
  <div class="w-full">
    <CollapsibleSection
      class="group/preview w-full border-b-0"
      :defaultOpen="false">
      <template #title>Code Snippet</template>
      <template #actions>
        <div class="flex flex-1">
          <ScalarCombobox
            :modelValue="selectedPlugin"
            :options="snippets.options"
            placement="bottom-end"
            @update:modelValue="selectClient">
            <ScalarButton
              class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-1.25 py-0.75 font-normal"
              variant="ghost">
              <span>{{ selectedPlugin?.label }}</span>
              <ScalarIcon
                icon="ChevronDown"
                size="md" />
            </ScalarButton>
          </ScalarCombobox>
        </div>
      </template>
      <DataTable
        :columns="['']"
        presentational>
        <DataTableRow>
          <div
            class="bg-b-1 flex items-center justify-center overflow-hidden border-t">
            <OperationCodeSample
              v-bind="props"
              simpleView />
          </div>
        </DataTableRow>
      </DataTable>
    </CollapsibleSection>
  </div>
</template>
