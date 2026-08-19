<script setup lang="ts">
import { ScalarIconArrowUp, ScalarIconStop } from '@scalar/icons'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { useChatCopy } from '@/copy/copy'

/**
 * The composer's single round action control (rulings A3/A4/A8).
 *
 * One 28px button morphs between Send (up arrow) and Stop (square) with the
 * `streaming` prop. Right after the morph to Stop it ignores clicks for a
 * short window, because a user aiming at Send as the stream starts must not
 * mis-hit Stop. On coarse pointers the effective hit area extends to 44px
 * while the visual stays 28px.
 */
const { streaming, disabled = false } = defineProps<{
  /** True while a response is streaming; the button becomes the Stop control. */
  streaming: boolean
  /** Disables sending only — Stop stays available while streaming. */
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: []
  stop: []
}>()

const copy = useChatCopy()

/** How long clicks are ignored after the Send → Stop morph. */
const STOP_GUARD_MS = 150

/** How long the pulse class stays on — outlives the animation slightly. */
const PULSE_MS = 400

const stopGuarded = ref(false)
const pulsing = ref(false)

let stopGuardTimer: ReturnType<typeof setTimeout> | undefined
let pulseTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => streaming,
  (isStreaming) => {
    clearTimeout(stopGuardTimer)

    if (isStreaming) {
      // The guard starts at the morph, not at mount: only a button that was
      // Send a moment ago can collect a click that was aimed at Send.
      stopGuarded.value = true
      stopGuardTimer = setTimeout(() => {
        stopGuarded.value = false
      }, STOP_GUARD_MS)
    } else {
      stopGuarded.value = false
    }
  },
)

const onClick = (): void => {
  if (streaming) {
    if (stopGuarded.value) {
      // This click was almost certainly aimed at Send — swallow it.
      return
    }

    emit('stop')
    return
  }

  if (disabled) {
    // Defense in depth: the DOM disables the button, but a programmatic
    // click event still reaches this handler.
    return
  }

  emit('send')
}

/**
 * Plays a brief attention animation — the composer calls this when Enter is
 * pressed mid-stream, so the user notices the control is currently Stop.
 * The class is dropped for a tick first so an already-playing pulse restarts.
 */
const pulse = (): void => {
  clearTimeout(pulseTimer)
  pulsing.value = false

  void nextTick().then(() => {
    pulsing.value = true
    pulseTimer = setTimeout(() => {
      pulsing.value = false
    }, PULSE_MS)
  })
}

onBeforeUnmount(() => {
  clearTimeout(stopGuardTimer)
  clearTimeout(pulseTimer)
})

defineExpose({ pulse })
</script>

<template>
  <button
    type="button"
    class="chat-send"
    :class="{ 'chat-send-pulse': pulsing }"
    :disabled="!streaming && disabled"
    :aria-label="streaming ? copy.composer.stop : copy.composer.send"
    @click="onClick">
    <ScalarIconStop
      v-if="streaming"
      weight="bold" />
    <ScalarIconArrowUp
      v-else
      weight="bold" />
  </button>
</template>

<style scoped>
.chat-send {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--scalar-color-accent);
  /*
   * The glyph pairs with the accent fill through --scalar-background-1:
   * in dark mode that token is the contrast-correct choice, never white.
   */
  color: var(--scalar-background-1);
  /* The icons size themselves to 1em — this is the 16px bold icon ruling. */
  font-size: 16px;
  cursor: pointer;
}

.chat-send:disabled {
  cursor: default;
  opacity: 0.4;
}

.chat-send:focus-visible {
  outline: 1px solid var(--scalar-color-accent);
  outline-offset: 2px;
}

/* Coarse pointers get a 44px effective target around the 28px visual. */
@media (pointer: coarse) {
  .chat-send::after {
    content: '';
    position: absolute;
    inset: -8px;
  }
}

.chat-send-pulse {
  animation: chat-send-pulse 300ms ease-out;
}

@keyframes chat-send-pulse {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.18);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-send-pulse {
    animation: none;
  }
}
</style>
