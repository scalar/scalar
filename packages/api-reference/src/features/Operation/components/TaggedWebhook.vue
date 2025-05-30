<script setup lang="ts">
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import type { TransformedOperation } from '@scalar/types/legacy'
import { computed, useId } from 'vue'

import { Anchor } from '@/components/Anchor'
import { Badge } from '@/components/Badge'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import Webhook from '@/features/Operation/components/Webhook.vue'
import type { Schemas } from '@/features/Operation/types/schemas'
import { useConfig } from '@/hooks/useConfig'

const { webhook, id } = defineProps<{
  id?: string
  webhook: TransformedOperation
  schemas?: Schemas
}>()

const labelId = useId()
const config = useConfig()

/** The title of the operation (summary or path) */
const title = computed(() => webhook.path)
</script>

<template>
  <Section
    :id="id"
    :aria-labelledby="labelId"
    :label="title"
    tabindex="-1">
    <SectionContent :loading="config.isLoading">
      <Badge
        class="font-code text-green flex w-fit items-center justify-center gap-1">
        <ScalarIconWebhooksLogo weight="bold" />Webhook
        {{ webhook.httpVerb.toUpperCase() }}
      </Badge>

      <div>
        <SectionHeader>
          <Anchor :id="id ?? ''">
            <SectionHeaderTag
              :id="labelId"
              :level="3">
              {{ title }}
            </SectionHeaderTag>
          </Anchor>
        </SectionHeader>
      </div>
      <SectionColumns>
        <SectionColumn>
          <Webhook :webhook="webhook" />
        </SectionColumn>
      </SectionColumns>
    </SectionContent>
  </Section>
</template>

<style scoped>
.examples {
  position: sticky;
  top: calc(var(--refs-header-height) + 24px);
}
.deprecated * {
  text-decoration: line-through;
}
.example-path {
  color: var(--scalar-color-2);
  font-family: var(--scalar-font-code);
}
.example-path :deep(em) {
  color: var(--scalar-color-1);
  font-style: normal;
}
</style>
