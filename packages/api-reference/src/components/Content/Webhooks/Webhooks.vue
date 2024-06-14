<script lang="ts" setup>
import { ScalarMarkdown } from '@scalar/components'
import type { Webhooks } from '@scalar/oas-utils'
import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import { computed } from 'vue'

import { useNavState } from '../../../hooks'
import { Anchor } from '../../Anchor'
import {
  Section,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../../Section'
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
    <template
      v-for="name in webhookKeys"
      :key="name">
      <Section
        v-for="httpVerb in Object.keys(
          webhooks?.[name],
        ) as OpenAPIV3_1.HttpMethods[]"
        :id="getWebhookId(name, httpVerb)"
        :key="httpVerb"
        :label="name">
        <template v-if="webhooks?.[name]">
          <SectionContent>
            <!-- Title -->
            <SectionHeader :level="2">
              <Anchor :id="getWebhookId(name, httpVerb)">
                {{ webhooks[name][httpVerb]?.name }}
              </Anchor>
            </SectionHeader>

            <!-- Description -->
            <ScalarMarkdown
              v-if="webhooks[name][httpVerb]?.description"
              :value="webhooks[name][httpVerb]?.description"
              withImages />

            <!-- Details -->
            <Webhook :webhook="webhooks[name][httpVerb]" />
          </SectionContent>
        </template>
      </Section>
    </template>
  </SectionContainer>
</template>
