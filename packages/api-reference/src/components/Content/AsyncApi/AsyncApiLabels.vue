<script setup lang="ts">
import { computed } from 'vue'

const { servers = [], protocols = [] } = defineProps<{
  /** Names of the servers an entry is available on. */
  servers?: string[]
  /** Protocol identifiers (for example `wss`, `kafka`) shown as uppercase pills. */
  protocols?: string[]
}>()

/** Hide the whole row when there is nothing to show. */
const hasLabels = computed(() => servers.length > 0 || protocols.length > 0)
</script>

<template>
  <div
    v-if="hasLabels"
    class="async-api-labels">
    <template v-if="servers.length">
      <span class="sr-only">Servers:</span>
      <span
        v-for="server in servers"
        :key="`server-${server}`"
        class="async-api-label async-api-label--server"
        :title="server">
        {{ server }}
      </span>
    </template>
    <template v-if="protocols.length">
      <span class="sr-only">Protocols:</span>
      <span
        v-for="protocol in protocols"
        :key="`protocol-${protocol}`"
        class="async-api-label async-api-label--protocol"
        :title="protocol">
        {{ protocol }}
      </span>
    </template>
  </div>
</template>

<style scoped>
.async-api-labels {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.async-api-label {
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
  line-height: 1.4;
  border-radius: 12px;
  padding: 2px 8px;
  display: inline-flex;
  align-items: center;
}
.async-api-label--server {
  color: var(--scalar-color-2);
  background: var(--scalar-background-2);
}
.async-api-label--protocol {
  color: var(--scalar-color-1);
  background: var(--scalar-background-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
