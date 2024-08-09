<script setup lang="ts">
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { ScalarIcon } from '@scalar/components'

import { useWebSocket } from './useWebSocket'

const { messageHistory } = useWebSocket()
</script>
<template>
  <ViewLayoutSection>
    <template #title>
      <ScalarIcon
        class="text-c-3 mr-2 rotate-180"
        icon="ExternalLink"
        size="sm"
        thickness="2.5" />
      <div class="flex items-center flex-1">Response</div>
    </template>
    <div class="custom-scroll flex flex-1 flex-col px-2 xl:px-6 py-2.5">
      <div
        v-for="history in messageHistory"
        :key="history.message">
        {{ history.type }} : {{ history.message }}
      </div>
    </div>
  </ViewLayoutSection>
</template>
