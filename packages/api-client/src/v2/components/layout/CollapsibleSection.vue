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
import { ScalarIcon } from '@scalar/components'
import { useId } from 'vue'

import ValueEmitter from './ValueEmitter.vue'

const {
  defaultOpen = true,
  itemCount = 0,
  isStatic,
} = defineProps<{
  /** Whether the disclosure is open by default. */
  defaultOpen?: boolean
  /** Number of items to show in badge when collapsed. */
  itemCount?: number
  /** Whether the disclosure is static and cannot be toggled. */
  isStatic?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const headingId = useId()
</script>

<template>
  <Disclosure
    v-slot="{ open }"
    as="div"
    class="group/collapse text-c-2 focus-within:text-c-1 last:ui-open:border-b-0 border-b"
    :class="isStatic && 'last-of-type:first-of-type:border-b-0'"
    :defaultOpen="defaultOpen"
    :static="isStatic">
    <!-- We use this hack to emit the slot value back to the parent -->
    <ValueEmitter
      :value="open as boolean"
      @change="(value) => emit('update:modelValue', value)" />

    <section
      :aria-labelledby="headingId"
      class="contents">
      <div
        class="bg-b-2 flex items-center"
        :class="isStatic && 'rounded-t-lg border border-b-0'">
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
          <h2
            class="text-c-1 m-0 flex flex-1 items-center gap-1.5 leading-[20px]">
            <span
              :id="headingId"
              class="contents">
              <slot
                name="title"
                :open="open" />
              <span
                v-if="!open"
                class="sr-only">
                (Collapsed)
              </span>
            </span>

            <!-- Badge showing item count when collapsed. -->
            <span
              v-if="!open && itemCount"
              class="bg-b-2 text-c-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs font-semibold">
              {{ itemCount }}
              <span class="sr-only">Item{{ itemCount === 1 ? '' : 's' }}</span>
            </span>
          </h2>
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
