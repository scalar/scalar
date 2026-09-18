import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, onMounted, ref } from 'vue'

import { getStickyHeaderOffset, scrollToElement } from './lazy-bus'

/**
 * Visual stories for the sticky-header scroll helpers.
 *
 * Each story renders a self-contained scene: a sticky bar pinned to the top of the story
 * wrapper and a content block below it. The computed values are displayed so the snapshot
 * captures both the visual layout and the helper output in one image.
 */

// ---------------------------------------------------------------------------
// Shared wrapper styles
// ---------------------------------------------------------------------------

const WRAPPER =
  'position:relative;width:600px;height:300px;overflow:auto;background:var(--scalar-background-1);font-family:var(--scalar-font)'
const STICKY_BAR =
  'position:sticky;top:0;left:0;right:0;height:60px;background:var(--scalar-color-accent,#6366f1);color:#fff;display:flex;align-items:center;padding:0 16px;font-weight:600;z-index:10'
const CONTENT = 'padding:16px'
const TARGET_BOX =
  'margin-top:260px;padding:12px 16px;background:var(--scalar-background-2);border:2px solid var(--scalar-color-accent,#6366f1);border-radius:6px'
const RESULT_BOX =
  'margin-top:12px;padding:8px 12px;background:var(--scalar-background-3,#f3f4f6);border-radius:4px;font-size:13px;color:var(--scalar-color-1)'

// ---------------------------------------------------------------------------
// StickyHeaderOffset story component
// ---------------------------------------------------------------------------

const StickyHeaderOffsetDemo = defineComponent({
  name: 'StickyHeaderOffsetDemo',
  setup() {
    const offset = ref<number | null>(null)
    onMounted(() => {
      // Read offset after the sticky bar is painted
      requestAnimationFrame(() => {
        offset.value = getStickyHeaderOffset()
      })
    })
    return { offset }
  },
  template: `
    <div style="${WRAPPER}">
      <div style="${STICKY_BAR}">Sticky Header (60 px)</div>
      <div style="${CONTENT}">
        <p style="margin:0 0 8px;font-size:14px;color:var(--scalar-color-1)">
          <code>getStickyHeaderOffset()</code> scans all sticky/fixed elements at the top of the
          viewport and returns the tallest one's height, so scroll targets are never hidden behind it.
        </p>
        <div style="${RESULT_BOX}">
          Computed offset: <strong>{{ offset !== null ? offset + ' px' : 'measuring…' }}</strong>
        </div>
      </div>
    </div>
  `,
})

// ---------------------------------------------------------------------------
// ScrollToElement story component
// ---------------------------------------------------------------------------

const ScrollToElementDemo = defineComponent({
  name: 'ScrollToElementDemo',
  setup() {
    const scrolled = ref(false)
    const targetRef = ref<HTMLElement | null>(null)

    const doScroll = () => {
      if (targetRef.value) {
        scrollToElement(targetRef.value)
        scrolled.value = true
      }
    }

    return { scrolled, targetRef, doScroll }
  },
  template: `
    <div style="${WRAPPER}" id="scroll-demo-root">
      <div style="${STICKY_BAR}">Sticky Header (60 px)</div>
      <div style="${CONTENT}">
        <p style="margin:0 0 8px;font-size:14px;color:var(--scalar-color-1)">
          <code>scrollToElement(el)</code> offsets the scroll position by the sticky header height so
          the target heading is never hidden behind the bar.
        </p>
        <button
          style="padding:6px 14px;border-radius:4px;border:1px solid var(--scalar-color-accent,#6366f1);background:transparent;color:var(--scalar-color-accent,#6366f1);cursor:pointer;font-size:13px"
          @click="doScroll"
        >
          Scroll to target
        </button>
        <div ref="targetRef" style="${TARGET_BOX}" id="lazy-bus-story-target">
          🎯 Scroll target — visible above the sticky bar when offset is applied correctly
        </div>
        <div v-if="scrolled" style="${RESULT_BOX}">
          scrollToElement called ✓
        </div>
      </div>
    </div>
  `,
})

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Schema/LazyBus',
}

export default meta

type Story = StoryObj

export const StickyHeaderOffset: Story = {
  render: () => ({
    components: { StickyHeaderOffsetDemo },
    template: '<StickyHeaderOffsetDemo />',
  }),
}

export const ScrollToElement: Story = {
  render: () => ({
    components: { ScrollToElementDemo },
    template: '<ScrollToElementDemo />',
  }),
}
