<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

const {
  activeCookieId,
  activeEnvVariables,
  activeEnvironment,
  activeWorkspace,
} = useActiveEntities()
const { cookies } = useWorkspace()
</script>
<template>
  <ViewLayoutSection>
    <template #title>
      <span>Raw Cookie String</span>
    </template>
    <template
      v-if="activeCookieId && cookies[activeCookieId] && activeWorkspace">
      <CodeInput
        class="py-2.5 pr-2 pl-px md:px-2"
        :envVariables="activeEnvVariables"
        :environment="activeEnvironment"
        lineNumbers
        modelValue=""
        :workspace="activeWorkspace" />
    </template>
  </ViewLayoutSection>
</template>
