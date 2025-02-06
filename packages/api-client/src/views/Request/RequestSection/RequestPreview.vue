<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import {
  ScalarButton,
  ScalarCodeBlock,
  ScalarCombobox,
  type ScalarComboboxOption,
  ScalarIcon,
} from '@scalar/components'
import { safeJSON } from '@scalar/object-utils/parse'
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'
import { computed, onMounted, ref, watch } from 'vue'

const { activeRequest, activeExample, activeCollection, activeEnvironment } =
  useActiveEntities()
const { cookies } = useWorkspace()

const { plugins, print } = snippetz()

const selectedPlugin = ref<ScalarComboboxOption | undefined>({
  id: 'node-undici',
  label: 'undici',
})

const requestContent = ref('CODE SNIPPET GOES HERE')

/** Available plugins */
const availablePlugins = computed(() => {
  const groupedPlugins: Record<string, ScalarComboboxOption[]> =
    plugins().reduce(
      (acc, plugin) => {
        const groupLabel = plugin.target
        if (!acc[groupLabel]) {
          acc[groupLabel] = []
        }
        acc[groupLabel].push({
          id: `${plugin.target}-${plugin.client}`,
          label: `${plugin.client}`,
        })
        return acc
      },
      {} as Record<string, ScalarComboboxOption[]>,
    )

  return Object.entries(groupedPlugins).map(([label, options]) => ({
    id: label,
    label,
    options,
  }))
})
</script>

<template>
  <div class="sticky mt-auto bottom-0 w-full">
    <ViewLayoutCollapse
      class="group/preview -mt-0.25 w-full"
      :defaultOpen="false"
      :hasIcon="false">
      <template #title>Code Snippet</template>
      <template #actions>
        <div class="flex flex-1 -mx-1">
          <ScalarCombobox
            v-model="selectedPlugin"
            :options="availablePlugins"
            placement="bottom-end">
            <ScalarButton
              class="flex gap-1.5 h-full px-1.5 py-0.75 font-normal text-c-1 w-fit"
              fullWidth
              variant="ghost">
              <span>{{ selectedPlugin?.label }}</span>
              <ScalarIcon
                icon="ChevronDown"
                size="md" />
            </ScalarButton>
          </ScalarCombobox>
        </div>
      </template>
      <DataTable :columns="['']">
        <DataTableRow>
          <div
            class="bg-b-1 border-t flex items-center justify-center overflow-hidden">
            <ScalarCodeBlock
              class="max-h-40 px-1 py-1.5 w-full"
              :content="requestContent"
              :lang="selectedPlugin?.id"
              lineNumbers />
          </div>
        </DataTableRow>
      </DataTable>
    </ViewLayoutCollapse>
  </div>
</template>
<style scoped>
:deep(code.hljs *) {
  font-size: var(--scalar-mini);
}
</style>
