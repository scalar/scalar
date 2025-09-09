import { z } from 'zod'

export const analyticsEventData = {
  'page-view': z.object({
    to: z.string(),
    from: z.string(),
    hostname: z.string(),
  }),
  'client-send-request': z.undefined(),
} as const

export type Events = keyof typeof analyticsEventData

// For backward compatibility or if you need the array form
export const analyticsEvents = Object.keys(analyticsEventData) as Events[]

// Create a Zod enum from the object keys with strong typing
export const analyticsEventEnum = z.enum(analyticsEvents as [Events, ...Events[]])
