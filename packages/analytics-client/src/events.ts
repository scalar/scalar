import { z } from 'zod'

export const analyticsEventData = {
  'page-view': z.object({
    path: z.string(),
  }),
} as const

export type Events = keyof typeof analyticsEventData

// For backward compatibility or if you need the array form
export const analyticsEvents = Object.keys(analyticsEventData) as Events[]

// Create a Zod enum from the object keys with strong typing
export const analyticsEventEnum = z.enum(analyticsEvents as [Events, ...Events[]])
