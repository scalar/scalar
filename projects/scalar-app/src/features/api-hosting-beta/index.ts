/**
 * The one-time invitation to the API Hosting beta: a popup as the API client starts that signs the
 * user up for the same waitlist as scalar.com's API Hosting page, shown once in each browser.
 */
export { default as ApiHostingBetaPrompt } from './components/ApiHostingBetaPrompt.vue'
export { holdApiHostingBetaPrompt } from './hooks/use-api-hosting-beta-prompt'
