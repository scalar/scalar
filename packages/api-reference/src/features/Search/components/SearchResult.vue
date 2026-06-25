<script setup lang="ts">
import { ScalarSearchResultItem } from '@scalar/components/search-results'
import {
  ScalarIconBracketsCurly,
  ScalarIconTag,
  ScalarIconTerminalWindow,
  ScalarIconTextAlignLeft,
} from '@scalar/icons'
import type { ScalarIconComponent } from '@scalar/icons/types'
import { HttpMethod } from '@scalar/sidebar'
import {
  DEFAULT_MODELS_SECTION_LABEL,
  type ModelsSectionLabel,
} from '@scalar/types/api-reference'
import type { FuseResult } from 'fuse.js'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'
import type { EntryType, FuseData } from '@/features/Search/types'

const { modelsSectionLabel = DEFAULT_MODELS_SECTION_LABEL } = defineProps<{
  id: string
  isSelected: boolean
  result: FuseResult<FuseData>
  modelsSectionLabel?: ModelsSectionLabel
}>()
const { translate } = useLocalization()

const ENTRY_ICONS: { [x in EntryType]: ScalarIconComponent } = {
  heading: ScalarIconTextAlignLeft,
  model: ScalarIconBracketsCurly,
  operation: ScalarIconTerminalWindow,
  tag: ScalarIconTag,
  webhook: ScalarIconTerminalWindow,
}

const entryLabels = computed((): { [x in EntryType]: string } => ({
  heading: translate('search.entryHeading'),
  operation: translate('search.entryOperation'),
  tag: translate('search.entryTag'),
  model: modelsSectionLabel,
  webhook: translate('search.entryWebhook'),
}))
</script>

<template>
  <ScalarSearchResultItem
    :id="id"
    :icon="ENTRY_ICONS[result.item.type]"
    :selected="isSelected">
    <span
      :class="{
        'text-decoration-line':
          result.item.entry.type === 'operation' &&
          result.item.entry.isDeprecated,
      }">
      <span class="sr-only">
        {{ entryLabels[result.item.type] }}:&nbsp;
        <template
          v-if="
            result.item.entry.type === 'operation' &&
            result.item.entry.isDeprecated
          ">
          ({{ translate('common.deprecated') }})&nbsp;
        </template>
      </span>
      {{ result.item.title }}
      <span class="sr-only">,</span>
    </span>
    <template
      v-if="
        result.item.type !== 'webhook' &&
        (result.item.method || result.item.path) &&
        result.item.path !== result.item.title
      "
      #description>
      <span class="inline-flex items-center gap-1">
        <template v-if="result.item.type === 'operation'">
          <HttpMethod
            aria-hidden="true"
            :method="result.item.method ?? 'get'" />
          <span class="sr-only">
            {{ translate('common.httpMethod') }}:
            {{ result.item.method ?? 'get' }}
          </span>
        </template>
        <span class="sr-only">{{ translate('common.path') }}:&nbsp;</span>
        {{ result.item.path }}
      </span>
    </template>
    <template
      v-else-if="result.item.description"
      #description>
      <span class="sr-only">{{ translate('common.description') }}:&nbsp;</span>
      {{ result.item.description }}
    </template>
  </ScalarSearchResultItem>
</template>
