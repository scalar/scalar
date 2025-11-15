<script setup lang="ts">
import { ScalarSearchResultItem } from '@scalar/components'
import {
  ScalarIconTag,
  ScalarIconTerminalWindow,
  ScalarIconTextAlignLeft,
} from '@scalar/icons'
import type { ScalarIconComponent } from '@scalar/icons/types'
import { HttpMethod } from '@scalar/sidebar'
import type { FuseResult } from 'fuse.js'

import type { EntryType, FuseData } from '@/v2/features/search/types'

defineProps<{
  id: string
  isSelected: boolean
  result: FuseResult<FuseData>
}>()

const ENTRY_ICONS: { [x in EntryType]: ScalarIconComponent } = {
  heading: ScalarIconTextAlignLeft,
  operation: ScalarIconTerminalWindow,
  tag: ScalarIconTag,
}

const ENTRY_LABELS: { [x in EntryType]: string } = {
  heading: 'Heading',
  operation: 'Operation',
  tag: 'Tag',
}
</script>

<template>
  <ScalarSearchResultItem
    :id="id"
    :icon="ENTRY_ICONS[result.item.type]"
    :selected="isSelected">
    <div class="flex min-w-0 flex-col gap-0.5">
      <!--
        Document Name
        This search is across all documents, so we need to show the document name
        to help the user understand which document the result belongs to.
      -->
      <span
        v-if="result.item.documentName"
        class="text-c-3 truncate text-xs font-medium">
        {{ result.item.documentName }}
      </span>

      <!-- Deprecation message -->
      <span
        :class="{
          'text-decoration-line':
            result.item.entry.type === 'operation' &&
            result.item.entry.isDeprecated,
        }">
        <span class="sr-only">
          {{ ENTRY_LABELS[result.item.type] }}:&nbsp;
          <template
            v-if="
              result.item.entry.type === 'operation' &&
              result.item.entry.isDeprecated
            ">
            (Deprecated)&nbsp;
          </template>
        </span>
        {{ result.item.title }}
        <span class="sr-only">,</span>
      </span>
    </div>

    <!-- Method and Path -->
    <template
      v-if="result.item.type === 'operation'"
      #description>
      <span class="inline-flex items-center gap-1">
        <template v-if="result.item.type === 'operation'">
          <HttpMethod
            aria-hidden="true"
            :method="result.item.method ?? 'get'" />
          <span class="sr-only">
            HTTP Method: {{ result.item.method ?? 'get' }}
          </span>
        </template>
        <span class="sr-only">Path:&nbsp;</span>
        {{ result.item.path }}
      </span>
    </template>

    <!-- Description -->
    <template
      v-else-if="result.item.description"
      #description>
      <span class="sr-only">Description:&nbsp;</span>
      {{ result.item.description }}
    </template>
  </ScalarSearchResultItem>
</template>
