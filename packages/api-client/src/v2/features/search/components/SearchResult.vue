<script setup lang="ts">
import { ScalarSearchResultItem } from '@scalar/components/search-results'
import {
  ScalarIconTag,
  ScalarIconTerminalWindow,
  ScalarIconTextAlignLeft,
} from '@scalar/icons'
import type { ScalarIconComponent } from '@scalar/icons/types'
import { HttpMethod } from '@scalar/sidebar'
import type { FuseResult } from 'fuse.js'
import { computed } from 'vue'

import { useLocalization } from '@/v2/features/localization'
import type { FuseData } from '@/v2/features/search/types'

defineProps<{
  id: string
  isSelected: boolean
  result: FuseResult<FuseData>
}>()

const { translate } = useLocalization()

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

const ENTRY_LABELS = computed(() => ({
  heading: translate('apiClient.searchResult.heading'),
  operation: translate('apiClient.searchResult.operation'),
  tag: translate('apiClient.searchResult.tag'),
}))
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
        <span class="sr-only"
          >{{ translate('apiClient.searchResult.httpMethod') }}
          {{ result.item.method ?? 'get' }}
        </span>
        <span class="sr-only">{{
          translate('apiClient.searchResult.path')
        }}</span>
        {{ result.item.path }}
      </span>
    </template>
    <template
      v-else-if="result.item.description"
      #description>
      <span class="sr-only">{{
        translate('apiClient.searchResult.description')
      }}</span>
      {{ result.item.description }}
    </template>
  </ScalarSearchResultItem>
</template>
