<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { ScalarIconTrash } from '@scalar/icons'
import type {
  CollectionType,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { computed } from 'vue'

import { CodeInput } from '@/v2/components/code-input'
import {
  DataTable,
  DataTableCell,
  DataTableCheckbox,
  DataTableHeader,
  DataTableRow,
} from '@/v2/components/data-table'

const { cookies, eventBus, collectionType } = defineProps<
  {
    cookies: XScalarCookie[]
    eventBus: WorkspaceEventBus
  } & CollectionType
>()

/** Column widths: Enabled checkbox, Name, Value, Domain, Actions (delete button) */
const COLUMNS = ['32px', '1fr', '1fr', '1fr', '36px']

/** Adds an empty row at the end for creating new cookies */
const displayRows = computed<
  {
    name: string
    value: string
    domain: string
    isDisabled: boolean
  }[]
>(() => {
  /** Normalize the cookies to have name, value, and domain */
  const cookieRows = cookies.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain ?? '',
    isDisabled: cookie.isDisabled ?? false,
  }))

  const lastCookie = cookies.at(-1)
  const hasContentInLastRow =
    lastCookie &&
    (lastCookie.name !== '' ||
      lastCookie.value !== '' ||
      lastCookie.domain !== '')

  // Add the extra row at the end
  if (!lastCookie || hasContentInLastRow) {
    return [
      ...cookieRows,
      { name: '', value: '', domain: '', isDisabled: true },
    ]
  }

  return cookieRows
})

/** Updates an existing cookie or creates a new one */
const handleCookieChange = (
  name: string,
  value: string,
  domain: string,
  isDisabled: boolean,
  index: number,
): void => {
  const isNewCookie = index >= cookies.length

  /**
   * Do not allow adding a new cookie with an empty name on the last row,
   * we allow it on other rows as it will delete the row
   */
  if (!name && isNewCookie) {
    return
  }

  // Adding a new cookie
  if (index >= cookies.length) {
    eventBus.emit('cookie:upsert:cookie', {
      payload: { name, value, domain, isDisabled: false },
      collectionType,
    })
    return
  }

  // Updating existing cookie
  eventBus.emit('cookie:upsert:cookie', {
    payload: { name, value, domain, isDisabled },
    collectionType,
    index,
  })
}

/** Deletes a cookie by index */
const handleCookieDelete = (index: number): void =>
  eventBus.emit('cookie:delete:cookie', {
    cookieName: cookies[index]?.name ?? '',
    index,
    collectionType,
  })
</script>
<template>
  <!-- Cookies table -->
  <DataTable
    class="group/table data-table h-min flex-1 rounded border"
    :columns="COLUMNS">
    <!-- Accessibility header row -->
    <DataTableRow class="sr-only !block">
      <DataTableHeader>Enabled</DataTableHeader>
      <DataTableHeader>Name</DataTableHeader>
      <DataTableHeader>Value</DataTableHeader>
      <DataTableHeader>Domain</DataTableHeader>
      <DataTableHeader>Actions</DataTableHeader>
    </DataTableRow>

    <!-- Cookie rows -->
    <DataTableRow
      v-for="(row, index) in displayRows"
      :key="index"
      class="group/row">
      <!-- Enabled checkbox -->
      <DataTableCheckbox
        class="!border-r"
        :modelValue="!row.isDisabled"
        @update:modelValue="
          (value) =>
            handleCookieChange(row.name, row.value, row.domain, !value, index)
        " />

      <!-- Name -->
      <DataTableCell>
        <CodeInput
          aria-label="Cookie Name"
          disableCloseBrackets
          disableTabIndent
          :environment="undefined"
          lineWrapping
          :modelValue="row.name"
          placeholder="Name"
          @update:modelValue="
            (name) =>
              handleCookieChange(
                name,
                row.value,
                row.domain,
                row.isDisabled,
                index,
              )
          " />
      </DataTableCell>

      <!-- Value -->
      <DataTableCell>
        <CodeInput
          aria-label="Cookie Value"
          disableTabIndent
          :environment="undefined"
          lineWrapping
          :modelValue="row.value"
          placeholder="Value"
          @update:modelValue="
            (value) =>
              handleCookieChange(
                row.name,
                value,
                row.domain,
                row.isDisabled,
                index,
              )
          " />
      </DataTableCell>

      <!-- Domain -->
      <DataTableCell>
        <CodeInput
          aria-label="Cookie Domain"
          disableCloseBrackets
          disableTabIndent
          :environment="undefined"
          lineWrapping
          :modelValue="row.domain"
          placeholder="Domain"
          @update:modelValue="
            (domain) =>
              handleCookieChange(
                row.name,
                row.value,
                domain,
                row.isDisabled,
                index,
              )
          " />
      </DataTableCell>

      <!-- Delete button -->
      <DataTableCell class="flex items-center justify-center">
        <ScalarButton
          v-if="index < cookies.length"
          class="text-c-2 hover:text-c-1 hover:bg-b-2 hidden h-fit rounded p-1 group-focus-within:flex group-hover/row:flex"
          size="sm"
          variant="ghost"
          @click="handleCookieDelete(index)">
          <ScalarIconTrash class="size-3.5" />
        </ScalarButton>
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
