<script setup lang="ts">
import type { AsyncApiInfoObject } from '@scalar/types/asyncapi/3.1'
import type { ExternalDocumentationObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

import { LinkList } from '@/components/LinkList'
import { ExternalDocs } from '@/features/external-docs'

import { getExternalDocumentation } from './helpers/get-external-documentation'

const { owner } = defineProps<{
  /** Documentation stays with its owner, independently of navigation grouping. */
  owner?: Pick<AsyncApiInfoObject, 'externalDocs' | 'tags'>
}>()

const documentation = computed<ExternalDocumentationObject[]>(() =>
  getExternalDocumentation(owner),
)
</script>

<template>
  <LinkList v-if="documentation.length">
    <ExternalDocs
      v-for="(value, index) in documentation"
      :key="index"
      :value />
  </LinkList>
</template>
