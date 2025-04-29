<script setup lang="ts">
import { ScalarViewLayoutSection } from '@scalar/components/components/ScalarViewLayout'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
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
  <ScalarViewLayoutSection>
    <template #title>
      <span>Raw Cookie String</span>
    </template>
    <template
      v-if="activeCookieId && cookies[activeCookieId] && activeWorkspace">
      <CodeInput
        class="py-2.5 pl-px pr-2 md:px-2"
        :envVariables="activeEnvVariables"
        :environment="activeEnvironment"
        lineNumbers
        modelValue=""
        :workspace="activeWorkspace" />
    </template>
  </ScalarViewLayoutSection>
</template>
