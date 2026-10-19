<script setup lang="ts">
import type { SchemaRenderingProps } from '@scalar/blocks/schema'
import { ScalarMarkdown } from '@scalar/components/markdown'
import { isPlainLeftClick } from '@scalar/helpers/dom/is-plain-left-click'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

import OperationPath from '@/components/OperationPath.vue'
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
  if (!eventBus || !isPlainLeftClick(event)) {
    return
  }
  event.preventDefault()
  eventBus.emit('scroll-to:nav-item', { id })
}
</script>

<template>
  <div class="min-w-0">
    <SectionHeaderTag
      class="text-c-1 mb-3 block! border-b pb-2 text-base leading-[1.45] font-medium"
      :level="level">
      Replies
    </SectionHeaderTag>
    <div class="min-w-0">
      <div
        v-if="reply.channel || reply.address !== undefined || reply.description"
        class="mb-4 min-w-0">
        <dl class="space-y-4 text-sm">
          <div
            v-if="reply.channel"
            class="min-w-0">
            <dt class="text-c-1 mb-2 border-b pb-2 text-base font-medium">
              Channel
            </dt>
            <dd class="text-c-2 min-w-0 break-words">
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
            class="min-w-0">
            <dt class="text-c-1 mb-2 border-b pb-2 text-base font-medium">
              {{ reply.dynamicAddress ? 'Dynamic address' : 'Address' }}
            </dt>
            <dd class="text-c-2 min-w-0">
              <code
                class="font-code min-w-0 text-sm [overflow-wrap:anywhere] whitespace-pre-wrap">
                <OperationPath
                  class="text-c-1 [&_em]:text-c-2 font-normal! [&_em]:font-medium [&_em]:not-italic"
                  :path="reply.address" />
              </code>
            </dd>
          </div>
        </dl>
        <ScalarMarkdown
          v-if="reply.description"
          class="text-c-2 mt-1 text-sm"
          :value="reply.description" />
      </div>
      <div v-if="reply.messages.length">
        <template
          v-for="(message, index) in reply.messages"
          :key="index">
          <Message
            v-if="message.entry"
            :class="{ '[&>.collapsible-section]:border-t-0!': index === 0 }"
            :document="document"
            :eventBus="eventBus"
            :expansion="expansion"
            inline
            :message="message.entry"
            :options="options"
            :specificationExtension="specificationExtension" />
          <div
            v-else
            class="py-3 text-sm"
            :class="{ 'border-t': index > 0 }">
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
