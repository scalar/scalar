<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

import { SectionHeaderTag } from '@/components/Section'
import type { HeadingLevel } from '@/features/document-outline'
import { useNavigationHref } from '@/hooks/use-navigation-href'

import type { OperationReply } from './helpers/get-operation-reply'

const { reply, eventBus, level } = defineProps<{
  reply: OperationReply
  eventBus: WorkspaceEventBus | null
  level: HeadingLevel
}>()

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
      class="text-c-1 mb-3 block! text-lg leading-[1.45] font-medium"
      :level="level"
      rule>
      Reply
    </SectionHeaderTag>
    <dl class="grid gap-3">
      <div v-if="reply.channel">
        <dt class="text-c-2 text-sm">Channel</dt>
        <dd class="mt-1 break-words">
          <a
            v-if="reply.channel.id"
            class="text-c-accent rounded underline underline-offset-2 focus-visible:outline"
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
      <div v-if="reply.messages.length">
        <dt class="text-c-2 text-sm">Reply messages</dt>
        <dd class="mt-1">
          <ul class="flex list-none flex-col gap-2">
            <li
              v-for="(message, index) in reply.messages"
              :key="index"
              class="break-words">
              <a
                v-if="message.id"
                class="text-c-accent rounded underline underline-offset-2 focus-visible:outline"
                :href="href(message.id)"
                @click="navigate($event, message.id)">
                {{ message.title }}
              </a>
              <span v-else>{{ message.title }}</span>
            </li>
          </ul>
        </dd>
      </div>
    </dl>
  </div>
</template>
