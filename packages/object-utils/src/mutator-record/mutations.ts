import { type Path, type PathValue, getNestedValue, setNestedValue } from '../nested'

/** Type safe include */
export function includes<T>(arr: readonly T[], x: T): boolean {
  return arr.includes(x)
}

/** Nested paths of the data type */
type MutationPath<D> = Path<D>

/** Mutation record for a specific value and data type */
type MutationRecord<T, D> = {
  prev: T
  value: T
  path: MutationPath<D>
}

/** Mutation effect function that is run provisioned with the data object */
type MutationEffect<T> = (data: T) => void

/** Effect record that holds the possible change trigger keys for the effect to run */
type MutationEffectRecord<T> = {
  /** Side effect name for debug logs */
  name: string
  /**
   * List of path keys to run effect for. Any nested changes will also trigger the side effect
   * ex. 'foo.bar'
   */
  triggers: string[]
  /**
   * Side effect function to run. A copy of the updated data value is passed to the handler
   */
  effect: MutationEffect<T> // Effect to run
}

/**
 * Mutation tracker to allow history roll back/forwards
 *
 * Associates a history record with a specific data object and allows rolling back of that
 * specific object history.
 */
export class Mutation<DataType> {
  /** Object reference for the given data to be tracked */
  parentData: DataType
  /** Maximum number of record to keep (how many times you can 'undo' a mutation) */
  maxRecords: number
  /** List of all mutation records */
  records: MutationRecord<any, DataType>[] = []
  /** List of side effect handlers to run whenever the data changes */
  sideEffects: MutationEffectRecord<DataType>[] = []
  /** Active mutation index. Allows rolling forward and backwards */
  idx = 0
  /** Optional debug messages */
  debug: boolean

  constructor(parentData: DataType, maxRecords = 5000, debug = false) {
    this.maxRecords = maxRecords
    this.parentData = parentData
    this.debug = debug
  }

  /** Mutate without saving a record. Private function. */
  _unsavedMutate<K extends MutationPath<DataType>>(path: K, value: PathValue<DataType, K>) {
    setNestedValue(this.parentData, path, value)
    this.runSideEffects(path)
  }

  /** Side effects must take ONLY an object of the specified type and act on it */
  addSideEffect(triggers: string[], effect: MutationEffect<DataType>, name: string, immediate = true) {
    this.sideEffects.push({ triggers, effect, name })
    if (immediate) {
      effect(this.parentData)
      if (this.debug) {
        console.info(`Running mutation side effect: ${name}`, 'debug')
      }
    }
  }

  /** Runs all side effects that match the path trigger */
  runSideEffects(path: MutationPath<DataType>) {
    this.sideEffects.forEach(({ effect, triggers, name }) => {
      const triggerEffect = triggers.some((trigger) => path.includes(trigger)) || path.length < 1
      if (triggerEffect) {
        effect(this.parentData)
        if (this.debug) {
          console.info(`Running mutation side effect: ${name}`, 'debug')
        }
      }
    })
  }

  /** Mutate an object with the new property value and run side effects */
  mutate<K extends MutationPath<DataType>>(
    /** Path to nested set */
    path: K,
    /** New value to set */
    value: PathValue<DataType, K>,
    /** Optional explicit previous value. Otherwise the current value will be used */
    previousValue: PathValue<DataType, K> | null = null,
  ) {
    // If already rolled back then clear roll forward values before assigning new mutation
    if (this.idx < this.records.length - 1) {
      this.records.splice(this.idx + 1)
    }

    // Check for a change
    const prev = getNestedValue(this.parentData, path)
    if (prev === value) {
      return
    }

    // Save new mutation record with previous value
    setNestedValue(this.parentData, path, value)
    this.runSideEffects(path)

    this.records.push({
      prev: previousValue ?? prev, // Optional explicit previous value
      value,
      path,
    })

    // Save new position to end
    this.idx = this.records.length - 1

    // If the record has overflowed remove first entry
    if (this.records.length > this.maxRecords) {
      this.records.shift()
    }

    if (this.debug) {
      console.info(`Set object '${this.idx}' '${path}' to ${value}`, 'debug')
    }
  }

  /** Undo the previous mutation */
  undo() {
    if (this.idx < 0 || this.records.length < 1) {
      return false
    }

    if (this.debug) {
      console.info('Undoing Mutation', 'debug')
    }

    const record = this.records[this.idx]
    this.idx -= 1
    if (record) {
      this._unsavedMutate(record.path, record.prev)
    }

    return true
  }

  /** Roll forward to the next available mutation if its exists */
  redo() {
    if (this.idx > this.records.length - 2) {
      return false
    }

    if (this.debug) {
      console.info('Redoing Mutation', 'debug')
    }

    const record = this.records[this.idx + 1]
    this.idx += 1
    if (record) {
      this._unsavedMutate(record.path, record.value)
    }

    return true
  }
}
