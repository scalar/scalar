import { apply } from '@/diff/apply'
import { type Difference, diff } from '@/diff/diff'
import { merge } from '@/diff/merge'
import microdiff, { type Difference as MicroDifference } from '@/diff/micro'

export { diff, apply, merge, microdiff, type Difference, type MicroDifference }
