<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { capitalize, computed, ref } from 'vue'

defineProps<{
  title: string
}>()

const {
  activeCollection,
  collectionMutators,
  activeSecurityRequirements,
  securitySchemes,
  securitySchemeMutators,
} = useWorkspace()

const columnLayout = computed(() =>
  activeScheme.value?.type === 'oauth2' ||
  activeScheme.value?.type === 'openIdConnect'
    ? ['', 'auto']
    : [''],
)

/** Generate pretty name for the dropdown label */
const getLabel = (id: string) => {
  const scheme = securitySchemes[id]

  switch (scheme.type) {
    case 'apiKey':
      return `${capitalize(scheme.in)} (${id})`
    case 'http': {
      return `${capitalize(scheme.scheme)} Authentication (${id})`
    }
    case 'oauth2':
      return `OAuth 2.0 (${id})`
    case 'openIdConnect':
      return `Open ID Connect (${id})`
    default:
      return 'None'
  }
}

// Temp until we replace the last two
const password = ref('')

/** Generate the options for the dropdown */
const schemeOptions = computed(() =>
  activeSecurityRequirements.value.flatMap((req) => {
    const keys = Object.keys(req)

    // Optional
    if (keys.length === 0) return { id: 'none', label: 'None' }

    // Active requirements
    return keys.map((id) =>
      id === 'none' ? { id, label: 'None' } : { id, label: getLabel(id) },
    )
  }),
)

const activeScheme = computed(
  () => securitySchemes[schemeModel.value?.id ?? ''],
)

const schemeModel = computed({
  // Grab the selected OR first security scheme
  get: () =>
    schemeOptions.value.find(
      ({ id }) =>
        id ===
        (activeCollection.value?.selectedSecurityKeys[0] ??
          schemeOptions.value[0].id),
    ),
  // Update the mutator on set
  set: (opt) =>
    opt?.id &&
    collectionMutators.edit(
      activeCollection.value!.uid,
      'selectedSecurityKeys',
      [opt.id],
    ),
})

/** Steal the type from the mutator */
type MutatorArgs = Parameters<typeof securitySchemeMutators.edit>
const updateScheme = (path: MutatorArgs[1], value: MutatorArgs[2]) =>
  securitySchemeMutators.edit(activeScheme.value.uid, path, value)
</script>
<template>
  <ViewLayoutCollapse
    class="group/params"
    :itemCount="schemeOptions.length">
    <template #title>
      <div class="flex gap-1">
        {{ title }}
      </div>
    </template>
    <DataTable
      class="flex-1"
      :columns="columnLayout">
      <DataTableRow>
        <DataTableHeader
          class="relative col-span-full h-8 cursor-pointer py-[2.25px] px-[2.25px] flex items-center">
          <ScalarListbox
            v-model="schemeModel"
            class="font-code text-xxs w-full"
            fullWidth
            :options="schemeOptions"
            teleport>
            <ScalarButton
              class="flex gap-1.5 h-auto px-1.5 text-c-2 font-normal"
              fullWidth
              variant="ghost">
              <span>{{ schemeModel?.label }}</span>
              <ScalarIcon
                icon="ChevronDown"
                size="xs" />
            </ScalarButton>
          </ScalarListbox>
        </DataTableHeader>
      </DataTableRow>

      <!-- HTTP Bearer -->
      <DataTableRow
        v-if="
          activeScheme?.type === 'http' && activeScheme.scheme === 'bearer'
        ">
        <DataTableInput
          :modelValue="activeScheme.value"
          placeholder="Token"
          type="password"
          @update:modelValue="(v) => updateScheme('value', v)">
          Bearer Token
        </DataTableInput>
      </DataTableRow>

      <!-- HTTP Basic -->
      <template
        v-else-if="
          activeScheme?.type === 'http' && activeScheme.scheme === 'basic'
        ">
        <DataTableRow>
          <DataTableInput
            class="text-c-2"
            :modelValue="activeScheme.value"
            placeholder="Username"
            @update:modelValue="(v) => updateScheme('value', v)">
            Username
          </DataTableInput>
        </DataTableRow>
        <DataTableRow>
          <DataTableInput
            :modelValue="activeScheme.secondValue"
            placeholder="Token"
            type="password"
            @update:modelValue="(v) => updateScheme('secondValue', v)">
            Password
          </DataTableInput>
        </DataTableRow>
      </template>

      <!-- API Key -->
      <DataTableRow v-else-if="activeScheme?.type === 'apiKey'">
        <DataTableInput
          :modelValue="activeScheme.value"
          placeholder="Value"
          type="password"
          @update:modelValue="(v) => updateScheme('value', v)">
          {{ activeScheme.name }}
        </DataTableInput>
      </DataTableRow>

      <!-- oAuth 2 -->
      <DataTableRow
        v-else-if="activeScheme?.type === 'oauth2'"
        class="border-r-transparent">
        <DataTableInput
          v-model="password"
          placeholder="Token">
          Client ID
        </DataTableInput>
        <DataTableCell class="flex items-center p-0.5">
          <ScalarButton size="sm">Authorize</ScalarButton>
        </DataTableCell>
      </DataTableRow>

      <!-- Open ID Connect -->
      <DataTableRow
        v-else-if="activeScheme?.type === 'openIdConnect'"
        class="border-r-transparent">
        <DataTableInput
          v-model="password"
          placeholder="Token">
          TODO
        </DataTableInput>
        <DataTableCell class="flex items-center">
          <ScalarButton size="sm"> Authorize </ScalarButton>
        </DataTableCell>
      </DataTableRow>
    </DataTable>
  </ViewLayoutCollapse>
</template>
