<script setup lang="ts">
import { ScalarIconSparkle } from '@scalar/icons'

import { useAgentContext } from '@/hooks/use-agent'

const agentContext = useAgentContext()
</script>

<template>
  <button
    class="bg-sidebar-b-search text-sidebar-c-2 hover:text-sidebar-c-1 flex items-center gap-1.5 rounded border px-2 text-base whitespace-nowrap"
    type="button"
    @click="agentContext?.toggleAgent()">
    <ScalarIconSparkle />
    Ask AI
  </button>
</template>
