<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { onMounted } from 'vue'

import { LinkList } from '@/components/LinkList'
import { ExternalDocs } from '@/features/external-docs'
import { Contact, License, TermsOfService } from '@/features/info-object'

const { document } = defineProps<{
  document: OpenApiDocument
}>()
</script>

<template>
  <LinkList>
    <ExternalDocs :value="document.externalDocs" />
    <Contact
      v-if="document.info?.contact"
      :value="document.info?.contact" />
    <License
      v-if="document.info?.license"
      :value="document.info?.license" />
    <TermsOfService
      v-if="document.info?.termsOfService"
      :value="document.info?.termsOfService" />
  </LinkList>
</template>
