import { env } from '@/environment'

export const loginUrl = `${env.VITE_DASHBOARD_URL}/login?externalRedirect=client`
export const registerUrl = `${env.VITE_DASHBOARD_URL}/register?externalRedirect=client`
