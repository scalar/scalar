<script setup lang="ts">
import type { SchemaRenderingProps } from '@scalar/blocks/schema'
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

import { SectionHeaderTag } from '@/components/Section'
import type { HeadingLevel } from '@/features/document-outline'
import { useNavigationHref } from '@/hooks/use-navigation-href'

import type { AsyncApiSchemaRenderOptions } from './helpers/async-api-render-options'
import type { OperationReply } from './helpers/get-operation-reply'
import Message from './Message.vue'

const { reply, eventBus, level, document, options } = defineProps<
  {
    document: AsyncApiDocument
    options?: Partial<AsyncApiSchemaRenderOptions>
    reply: OperationReply
    eventBus: WorkspaceEventBus | null
    level: HeadingLevel
  } & SchemaRenderingProps
>()

const href = useNavigationHref()

/** Preserve native modified-click navigation while ordinary clicks reveal lazy content. */
const navigate = (event: MouseEvent, id: string): void => {
  if (
    !eventBus ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }
  event.preventDefault()
  eventBus.emit('scroll-to:nav-item', { id })
}
</script>

<template>
  <div class="mt-6 min-w-0">
    <SectionHeaderTag
      class="text-c-1 mb-3 block! text-base leading-[1.45] font-medium"
      :level="level"
      rule>
      Replies
    </SectionHeaderTag>
    <dl class="grid gap-3 text-sm">
      <div v-if="reply.channel">
        <dt class="text-c-2 text-sm">Channel</dt>
        <dd class="mt-1 break-words">
          <a
            v-if="reply.channel.id"
            class="text-c-2 hover:text-c-1 rounded underline focus-visible:outline"
            :href="href(reply.channel.id)"
            @click="navigate($event, reply.channel.id)">
            {{ reply.channel.title }}
          </a>
          <span v-else>{{ reply.channel.title }}</span>
        </dd>
      </div>
      <div v-if="reply.address !== undefined">
        <dt class="text-c-2 text-sm">
          {{ reply.dynamicAddress ? 'Dynamic reply address' : 'Reply address' }}
        </dt>
        <dd class="mt-1">
          <code class="break-all">{{ reply.address }}</code>
          <ScalarMarkdown
            v-if="reply.description"
            class="mt-1"
            :value="reply.description" />
        </dd>
      </div>
    </dl>
    <div
      v-if="reply.messages.length"
      class="mt-3 grid gap-3">
      <template
        v-for="(message, index) in reply.messages"
        :key="index">
        <Message
          v-if="message.entry"
          :document="document"
          :eventBus="eventBus"
          :expansion="expansion"
          inline
          :message="message.entry"
          :options="options"
          :specificationExtension="specificationExtension" />
        <a
          v-else-if="message.id"
          class="text-c-2 hover:text-c-1 text-sm underline"
          :href="href(message.id)"
          @click="navigate($event, message.id)"
          >{{ message.title }}</a
        >
        <span
          v-else
          class="text-sm"
          >{{ message.title }}</span
        >
      </template>
    </div>
  </div>
</template>
