<script setup lang="ts">
import { ScalarIconCaretRight } from '@scalar/icons'
import { computed, useId } from 'vue'

const { id } = defineProps<{
  id?: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

defineSlots<{
  default?: () => unknown
  title?: () => unknown
  /** Keeps interactive header actions outside the disclosure button. */
  actions?: () => unknown
}>()

const instanceId = useId()
const disclosureId = computed(
  () => `~accordion/${encodeURIComponent(id ?? '')}/${instanceId}`,
)
/** Names the toggle after the title, which renders over the button rather than inside it. */
const titleId = computed(() => `${disclosureId.value}/title`)
const panelId = computed(() => `${disclosureId.value}/panel`)
</script>
<template>
  <section
    :id="id"
    class="section-accordion-wrapper">
    <div class="section-accordion">
      <!-- Preserve the original header formatting context when no actions are supplied. -->
      <div
        :class="
          $slots.actions
            ? 'narrow:flex-col narrow:items-stretch flex items-start gap-3'
            : 'contents'
        ">
        <!--
          The title holds controls of its own (the copy link in `Anchor`), and a button cannot hold
          another button: the HTML parser would move it out, and the server markup could not be
          hydrated. So the title lies over the toggle and lets clicks through to it.
          `group/heading` reveals the copy link while the header is hovered.
        -->
        <div
          class="section-accordion-header group/heading"
          :class="{ 'min-w-0 flex-1': $slots.actions }">
          <button
            :aria-controls="modelValue ? panelId : undefined"
            :aria-expanded="modelValue"
            :aria-labelledby="titleId"
            class="section-accordion-button"
            type="button"
            @click="emit('update:modelValue', !modelValue)">
            <ScalarIconCaretRight
              class="section-accordion-chevron size-5 transition-transform"
              :class="{ 'rotate-90': modelValue }" />
          </button>
          <div
            :id="titleId"
            class="section-accordion-title">
            <slot name="title" />
          </div>
        </div>
        <div
          v-if="$slots.actions"
          class="narrow:self-end flex shrink-0 items-center gap-3">
          <slot name="actions" />
        </div>
      </div>
      <div
        v-if="modelValue"
        :id="panelId"
        class="section-accordion-content">
        <slot />
      </div>
    </div>
  </section>
</template>
<style scoped>
.section-accordion-wrapper {
  padding: 0 60px;
}
.section-accordion {
  position: relative;
  width: 100%;
  max-width: var(--refs-content-max-width);
  margin: auto;
}
.section-accordion-content {
  display: flex;
  flex-direction: column;
  gap: 12px;

  padding-top: 12px;
}
/* The toggle and the title share one grid cell, so the button spans the whole header. */
.section-accordion-header {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr);

  cursor: pointer;

  margin: -6px 0 -6px 0;
}
.section-accordion-button,
.section-accordion-title {
  grid-area: 1 / 1;
}
.section-accordion-button {
  width: 100%;
  height: 100%;

  cursor: pointer;

  border-radius: var(--scalar-radius);
}
.section-accordion-chevron {
  position: absolute;
  left: -22px;
  top: 12px;
  color: var(--scalar-color-3);
}

.section-accordion-header:hover .section-accordion-chevron {
  color: var(--scalar-color-1);
}
.section-accordion-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 6px;
  pointer-events: none;
}
/* The controls the title carries, such as the copy link, keep their clicks. */
.section-accordion-title
  :is(a[href], button, input, select, textarea, [role='button'], [tabindex]) {
  pointer-events: auto;
}
.section-accordion-title :deep(.section-header-wrapper) {
  grid-template-columns: 1fr;
}
.section-accordion-title :deep(.section-header) {
  margin-bottom: 0;
}
@container references-container (max-width: 900px) {
  .section-accordion-chevron {
    width: 16px;
    left: -16px;
    top: 14px;
  }
  .section-accordion-wrapper {
    padding: calc(var(--refs-viewport-offset)) 24px 0 24px;
  }
}
</style>
