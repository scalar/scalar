<script lang="ts">
/**
 * Simple collapsible section component that can be used to wrap content that should be collapsed and expanded
 *
 * Would like to replace with details/summary elements, but they are not supported in all browsers yet?
 */
export default {
  name: 'CollapsibleSection',
}
</script>

<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components/icon'
import { computed, inject, toValue, useId } from 'vue'

import { useLocalization } from '@/v2/features/localization'

import { COLLAPSIBLE_SECTION_HEADING_LEVEL } from './collapsible-section-heading-level'
import ValueEmitter from './ValueEmitter.vue'

const {
  defaultOpen = true,
  heading = true,
  itemCount = 0,
  isStatic,
} = defineProps<{
  /** Whether the disclosure is open by default. */
  defaultOpen?: boolean
  /**
   * Whether the title belongs in the document outline.
   *
   * A section of a request or response is a passage of the page, so its title
   * is a heading by default. A caller whose title only names a cluster of
   * controls opts out: the title renders as plain text and the section becomes
   * a `group` named by it, which keeps the card findable without adding an
   * entry to the heading outline that has no passage behind it.
   */
  heading?: boolean
  /** Number of items to show in badge when collapsed. */
  itemCount?: number
  /** Whether the disclosure is static and cannot be toggled. */
  isStatic?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { translate } = useLocalization()

/**
 * Defaults to `h2`, for a section that sits directly below the page title. A
 * parent that renders a title above its sections provides a deeper level.
 */
const headingLevel = inject(COLLAPSIBLE_SECTION_HEADING_LEVEL, 2)

/**
 * The element that holds the title. A caller that opted out of the heading gets
 * a `span`, which reads as plain text and is also the only valid choice inside
 * the disclosure button, since a heading is not phrasing content.
 */
const titleTag = computed((): string =>
  heading ? `h${toValue(headingLevel)}` : 'span',
)

/** Names the `group` a section without a heading becomes. */
const titleId = useId()
</script>

<template>
  <Disclosure
    v-slot="{ open }"
    as="div"
    class="group/collapse text-c-2 focus-within:text-c-1 last:ui-open:border-b-0"
    :class="{
      'last-of-type:first-of-type:border-b-0': isStatic,
      'border-b': !isStatic,
    }"
    :defaultOpen="defaultOpen"
    :static="isStatic">
    <!-- We use this hack to emit the slot value back to the parent -->
    <ValueEmitter
      :value="open"
      @change="(value) => emit('update:modelValue', value)" />

    <!-- A section that carries a heading stays deliberately unnamed: naming it
         would turn it into a region landmark wrapping its own heading, so
         screen readers announce the title twice before reading the contents.
         Without a heading there is nothing to duplicate, and `group` is not a
         landmark, so the name bounds the card without joining the landmark
         list. -->
    <section
      :aria-labelledby="heading ? undefined : titleId"
      class="contents"
      :role="heading ? undefined : 'group'">
      <div
        class="bg-b-2 flex items-center"
        :class="isStatic && 'rounded-t-xl border-x border-t'">
        <!-- Main disclosure button that toggles the panel -->
        <DisclosureButton
          class="hover:text-c-1 group box-content flex max-h-8 flex-1 items-center gap-2.5 overflow-hidden px-1 py-1.5 text-base font-medium outline-none md:px-1.5 xl:pr-0.5 xl:pl-2"
          :class="isStatic && '!pl-3'"
          :disabled="isStatic">
          <ScalarIcon
            v-if="!isStatic"
            class="text-c-3 group-hover:text-c-1 rounded-px ui-open:rotate-90 ui-not-open:rotate-0 outline-offset-2 group-focus-visible:outline"
            icon="ChevronRight"
            size="md" />

          <!-- Heading with title -->
          <component
            :is="titleTag"
            :id="heading ? undefined : titleId"
            class="text-c-1 m-0 flex flex-1 items-center gap-1.5 leading-[20px]">
            <span class="contents">
              <slot
                name="title"
                :open="open" />
              <span
                v-if="!open"
                class="sr-only"
                >{{ translate('apiClient.collapsibleSection.collapsed') }}</span
              >
            </span>

            <!-- Badge showing item count when collapsed. -->
            <span
              v-if="!open && itemCount"
              class="bg-b-2 text-c-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs font-semibold">
              {{ itemCount }}
              <span class="sr-only">{{
                itemCount === 1
                  ? translate('apiClient.collapsibleSection.item')
                  : translate('apiClient.collapsibleSection.items')
              }}</span>
            </span>
          </component>
        </DisclosureButton>

        <!-- Optional actions slot that hides when the panel is closed. -->
        <div
          v-if="$slots.actions"
          class="ui-not-open:hidden flex items-center gap-2 pr-0.75">
          <slot
            name="actions"
            :open="open" />
        </div>
      </div>

      <!-- The collapsible content panel. -->
      <DisclosurePanel
        v-bind="$attrs"
        class="diclosure-panel h-full max-h-fit rounded-b">
        <slot :open="open" />
      </DisclosurePanel>
    </section>
  </Disclosure>
</template>
