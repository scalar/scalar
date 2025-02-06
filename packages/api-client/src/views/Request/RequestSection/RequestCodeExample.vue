<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { CodeSnippet } from '@/views/Components/CodeSnippet'
import {
  ScalarButton,
  ScalarCombobox,
  type ScalarComboboxOption,
  ScalarIcon,
} from '@scalar/components'
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'
import { computed, ref } from 'vue'

import { filterSecurityRequirements } from './helpers/filter-security-requirements'

/** The selected HTTP client to render the code snippet for */
const selectedPlugin = ref<ScalarComboboxOption | undefined>({
  id: 'js/fetch',
  label: 'js/fetch',
})

// Get the entities from the store
const { activeRequest, activeExample, activeServer, activeCollection } =
  useActiveEntities()
const { securitySchemes } = useWorkspace()

/**
 * Just the relevant security schemes for the selected request
 */
const selectedSecuritySchemes = computed(() =>
  filterSecurityRequirements(
    activeRequest.value?.security || activeCollection.value?.security || [],
    activeCollection.value?.selectedSecuritySchemeUids,
    securitySchemes,
  ),
)

/** Group plugins by target/language to show in a dropdown */
const availablePlugins = computed(() => {
  const groupedPlugins: Record<string, ScalarComboboxOption[]> = snippetz()
    .plugins()
    .reduce(
      (acc, plugin) => {
        const groupLabel = plugin.target

        if (!acc[groupLabel]) {
          acc[groupLabel] = []
        }

        acc[groupLabel].push({
          id: `${plugin.target}/${plugin.client}`,
          label: `${plugin.target}/${plugin.client}`,
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

/** node/undici -> node */
const selectedTarget = computed(
  () => selectedPlugin.value?.id.split('/')[0] as TargetId,
)

/** node/undici -> undici */
const selectedClient = computed(
  () =>
    selectedPlugin.value?.id.split('/')[1] as ClientId<
      typeof selectedTarget.value
    >,
)
</script>

<template>
  <div class="sticky mt-auto bottom-0 w-full">
    <ViewLayoutCollapse
      class="group/preview -mt-0.25 w-full"
      :defaultOpen="true"
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
            <CodeSnippet
              class="px-1 py-1.5 max-h-40"
              :client="selectedClient"
              :example="activeExample"
              :operation="activeRequest"
              :securitySchemes="selectedSecuritySchemes"
              :server="activeServer"
              :target="selectedTarget" />
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
