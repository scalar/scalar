<script lang="ts" setup>
import { getOpenApiDocumentVersion } from '@/components/ImportCollection/utils/getOpenApiDocumentVersion'
import { ScalarCodeBlock, ScalarIcon } from '@scalar/components'
import { isJsonString } from '@scalar/oas-utils/helpers'

defineProps<{
  content?: string | null
}>()
</script>
<template>
  <div
    v-if="content"
    class="flex gap-2 flex-col w-full">
    <div class="flex gap-2 items-center">
      <template v-if="getOpenApiDocumentVersion(content)">
        <div class="text-sm">
          {{ getOpenApiDocumentVersion(content) }}
        </div>
        <ScalarIcon
          class="text-green"
          icon="Checkmark"
          size="sm" />
      </template>
      <template v-else>
        <ScalarIcon
          class="text-red"
          icon="Error"
          size="sm" />
        <div class="text-sm">
          Oh, this doesn’t seem to be an OpenAPI/Swagger document:
        </div>
      </template>
    </div>
    <div class="h-32 overflow-hidden border rounded">
      <ScalarCodeBlock
        class="bg-b-2"
        :content="content ?? ''"
        :copy="false"
        :lang="isJsonString(content) ? 'json' : 'yaml'" />
    </div>
  </div>
</template>
