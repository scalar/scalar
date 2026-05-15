export type XBadge = {
  name: string
  position?: 'before' | 'after'
  color?: string
}

export type XBadges = {
  'x-badges'?: XBadge[]
}
