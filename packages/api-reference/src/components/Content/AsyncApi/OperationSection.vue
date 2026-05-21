<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import { slugify } from '@scalar/helpers/string/slugify'
import type {
  AsyncApiChannelObject,
  AsyncApiMessageObject,
  AsyncApiOperationObject,
} from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { computed, useId } from 'vue'

import { Anchor } from '@/components/Anchor'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContainer,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'

import MessagesList from './MessagesList.vue'

const { operationId, operation } = defineProps<{
  /** The key of the operation in the AsyncAPI `operations` map */
  operationId: string
  operation: AsyncApiOperationObject
  eventBus: WorkspaceEventBus | null
}>()

/** Id of the heading element, used to label the section for screen readers */
const headerId = useId()

/** Stable id for the section element, used for deep links */
const id = computed(() => `operation/${slugify(operationId)}`)

/** Human-friendly heading, falling back to the operation key */
const title = computed(() => operation.title ?? operationId)

const toMessage = (key: string, message: AsyncApiMessageObject) => ({
  id: key,
  label: message.title ?? message.name ?? key,
})

/**
 * The messages listed in the box.
 *
 * An operation MAY reference a subset of its channel's messages. When the
 * `messages` key is omitted entirely, the AsyncAPI spec says every message
 * defined on the referenced channel is used, so we fall back to those.
 */
const messages = computed(() => {
  if (operation.messages) {
    return operation.messages.map((entry, index) => {
      const message = getResolvedRef(entry) as AsyncApiMessageObject
      return toMessage(message.name ?? `message-${index}`, message)
    })
  }

  const channel = getResolvedRef(operation.channel) as AsyncApiChannelObject
  return Object.entries(channel.messages ?? {}).map(([key, entry]) =>
    toMessage(key, getResolvedRef(entry) as AsyncApiMessageObject),
  )
})
</script>

<template>
  <SectionContainer
    :aria-labelledby="headerId"
    role="region">
    <Section
      :id="id"
      role="none"
      @intersecting="() => eventBus?.emit('intersecting:nav-item', { id })">
      <SectionHeader>
        <Anchor
          @copyAnchorUrl="() => eventBus?.emit('copy-url:nav-item', { id })">
          <SectionHeaderTag
            :id="headerId"
            :level="2">
            {{ title }}
          </SectionHeaderTag>
        </Anchor>
      </SectionHeader>
      <SectionContent>
        <SectionColumns>
          <SectionColumn>
            <ScalarMarkdown
              :value="operation.description ?? ''"
              withImages />
          </SectionColumn>
          <SectionColumn>
            <MessagesList
              :messages="messages"
              :title="title" />
          </SectionColumn>
        </SectionColumns>
      </SectionContent>
    </Section>
  </SectionContainer>
</template>
