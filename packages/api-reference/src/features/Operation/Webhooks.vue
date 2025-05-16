<script lang="ts" setup>
import { ScalarCodeBlock, ScalarMarkdown } from '@scalar/components'
import { getExampleFromSchema } from '@scalar/oas-utils/spec-getters'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Webhooks } from '@scalar/types/legacy'
import { computed, useId } from 'vue'

import { Lazy } from '@/components/Content/Lazy'
import {
  CompactSection,
  Section,
  SectionColumn,
  SectionColumns,
  SectionContainer,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import ShowMoreButton from '@/components/ShowMoreButton.vue'
import { useNavState } from '@/hooks/useNavState'
import { useSidebar } from '@/hooks/useSidebar'

import Webhook from './components/Webhook.vue'

const props = defineProps<{
  webhooks: Webhooks
}>()

const webhookKeys = computed(() => {
  return Object.keys(props.webhooks ?? {})
})

const headerId = useId()

const { getWebhookId } = useNavState()

const MAX_WEBHOOKS_INITIALLY_SHOWN = 10

const { collapsedSidebarItems } = useSidebar()

const showAllWebhooks = computed(
  () =>
    webhookKeys.value.length <= MAX_WEBHOOKS_INITIALLY_SHOWN ||
    collapsedSidebarItems[getWebhookId()],
)

const webhooksFiltered = computed(() => {
  const webhooks = webhookKeys.value
  if (showAllWebhooks.value) {
    return webhooks
  }
  // return only first MAX_WEBHOOKS_INITIALLY_SHOWN webhooks
  return webhooks.slice(0, MAX_WEBHOOKS_INITIALLY_SHOWN)
})
</script>
<template>
  <SectionContainer
    v-if="webhookKeys.length"
    id="webhooks">
    <Section :aria-labelledby="headerId">
      <SectionHeader>
        <SectionHeaderTag
          :id="headerId"
          :level="2">
          Webhooks
        </SectionHeaderTag>
      </SectionHeader>
      <Lazy
        id="webhooks"
        :isLazy="false" />
      <div
        class="webhooks-list"
        :class="{ 'webhooks-list-truncated': !showAllWebhooks }">
        <template
          v-for="name in webhooksFiltered"
          :key="name">
          <Lazy
            v-for="httpVerb in Object.keys(
              webhooks?.[name],
            ) as OpenAPIV3_1.HttpMethods[]"
            :id="getWebhookId({ name, method: httpVerb })"
            :key="httpVerb"
            isLazy>
            <CompactSection
              v-if="webhooks?.[name]"
              :id="getWebhookId({ name, method: httpVerb })"
              class="webhooks-list-item"
              :label="name">
              <template #heading>
                <!-- Title -->
                <SectionHeaderTag :level="3">
                  {{ webhooks[name][httpVerb]?.name }}
                </SectionHeaderTag>
              </template>
              <!-- Description -->
              <ScalarMarkdown
                v-if="webhooks[name][httpVerb]?.description"
                class="webhook-section-description"
                :value="webhooks[name][httpVerb]?.description"
                withImages />

              <SectionColumns>
                <SectionColumn>
                  <!-- Details -->
                  <Webhook :webhook="webhooks[name][httpVerb]" />
                </SectionColumn>
                <SectionColumn>
                  <div
                    class="dark-mode bg-b-2 overflow-hidden rounded-lg text-sm">
                    <ScalarCodeBlock
                      :content="
                        getExampleFromSchema(
                          webhooks[name][httpVerb]?.information?.requestBody
                            ?.content?.['application/json']?.schema,
                        )
                      "
                      lang="json" />
                  </div>
                </SectionColumn>
              </SectionColumns>
            </CompactSection>
          </Lazy>
        </template>
      </div>
      <ShowMoreButton
        v-if="!showAllWebhooks"
        id="webhooks"
        class="show-more-webhooks" />
    </Section>
  </SectionContainer>
</template>

<style scoped>
.example-payload {
  border-radius: var(--scalar-radius);
}

.webhooks-list {
  display: contents;
}
.webhooks-list-truncated .webhooks-list-item:last-child {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.webhooks-list-item[aria-expanded='true'] {
  padding-bottom: 48px;
}
.webhook-section-description.webhook-section-description {
  color: var(--scalar-color-2);
  font-size: var(--scalar-font-size-3);
  padding-bottom: 12px;
}
.show-more-webhooks {
  margin-top: 32px;
  top: 0px;
}
</style>
