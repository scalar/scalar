<script setup lang="ts">
import { ScreenReader } from '@scalar/blocks/shared'
import {
  ScalarCard,
  ScalarCardHeader,
  ScalarCardSection,
} from '@scalar/components/card'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedAsyncApiOperation } from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

import { pickHeading } from './helpers/pick-heading'
import { resolveAsyncApiOperation } from './helpers/resolve-async-api-nodes'

const { operations, document } = defineProps<{
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
      title: pickHeading(
        resolvedOperation?.title,
        resolvedOperation?.summary,
        operation.title,
        operation.operationName,
      ),
    }
  }),
)
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
            class="text-c-1 font-code flex cursor-pointer items-baseline gap-3 text-sm leading-[1.55] no-underline"
            :href="`#${operation.id}`"
            @click.prevent="
              eventBus?.emit('scroll-to:nav-item', { id: operation.id })
            ">
            <span
              class="w-16 shrink-0 text-right uppercase"
              :class="operation.action === 'send' ? 'text-blue' : 'text-green'">
              {{ operation.action }}
            </span>
            <span class="operation-title">{{ operation.title }}</span>
          </a>
        </li>
      </ul>
    </ScalarCardSection>
  </ScalarCard>
</template>

<style scoped>
a:hover .operation-title,
a:focus-visible .operation-title {
  text-decoration: underline;
}
</style>
