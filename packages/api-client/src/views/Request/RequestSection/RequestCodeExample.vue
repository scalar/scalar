<script setup lang="ts">
import {
  ScalarButton,
  ScalarCombobox,
  ScalarIcon,
  type ScalarComboboxOption,
} from '@scalar/components'
import type { Workspace } from '@scalar/oas-utils/entities'
import type {
  Collection,
  Operation,
  RequestExample,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { snippetz, type ClientId, type TargetId } from '@scalar/snippetz'
import { computed } from 'vue'

import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import { CodeSnippet } from '@/views/Components/CodeSnippet'

import { filterSecurityRequirements } from './helpers/filter-security-requirements'

const { collection, example, operation, server, workspace } = defineProps<{
  collection: Collection
  example: RequestExample
  operation: Operation
  server: Server | undefined
  workspace: Workspace
}>()

const { securitySchemes, workspaceMutators } = useWorkspace()

/**
 * Just the relevant security schemes for the selected request
 */
const selectedSecuritySchemes = computed(() => {
  const schema = filterSecurityRequirements(
    operation.security || collection.security || [],
    operation.selectedSecuritySchemeUids ||
      collection.selectedSecuritySchemeUids,
    securitySchemes,
  )

  // If no schema - use the operation selectedSecuritySchemeUids
  if (!schema.length) {
    return operation.selectedSecuritySchemeUids
      ?.flatMap((uids) => (Array.isArray(uids) ? uids : [uids]))
      .map((uid) => securitySchemes[uid])
      .filter((scheme) => scheme !== undefined)
  }

  return schema
})

/** Group plugins by target/language to show in a dropdown, also build a dictionary in the same loop */
const snippets = computed(() => {
  const dict: Record<string, string> = {}

  const options = snippetz()
    .clients()
    .map((group) => ({
      label: group.title,
      options: group.clients.map((plugin) => {
        // Add to the dictionary
        dict[`${group.key},${plugin.client}`] = plugin.title

        return {
          id: `${group.key},${plugin.client}`,
          label: plugin.title,
        }
      }),
    }))

  return {
    options,
    dict,
  }
})

/** The currently selected plugin */
const selectedPlugin = computed(() => {
  const selectedClient = workspace.selectedHttpClient

  // Backups on backups
  if (!selectedClient)
    return (
      snippets.value.options[0]?.options[0] ?? {
        id: 'js,fetch',
        label: 'Fetch',
      }
    )

  const id = `${selectedClient.targetKey},${selectedClient.clientKey}`
  return {
    id,
    label: snippets.value.dict[id] ?? 'Unknown',
  }
})

/** The currently selected target, unsafely typecast until we can extract validation fron snippetz */
const selectedTarget = computed(
  () => (workspace.selectedHttpClient?.targetKey ?? 'js') as TargetId,
)

/** The currently selected client, unsafely typecast until we can extract validation fron snippetz */
const selectedClient = computed(
  () =>
    (workspace.selectedHttpClient?.clientKey ?? 'fetch') as ClientId<TargetId>,
)

/** Update the store with the newly selected client */
const selectClient = ({ id }: ScalarComboboxOption) => {
  const [target, client] = id.split(',')
  if (!target || !client) return

  workspaceMutators.edit(workspace.uid, 'selectedHttpClient', {
    targetKey: target,
    clientKey: client,
  })
}
</script>

<template>
  <div class="w-full">
    <ViewLayoutCollapse
      class="group/preview w-full border-b-0"
      :defaultOpen="false">
      <template #title>Code Snippet</template>
      <template #actions>
        <div class="-mx-1 flex flex-1">
          <ScalarCombobox
            :modelValue="selectedPlugin"
            :options="snippets.options"
            placement="bottom-end"
            @update:modelValue="selectClient">
            <ScalarButton
              class="text-c-1 hover:bg-b-3 py-0.75 flex h-full w-fit gap-1.5 px-1.5 font-normal"
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
            class="bg-b-1 flex items-center justify-center overflow-hidden border-t">
            <CodeSnippet
              class="px-3 py-1.5"
              :client="selectedClient"
              :example="example"
              :operation="operation"
              :securitySchemes="selectedSecuritySchemes"
              :server="server"
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
