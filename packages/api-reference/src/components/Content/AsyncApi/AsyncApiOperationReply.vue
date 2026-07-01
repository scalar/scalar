<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type {
  AsyncApiMessageObject,
  AsyncApiOperationReplyObject,
} from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

import AsyncApiSectionTitle from './AsyncApiSectionTitle.vue'

const { reply } = defineProps<{
  /** Operation reply object, possibly a `$ref`. */
  reply: unknown
}>()

const { translate } = useLocalization()

/**
 * Resolved reply object, or undefined when not present. Consumers below optional-chain every access,
 * so no extra runtime narrowing is needed here.
 */
const resolved = computed<AsyncApiOperationReplyObject | undefined>(
  () => getResolvedRef(reply) as AsyncApiOperationReplyObject | undefined,
)

/** Reply address (runtime expression locating where the reply is sent). */
const address = computed(() =>
  resolved.value?.address ? getResolvedRef(resolved.value.address) : undefined,
)

/** Address of the channel the reply is sent on, when a reply channel is referenced. */
const channelAddress = computed(() => {
  const channel = resolved.value?.channel
    ? getResolvedRef(resolved.value.channel)
    : undefined
  return channel?.address ?? undefined
})

/** Human-friendly names of the reply messages. */
const messageNames = computed(() =>
  (resolved.value?.messages ?? [])
    .map(
      (message) => getResolvedRef(message) as AsyncApiMessageObject | undefined,
    )
    .map((message) => message?.title || message?.name)
    .filter((name): name is string => Boolean(name)),
)

const hasContent = computed(
  () =>
    Boolean(address.value?.location) ||
    Boolean(channelAddress.value) ||
    messageNames.value.length > 0,
)
</script>

<template>
  <div
    v-if="hasContent"
    class="async-api-reply">
    <AsyncApiSectionTitle>{{
      translate('asyncapi.reply')
    }}</AsyncApiSectionTitle>
    <dl class="async-api-reply-grid">
      <template v-if="channelAddress">
        <dt>{{ translate('asyncapi.replyChannel') }}</dt>
        <dd>
          <code>{{ channelAddress }}</code>
        </dd>
      </template>
      <template v-if="address?.location">
        <dt>{{ translate('asyncapi.replyAddress') }}</dt>
        <dd>
          <code>{{ address.location }}</code>
        </dd>
      </template>
      <template v-if="messageNames.length">
        <dt>{{ translate('asyncapi.replyMessages') }}</dt>
        <dd>{{ messageNames.join(', ') }}</dd>
      </template>
    </dl>
    <ScalarMarkdown
      v-if="address?.description"
      class="async-api-reply-description"
      :value="address.description"
      withImages />
  </div>
</template>

<style scoped>
.async-api-reply {
  margin-top: 12px;
}
.async-api-reply-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 12px;
  margin: 0;
  font-size: var(--scalar-small);
}
.async-api-reply-grid dt {
  color: var(--scalar-color-2);
}
.async-api-reply-grid dd {
  margin: 0;
  color: var(--scalar-color-1);
  min-width: 0;
}
.async-api-reply-description {
  margin-top: 8px;
  text-align: left;
}
</style>
