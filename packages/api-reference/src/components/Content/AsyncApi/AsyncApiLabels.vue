<script setup lang="ts">
import { computed } from 'vue'

import { Badge } from '@/components/Badge'
import { useApiReferenceLocalization } from '@/features/localization'

const { servers = [], protocols = [] } = defineProps<{
  /** Names of the servers an entry is available on. */
  servers?: string[]
  /** Protocol identifiers (for example `wss`, `kafka`) shown as uppercase pills. */
  protocols?: string[]
}>()
const { translate } = useApiReferenceLocalization()

/** Hide the whole row when there is nothing to show. */
const hasLabels = computed(() => servers.length > 0 || protocols.length > 0)
</script>

<template>
  <div
    v-if="hasLabels"
    class="async-api-labels">
    <template v-if="servers.length">
      <span class="sr-only">{{ translate('asyncapi.servers') }}:</span>
      <Badge
        v-for="server in servers"
        :key="`server-${server}`"
        class="async-api-label--server"
        :title="server">
        {{ server }}
      </Badge>
    </template>
    <template v-if="protocols.length">
      <span class="sr-only">{{ translate('asyncapi.protocols') }}:</span>
      <Badge
        v-for="protocol in protocols"
        :key="`protocol-${protocol}`"
        class="async-api-label--protocol"
        :title="protocol">
        {{ protocol }}
      </Badge>
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
/* Protocols read as identifiers, so render them uppercase to set them apart from server names. */
.async-api-label--protocol {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
