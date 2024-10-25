<script setup lang="ts">
import {
  DataTableCell,
  DataTableCheckbox,
  DataTableRow,
} from '@/components/DataTable'
import type { UpdateScheme } from '@/store'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import type { SecuritySchemeOauth2 } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

const props = defineProps<{
  activeFlow: SecuritySchemeOauth2['flow']
  updateScheme: UpdateScheme
}>()

const scopes = computed(() =>
  Object.entries(props.activeFlow?.scopes ?? {}).map(([key, val]) => ({
    id: key,
    label: key,
    description: val,
  })),
)

/** An array of the selected scope ids */
const selectedScopes = computed(() => props.activeFlow?.selectedScopes || [])

function setScope(id: string, checked: boolean) {
  // Checked - Add scope to list
  if (checked)
    props.updateScheme('flow.selectedScopes', [...selectedScopes.value, id])
  // Unchecked - Remove scope from list
  else
    props.updateScheme(
      'flow.selectedScopes',
      selectedScopes.value.filter((scope) => scope !== id),
    )
}
</script>

<template>
  <DataTableCell class="items-center min-h-8 h-auto">
    <div class="flex h-fit w-full">
      <div class="text-c-1 min-w-[94px] items-center pl-2 h-full">
        <span class="h-8 flex items-center"> Scopes </span>
      </div>
      <Disclosure
        as="div"
        class="flex flex-col w-full bl">
        <DisclosureButton
          v-slot="{ open }"
          :class="[
            'group/scopes-accordion flex items-center text-left min-h-8 gap-1.5 h-auto pl-2 hover:text-c-1 pr-2.5 cursor-pointer',
            (activeFlow?.selectedScopes?.length || 0) > 0
              ? 'text-c-1'
              : 'text-c-3',
          ]">
          <div class="flex-1">
            Selected
            {{ activeFlow?.selectedScopes?.length || 0 }} /
            {{ Object.keys(activeFlow?.scopes ?? {}).length || 0 }}
          </div>
          <ScalarIcon
            class="text-c-3 group-hover/scopes-accordion:text-c-2"
            :icon="open ? 'ChevronDown' : 'ChevronRight'"
            size="xs" />
        </DisclosureButton>
        <DisclosurePanel as="template">
          <table
            class="grid auto-rows-auto border-t-1/2"
            :style="{ gridTemplateColumns: '1fr auto' }">
            <DataTableRow
              v-for="{ id, label, description } in scopes"
              :key="id"
              class="text-c-2"
              @click="setScope(id, !selectedScopes.includes(id))">
              <DataTableCell
                class="w-full px-2 py-1.5 hover:text-c-1 cursor-pointer">
                <span>
                  <span class="font-code text-xs">{{ label }}</span>
                  <span>&nbsp;&ndash; {{ description }}</span>
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
