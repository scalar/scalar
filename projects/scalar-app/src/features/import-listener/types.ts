export type ImportEventData = {
  type: 'url' | 'file' | 'raw'
  source: string
  companyLogo?: string | null
}
