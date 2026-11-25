<script lang="ts" setup>
/**
 * Deploy: a waitlist sign-up for hosting on Scalar, in the same card as the Generate SDK content
 * (brand wash, artwork, centred title, rounded actions). The localhost shell shows it in its side
 * panel, and the one-time API Hosting beta popup shows it in a dialog.
 *
 * It is about running the API itself on Scalar, not its documentation. When the reference is served
 * by a server framework (FastAPI, Elysia, Express, …), the card shows that framework's logo and
 * names it in the title. Either way, what hosting includes sits below the sign-up.
 *
 * Submits to the Loops newsletter form the marketing site uses, with the same `Hosting` user group
 * and the same one-minute local rate limit, so both places behave alike. Every sign-up sets the
 * contact's `oss` property, as the marketing site sets `landing`, so the waitlist shows where people
 * joined. When a server framework is known, its name goes along as the contact's `framework`
 * property, so we can see what people on the waitlist are running.
 */
import { ScalarButton } from '@scalar/components/button'
import { ScalarIcon } from '@scalar/components/icon'
import { useLoadingState } from '@scalar/components/loading'
import {
  ScalarIconArrowLeft,
  ScalarIconButterfly,
  ScalarIconCpu,
  ScalarIconGitBranch,
  ScalarIconMoon,
} from '@scalar/icons'
import type { ScalarIconComponent } from '@scalar/icons/types'
import type {
  ApiReferenceConfiguration,
  ApiReferenceTranslationKey,
} from '@scalar/types/api-reference'
import { computed, nextTick, onMounted, ref, useId, useTemplateRef } from 'vue'

import { rememberApiHostingBetaPromptSeen } from '@/features/api-hosting-beta/hooks/use-api-hosting-beta-prompt'
import { useLocalization } from '@/features/localization'

import { getServerFramework } from '../server-frameworks'
import DeveloperToolsCard from './DeveloperToolsCard.vue'

const { integration, popup = false } = defineProps<{
  /** The framework serving the reference, set by the Scalar integrations */
  integration?: ApiReferenceConfiguration['_integration']
  /**
   * Shown in the one-time API Hosting beta popup rather than the side panel. The artwork is the
   * beta's butterfly, as in the API client's invitation, and a sign-up ends with Done, which closes
   * the card, instead of Back to another sign-up: once someone has joined, the popup has nothing
   * left to do.
   */
  popup?: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const framework = computed(() => getServerFramework(integration))

// Opening this card anywhere counts as having seen the API Hosting beta popup, so the panel keeps the
// popup from repeating the invitation on a later load (the popup has already remembered itself)
onMounted(rememberApiHostingBetaPromptSeen)

/** What running an app on Scalar includes, laid out like the Generate SDK card's feature rows */
const HOSTING_FEATURES = [
  {
    icon: ScalarIconCpu,
    title: 'developerTools.hostingScaleTitle',
    description: 'developerTools.hostingScaleDescription',
  },
  {
    icon: ScalarIconMoon,
    title: 'developerTools.hostingIdleTitle',
    description: 'developerTools.hostingIdleDescription',
  },
  {
    icon: ScalarIconGitBranch,
    title: 'developerTools.hostingDeploysTitle',
    description: 'developerTools.hostingDeploysDescription',
  },
] as const satisfies ReadonlyArray<{
  icon: ScalarIconComponent
  title: ApiReferenceTranslationKey
  description: ApiReferenceTranslationKey
}>

const PRICING_URL = 'https://scalar.com/pricing'

/** The Loops newsletter form behind the hosting waitlist */
const LOOPS_FORM_URL =
  'https://app.loops.so/api/newsletter-form/clksm7aj203tclb0olg1z2xb3'
/** Shared with the Loops embed, so a sign-up in either place counts towards the same limit */
const RATE_LIMIT_KEY = 'loops-form-timestamp'
const RATE_LIMIT_MS = 60_000

const { translate } = useLocalization()
const loader = useLoadingState()

const title = computed<string>(() =>
  framework.value
    ? translate('developerTools.deployFrameworkTitle', {
        framework: framework.value.name,
      })
    : translate('developerTools.deployApiTitle'),
)

const emailId = useId()
const errorId = useId()
const successId = useId()

const email = ref('')
const status = ref<'idle' | 'success' | 'error'>('idle')
const errorMessage = ref('')

/**
 * What describes the email field: the error when there is one and, in the popup, where focus starts
 * in the field, the card's description too, which a screen reader would otherwise pass over.
 */
const emailDescription = (
  descriptionId: string | undefined,
): string | undefined =>
  [
    popup ? descriptionId : undefined,
    status.value === 'error' ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined

const emailInput = useTemplateRef<HTMLInputElement>('emailInput')

/** Private windows can refuse storage, which only means the local rate limit does not apply */
const readTimestamp = (): number => {
  try {
    return Number(localStorage.getItem(RATE_LIMIT_KEY)) || 0
  } catch {
    return 0
  }
}
const writeTimestamp = (value: string): void => {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, value)
  } catch {
    // Nothing to remember then
  }
}

const fail = (message: string): void => {
  errorMessage.value = message
  status.value = 'error'
  void loader.invalidate()
}

const submit = async (): Promise<void> => {
  if (loader.isLoading) {
    return
  }

  const now = Date.now()
  if (readTimestamp() + RATE_LIMIT_MS > now) {
    fail(translate('developerTools.waitlistRateLimit'))
    return
  }
  writeTimestamp(String(now))

  status.value = 'idle'
  loader.start()

  try {
    const response = await fetch(LOOPS_FORM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        userGroup: 'Hosting',
        mailingLists: '',
        email: email.value,
        // Loops stores any extra field as a contact property of the same name
        oss: 'true',
        ...(framework.value ? { framework: framework.value.name } : {}),
      }).toString(),
    })

    if (!response.ok) {
      const data: unknown = await response.json().catch(() => undefined)
      const message =
        data && typeof data === 'object' && 'message' in data
          ? String(data.message)
          : ''
      fail(
        message ||
          response.statusText ||
          translate('developerTools.waitlistError'),
      )
      return
    }

    await loader.validate()
    email.value = ''
    status.value = 'success'
  } catch (error) {
    // Loops sits behind Cloudflare, which answers too many sign-ups with a blocked request
    if (error instanceof Error && error.message === 'Failed to fetch') {
      fail(translate('developerTools.waitlistRateLimit'))
      return
    }
    writeTimestamp('')
    fail(translate('developerTools.waitlistError'))
  }
}

/**
 * The success button (Back, or Done in the popup) takes focus when the thanks replace the form.
 * Otherwise focus falls out of the card along with the Join button it was on, which a popup showing
 * this card cannot allow. The side panel is not modal, so focus only moves when it was left nowhere or
 * is still in the card: someone who has gone back to reading while the sign-up was away keeps their
 * place.
 */
const vFocus = {
  mounted: (element: HTMLElement): void => {
    const active = document.activeElement
    if (
      !active ||
      active === document.body ||
      element.closest('.developer-tools-card')?.contains(active)
    ) {
      element.focus()
    }
  },
}

/** Back to the form, with focus where the next sign-up starts */
const reset = async (): Promise<void> => {
  status.value = 'idle'
  errorMessage.value = ''
  await loader.clear()
  await nextTick()
  emailInput.value?.focus()
}
</script>
<template>
  <DeveloperToolsCard
    :compactHero="popup"
    :description="translate('developerTools.deployApiDescription')"
    :divided="false"
    :title
    @close="emit('close')">
    <template #hero>
      <!-- The popup shows the beta's small butterfly, as the API client's popup does -->
      <ScalarIconButterfly
        v-if="popup"
        class="text-green size-8" />
      <!-- The framework's logo on a sticker-like tile, or Scalar's own mark without one -->
      <span
        v-else
        aria-hidden="true"
        class="deploy-waitlist-sticker bg-b-1 flex size-26 items-center justify-center rounded-3xl border shadow-lg">
        <ScalarIcon
          v-if="framework"
          class="size-14"
          :logo="framework.logo" />
        <ScalarIcon
          v-else
          class="text-c-1 size-14"
          icon="Logo" />
      </span>
    </template>
    <template #default="{ titleId, descriptionId }">
      <div
        v-if="status === 'success'"
        class="flex flex-col items-center gap-3 text-center"
        role="status">
        <p
          :id="successId"
          class="text-c-1 m-0 text-base font-medium">
          {{ translate('developerTools.waitlistSuccess') }}
        </p>
        <!-- Takes focus, and reads out the thanks with its name, as the status alone may not be announced -->
        <ScalarButton
          v-if="popup"
          v-focus
          :aria-describedby="successId"
          class="h-10 w-full rounded-full text-base"
          variant="solid"
          @click="emit('close')">
          {{ translate('developerTools.waitlistDone') }}
        </ScalarButton>
        <ScalarButton
          v-else
          v-focus
          :aria-describedby="successId"
          class="text-c-2 hover:text-c-1 h-10 rounded-full px-4 text-base"
          variant="ghost"
          @click="reset">
          <ScalarIconArrowLeft class="me-2 size-4 rtl:-scale-x-100" />
          {{ translate('developerTools.waitlistBack') }}
        </ScalarButton>
      </div>

      <!-- Named after the card in the panel; in the popup the dialog already carries that name -->
      <form
        v-else
        :aria-labelledby="popup ? undefined : titleId"
        class="flex flex-col gap-2"
        @submit.prevent="submit">
        <label
          class="sr-only"
          :for="emailId">
          {{ translate('developerTools.waitlistEmail') }}
        </label>
        <input
          :id="emailId"
          ref="emailInput"
          v-model="email"
          :aria-describedby="emailDescription(descriptionId)"
          :aria-invalid="status === 'error' || undefined"
          autocomplete="email"
          class="bg-b-2 text-c-1 placeholder:text-c-3 h-10 w-full rounded-full border-0 px-5 text-base outline-offset-[-1px] focus-visible:outline"
          name="email"
          :placeholder="translate('developerTools.waitlistPlaceholder')"
          required
          type="email" />
        <!-- The spinner hides the label, so the name is pinned while loading (the button is still announced as busy) -->
        <ScalarButton
          :aria-busy="loader.isLoading"
          :aria-label="
            loader.isActive
              ? translate('developerTools.joinWaitlist')
              : undefined
          "
          class="h-10 w-full rounded-full text-base"
          :loader
          type="submit"
          variant="solid">
          {{ translate('developerTools.joinWaitlist') }}
        </ScalarButton>
        <p
          v-if="status === 'error'"
          :id="errorId"
          class="text-c-danger m-0 pt-1 text-center text-sm"
          role="alert">
          {{ errorMessage }}
        </p>
      </form>

      <!-- What hosting includes, below the sign-up; WebKit drops the list role from a list-style: none list -->
      <ul
        class="m-0 mt-6 flex list-none flex-col gap-4 border-t p-0 pt-6"
        role="list">
        <li
          v-for="feature in HOSTING_FEATURES"
          :key="feature.title"
          class="flex items-start gap-3">
          <span class="text-c-1 flex h-6 shrink-0 items-center">
            <component
              :is="feature.icon"
              class="size-5"
              weight="regular" />
          </span>
          <span class="flex flex-col gap-0.5">
            <span class="text-c-1 text-base leading-6 font-bold">
              {{ translate(feature.title) }}
            </span>
            <span class="text-c-2 text-sm leading-relaxed">
              {{ translate(feature.description) }}
            </span>
          </span>
        </li>
      </ul>
      <p
        class="text-c-2 m-0 mt-5 text-center text-xs leading-relaxed text-balance">
        {{ translate('developerTools.hostingPlans') }} ·
        <a
          class="text-c-1 underline"
          :href="PRICING_URL"
          rel="noopener noreferrer"
          target="_blank">
          {{ translate('developerTools.hostingSeePlans') }}
          <span class="sr-only">
            {{ translate('exploreScalar.opensInNewTab') }}
          </span>
        </a>
      </p>
    </template>
  </DeveloperToolsCard>
</template>
<style scoped>
.deploy-waitlist-sticker {
  rotate: -6deg;
}
</style>
