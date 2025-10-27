<script setup lang="ts">
import type {
  ExternalDocumentationObject,
  InfoObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { LinkList } from '@/components/LinkList'
import { ExternalDocs } from '@/features/external-docs'
import { Contact, License, TermsOfService } from '@/features/info-object'

defineProps<{
  info: InfoObject
  externalDocs?: ExternalDocumentationObject
}>()
</script>

<template>
  <LinkList>
    <ExternalDocs :value="externalDocs" />
    <Contact
      v-if="info.contact"
      :value="info.contact" />
    <License
      v-if="info.license"
      :value="info.license" />
    <TermsOfService
      v-if="info.termsOfService"
      :value="info.termsOfService" />
  </LinkList>
</template>
