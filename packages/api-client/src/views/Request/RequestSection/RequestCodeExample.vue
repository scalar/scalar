<script setup lang="ts">
import {
  ScalarButton,
  ScalarCodeBlock,
  ScalarCombobox,
  ScalarIcon,
  type ScalarComboboxOption,
} from '@scalar/components'
import type {
  Collection,
  Operation,
  RequestExample,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { snippetz, type ClientId, type TargetId } from '@scalar/snippetz'
import { computed, ref } from 'vue'

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

const localSelectedClient = computed(() => {
  // If the current selection is a custom example
  if (localSelectedClientState.value.targetKey === 'custom') {
    // Check if this custom example still exists in the new operation
    const customExampleExists = codeSamples.value?.some(
      (sample) => sample.lang === localSelectedClientState.value.clientKey,
    )

    // If it exists, keep using it
    if (customExampleExists) {
      return localSelectedClientState.value
    }
  }

  // Otherwise fall back to workspace selection
  return {
    targetKey: workspace.selectedHttpClient?.targetKey ?? 'js',
    clientKey: workspace.selectedHttpClient?.clientKey ?? 'fetch',
  }
})

// Store the actual selected state
const localSelectedClientState = ref({
  targetKey: workspace.selectedHttpClient?.targetKey ?? 'js',
  clientKey: workspace.selectedHttpClient?.clientKey ?? 'fetch',
})

/**
 * Just the relevant security schemes for the selected request
 */
const selectedSecuritySchemes = computed(() =>
  filterSecurityRequirements(
    operation.security || collection.security || [],
    operation.selectedSecuritySchemeUids ||
      collection.selectedSecuritySchemeUids,
    securitySchemes,
  ),
)

/**
 * Group plugins by target/language to show in a dropdown, also build a dictionary in the same loop
 **/
const snippets = computed(() => {
  const dict: Record<string, string> = {}

  // Get the built-in snippets
  const builtInOptions = snippetz()
    .clients()
    .map((group) => ({
      label: group.title,
      options: group.clients.map((plugin) => {
        dict[`${group.key},${plugin.client}`] = plugin.title
        return {
          id: `${group.key},${plugin.client}`,
          label: plugin.title,
        }
      }),
    }))

  // Get any custom code samples from x-codeSamples
  const customExamples = (
    operation['x-codeSamples'] ||
    operation['x-code-samples'] ||
    operation['x-custom-examples'] ||
    []
  ).map((sample) => ({
    id: `custom,${sample.lang}`,
    label: sample.label || sample.lang,
  }))

  // If we have custom samples, add them as a new group
  const options =
    customExamples.length > 0
      ? [
          {
            id: 'customExamples',
            label: 'Code Examples',
            options: customExamples.map((customExample) => ({
              id: customExample.id,
              label: customExample.label ?? customExample.id,
            })),
          },
          ...builtInOptions,
        ]
      : builtInOptions

  // Add custom samples to the dictionary
  customExamples.forEach((sample) => {
    dict[sample.id] = sample.label ?? sample.id
  })

  return {
    options,
    dict,
  }
})

/** The currently selected plugin */
const selectedPlugin = computed(() => {
  const client = localSelectedClient.value

  // Handle custom examples
  if (client.targetKey === 'custom') {
    const id = `custom,${client.clientKey}`
    return {
      id,
      label: snippets.value.dict[id] ?? 'Unknown',
    }
  }

  // Handle regular snippetz plugins
  const id = `${client.targetKey},${client.clientKey}`
  return {
    id,
    label: snippets.value.dict[id] ?? 'Unknown',
  }
})

/** The currently selected target */
const selectedTarget = computed(
  () => localSelectedClient.value.targetKey as TargetId,
)

/** The currently selected client */
const selectedClient = computed(
  () => localSelectedClient.value.clientKey as ClientId<TargetId>,
)

/** Update the selection when a new client is picked */
const selectClient = ({ id }: ScalarComboboxOption) => {
  const [target, client] = id.split(',')

  if (!target || !client) {
    return
  }

  // Update the state ref
  localSelectedClientState.value = {
    targetKey: target,
    clientKey: client,
  }

  // Only update workspace for non-custom selections
  if (target !== 'custom') {
    workspaceMutators.edit(workspace.uid, 'selectedHttpClient', {
      targetKey: target,
      clientKey: client,
    })
  }
}

const codeSamples = computed(() => {
  return (
    operation['x-codeSamples'] ||
    operation['x-code-samples'] ||
    operation['x-custom-examples']
  )
})

/** Get the code sample content for a custom example */
const customCodeContent = computed(() => {
  if (!selectedPlugin.value.id.startsWith('custom,')) {
    return undefined
  }

  const lang = selectedPlugin.value.id.split(',')[1]
  const sample = codeSamples.value?.find((s) => s.lang === lang)
  return sample?.source
})
</script>

<template>
  <div class="w-full">
    <ViewLayoutCollapse
      class="group/preview w-full border-b-0"
      :defaultOpen="true">
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
            <!-- Use the given code example -->
            <template v-if="customCodeContent">
              <ScalarCodeBlock
                class="px-3 py-1.5"
                :content="customCodeContent"
                :lang="selectedPlugin.id.split(',')[1] ?? 'plaintext'" />
            </template>
            <!-- Generate a code snippet -->
            <template v-else>
              <CodeSnippet
                class="px-3 py-1.5"
                :client="selectedClient"
                :example="example"
                :operation="operation"
                :securitySchemes="selectedSecuritySchemes"
                :server="server"
                :target="selectedTarget" />
            </template>
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
