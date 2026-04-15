<script lang="ts">
/**
 * Scalar Virtual Text component
 *
 * Renders large blocks of text efficiently using virtualized scrolling.
 * Only the visible lines are rendered to the DOM.
 *
 * @example
 * <ScalarVirtualText text="line1\nline2\nline3" :lineHeight="20" />
 */
export default {}
</script>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Text to display */
    text: string
    /**
     * Height of each line
     * @default 20
     */
    lineHeight?: number
    containerClass?: string
    contentClass?: string
    lineClass?: string
  }>(),
  {
    lineHeight: 20,
    containerClass: '',
    contentClass: '',
    lineClass: '',
  },
)

const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const scrollPosition = ref(0)
const containerHeight = ref(0)

/** Array of text broken into lines */
const lines = computed(() => props.text.split('\n'))
/** Total height of all lines combined */
const totalHeight = computed(() => lines.value.length * props.lineHeight)

/** Index of the first visible line */
const visibleStartIndex = computed(() =>
  Math.floor(scrollPosition.value / props.lineHeight),
)

/** Index of the last visible line */
const visibleEndIndex = computed(() =>
  Math.min(
    Math.ceil(
      (scrollPosition.value + containerHeight.value) / props.lineHeight,
    ),
    lines.value.length,
  ),
)

/** Array of visible lines, including buffer for smooth scrolling */
const visibleLines = computed(() => {
  const buffer = 10
  const start = Math.max(0, visibleStartIndex.value - buffer)
  const end = Math.min(lines.value.length, visibleEndIndex.value + buffer)

  return lines.value.slice(start, end)
})

/** Pixel offset for the visible content slice */
const contentOffset = computed(
  () => Math.max(0, visibleStartIndex.value - 10) * props.lineHeight,
)

/** Updates the scroll position when the container is scrolled */
const handleScroll = () =>
  containerRef.value && (scrollPosition.value = containerRef.value.scrollTop)

/** Updates the container height when the window is resized */
const updateContainerHeight = () =>
  containerRef.value &&
  (containerHeight.value = containerRef.value.clientHeight)

onMounted(() => {
  updateContainerHeight()
  window.addEventListener('resize', updateContainerHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateContainerHeight)
})

watchEffect(() => {
  if (!contentRef.value) {
    return
  }

  contentRef.value.style.transform = `translateY(${contentOffset.value}px)`
})
</script>

<template>
  <div
    ref="containerRef"
    class="scalar-virtual-text relative overflow-auto"
    :class="containerClass"
    @scroll="handleScroll">
    <!-- Invisible spacer that defines the full scrollable height -->
    <div :style="{ height: `${totalHeight}px` }" />
    <code
      ref="contentRef"
      class="scalar-virtual-text-content absolute left-0 right-0 top-0"
      :class="contentClass"
      :style="{ transform: `translateY(${contentOffset}px)` }">
      <div
        v-for="(line, index) in visibleLines"
        :key="visibleStartIndex + index"
        class="scalar-virtual-text-line"
        :class="lineClass"
        :style="{
          height: `${props.lineHeight}px`,
          lineHeight: `${props.lineHeight}px`,
        }">
        {{ line }}
      </div>
    </code>
  </div>
</template>
