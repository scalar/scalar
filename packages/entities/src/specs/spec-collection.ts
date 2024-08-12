import { nanoidSchema } from '@/utility'
import { z } from 'zod'

const specBase = z.object({
  uid: nanoidSchema,
  public: z.boolean().default(false),
  requests: z.any(),
})
type ScalarSpecBase = {
  uid: string
  public: boolean
  /** Define what data lives in the overlay and what lives as spec extensions */
  overlay: {
    folders: boolean
    examples: boolean
  }
}

type ScalarSpecUrl = ScalarSpecBase & {
  type: 'url'
  url: string
  /**
   * Record of branch names to branch urls
   *
   * Ex.
   * ```
   * {
   *   'staging': 'staging.scalar.com'
   *   'prod': 'api.scalar.com'
   *   'test': 'test.scalar.com'
   * }
   * ```
   */
  branches: Record<string, string>
  /**
   * Optional endpoint data to push updates to
   * Body will contain the updated spec
   */
  push?: {
    url: string
    method: 'post' | 'put'
    query?: Record<string, string>
    headers?: Record<string, string>
    body?: string
    /** Should live elsewhere in user data and be a ref to the token */
    authToken?: string
  }
}

type ScalarSpecGithub = ScalarSpecBase & {
  type: 'github'
  repository: {
    id: number
    name: string
    filePath: string
    branches: string[]
  }
}

type ScalarSpecHosted = {
  type: 'hosted'
  yjsRef: string
}

type ScalarSpecOverlay = {
  /** Matching UID */
  uid: string
}
