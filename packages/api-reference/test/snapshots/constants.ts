import { type Slug, sources } from '@test/data/sources'

/** A subset of slugs to test */
export const snapshotSourceList: Slug[] = ['scalar-galaxy', 'scalar-galaxy-classic']

export const snapshotSources = sources.filter(({ slug }) => snapshotSourceList.includes(slug))
