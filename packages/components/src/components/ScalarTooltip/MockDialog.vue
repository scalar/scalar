<script lang="ts">
/**
 * Mock dialog for stories
 *
 * A minimal stand-in for a native `<dialog>`, used by the tooltip stories to exercise
 * the browser's top layer. It is deliberately not a real Scalar component: it is not
 * exported from `index.ts` and nothing outside the stories should import it.
 *
 * The modal overhaul on `brynn/doc-3107-modal-component-overhaul` replaces Scalar's
 * modals with native dialogs. When that lands this component is the seam to swap out:
 * point the stories at the real modal component and delete this file.
 *
 * It lives here rather than in `test/` because `noRestrictedImports` blocks `@test/*`
 * from anything under `src/`, and that exemption covers `.test.ts` / `.e2e.ts` but not
 * `.stories.ts`.
 *
 * @example
 * <MockDialog modal>
 *   <ScalarButton>Hover Me</ScalarButton>
 * </MockDialog>
 */
export default {}
</script>
<script setup lang="ts">
import { type Ref, onMounted, ref } from 'vue'

const { modal = false } = defineProps<{
  /**
   * Whether to open the dialog with `showModal()` rather than `show()`
   *
   * Only `showModal()` promotes the dialog to the browser's top layer, which paints
   * above the rest of the document regardless of `z-index`. `show()` leaves the dialog
   * in the normal flow.
   *
   * @default false
   */
  modal?: boolean
}>()

defineSlots<{
  /** The dialog contents */
  default(): unknown
}>()

const dialogRef: Ref<HTMLDialogElement | null> = ref(null)

onMounted(() => {
  // Guard against a re-mount: both open methods throw if the dialog is already open
  if (!dialogRef.value || dialogRef.value.open) {
    return
  }

  if (modal) {
    dialogRef.value.showModal()
  } else {
    dialogRef.value.show()
  }
})
</script>
<template>
  <dialog
    ref="dialogRef"
    class="mock-dialog">
    <div class="mock-dialog-body">
      <slot />
    </div>
  </dialog>
</template>
<style scoped>
/**
 * `transform: scale(1)` mirrors the Scalar dashboard, whose dialogs carry a resting
 * transform from their entry transition. A non-`none` transform creates a containing
 * block for fixed-position descendants, so keeping it here means any story using this
 * dialog exercises the harder of the two real-world layouts.
 */
.mock-dialog {
  width: 320px;
  height: 180px;
  padding: 24px;
  border: 1px solid var(--scalar-border-color);
  border-radius: 12px;
  background: var(--scalar-background-1);
  color: var(--scalar-color-1);
  transform: scale(1);
}

.mock-dialog-body {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}
</style>
