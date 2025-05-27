<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import type { Oauth2Flow } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

import {
  DataTableCell,
  DataTableCheckbox,
  DataTableRow,
} from '@/components/DataTable'
import type { UpdateScheme } from '@/store'

const { flow, updateScheme } = defineProps<{
  flow: Oauth2Flow
  updateScheme: UpdateScheme
}>()

const scopes = computed(() =>
  Object.entries(flow?.scopes ?? {}).map(([key, val]) => ({
    id: key,
    label: key,
    description: val,
  })),
)

/** An array of the selected scope ids */
const selectedScopes = computed(() => flow?.selectedScopes || [])

function setScope(id: string, checked: boolean) {
  // Checked - Add scope to list
  if (checked) {
    updateScheme(`flows.${flow.type}.selectedScopes`, [
      ...selectedScopes.value,
      id,
    ])
  }
  // Unchecked - Remove scope from list
  else {
    updateScheme(
      `flows.${flow.type}.selectedScopes`,
      selectedScopes.value.filter((scope) => scope !== id),
    )
  }
}

function selectAllScopes() {
  updateScheme(
    `flows.${flow.type}.selectedScopes`,
    Object.keys(flow?.scopes ?? {}),
  )
}
</script>

<template>
  <DataTableCell class="h-auto !max-h-[initial] min-h-8 items-center">
    <div class="flex h-fit w-full">
      <div class="text-c-1 h-full items-center"></div>
      <Disclosure
        as="div"
        class="bl flex w-full flex-col">
        <DisclosureButton
          v-slot="{ open }"
          :class="[
            'group/scopes-accordion hover:text-c-1 flex h-auto min-h-8 cursor-pointer items-center gap-1.5 pr-2.25 pl-3 text-left',
            (flow?.selectedScopes?.length || 0) > 0 ? 'text-c-1' : 'text-c-3',
          ]">
          <div class="flex-1">
            Scopes Selected
            {{ flow?.selectedScopes?.length || 0 }} /
            {{ Object.keys(flow?.scopes ?? {}).length || 0 }}
          </div>
          <div class="flex items-center gap-1.75">
            <ScalarButton
              v-if="
                flow?.selectedScopes?.length > 4 &&
                open &&
                flow?.selectedScopes?.length <
                  Object.keys(flow?.scopes ?? {}).length
              "
              class="text-c-3 hover:bg-b-2 hover:text-c-1 rounded px-1.5"
              size="sm"
              @click.stop="selectAllScopes">
              Select All
            </ScalarButton>
            <ScalarIcon
              class="text-c-3 group-hover/scopes-accordion:text-c-2"
              :icon="open ? 'ChevronDown' : 'ChevronRight'"
              size="md" />
          </div>
        </DisclosureButton>
        <DisclosurePanel as="template">
          <table
            class="grid auto-rows-auto"
            :style="{ gridTemplateColumns: '1fr auto' }">
            <DataTableRow
              v-for="{ id, label, description } in scopes"
              :key="id"
              class="text-c-2"
              @click="setScope(id, !selectedScopes.includes(id))">
              <DataTableCell
                class="hover:text-c-1 box-border !max-h-[initial] w-full cursor-pointer px-3 py-1.5">
                <div v-if="description">
                  <span class="font-code text-xs">{{ label }}</span>
                  &ndash;
                  {{ description }}
                </div>
              </DataTableCell>
              <DataTableCheckbox
                :modelValue="selectedScopes.includes(id)"
                @update:modelValue="() => {}" />
            </DataTableRow>
          </table>
        </DisclosurePanel>
      </Disclosure>
    </div>
  </DataTableCell>
</template>
