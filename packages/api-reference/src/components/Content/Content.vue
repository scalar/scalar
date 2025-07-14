<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'

import { Introduction } from '@/components/Content/Introduction'
import { Models } from '@/components/Content/Models'
import { SectionFlare } from '@/components/SectionFlare'
import { useConfig } from '@/hooks/useConfig'

import { TraversedEntryContainer } from './Operations'

defineProps<{
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
}>()

const config = useConfig()
</script>
<template>
  <SectionFlare />

  <div class="narrow-references-container">
    <slot name="start" />

    <!-- Introduction -->
    <Introduction
      v-if="document?.info?.title || document?.info?.description"
      :document
      :config />

    <!-- Empty State -->
    <slot
      v-else
      name="empty-state" />

    <!-- Loop on traversed entries -->
    <TraversedEntryContainer
      :document
      :config />

    <!-- Models -->
    <Models
      v-if="!config?.hideModels"
      :document
      :config />

    <slot name="end" />
  </div>
</template>

<style>
.narrow-references-container {
  container-name: narrow-references-container;
  container-type: inline-size;
}
</style>
