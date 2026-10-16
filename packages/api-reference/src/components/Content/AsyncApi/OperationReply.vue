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
  <div class="mt-5 min-w-0">
    <SectionHeaderTag
      class="text-c-1 mb-2 block! text-base leading-[1.45] font-medium"
      :level="level">
      Replies
    </SectionHeaderTag>
    <div class="bg-b-1 rounded-lg border">
      <div
        v-if="reply.channel || reply.address !== undefined || reply.description"
        class="bg-b-2 px-4 py-3"
        :class="reply.messages.length ? 'rounded-t-lg border-b' : 'rounded-lg'">
        <dl class="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <div
            v-if="reply.channel"
            class="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            <dt class="text-c-2">Channel</dt>
            <dd class="min-w-0 break-words">
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
          <div
            v-if="reply.address !== undefined"
            class="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            <dt class="text-c-2">
              {{ reply.dynamicAddress ? 'Dynamic address' : 'Address' }}
            </dt>
            <dd class="min-w-0">
              <code class="text-xs break-all">{{ reply.address }}</code>
            </dd>
          </div>
        </dl>
        <ScalarMarkdown
          v-if="reply.description"
          class="text-c-2 mt-1 text-sm"
          :value="reply.description" />
      </div>
      <div
        v-if="reply.messages.length"
        class="divide-y">
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
          <div
            v-else
            class="px-4 py-3 text-sm">
            <a
              v-if="message.id"
              class="text-c-2 hover:text-c-1 underline"
              :href="href(message.id)"
              @click="navigate($event, message.id)"
              >{{ message.title }}</a
            >
            <span v-else>{{ message.title }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
