<script setup lang="ts">
import {
  addScalarClassesToHeadless,
  ScalarTeleportRoot,
  type ModalState,
} from '@scalar/components'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import {
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  ref,
  useId,
  watch,
} from 'vue'

const props = defineProps<{ modalState: ModalState }>()
const emit = defineEmits<{
  (e: 'open'): void
  (e: 'close'): void
}>()

const client = ref<HTMLElement | null>(null)
const id = useId()

const { activate: activateFocusTrap, deactivate: deactivateFocusTrap } =
  useFocusTrap(client, {
    allowOutsideClick: true,
    fallbackFocus: `#${id}`,
  })

// ensure scalar classes exist on headless-ui root
onBeforeMount(() => addScalarClassesToHeadless())

// manage the focus trap and emit lifecycle events
watch(
  () => props.modalState.open,
  (open) => {
    if (open) {
      // trap focus after DOM settle
      activateFocusTrap({ checkCanFocusTrap: () => nextTick() })
      emit('open')
    } else {
      deactivateFocusTrap()
      emit('close')
    }
  },
  { immediate: false },
)

// best-effort cleanup on unmount
onBeforeUnmount(() => {
  deactivateFocusTrap()
})
</script>

<template>
  <div
    v-show="modalState.open"
    class="scalar scalar-app">
    <div class="scalar-container">
      <!-- 
      adding v-show also here to ensure proper rendering in Safari.
      @see https://github.com/scalar/scalar/issues/7983
      -->
      <div
        v-show="modalState.open"
        :id="id"
        ref="client"
        aria-label="API Client"
        aria-modal="true"
        v-bind="$attrs"
        class="scalar-app-layout scalar-client"
        role="dialog"
        tabindex="-1">
        <ScalarTeleportRoot>
          <slot />
        </ScalarTeleportRoot>
      </div>

      <!-- overlay / exit area -->
      <div
        class="scalar-app-exit"
        @click="modalState.hide()" />
    </div>
  </div>
</template>

<style scoped>
@reference "@/style.css";

.scalar .scalar-app-layout {
  background: var(--scalar-background-1);
  height: calc(100% - 120px);
  max-width: 1390px;
  width: 100%;
  margin: auto;
  opacity: 0;
  animation: scalarapiclientfadein 0.35s forwards;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}
/**
 * Allow the modal to fill more space on
 * very short (or very zoomed in) screens
 */
@variant zoomed {
  .scalar .scalar-app-layout {
    height: 100%;
    max-height: 90svh;
  }
}
@keyframes scalarapiclientfadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.scalar .scalar-app-exit {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #00000038;
  transition: all 0.3s ease-in-out;
  cursor: pointer;
  animation: scalardrawerexitfadein 0.35s forwards;
  z-index: -1;
}
.dark-mode .scalar .scalar-app-exit {
  background: rgba(0, 0, 0, 0.45);
}
@keyframes scalardrawerexitfadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.scalar .scalar-app-exit:before {
  font-family: sans-serif;
  position: absolute;
  top: 0;
  right: 12px;
  font-size: 30px;
  font-weight: 100;
  line-height: 50px;
  text-align: center;
  color: white;
  opacity: 0.6;
}
.scalar .scalar-app-exit:hover:before {
  opacity: 1;
}

/* container */
.scalar-container {
  overflow: hidden;
  visibility: visible;
  position: fixed;
  bottom: 0;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  @apply z-overlay;
}

.scalar .url-form-input {
  min-height: auto !important;
}

.scalar .scalar-container {
  line-height: normal;
}
</style>
