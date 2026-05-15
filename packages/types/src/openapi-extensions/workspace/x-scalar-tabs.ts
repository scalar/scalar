export type TabIcon = 'request' | 'document'

export type Tab = {
  path: string
  title: string
  icon?: TabIcon
}

export type XScalarTabs = {
  'x-scalar-tabs'?: Tab[]
  'x-scalar-active-tab'?: number
}
