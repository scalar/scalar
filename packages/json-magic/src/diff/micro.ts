import { diff, type MicroDifference } from '@/diff/diff'

export type Difference<T = unknown> = MicroDifference<T>

const microdiff = <T>(obj: unknown, newObj: T): Difference<T>[] => diff(obj, newObj, { format: 'micro' })

export default microdiff
