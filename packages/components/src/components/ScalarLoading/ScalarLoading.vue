<script setup lang="ts">
import { reactive } from 'vue'

withDefaults(
  defineProps<{
    loadingState: LoadingState
    size?: string
  }>(),
  {
    size: '24px',
  },
)
</script>

<script lang="ts">
export type LoadingState = ReturnType<typeof useLoadingState>

/**
 * Handles isLoading spinner for the FlowLoader Component
 * - stateIsLoading will trigger the spinner
 * - isValid or isInvalid will show a check or x and then spin out
 */
export function useLoadingState() {
  return reactive({
    valid: false,
    invalid: false,
    isLoading: false,
    startLoading() {
      this.isLoading = true
    },
    stopLoading() {
      this.isLoading = false
    },
    isValid(time = 800) {
      this.valid = true
      const diff = time - 300
      // Allow chaining after animation
      return new Promise((res) =>
        setTimeout(() => this.clear().then(() => res(true)), diff),
      )
    },
    isInvalid(time = 1100) {
      this.invalid = true
      const diff = time - 300
      // Allow chaining after animation
      return new Promise((res) =>
        setTimeout(() => this.clear().then(() => res(true)), diff),
      )
    },
    clear(time = 300) {
      this.valid = false
      this.invalid = false
      this.isLoading = false
      // Allow chaining after animation
      return new Promise((res) => {
        setTimeout(() => {
          res(true)
        }, time)
      })
    },
  })
}
</script>

<template>
  <div
    v-if="loadingState"
    class="loader-wrapper">
    <svg
      class="svg-loader"
      :class="{
        'icon-is-valid': loadingState.valid,
        'icon-is-invalid': loadingState.invalid,
      }"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink">
      <path
        class="svg-path svg-check-mark"
        d="m 0 60 l 30 30 l 70 -80" />
      <path
        class="svg-path svg-x-mark"
        d="m 50 50 l 40 -40" />
      <path
        class="svg-path svg-x-mark"
        d="m 50 50 l 40 40" />
      <path
        class="svg-path svg-x-mark"
        d="m 50 50 l -40 -40" />
      <path
        class="svg-path svg-x-mark"
        d="m 50 50 l -40 40" />
      <g
        v-if="loadingState.isLoading"
        class="circular-loader">
        <circle
          class="loader-path"
          :class="{
            'loader-path-off': loadingState.valid || loadingState.invalid,
          }"
          cx="50"
          cy="50"
          fill="none"
          r="20"
          stroke-width="2" />
      </g>
    </svg>
  </div>
</template>
<style scoped>
.loader-wrapper {
  position: relative;
  height: v-bind(size);
  width: v-bind(size);

  display: flex;
  align-items: center;
  justify-content: center;

  --default-loader-size: 50%;
}

/*SVG Positioning for Loader Objects*/
.svg-loader {
  width: var(--loader-size, var(--default-loader-size));
  height: var(--loader-size, var(--default-loader-size));
  top: 1rem;
  right: 0.9rem;
  overflow: visible;

  fill: none;
  background-color: transparent;
  stroke: currentColor;
}

.svg-path {
  stroke-width: 14;
  fill: none;
  transition: 0.3s;
}

.svg-x-mark {
  stroke-dasharray: 57;
  stroke-dashoffset: 57;
  transition-delay: 0s;
}

.svg-check-mark {
  stroke-dasharray: 149;
  stroke-dashoffset: 149;
  transition-delay: 0s;
}

.icon-is-invalid .svg-x-mark {
  stroke-dashoffset: 0;
  transition-delay: 0.3s;
}

.icon-is-valid .svg-check-mark {
  stroke-dashoffset: 0;
  transition-delay: 0.3s;
}

.circular-loader {
  animation:
    rotate 0.7s linear infinite,
    fade-in 0.4s;

  transform-origin: center center;
  transform: scale(5);

  background: transparent;
}

.loader-path {
  stroke-dasharray: 50, 200;
  stroke-dashoffset: -100;
  stroke-linecap: round;
}

.loader-path-off {
  stroke-dasharray: 50, 200;
  stroke-dashoffset: -100;
  transition: opacity 0.3s;
  opacity: 0;
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }
  70% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes rotate {
  from {
    transform: scale(5) rotate(0deg);
  }
  to {
    transform: scale(5) rotate(360deg);
  }
}
</style>
