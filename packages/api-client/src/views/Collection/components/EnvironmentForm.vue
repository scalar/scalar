<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { ScalarIconTrash, ScalarIconWarning } from '@scalar/icons'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import { useWorkspace } from '@/store'
import type { EnvVariable } from '@/store/active-entities'

const { collection, environment, workspace, envVariables } = defineProps<{
  collection: Collection
  environment: Environment
  workspace: Workspace
  envVariables: EnvVariable[]
}>()

const { collectionMutators } = useWorkspace()

//
const localVariables = ref<Array<{ key: string; value: string }>>([])

// Set of existing keys from the collection
const collectionKeys = ref<Set<string>>(new Set())

// Map of key typed by the user
const tempKeys = ref<Map<number, string>>(new Map())

// Prevent multiple updates to the collection
const isUpdating = ref(false)

const variables = computed(() => {
  if (!environment?.value) {
    return [{ key: '', value: '' }]
  }
  try {
    const parsedObject = JSON.parse(environment.value)
    const entries = Object.entries(parsedObject).map(([key, val]) => ({
      key,
      value: String(val),
    }))
    if (entries.length === 0) {
      return [{ key: '', value: '' }]
    }
    return entries
  } catch (_) {
    return [{ key: '', value: '' }]
  }
})

const environmentVariables = computed(() => {
  const lastRow = localVariables.value[localVariables.value.length - 1]
  if (!lastRow) {
    return [{ key: '', value: '' }]
  }
  if (lastRow.key || lastRow.value) {
    return [...localVariables.value, { key: '', value: '' }]
  }
  return localVariables.value
})

const getDuplicateKeyIndexes = computed(() => {
  const keyCounts = new Map<string, number[]>()

  // Add existing keys from the collection
  localVariables.value.forEach((v, index) => {
    if (v.key) {
      const indexes = keyCounts.get(v.key) || []
      indexes.push(index)
      keyCounts.set(v.key, indexes)
    }
  })

  // Add typed keys that are being edited
  tempKeys.value.forEach((key, index) => {
    if (key) {
      const indexes = keyCounts.get(key) || []
      indexes.push(index)
      keyCounts.set(key, indexes)
    }
  })

  return Array.from(keyCounts.values())
    .filter((indexes) => indexes.length > 1)
    .flat()
})

// Update originalKeys when variables change
watch(
  variables,
  (newVars) => {
    localVariables.value = [...newVars]
    collectionKeys.value = new Set(newVars.map((v) => v.key).filter(Boolean))
  },
  { immediate: true },
)

const handleUpdateRow = async (
  index: number,
  field: 'key' | 'value',
  value: string,
) => {
  if (isUpdating.value) {
    return
  }

  if (field === 'key') {
    // Store the typed key
    tempKeys.value.set(index, value)

    // Check for duplicates
    const otherKeys = new Set(collectionKeys.value)
    const currentItem = localVariables.value[index]

    // Remove the current item from the set of original keys
    if (currentItem) {
      otherKeys.delete(currentItem.key)
    }

    // If it's a duplicate, don't proceed with mutation
    if (otherKeys.has(value)) {
      return
    }
  }

  isUpdating.value = true

  try {
    const newVariables = [...localVariables.value]
    const currentItem = newVariables[index]
    if (!currentItem) {
      return
    }

    newVariables[index] = {
      key: field === 'key' ? value : currentItem.key,
      value: field === 'value' ? value : currentItem.value,
    }

    if (
      !newVariables[index].key &&
      !newVariables[index].value &&
      index !== newVariables.length - 1
    ) {
      newVariables.splice(index, 1)
    }

    const updatedValue = newVariables.reduce(
      (acc, { key, value }) => {
        if (key || value) {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, string>,
    )

    if (collection) {
      const environments = {
        ...collection['x-scalar-environments'],
        [environment.name]: {
          ...collection['x-scalar-environments']?.[environment.name],
          variables: updatedValue,
        },
      }
      await collectionMutators.edit(
        collection.uid,
        'x-scalar-environments',
        environments,
      )
    }

    if (index === localVariables.value.length - 1) {
      const lastRow = newVariables[newVariables.length - 1]
      if (lastRow && (lastRow.key || lastRow.value)) {
        await addRow()
      }
    }

    await nextTick()
    localVariables.value = newVariables

    // Update collection keys after successful update
    if (field === 'key') {
      collectionKeys.value = new Set(
        newVariables.map((v) => v.key).filter(Boolean),
      )
      // Clear the typed key after successful update
      tempKeys.value.delete(index)
    }
  } finally {
    isUpdating.value = false
  }
}

const addRow = async () => {
  if (isUpdating.value) {
    return
  }
  isUpdating.value = true

  try {
    const newVariables = [...localVariables.value, { key: '', value: '' }]
    const updatedValue = newVariables.reduce(
      (acc, { key, value }) => {
        if (key || value) {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, string>,
    )

    if (collection) {
      const environments = {
        ...collection['x-scalar-environments'],
        [environment.name]: {
          ...collection['x-scalar-environments']?.[environment.name],
          variables: updatedValue,
        },
      }
      await collectionMutators.edit(
        collection.uid,
        'x-scalar-environments',
        environments,
      )
    }

    await nextTick()
    localVariables.value = newVariables
  } finally {
    isUpdating.value = false
  }
}

const handleDeleteRow = async (index: number) => {
  if (isUpdating.value) {
    return
  }
  isUpdating.value = true

  try {
    const newVariables = [...localVariables.value]
    newVariables.splice(index, 1)
    const updatedValue = newVariables.reduce(
      (acc, { key, value }) => {
        if (key || value) {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, string>,
    )

    if (collection) {
      const environments = {
        ...collection['x-scalar-environments'],
        [environment.name]: {
          ...collection['x-scalar-environments']?.[environment.name],
          variables: updatedValue,
        },
      }
      await collectionMutators.edit(
        collection.uid,
        'x-scalar-environments',
        environments,
      )
    }

    await nextTick()
    localVariables.value = newVariables
  } finally {
    isUpdating.value = false
  }
}

// Keep an empty row at the end of the table
const defaultRow = async () => {
  if (localVariables.value.length === 0) {
    await addRow()
  } else if (localVariables.value.length >= 1) {
    const lastRow = localVariables.value[localVariables.value.length - 1]
    if (lastRow && (lastRow.key || lastRow.value)) {
      await addRow()
    }
  }
}

onMounted(() => {
  defaultRow()
})

// Update the collection on local variables changes
watch(
  () => localVariables.value,
  () => {
    defaultRow()
  },
)
</script>

<template>
  <DataTable
    class="group/table flex-1"
    :columns="['', '']">
    <DataTableRow class="sr-only !block">
      <DataTableHeader>Key</DataTableHeader>
      <DataTableHeader>Value</DataTableHeader>
    </DataTableRow>
    <DataTableRow
      v-for="(variable, index) in environmentVariables"
      :key="index"
      :class="{
        error: getDuplicateKeyIndexes.includes(index),
      }">
      <DataTableCell>
        <CodeInput
          disableCloseBrackets
          disableEnter
          disableTabIndent
          lineWrapping
          :environment="environment"
          :envVariables="envVariables"
          :modelValue="variable.key"
          placeholder="Key"
          :workspace="workspace"
          @update:modelValue="(v: string) => handleUpdateRow(index, 'key', v)">
          <template
            #icon
            v-if="getDuplicateKeyIndexes.includes(index)">
            <ScalarIconWarning
              class="text-red mr-0.75 size-3.5 brightness-[.9]" />
          </template>
        </CodeInput>
      </DataTableCell>
      <DataTableCell>
        <CodeInput
          class="pr-6 group-hover:pr-10 group-has-[.cm-focused]:pr-10"
          disableCloseBrackets
          disableEnter
          disableTabIndent
          lineWrapping
          :environment="environment"
          :envVariables="envVariables"
          :modelValue="variable.value"
          placeholder="Value"
          :workspace="workspace"
          @update:modelValue="
            (v: string) => handleUpdateRow(index, 'value', v)
          ">
          <template #icon>
            <ScalarButton
              v-if="variable.key || variable.value"
              class="text-c-2 hover:text-c-1 hover:bg-b-2 z-context hidden h-fit rounded p-1 group-hover:flex group-has-[.cm-focused]:flex"
              size="sm"
              variant="ghost"
              @click.stop="handleDeleteRow(index)">
              <ScalarIconTrash class="size-3.5" />
            </ScalarButton>
          </template>
        </CodeInput>
      </DataTableCell>
    </DataTableRow>
  </DataTable>
</template>

<style scoped>
:deep(.cm-editor) {
  padding: 0;
}
:deep(.cm-content) {
  align-items: center;
  background-color: transparent;
  display: flex;
  font-family: var(--scalar-font);
  font-size: var(--scalar-small);
  padding: 5px 8px;
  width: 100%;
}
:deep(.cm-content):has(.cm-pill) {
  padding: 5px 8px;
}
:deep(.cm-content .cm-pill:not(:last-of-type)) {
  margin-right: 0.5px;
}
:deep(.cm-content .cm-pill:not(:first-of-type)) {
  margin-left: 0.5px;
}
:deep(.cm-line) {
  overflow: hidden;
  padding: 0;
  text-overflow: ellipsis;
}
</style>
