<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

const { activeCookieId } = useActiveEntities()
const { cookies } = useWorkspace()
</script>
<template>
  <ViewLayoutSection>
    <template #title>
      <span>Raw Cookie String</span>
    </template>
    <template v-if="activeCookieId && cookies[activeCookieId]">
      <CodeInput
        class="pl-px pr-2 md:px-2 py-2.5"
        lineNumbers
        modelValue="" />
    </template>
  </ViewLayoutSection>
</template>
