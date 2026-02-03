<script setup lang="ts">
import Logo from '@/components/Logo.vue'
import { useState } from '@/state/state'
import PromptForm from '@/views/PromptForm.vue'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'uploadApi'): void
}>()

const { mode } = useState()
</script>

<template>
  <div class="startContainer">
    <Logo class="agentLogo" />
    <h1 class="heading">How can I help you today?</h1>
    <PromptForm
      ref="promptFormField"
      @submit="emit('submit')"
      @uploadApi="emit('uploadApi')" />
    <p class="disclaimerText">
      <template v-if="mode === 'preview'">
        By messaging Agent Scalar your OpenAPI Document will be Temporarily
        uploaded to Scalar's Servers. You must agree to our
      </template>
      <template v-else> By messaging Agent Scalar you agree to our </template>
      <a
        class="disclaimerLink"
        href="https://scalar.com/legal/terms-and-conditions"
        target="_blank"
        >Terms
      </a>
      and
      <a
        class="disclaimerLink"
        href="https://scalar.com/legal/privacy-policy"
        target="_blank">
        Privacy Policy</a
      >.
    </p>
  </div>
</template>

<style scoped>
.agentLogo {
  margin-bottom: 15px;
}

.startContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 720px;
  position: relative;
}

.heading {
  font-size: 1.5rem;
  font-weight: var(--scalar-font-bold);
  margin-bottom: 50px;
}

.suggestionsContainer {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 25px 0;
}

.disclaimerText {
  text-align: center;
  color: var(--scalar-color-3);
  font-size: var(--scalar-font-size-3);
  text-wrap: balance;
  line-height: 1.44;
  margin-top: 40px;
}

.disclaimerLink {
  text-decoration: underline;
}
</style>
