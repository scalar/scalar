<script setup lang="ts">
import { MAX_PROMPT_SIZE } from '@scalar/chat-protocol/limits'
import { computed, nextTick, useTemplateRef, watch } from 'vue'

import ChatSend from '@/components/ChatSend.vue'
import { useChatCopy } from '@/copy/copy'

/**
 * The chat input block (rulings A5/A2/A8/A12).
 *
 * Owns the draft textarea, the Send/Stop control and the docks around them.
 * It deliberately does not own the draft's lifecycle: `submit` emits the
 * trimmed text and clearing the model afterwards is the shell's call, so a
 * failed send never loses what the user typed.
 */
const {
  modelValue,
  streaming,
  sendDisabled = false,
  allowEmptySubmit = false,
  maxlength,
  layout = 'stacked',
} = defineProps<{
  /** The draft text; the shell owns it and clears it after a successful send. */
  modelValue: string
  /** True while a response is streaming; Enter becomes a no-op nudge. */
  streaming: boolean
  /** Extra send gate from the shell (pending approvals, missing session, …). */
  sendDisabled?: boolean
  /**
   * Let an empty draft submit — for shells whose message can be something
   * other than text (the editor sends attachment-only messages). The shell
   * still gates via `sendDisabled` when nothing at all is ready to send.
   */
  allowEmptySubmit?: boolean
  /**
   * A hard draft length cap, enforced by the browser's native `maxlength`.
   * Shells must never clamp the model programmatically instead — rewriting
   * the value mid-IME-composition garbles the composition; the native
   * attribute is composition-safe.
   */
  maxlength?: number
  /** `stacked` is the full block layout, `inline` the single-row variant. */
  layout?: 'stacked' | 'inline'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** Carries the trimmed draft. Clearing the model is the shell's call. */
  'submit': [text: string]
  'stop': []
}>()

const copy = useChatCopy()

const rootRef = useTemplateRef<HTMLDivElement>('root')
const fieldRef = useTemplateRef<HTMLTextAreaElement>('field')
const sendRef = useTemplateRef<InstanceType<typeof ChatSend>>('send')

/**
 * Drafts over the protocol limit are held back client-side instead of
 * failing server-side after the round trip. The state is exposed and
 * mirrored as a data attribute so shells can style the block.
 */
const overLimit = computed<boolean>(() => modelValue.length > MAX_PROMPT_SIZE)

const onInput = (event: Event): void => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

const submit = (): void => {
  if (streaming || sendDisabled || overLimit.value) {
    return
  }

  const text = modelValue.trim()

  if (!text && !allowEmptySubmit) {
    return
  }

  emit('submit', text)
}

const onKeydown = (event: KeyboardEvent): void => {
  if (event.key !== 'Enter' || event.shiftKey) {
    return
  }

  if (event.isComposing || event.keyCode === 229) {
    // An Enter that only commits an IME composition must not send. WebKit
    // fires compositionend before the confirming keydown, so that Enter
    // arrives with isComposing already false — keyCode 229 is the standard
    // secondary signal for it.
    return
  }

  event.preventDefault()

  if (streaming) {
    // No queuing, no interrupt: nudge attention to the Stop control and
    // keep the typed text where it is.
    sendRef.value?.pulse()
    return
  }

  submit()
}

/**
 * Whether handing focus back to the field would steal it from somewhere
 * else. Focus is only reclaimed when it already sits inside this composer
 * (the user pressed Send or Stop) or nowhere at all (body/null). A rail
 * chat renders next to unrelated inputs, and a stream completing must not
 * interrupt the user typing in one of them.
 */
const canReclaimFocus = (): boolean => {
  const active = document.activeElement

  return (
    !active ||
    active === document.body ||
    (rootRef.value?.contains(active) ?? false)
  )
}

watch(
  () => streaming,
  (isStreaming, wasStreaming) => {
    if (wasStreaming && !isStreaming) {
      // Hand focus back once the reply finishes so the user can keep typing.
      void nextTick().then(() => {
        if (canReclaimFocus()) {
          fieldRef.value?.focus()
        }
      })
    }
  },
)

defineExpose({
  overLimit,
  focus: (): void => fieldRef.value?.focus(),
})
</script>

<template>
  <div
    ref="root"
    class="chat-composer"
    :class="
      layout === 'inline' ? 'chat-composer-inline' : 'chat-composer-stacked'
    "
    :data-over-limit="overLimit ? 'true' : undefined">
    <div class="chat-composer-input">
      <!-- Content docked inside the input box above the field, like the
           editor's attachment preview strip. The wrapper forces its own
           row, so the dock sits above the field in both layouts. -->
      <div
        v-if="$slots.inputStart"
        class="chat-composer-input-start">
        <slot name="inputStart" />
      </div>
      <textarea
        ref="field"
        class="chat-composer-field"
        rows="1"
        :value="modelValue"
        :maxlength="maxlength"
        :placeholder="copy.composer.placeholder"
        @input="onInput"
        @keydown="onKeydown" />
      <div class="chat-composer-actions">
        <slot name="actionsStart" />
        <ChatSend
          ref="send"
          class="chat-composer-send"
          :streaming="streaming"
          :disabled="sendDisabled || overLimit"
          @send="submit"
          @stop="emit('stop')" />
      </div>
    </div>
    <!--
      The banner dock sits after the input in the DOM so Tab flows from the
      textarea through the actions into Reject → Approve; the CSS order
      lifts it visually above the input.
    -->
    <div
      v-if="$slots.banners"
      class="chat-composer-banners">
      <slot name="banners" />
    </div>
    <div
      v-if="$slots.footnote || copy.disclaimer.short"
      class="chat-composer-footnote">
      <slot name="footnote">{{ copy.disclaimer.short }}</slot>
    </div>
  </div>
</template>

<style scoped>
.chat-composer {
  display: flex;
  flex-direction: column;
  font-size: var(--chat-font-prose);
}

/* Visually above the input while DOM-after it — see the template note.
   The dock sits flush on the input box (no gap, per the design review). */
.chat-composer-banners {
  order: -1;
}

/* A docked approval bar rides a connected backdrop plate: the plate is
   rounded on top and tucks under the composer box, so the two read as
   connected while the input NEVER loses its full radius (design ruling
   on the editor adoption). `--chat-approval-dock-bg` is the public hook
   for the plate color — background-2 by default, and dark shells set
   their own mix. */
.chat-composer-banners:has(.chat-approval-bar) {
  background: var(--chat-approval-dock-bg, var(--scalar-background-2));
  border-radius: var(--scalar-radius-3xl) var(--scalar-radius-3xl) 0 0;
  padding-bottom: var(--scalar-radius-3xl);
  margin-bottom: calc(-1 * var(--scalar-radius-3xl));
}

/* Inside the plate the bar is just the row — the plate owns the chrome. */
.chat-composer-banners :deep(.chat-approval-bar) {
  background: transparent;
  border: none;
  border-radius: 0;
}

/* Paints above the plate's tucked-under lip. */
.chat-composer-input {
  position: relative;
}

/* `--chat-composer-input-bg` is the public hook for the input surface —
   shells (dark-mode overrides included) set the variable on an ancestor
   instead of reaching into this component's internal classes. */
.chat-composer-input {
  display: flex;
  background: var(--chat-composer-input-bg, var(--scalar-background-1));
  border: 1px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-3xl);
}

/* The dock always takes its own full row, above the field. */
.chat-composer-input-start {
  width: 100%;
}

/* The blue ring every focused agent composer shows; surface focus flashes
   (the MCP rail's rainbow sweep) are designed to resolve into it. */
.chat-composer-input:focus-within {
  border-color: var(--scalar-color-blue, var(--scalar-color-1));
}

.chat-composer[data-over-limit='true'] .chat-composer-input {
  border-color: var(--scalar-color-red);
}

.chat-composer-field {
  /* Autogrow without a JS mirror; the per-layout max-height clamps it. */
  field-sizing: content;
  flex: 1;
  width: 100%;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: var(--scalar-color-1);
  font-family: var(--scalar-font);
  font-size: var(--chat-font-prose);
  line-height: 1.5;
  overflow-y: auto;
}

.chat-composer-field::placeholder {
  color: var(--scalar-color-3);
}

/*
 * iOS zooms into focused inputs rendered under 16px. The theme collapses
 * the base token to 14px at iPhone widths, which would re-enable that zoom
 * — so the guard applies to the textarea only, never the whole block.
 */
@media (max-width: 640px) {
  .chat-composer-field {
    font-size: max(16px, var(--chat-font-prose));
  }
}

.chat-composer-stacked .chat-composer-input {
  flex-direction: column;
  /* The design's fixed frame: never shorter than 84px, growing with the
     draft up to 240px; past that the field scrolls internally. */
  min-height: 84px;
  max-height: 240px;
}

.chat-composer-stacked .chat-composer-field {
  min-height: 48px;
  /* Leaves room for the actions row inside the input box's 240px cap. */
  max-height: 196px;
  padding: 12px 12px 4px;
}

.chat-composer-inline .chat-composer-input {
  align-items: flex-end;
  min-height: 40px;
  /* Lets the inputStart dock's full-width row sit above the field. */
  flex-wrap: wrap;
}

.chat-composer-inline .chat-composer-field {
  max-height: 120px;
  padding: 8px 0 8px 12px;
}

.chat-composer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-composer-stacked .chat-composer-actions {
  padding: 4px 8px 8px;
}

.chat-composer-inline .chat-composer-actions {
  margin-inline-start: auto;
  padding: 6px 8px;
}

/* Send stays at the inline end even when the pill slot is empty. */
.chat-composer-send {
  margin-inline-start: auto;
}

.chat-composer-footnote {
  margin-top: 8px;
  font-size: var(--chat-font-meta);
  color: var(--scalar-color-3);
  text-align: center;
}
</style>
