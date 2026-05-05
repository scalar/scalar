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

import type { FuseData } from '@/v2/features/search/types'

defineProps<{
  id: string
  isSelected: boolean
  result: FuseResult<FuseData>
}>()

/**
 * Icon used for each search result type. Operations use the terminal glyph to
 * match the sidebar's operation indicator, tags and headings use their closest
 * semantic equivalents.
 */
const ENTRY_ICONS: { [x in FuseData['type']]: ScalarIconComponent } = {
  heading: ScalarIconTextAlignLeft,
  operation: ScalarIconTerminalWindow,
  tag: ScalarIconTag,
}

const ENTRY_LABELS: { [x in FuseData['type']]: string } = {
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
    <span>
      <span class="sr-only">{{ ENTRY_LABELS[result.item.type] }}:&nbsp;</span>
      {{ result.item.title }}
      <span class="sr-only">,</span>
    </span>
    <template
      v-if="
        result.item.type === 'operation' &&
        (result.item.method || result.item.path) &&
        result.item.path !== result.item.title
      "
      #description>
      <span class="inline-flex items-center gap-1">
        <HttpMethod
          aria-hidden="true"
          :method="result.item.method ?? 'get'" />
        <span class="sr-only">
          HTTP Method: {{ result.item.method ?? 'get' }}
        </span>
        <span class="sr-only">Path:&nbsp;</span>
        {{ result.item.path }}
      </span>
    </template>
    <template
      v-else-if="result.item.description"
      #description>
      <span class="sr-only">Description:&nbsp;</span>
      {{ result.item.description }}
    </template>
  </ScalarSearchResultItem>
</template>
