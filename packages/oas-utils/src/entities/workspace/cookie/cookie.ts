import type { Nanoid } from '../shared'

export type Cookie = {
  uid: Nanoid
  name: string
  value: string
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
  sameSite: string
  expires: Date | null
}
