<script setup lang="ts">
import {
  DataTableCell,
  DataTableInput,
  DataTableRow,
} from '@/components/DataTable'
import type { UpdateCurrentScheme } from '@/store/workspace'
import {
  type SecuritySchemeOptionOauth,
  authorizeOauth2,
} from '@/views/Request/libs'
import { ScalarButton, useLoadingState } from '@scalar/components'
import type { SecuritySchemeOauth2 } from '@scalar/oas-utils/entities/workspace/security'
import { computed } from 'vue'

import ScopesDropdown from './ScopesDropdown.vue'

const props = defineProps<{
  activeScheme: SecuritySchemeOauth2
  schemeModel: SecuritySchemeOptionOauth
  updateCurrentScheme: UpdateCurrentScheme
}>()

const loadingState = useLoadingState()

const activeFlow = computed(
  () => props.activeScheme.flows[props.schemeModel.flowKey],
)

/** Authorize the user using specified flow */
const handleAuthorize = async () => {
  if (loadingState.isLoading) return
  loadingState.startLoading()

  const accessToken = await authorizeOauth2(
    props.activeScheme,
    props.schemeModel,
  ).finally(() => loadingState.stopLoading())

  if (accessToken)
    props.updateCurrentScheme(
      `flows.${props.schemeModel.flowKey}.token`,
      accessToken,
    )
}
</script>

<template>
  <!-- Implicit / Authorization Code -->
  <DataTableRow
    v-if="
      schemeModel.flowKey === 'implicit' ||
      schemeModel.flowKey === 'authorizationCode'
    "
    class="border-r-transparent">
    <template v-if="!activeFlow?.token">
      <DataTableInput
        :modelValue="activeScheme.clientId"
        placeholder="12345"
        @update:modelValue="(v) => props.updateCurrentScheme('clientId', v)">
        Client ID
      </DataTableInput>

      <DataTableCell class="flex items-center p-0.5">
        <ScopesDropdown
          :activeFlow="activeFlow"
          :schemeModel="schemeModel"
          :updateCurrentScheme="updateCurrentScheme" />
      </DataTableCell>

      <!-- Access Token -->
      <DataTableCell class="flex items-center p-0.5">
        <ScalarButton
          :loading="loadingState"
          size="sm"
          @click="handleAuthorize">
          Authorize
        </ScalarButton>
      </DataTableCell>
    </template>
    <template v-else>
      <DataTableInput
        :modelValue="activeFlow.token"
        type="password"
        @update:modelValue="
          (v) =>
            updateCurrentScheme(`flows.${props.schemeModel.flowKey}.token`, v)
        ">
        Access Token
      </DataTableInput>
      <DataTableCell class="flex items-center p-0.5">
        <ScalarButton
          size="sm"
          variant="ghost"
          @click="
            updateCurrentScheme(`flows.${props.schemeModel.flowKey}.token`, '')
          ">
          Clear
        </ScalarButton>
      </DataTableCell>
    </template>
  </DataTableRow>

  <!-- Password -->
  <!-- <DataTableRow -->
  <!--   v-if="schemeModel.flowKey === 'password'" -->
  <!--   class="border-r-transparent"> -->
  <!--   <DataTableInput -->
  <!--     :modelValue="activeScheme.clientId" -->
  <!--     placeholder="12345" -->
  <!--     @update:modelValue="(v) => updateScheme('clientId', v)"> -->
  <!--     Client ID -->
  <!--   </DataTableInput> -->
  <!--   <DataTableCell class="flex items-center p-0.5"> -->
  <!--     <ScalarButton size="sm">Authorize</ScalarButton> -->
  <!--   </DataTableCell> -->
  <!-- </DataTableRow> -->

  <!-- Client Credentials -->
  <DataTableRow
    v-if="schemeModel.flowKey === 'clientCredentials'"
    class="border-r-transparent">
    <DataTableInput
      :modelValue="activeScheme.clientId"
      placeholder="12345"
      @update:modelValue="(v) => updateCurrentScheme('clientId', v)">
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
