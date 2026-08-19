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
  layout = 'stacked',
} = defineProps<{
  /** The draft text; the shell owns it and clears it after a successful send. */
  modelValue: string
  /** True while a response is streaming; Enter becomes a no-op nudge. */
  streaming: boolean
  /** Extra send gate from the shell (pending approvals, missing session, …). */
  sendDisabled?: boolean
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

  if (!text) {
    return
  }

  emit('submit', text)
}

const onKeydown = (event: KeyboardEvent): void => {
  if (event.key !== 'Enter' || event.shiftKey) {
    return
  }

  if (event.isComposing) {
    // An Enter that only commits an IME composition must not send.
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

watch(
  () => streaming,
  (isStreaming, wasStreaming) => {
    if (wasStreaming && !isStreaming) {
      // Hand focus back once the reply finishes so the user can keep typing.
      void nextTick().then(() => fieldRef.value?.focus())
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
    class="chat-composer"
    :class="
      layout === 'inline' ? 'chat-composer-inline' : 'chat-composer-stacked'
    "
    :data-over-limit="overLimit ? 'true' : undefined">
    <div class="chat-composer-input">
      <textarea
        ref="field"
        class="chat-composer-field"
        rows="1"
        :value="modelValue"
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
  gap: 8px;
  font-size: var(--chat-font-prose);
}

/* Visually above the input while DOM-after it — see the template note. */
.chat-composer-banners {
  order: -1;
}

.chat-composer-input {
  display: flex;
  background: var(--scalar-background-1);
  border: 1px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
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
}

.chat-composer-stacked .chat-composer-field {
  min-height: 48px;
  max-height: 220px;
  padding: 12px 12px 4px;
}

.chat-composer-inline .chat-composer-input {
  align-items: flex-end;
  min-height: 40px;
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
  font-size: var(--chat-font-meta);
  color: var(--scalar-color-3);
  text-align: center;
}
</style>
