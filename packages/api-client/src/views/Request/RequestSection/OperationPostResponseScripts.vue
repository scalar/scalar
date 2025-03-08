<script setup lang="ts">
import type { Operation } from '@scalar/oas-utils/entities/spec'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'

import PostResponseScripts from './PostResponseScripts.vue'

const { operation } = defineProps<{
  operation: Operation
}>()
</script>

<template>
  <ViewLayoutCollapse
    class="group/preview w-full border-b-0"
    :defaultOpen="false">
    <template #title>Post Response Scripts</template>
    <PostResponseScripts :operation="operation" />
  </ViewLayoutCollapse>
</template>
