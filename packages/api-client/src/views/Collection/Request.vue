<script setup lang="ts">
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { useWorkspace } from '@/store/workspace'
import RequestSection from '@/views/Collection/RequestSection/RequestSection.vue'
import ResponseSection from '@/views/Collection/ResponseSection/ResponseSection.vue'

defineProps<{ showSideBar: boolean }>()

const { activeExample, activeRequest } = useWorkspace()
</script>
<template>
  <ViewLayoutContent
    v-if="activeExample"
    class="flex-1"
    :class="[showSideBar ? 'sidebar-active-hide-layout' : '']">
    <RequestSection />
    <ResponseSection
      :response="
        activeRequest?.history?.[activeRequest?.history?.length - 1]?.response
      " />
  </ViewLayoutContent>
</template>
