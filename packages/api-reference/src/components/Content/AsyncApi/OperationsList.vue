<script setup lang="ts">
import { ScreenReader } from '@scalar/blocks/shared'
import {
  ScalarCard,
  ScalarCardHeader,
  ScalarCardSection,
} from '@scalar/components/card'
import { isPlainLeftClick } from '@scalar/helpers/dom/is-plain-left-click'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedAsyncApiOperation } from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'
import { useNavigationHref } from '@/hooks/use-navigation-href'

import { pickHeading } from './helpers/pick-heading'
import { resolveAsyncApiOperation } from './helpers/resolve-async-api-nodes'

const { operations, document, eventBus } = defineProps<{
  channelTitle: string
  operations: TraversedAsyncApiOperation[]
  document: AsyncApiDocument
  eventBus: WorkspaceEventBus | null
}>()

const { translate } = useLocalization()

/** Match the title shown in each operation section, including trait titles. */
const entries = computed(() =>
  operations.map((operation) => {
    const resolvedOperation = resolveAsyncApiOperation(
      document,
      operation.operationName,
    )
    return {
      ...operation,
      actionClass: operation.action === 'send' ? 'text-blue' : 'text-green',
      title: pickHeading(
        resolvedOperation?.title,
        resolvedOperation?.summary,
        operation.title,
        operation.operationName,
      ),
    }
  }),
)
const href = useNavigationHref()

const navigate = (event: MouseEvent, id: string): void => {
  if (!eventBus || !isPlainLeftClick(event)) {
    return
  }
  event.preventDefault()
  eventBus.emit('scroll-to:nav-item', { id })
}
</script>

<template>
  <ScalarCard
    v-if="entries.length"
    class="sticky top-[calc(var(--refs-viewport-offset)+24px)] text-base">
    <ScalarCardHeader muted>
      <ScreenReader>{{ channelTitle }}</ScreenReader>
      {{ translate('navigation.operations') }}
    </ScalarCardHeader>
    <ScalarCardSection class="custom-scroll max-h-[60vh]">
      <ul
        :aria-label="`${channelTitle} ${translate('navigation.operations')}`"
        class="bg-b-2 w-full overflow-auto px-3 py-2.5">
        <li
          v-for="operation in entries"
          :key="operation.id">
          <a
            class="text-c-1 font-code group flex cursor-pointer items-baseline gap-3 text-sm leading-[1.55] no-underline"
            :href="href(operation.id)"
            @click="navigate($event, operation.id)">
            <span
              class="w-16 shrink-0 text-right uppercase"
              :class="operation.actionClass">
              {{ operation.action }}
            </span>
            <span class="group-hover:underline group-focus-visible:underline">{{
              operation.title
            }}</span>
          </a>
        </li>
      </ul>
    </ScalarCardSection>
  </ScalarCard>
</template>
