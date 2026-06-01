<script setup lang="ts">
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  TraversedAsyncApiMessage,
  TraversedAsyncApiOperation,
  TraversedEntry,
} from '@scalar/workspace-store/schemas/navigation'
import { computed, useId } from 'vue'

import { Anchor } from '@/components/Anchor'
import { Badge } from '@/components/Badge'
import {
  Section,
  SectionContainer,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'

import Message from './Message.vue'

const {
  operation,
  level = 0,
  eventBus,
  expandedItems,
} = defineProps<{
  operation: TraversedAsyncApiOperation
  document: AsyncApiDocument
  eventBus: WorkspaceEventBus | null
  /** Used to determine which message accordions are open. */
  expandedItems: Record<string, boolean>
  /** Nesting depth, used to skip the outer container padding when nested. */
  level?: number
}>()

const headerId = useId()

/** Messages nested under this operation, rendered as accordions in the section. */
const messages = computed(() =>
  (operation.children ?? []).filter(
    (entry: TraversedEntry): entry is TraversedAsyncApiMessage =>
      entry.type === 'asyncapi-message',
  ),
)
</script>

<template>
  <SectionContainer :omit="level !== 0">
    <Section
      :id="operation.id"
      :aria-labelledby="headerId"
      class="[--font-size:var(--scalar-heading-2)]"
      role="region"
      @intersecting="
        () => eventBus?.emit('intersecting:nav-item', { id: operation.id })
      ">
      <SectionContent>
        <!-- Badge row above the heading, mirroring the OpenAPI operation layout. -->
        <div class="mb-1 flex gap-1">
          <!-- send/receive tells the reader which direction the operation flows. -->
          <Badge class="uppercase">{{ operation.action }}</Badge>
        </div>
        <SectionHeader removeMargin>
          <Anchor
            @copyAnchorUrl="
              () => eventBus?.emit('copy-url:nav-item', { id: operation.id })
            ">
            <SectionHeaderTag
              :id="headerId"
              :level="3">
              {{ operation.title }}
            </SectionHeaderTag>
          </Anchor>
        </SectionHeader>
      </SectionContent>

      <!-- Messages listed as accordions, like the OpenAPI models section. -->
      <Message
        v-for="message in messages"
        :key="message.id"
        :document="document"
        :eventBus="eventBus"
        :isCollapsed="!expandedItems[message.id]"
        :message="message" />
    </Section>
  </SectionContainer>
</template>
