import { env } from '@/environment'

/**
 * Generate the login URL, we use the current location in staging to redirect back to the previews
 */
export const loginUrl = () => {
  const redirect = env.VITE_ENV === 'staging' ? window.location.href : 'client'
  return `${env.VITE_DASHBOARD_URL}/login?externalRedirect=${redirect}`
}

/**
 * Generate the login URL, we use the current location in staging to redirect back to the previews
 */
export const registerUrl = () => {
  const redirect = env.VITE_ENV === 'staging' ? window.location.href : 'client'
  return `${env.VITE_DASHBOARD_URL}/register?externalRedirect=${redirect}`
}
