<script lang="ts" setup>
import { ScalarMarkdown } from '@scalar/components'
import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import type { Webhooks } from '@scalar/types/legacy'
import { computed } from 'vue'

import { useNavState } from '../../../hooks'
import {
  CompactSection,
  Section,
  SectionContainer,
  SectionHeader,
} from '../../Section'
import { Lazy } from '../Lazy'
import Webhook from './Webhook.vue'

const props = defineProps<{
  webhooks: Webhooks
}>()

const webhookKeys = computed(() => {
  return Object.keys(props.webhooks ?? {})
})

const { getWebhookId } = useNavState()
</script>
<template>
  <SectionContainer v-if="webhookKeys.length">
    <Section>
      <SectionHeader :level="2">Webhooks</SectionHeader>
      <Lazy
        id="webhooks"
        :isLazy="false">
        <div id="webhooks" />
      </Lazy>
      <template
        v-for="name in webhookKeys"
        :key="name">
        <Lazy
          v-for="httpVerb in Object.keys(
            webhooks?.[name],
          ) as OpenAPIV3_1.HttpMethods[]"
          :id="getWebhookId(name, httpVerb)"
          :key="httpVerb"
          isLazy>
          <CompactSection
            v-if="webhooks?.[name]"
            :id="getWebhookId(name, httpVerb)"
            :label="name">
            <template #heading>
              <!-- Title -->
              {{ webhooks[name][httpVerb]?.name }}
            </template>
            <!-- Description -->
            <ScalarMarkdown
              v-if="webhooks[name][httpVerb]?.description"
              class="webhook-section-description"
              :value="webhooks[name][httpVerb]?.description"
              withImages />

            <!-- Details -->
            <Webhook :webhook="webhooks[name][httpVerb]" />
          </CompactSection>
        </Lazy>
      </template>
    </Section>
  </SectionContainer>
</template>
