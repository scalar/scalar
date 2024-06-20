<script lang="ts">
import type { SecuritySchemeOauth2 } from '@scalar/oas-utils/entities/workspace/security'
import { computed } from 'vue'

/** Type for the dropdown options */
export type SecuritySchemeOption = {
  id: string
  label: string
  flowKey?: keyof SecuritySchemeOauth2['flows']
  uid?: string
}
</script>

<script setup lang="ts">
import {
  DataTableCell,
  DataTableInput,
  DataTableRow,
} from '@/components/DataTable'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { useWorkspace } from '@/store/workspace'

const props = defineProps<{
  activeScheme: SecuritySchemeOauth2
  schemeModel: Required<SecuritySchemeOption>
}>()

const { securitySchemeMutators } = useWorkspace()

const activeFlow = computed(
  () => props.activeScheme.flows[props.schemeModel.flowKey],
)

/** Handles updating the mutators as well as displaying */
const scopeModel = computed({
  get: () =>
    activeFlow.value?.selectedScopes.map((scopeName) =>
      scopeOptions.value.find(({ id }) => id === scopeName),
    ),
  set: (opts) =>
    updateScheme(
      `flows.${props.schemeModel.flowKey}.selectedScopes`,
      opts?.flatMap((opt) => (opt?.id ? opt.id : [])),
    ),
})

/** Scope dropdown options */
const scopeOptions = computed(() =>
  Object.entries(activeFlow.value?.scopes ?? {}).map(([key, val]) => ({
    id: key,
    label: [key, val].join(' - '),
  })),
)

type MutatorArgs = Parameters<typeof securitySchemeMutators.edit>
const updateScheme = (path: MutatorArgs[1], value: MutatorArgs[2]) =>
  securitySchemeMutators.edit(props.activeScheme.uid, path, value)
console.log
</script>

<template>
  <!-- Implicit -->
  <DataTableRow
    v-if="schemeModel.flowKey === 'implicit'"
    class="border-r-transparent">
    <DataTableInput
      :modelValue="activeScheme.clientId"
      placeholder="12345"
      @update:modelValue="(v) => updateScheme('clientId', v)">
      Client ID
    </DataTableInput>

    <DataTableCell class="flex items-center p-0.5">
      <ScalarListbox
        v-model="scopeModel"
        class="font-code text-xxs w-full"
        fullWidth
        multiple
        :options="scopeOptions"
        teleport
        @update:modelValue="console.log">
        <ScalarButton
          class="flex gap-1.5 h-auto px-1.5 text-c-2 font-normal"
          fullWidth
          variant="ghost">
          <span>
            Scopes
            {{ activeFlow?.selectedScopes.length }} /
            {{ Object.keys(activeScheme.flows.implicit?.scopes ?? {}).length }}
          </span>
          <ScalarIcon
            icon="ChevronDown"
            size="xs" />
        </ScalarButton>
      </ScalarListbox>
    </DataTableCell>

    <DataTableCell class="flex items-center p-0.5">
      <ScalarButton size="sm">Authorize</ScalarButton>
    </DataTableCell>
  </DataTableRow>

  <!-- Password -->
  <DataTableRow
    v-if="schemeModel.flowKey === 'password'"
    class="border-r-transparent">
    <DataTableInput
      :modelValue="activeScheme.clientId"
      placeholder="12345"
      @update:modelValue="(v) => updateScheme('clientId', v)">
      Client ID
    </DataTableInput>
    <DataTableCell class="flex items-center p-0.5">
      <ScalarButton size="sm">Authorize</ScalarButton>
    </DataTableCell>
  </DataTableRow>

  <!-- Client Credentials -->
  <DataTableRow
    v-if="schemeModel.flowKey === 'clientCredentials'"
    class="border-r-transparent">
    <DataTableInput
      :modelValue="activeScheme.clientId"
      placeholder="12345"
      @update:modelValue="(v) => updateScheme('clientId', v)">
      Client ID
    </DataTableInput>
    <DataTableCell class="flex items-center p-0.5">
      <ScalarButton size="sm">Authorize</ScalarButton>
    </DataTableCell>
  </DataTableRow>

  <!-- Authorization Code -->
  <DataTableRow
    v-if="schemeModel.flowKey === 'authorizationCode'"
    class="border-r-transparent">
    <DataTableInput
      :modelValue="activeScheme.clientId"
      placeholder="12345"
      @update:modelValue="(v) => updateScheme('clientId', v)">
      Client ID
    </DataTableInput>
    <DataTableCell class="flex items-center p-0.5">
      <ScalarButton size="sm">Authorize</ScalarButton>
    </DataTableCell>
  </DataTableRow>

  <!-- Open ID Connect -->
  <!-- <DataTableRow -->
  <!--   v-else-if="activeScheme?.type === 'openIdConnect'" -->
  <!--   class="border-r-transparent"> -->
  <!--   <DataTableInput -->
  <!--     v-model="password" -->
  <!--     placeholder="Token"> -->
  <!--     TODO -->
  <!--   </DataTableInput> -->
  <!--   <DataTableCell class="flex items-center"> -->
  <!--     <ScalarButton size="sm"> Authorize </ScalarButton> -->
  <!--   </DataTableCell> -->
  <!-- </DataTableRow> -->
</template>
