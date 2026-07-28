<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { computed, useId } from 'vue'

import { SectionContainer } from '@/components/Section'
import ShowMoreButton from '@/components/ShowMoreButton.vue'
import { useLocalization } from '@/features/localization'

import TagSection from './TagSection.vue'

const { tag, moreThanOneTag } = defineProps<{
  tag: TraversedTag
  moreThanOneTag: boolean
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
  /** Whether this tag sits inside a parent tag's container (drops its own padding). */
  nested?: boolean
}>()
const { translate } = useLocalization()

const headerId = useId()

const moreThanOneDefaultTag = computed(
  () => moreThanOneTag || tag?.title !== 'default' || tag?.description !== '',
)

const hasChildren = computed(() => (tag?.children?.length ?? 0) > 0)
</script>

<template>
  <SectionContainer
    :aria-labelledby="headerId"
    class="tag-section-container"
    :class="{ 'tag-section-nested': nested }"
    role="region">
    <TagSection
      v-if="moreThanOneDefaultTag"
      :eventBus="eventBus"
      :headerId="headerId"
      :isCollapsed="isCollapsed"
      :tag="tag" />
    <ShowMoreButton
      v-if="isCollapsed && moreThanOneTag && hasChildren"
      :id="tag.id"
      :aria-label="
        translate('navigation.showAllEndpoints', { name: tag.title })
      "
      @click="
        () => eventBus?.emit('toggle:nav-item', { id: tag.id, open: true })
      " />

    <!-- Show slot when section is expanded or single-tag (inverse of ShowMoreButton visibility). -->
    <div
      v-if="!(isCollapsed && moreThanOneTag)"
      class="contents divide-y">
      <slot />
    </div>
  </SectionContainer>
</template>

<style scoped>
.section-container {
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}
/*
 * A tag nested inside another tag's container would otherwise inherit a second
 * layer of horizontal padding. Dropping it keeps every section flush left
 * regardless of how deep the tag hierarchy goes.
 */
.tag-section-container.tag-section-nested {
  padding-inline: 0;
}
.section-container:has(.show-more) {
  background-color: color-mix(in srgb, var(--scalar-background-2), transparent);
}
</style>
