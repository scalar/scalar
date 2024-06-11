<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useWorkspace } from '@/store/workspace'

const { cookies, activeCookieId, cookieMutators } = useWorkspace()
</script>
<template>
  <ViewLayoutSection>
    <template #title>
      <span>Raw Cookie String</span>
    </template>
    <template v-if="activeCookieId && cookies[activeCookieId]">
      <CodeInput
        class="px-2 py-2.5"
        lineNumbers
        modelValue="" />
    </template>
  </ViewLayoutSection>
</template>
