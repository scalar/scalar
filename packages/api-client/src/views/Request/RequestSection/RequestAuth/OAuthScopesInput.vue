<script setup lang="ts">
import {
  DataTableCell,
  DataTableCheckbox,
  DataTableRow,
} from '@/components/DataTable'
import type { UpdateScheme } from '@/store'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import type { Oauth2Flow } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

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
  if (checked)
    updateScheme(`flows.${flow.type}.selectedScopes`, [
      ...selectedScopes.value,
      id,
    ])
  // Unchecked - Remove scope from list
  else
    updateScheme(
      `flows.${flow.type}.selectedScopes`,
      selectedScopes.value.filter((scope) => scope !== id),
    )
}
</script>

<template>
  <DataTableCell class="items-center min-h-8 h-auto !max-h-[initial]">
    <div class="flex h-fit w-full">
      <div class="text-c-1 items-center h-full"></div>
      <Disclosure
        as="div"
        class="flex flex-col w-full bl">
        <DisclosureButton
          v-slot="{ open }"
          :class="[
            'group/scopes-accordion flex items-center text-left min-h-8 gap-1.5 h-auto pl-3 pr-2 hover:text-c-1 cursor-pointer',
            (flow?.selectedScopes?.length || 0) > 0 ? 'text-c-1' : 'text-c-3',
          ]">
          <div class="flex-1">
            Scopes Selected
            {{ flow?.selectedScopes?.length || 0 }} /
            {{ Object.keys(flow?.scopes ?? {}).length || 0 }}
          </div>
          <ScalarIcon
            class="text-c-3 group-hover/scopes-accordion:text-c-2"
            :icon="open ? 'ChevronDown' : 'ChevronRight'"
            size="sm" />
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
                class="w-full px-3 py-1.5 hover:text-c-1 cursor-pointer !max-h-[initial]">
                <span>
                  <span v-if="description">
                    <span class="font-code text-xs">{{ label }}</span>
                    &ndash;
                    {{ description }}
                  </span>
                </span>
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
