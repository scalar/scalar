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
/**
 * Total height of all lines combined
 *
 * TODO: there is a problem with this calculation which screws up the scrollbar a bit
 */
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

/** Style object for the content container, controls "scrolling" */
const contentStyle = computed(() => ({
  height: `${totalHeight.value}px`,
  transform: `translateY(${Math.max(0, visibleStartIndex.value - 10) * props.lineHeight}px)`,
}))

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

  contentRef.value.style.transform = `translateY(${Math.max(0, visibleStartIndex.value - 10) * props.lineHeight}px)`
})
</script>

<template>
  <div
    ref="containerRef"
    class="scalar-virtual-text overflow-auto"
    :class="containerClass"
    @scroll="handleScroll">
    <code
      ref="contentRef"
      class="scalar-virtual-text-content"
      :class="contentClass"
      :style="contentStyle">
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
