<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import { SchemaGutterToggle, SchemaRailPanel } from '../schema'
import { useLocalization } from '../schema/localization'
import ExtensionValue from './ExtensionValue.vue'

/** Display extension values using the same property rows and controls as schemas. */
const {
  extensions,
  compact = false,
  collapsible = false,
} = defineProps<{
  /** Selected extension keys and their original values, in display order. */
  extensions: Record<string, unknown>
  /** Let the containing panel provide spacing around primitive values. */
  compact?: boolean
  /**
   * Fold the values under an "Extensions (n)" row, closed until opened, with
   * the same disclosure control as nested values. For surfaces where the
   * extensions matter less than the content around them.
   */
  collapsible?: boolean
}>()

const { translate } = useLocalization()

const count = computed<number>(() => Object.keys(extensions).length)
const heading = computed<string>(() =>
  translate('schema.extensionCount', { count: String(count.value) }),
)
const headingId = useId()
const panelId = useId()
const open = ref(false)
</script>

<template>
  <div
    v-if="count && collapsible"
    class="relative min-w-0 py-0.5 ps-8 text-base"
    :class="{ 'my-2': !compact }">
    <div class="relative flex min-h-5 min-w-0 items-baseline">
      <SchemaGutterToggle
        class="absolute start-[calc(0px_-_var(--schema-gutter,16px)_-_var(--schema-toggle-half,12px))] top-[0.5lh] -translate-y-1/2"
        :fallbackLabel="heading"
        :nameId="headingId"
        :open="open"
        :panelId="panelId"
        :panelRendered="open"
        @toggle="open = !open" />
      <span
        :id="headingId"
        class="text-c-2 min-w-0 font-medium break-words"
        >{{ heading }}</span
      >
    </div>
    <SchemaRailPanel
      v-if="open"
      :id="panelId"
      class="mt-0.5"
      :depth="1">
      <dl class="min-w-0">
        <ExtensionValue
          v-for="(value, name) in extensions"
          :key="name"
          :compact="compact"
          :depth="1"
          :name="name"
          topLevel
          :value="value" />
      </dl>
    </SchemaRailPanel>
  </div>
  <dl
    v-else-if="count"
    class="min-w-0 text-base"
    :class="{ 'my-2': !compact }">
    <ExtensionValue
      v-for="(value, name) in extensions"
      :key="name"
      :compact="compact"
      :name="name"
      :value="value" />
  </dl>
</template>
