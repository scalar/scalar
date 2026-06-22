<script setup lang="ts">
import type { AsyncApiInfoObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ExternalDocumentationObject,
  InfoObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { LinkList } from '@/components/LinkList'
import { ExternalDocs } from '@/features/external-docs'
import { Contact, License, TermsOfService } from '@/features/info-object'

const { info, externalDocs } = defineProps<{
  info: InfoObject | AsyncApiInfoObject
  externalDocs?: ExternalDocumentationObject
}>()

/** Whether there is at least one link to show, so we do not render an empty list */
const hasLinks = computed(() =>
  Boolean(externalDocs || info.contact || info.license || info.termsOfService),
)
</script>

<template>
  <LinkList v-if="hasLinks">
    <ExternalDocs
      v-if="externalDocs"
      :value="externalDocs" />
    <Contact
      v-if="info.contact"
      :value="info.contact" />
    <License
      v-if="info.license"
      :value="getResolvedRef(info.license)" />
    <TermsOfService
      v-if="info.termsOfService"
      :value="info.termsOfService" />
  </LinkList>
</template>
