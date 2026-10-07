/** Booking form for a demo call with Marc, Scalar's CEO */
export const DEMO_CALL_URL = 'https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a'

/** Shared view-transition-names for the card/panel and the three stickers */
export const EXPLORE_TRANSITION_NAMES = {
  card: 'scalar-explore-card',
  portals: 'scalar-explore-sticker-portals',
  sdks: 'scalar-explore-sticker-sdks',
  agent: 'scalar-explore-sticker-agent',
} as const

/** The `data-sticker` keys of the three stickers; each maps to its own entry in `EXPLORE_TRANSITION_NAMES` */
export type ExploreSticker = 'portals' | 'sdks' | 'agent'

/** Set on <html> while a transition runs so the global ::view-transition rules only match then */
export const EXPLORE_VT_ATTRIBUTE = 'data-scalar-explore-vt'
