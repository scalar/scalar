<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import { computed } from 'vue'

import { Badge } from '@/components/Badge'
import { ExternalDocs } from '@/features/external-docs'

import {
  getAsyncApiTags,
  type AsyncApiTags,
} from './helpers/get-async-api-tags'

const { tags } = defineProps<{ tags?: AsyncApiTags }>()
const resolvedTags = computed(() => getAsyncApiTags(tags))
</script>

<template>
  <div
    v-if="resolvedTags.length"
    class="my-2 flex flex-wrap items-start gap-2">
    <template
      v-for="(tag, index) in resolvedTags"
      :key="index">
      <details
        v-if="tag.description || tag.externalDocs"
        class="max-w-full min-w-0 rounded-lg border px-2 py-1 text-sm">
        <summary class="text-c-2 cursor-pointer break-words">
          {{ tag.name }}
        </summary>
        <div class="mt-2 flex flex-col gap-2">
          <ScalarMarkdown
            v-if="tag.description"
            :value="tag.description" />
          <ExternalDocs
            v-if="tag.externalDocs"
            :value="tag.externalDocs" />
        </div>
      </details>
      <Badge
        v-else
        class="max-w-full break-words">
        {{ tag.name }}
      </Badge>
    </template>
  </div>
</template>
