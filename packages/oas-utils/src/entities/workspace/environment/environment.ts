export type Environment = {
  uid: string
  name: string
  color: string
  raw: string
  parsed: { key: string; value: string }[]
  isDefault?: boolean
}
