<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableCheckbox from '@/components/DataTable/DataTableCheckbox.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import DataTableText from '@/components/DataTable/DataTableText.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import { type ThemeId, themeLabels } from '@scalar/themes'

import SettingsGeneralMode from './SettingsGeneralMode.vue'

const { activeWorkspace, workspaceMutators } = useWorkspace()

const toggleScalarProxy = () => {
  if (activeWorkspace.value.proxyUrl) {
    workspaceMutators.edit(activeWorkspace.value.uid, 'proxyUrl', '')
  } else {
    workspaceMutators.edit(
      activeWorkspace.value.uid,
      'proxyUrl',
      'https://proxy.scalar.com',
    )
  }
}

const themeIds: ThemeId[] = [
  'default',
  'alternate',
  'moon',
  'purple',
  'solarized',
  'bluePlanet',
  'saturn',
  'kepler',
  'mars',
  'deepSpace',
]

const changeTheme = (themeId: ThemeId) => {
  workspaceMutators.edit(activeWorkspace.value.uid, 'themeId', themeId)
}
</script>
<template>
  <ViewLayoutSection>
    <template #title>General</template>
    <div class="flex flex-col p-2">
      <DataTable :columns="['', '']">
        <DataTableRow>
          <DataTableText text="Use Scalar Proxy" />
          <DataTableCheckbox
            align="left"
            :modelValue="!!activeWorkspace.proxyUrl"
            @update:modelValue="toggleScalarProxy" />
        </DataTableRow>
        <DataTableRow>
          <DataTableText text="Theme Picker" />
          <DataTableCell>
            <ScalarDropdown>
              <ScalarButton
                class="font-normal h-full justify-start py-1.5 px-1.5 text-c-1 hover:bg-b-2 w-fit"
                fullWidth
                variant="ghost">
                <h2 class="font-medium m-0 text-sm flex gap-1.5 items-center">
                  {{ themeLabels[activeWorkspace.themeId] }}
                  <ScalarIcon
                    class="size-2.5"
                    icon="ChevronDown"
                    thickness="3.5" />
                </h2>
              </ScalarButton>

              <!-- Workspace list -->
              <template #items>
                <ScalarDropdownItem
                  v-for="themeId in themeIds"
                  :key="themeId"
                  class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden"
                  @click.stop="changeTheme(themeId)">
                  <div
                    class="flex items-center justify-center rounded-full p-[3px] w-4 h-4 group-hover/item:shadow-border"
                    :class="
                      activeWorkspace.themeId === themeId
                        ? 'bg-blue text-b-1'
                        : 'text-transparent'
                    ">
                    <ScalarIcon
                      class="size-2.5"
                      icon="Checkmark"
                      thickness="3.5" />
                  </div>
                  {{ themeLabels[themeId] }}
                </ScalarDropdownItem>
              </template>
            </ScalarDropdown>
          </DataTableCell>
        </DataTableRow>
        <DataTableRow>
          <SettingsGeneralMode />
        </DataTableRow>
      </DataTable>
    </div>
  </ViewLayoutSection>
</template>
