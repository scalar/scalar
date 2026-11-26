<script lang="ts">
/**
 * The API Hosting beta sign-up card: what is coming, an email to send (filled in when someone is
 * logged in) and an optional framework, then a thank-you once the waitlist has it.
 *
 * It renders as the dialog's panel, so it only works inside a Headless UI `Dialog`.
 */
export default {}
</script>

<script setup lang="ts">
import { DialogPanel } from '@headlessui/vue'
import { ScalarButton } from '@scalar/components/button'
import { useLoadingState } from '@scalar/components/loading'
import {
  ScalarIconButterfly,
  ScalarIconCaretDown,
  ScalarIconWarningCircle,
  ScalarIconX,
} from '@scalar/icons'
import {
  type ComponentPublicInstance,
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useId,
  useTemplateRef,
  watch,
} from 'vue'

import { joinApiHostingBeta } from '../helpers/join-api-hosting-beta'

const { email: accountEmail = '', fetch: sendRequest } = defineProps<{
  /** Fills the field in advance, so joining is one click. */
  email?: string
  /** Sends the sign-up, when the app brings its own fetch (the desktop app does). */
  fetch?: typeof fetch
}>()

const emit = defineEmits<{
  /** Done with the card, joined or not. */
  (event: 'close'): void
}>()

/**
 * The frameworks the waitlist on scalar.com offers, in its order, so a contact's `framework` reads
 * the same whichever sign-up it came from.
 */
const FRAMEWORKS = [
  '.NET',
  'AdonisJS',
  'Elysia',
  'Express',
  'FastAPI',
  'Fastify',
  'Go',
  'Hono',
  'Laravel',
  'Litestar',
  'NestJS',
  'Next.js',
  'Nitro',
  'Nuxt',
  'Platformatic',
  'Rust',
  'Other',
] as const

/**
 * A name, an @ and a domain with a dot in it: zod's default `email()` pattern, which keeps typos
 * such as a missing top-level domain off the waitlist.
 */
const EMAIL_PATTERN =
  /^(?!\.)(?!.*\.\.)[A-Za-z0-9_'+.-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/

/** The card's height tween between the steps, and the fade that comes with it. */
const STEP_TWEEN_MS = 260

/**
 * The full-width pill both steps end on, green like the butterfly. The default theme's green is too
 * light for white text on its own (about 4:1 in the light theme, under 3:1 in the dark one), so the
 * pill mixes in enough black to clear 4.5:1 in each, and a little more under the pointer. It starts
 * from the default theme's green (set on the card) rather than the active theme's, because other
 * themes ship lighter greens that no fixed mix would rescue.
 */
const ACTION_CLASS = [
  'w-full rounded-full text-white transition-colors duration-200',
  'bg-[color-mix(in_oklab,var(--api-hosting-beta-green),black_12%)] hover:bg-[color-mix(in_oklab,var(--api-hosting-beta-green),black_20%)] active:bg-[color-mix(in_oklab,var(--api-hosting-beta-green),black_24%)]',
  'dark:bg-[color-mix(in_oklab,var(--api-hosting-beta-green),black_24%)] dark:hover:bg-[color-mix(in_oklab,var(--api-hosting-beta-green),black_32%)] dark:active:bg-[color-mix(in_oklab,var(--api-hosting-beta-green),black_36%)]',
].join(' ')

const step = ref<'form' | 'joined'>('form')

const email = ref<string>(accountEmail)
const framework = ref<string>('')

/** The address the waitlist took, for the thank-you. */
const joinedEmail = ref<string>('')

/** Holds the field's complaint back until someone leaves it or tries to join. */
const touched = ref(false)

const emailError = computed<string | undefined>(() =>
  EMAIL_PATTERN.test(email.value.trim())
    ? undefined
    : 'Enter a valid email address.',
)

const shownEmailError = computed<string | undefined>(() =>
  touched.value ? emailError.value : undefined,
)

/** Why the waitlist turned the last sign-up down. */
const requestError = ref<string>()

// The waitlist's answer was about what was sent, so an edit puts it away
watch([email, framework], () => {
  requestError.value = undefined
})

const loader = useLoadingState()

const emailErrorId = useId()

const title = computed<string>(() =>
  step.value === 'joined'
    ? "You're on the list"
    : 'API Hosting is coming to Scalar',
)

const card = useTemplateRef<ComponentPublicInstance>('card')
const emailInput = useTemplateRef<HTMLInputElement>('emailInput')
const titleElement = useTemplateRef<HTMLElement>('titleElement')
const subtitleElement = useTemplateRef<HTMLElement>('subtitleElement')
const contentElement = useTemplateRef<HTMLElement>('contentElement')

const join = async (): Promise<void> => {
  // Active, not only loading: the check that follows a sign-up leaves Join on screen for a moment,
  // and a second press there would send it again
  if (loader.isActive) {
    return
  }

  touched.value = true
  if (emailError.value) {
    emailInput.value?.focus()
    return
  }

  const address = email.value.trim()

  requestError.value = undefined
  loader.start()

  const result = await joinApiHostingBeta({
    email: address,
    framework: framework.value || undefined,
    fetch: sendRequest,
  })

  if (!result.ok) {
    requestError.value = result.error
    void loader.invalidate()
    return
  }

  await loader.validate()
  joinedEmail.value = address
  step.value = 'joined'
}

let tweenTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Tweens the card's height from one step to the next and fades the new step in, rather than
 * cutting between them. The card is measured before the step swaps and again after, within one
 * task, so no in-between state paints.
 */
watch(
  step,
  async () => {
    const cardElement: unknown = card.value?.$el
    if (
      !(cardElement instanceof HTMLElement) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const from = cardElement.offsetHeight
    await nextTick()

    clearTimeout(tweenTimer)
    cardElement.style.transition = ''
    cardElement.style.height = ''
    const to = cardElement.offsetHeight

    if (from !== to) {
      cardElement.style.overflow = 'hidden'
      cardElement.style.height = `${from}px`
      // Commits the starting height, so the change below transitions from it
      void cardElement.offsetHeight
      cardElement.style.transition = `height ${STEP_TWEEN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
      cardElement.style.height = `${to}px`
      tweenTimer = setTimeout(() => {
        cardElement.style.transition = ''
        cardElement.style.height = ''
        cardElement.style.overflow = ''
      }, STEP_TWEEN_MS + 20)
    }

    for (const element of [
      titleElement.value,
      subtitleElement.value,
      contentElement.value,
    ]) {
      if (!element) {
        continue
      }
      element.classList.remove('api-hosting-beta-fade')
      // Restarts the animation on an element that already played it
      void element.offsetWidth
      element.classList.add('api-hosting-beta-fade')
    }
  },
  { flush: 'pre' },
)

onBeforeUnmount(() => clearTimeout(tweenTimer))

/**
 * The heading takes focus as the popup opens, so it is read first and a key pressed as the popup
 * appears lands nowhere: it opens by itself, and Join would send an address already filled in. It
 * does not scroll, so a short window keeps the top of the card in view. The dialog keeps focus it
 * finds already inside the card, so this also stands in for its initial focus, which would
 * otherwise land on the close button.
 */
const vFocusHeading = {
  mounted: (element: HTMLElement) => element.focus({ preventScroll: true }),
}

/** Done takes focus once someone has joined, scrolled into view if it has to be. */
const vFocus = { mounted: (element: HTMLElement) => element.focus() }
</script>

<template>
  <!-- The overlay scrolls, so a card taller than the window is never cut off -->
  <div class="custom-scroll relative h-full overflow-y-auto">
    <div
      class="mx-auto flex w-full flex-col px-6 pt-[10vh] pb-16 sm:w-[560px] sm:px-0">
      <DialogPanel
        ref="card"
        class="bg-b-1 relative flex origin-top flex-col rounded-[28px] border p-8 [--api-hosting-beta-green:#069061] dark:[--api-hosting-beta-green:#00b648]">
        <span
          aria-hidden="true"
          class="api-hosting-beta-wash pointer-events-none absolute inset-x-0 top-0 rounded-t-[inherit]" />
        <button
          aria-label="Close"
          class="bg-b-1/70 text-c-2 hover:bg-b-2 hover:text-c-1 ring-border absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full shadow-sm ring-1"
          type="button"
          @click="emit('close')">
          <ScalarIconX
            aria-hidden="true"
            class="size-4" />
        </button>
        <ScalarIconButterfly
          aria-hidden="true"
          class="text-green relative mb-6 block size-8 self-center" />
        <h2
          ref="titleElement"
          v-focus-heading
          class="text-c-1 relative w-fit self-center text-center text-(length:--scalar-heading-1) leading-snug font-bold text-balance outline-none"
          tabindex="-1">
          {{ title }}
        </h2>
        <p
          ref="subtitleElement"
          class="text-c-2 relative mt-4 text-center text-base leading-5 text-balance">
          <!-- One live region across both steps, so the thank-you is read out when it replaces the pitch -->
          <span role="status">
            <template v-if="step === 'joined'">
              Thanks for signing up. We'll be in touch at
              <span class="text-c-1 font-medium wrap-anywhere">{{
                joinedEmail
              }}</span>.
            </template>
            <template v-else>
              Deploy your API from the server framework you already use: NestJS,
              Hono, Elysia, .NET and more. Join the beta to try it before it
              launches.
            </template>
          </span>
        </p>
        <div
          ref="contentElement"
          class="api-hosting-beta-rise relative mt-8">
          <form
            v-if="step === 'form'"
            class="flex flex-col gap-8"
            novalidate
            @submit.prevent="join">
            <!-- Read-only rather than disabled while the sign-up is away, so what was sent stays
                 what is shown and a field that has focus keeps it -->
            <div class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label class="flex flex-col gap-2">
                  <span class="text-c-1 text-base/none font-medium">Email</span>
                  <span
                    class="bg-b-1.5 focus-within:bg-b-1 shadow-border flex cursor-text items-center rounded-lg p-3 text-base outline-offset-[-1px] focus-within:outline"
                    :class="{
                      'border-c-danger border': shownEmailError,
                    }">
                    <input
                      ref="emailInput"
                      v-model="email"
                      :aria-describedby="
                        shownEmailError ? emailErrorId : undefined
                      "
                      :aria-invalid="shownEmailError ? true : undefined"
                      autocomplete="email"
                      class="text-c-1 placeholder:text-c-3 w-full min-w-0 flex-1 border-none bg-transparent outline-none"
                      name="email"
                      placeholder="you@example.com"
                      :readonly="loader.isLoading"
                      spellcheck="false"
                      type="email"
                      @blur="touched = true" />
                  </span>
                </label>
                <span
                  v-if="shownEmailError"
                  :id="emailErrorId"
                  class="text-sm text-[color-mix(in_srgb,var(--scalar-color-red),var(--scalar-color-1)_40%)]"
                  role="alert">
                  {{ shownEmailError }}
                </span>
              </div>

              <!-- A native select: a teleported listbox would sit outside the dialog panel, where a
                   click on it counts as a click outside and closes the popup -->
              <label class="flex flex-col gap-2">
                <span
                  class="flex items-center justify-between gap-2 text-base/none">
                  <span class="text-c-1 font-medium">Framework</span>
                  <span class="text-c-2">Optional</span>
                </span>
                <span class="relative flex">
                  <select
                    v-model="framework"
                    class="bg-b-1.5 focus:bg-b-1 shadow-border w-full cursor-pointer appearance-none rounded-lg border-0 p-3 pr-10 text-base outline-offset-[-1px] focus:outline"
                    :class="framework ? 'text-c-1' : 'text-c-2'"
                    :disabled="loader.isLoading"
                    name="framework">
                    <option value="">Select a framework</option>
                    <option
                      v-for="name in FRAMEWORKS"
                      :key="name"
                      class="text-c-1"
                      :value="name">
                      {{ name }}
                    </option>
                  </select>
                  <ScalarIconCaretDown
                    aria-hidden="true"
                    class="text-c-3 pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                </span>
              </label>
            </div>

            <div class="flex flex-col gap-2">
              <div
                v-if="requestError"
                class="border-red text-c-1 flex items-start gap-1.5 rounded-lg border bg-[color-mix(in_srgb,var(--scalar-color-red),transparent_97%)] p-2 text-base leading-normal"
                role="alert">
                <span class="text-red flex h-lh shrink-0 items-center">
                  <ScalarIconWarningCircle
                    aria-hidden="true"
                    class="size-4" />
                </span>
                <span>{{ requestError }}</span>
              </div>
              <!-- The spinner hides the label, so the name is pinned while it runs -->
              <ScalarButton
                :aria-busy="loader.isLoading"
                :aria-label="loader.isActive ? 'Join the beta' : undefined"
                :class="ACTION_CLASS"
                :loader
                type="submit">
                Join the beta
              </ScalarButton>
            </div>
          </form>

          <div
            v-else
            class="flex flex-col">
            <ScalarButton
              v-focus
              :class="ACTION_CLASS"
              @click="emit('close')">
              Done
            </ScalarButton>
          </div>
        </div>
      </DialogPanel>
    </div>
  </div>
</template>

<style scoped>
/* The scalar.com rainbow, hugging the card's top edge */
.api-hosting-beta-wash {
  height: 48px;
  background-image: linear-gradient(
    90deg,
    var(--scalar-color-blue),
    var(--scalar-color-green) 16.6%,
    var(--scalar-color-accent) 24.9%,
    var(--scalar-color-orange) 41.5%,
    var(--scalar-color-yellow) 58.1%,
    var(--scalar-color-orange) 74.7%,
    var(--scalar-color-purple) 91.3%,
    var(--scalar-color-red)
  );
  mask-image: radial-gradient(
    ellipse 60% 60% at 50% 0%,
    black,
    transparent 80%
  );
}

@keyframes api-hosting-beta-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

.api-hosting-beta-rise {
  animation: api-hosting-beta-rise 260ms ease-out 140ms backwards;
}

@keyframes api-hosting-beta-fade {
  from {
    opacity: 0;
  }
}

.api-hosting-beta-fade {
  animation: api-hosting-beta-fade 240ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .api-hosting-beta-rise,
  .api-hosting-beta-fade {
    animation: none;
  }
}
</style>
