import { clone } from '../clone'
import { describe, expect, it } from 'vitest'

import { Mutation } from './mutations'

describe('Assign mutation records', () => {
  function createMicroStore(name: string) {
    return {
      name: name,
      time: Date.now(),
      id: Math.round(Math.random() * 100),
    }
  }
  const state = {
    storage: [createMicroStore('name1'), createMicroStore('name2'), createMicroStore('name3')],

    param1: 'Some param',
    param2: 2000,
  }

  const originalState = clone(state)
  const mutation = new Mutation(state)

  let intermediateState: typeof originalState
  it('Assigns value to store and creates records', () => {
    const newName = 'A NEW NAME!'
    mutation.mutate('storage.0.name', newName)

    expect(mutation.records.length).toEqual(1)
    expect(mutation.idx).toEqual(0)
    expect(state.storage[0]?.name).toEqual(newName)

    const newTime = Date.now()
    mutation.mutate('storage.2.time', newTime)
    expect(mutation.records.length).toEqual(2)
    expect(mutation.idx).toEqual(1)
    expect(state.storage[2]?.time).toEqual(newTime)

    intermediateState = clone(state)
  })

  it('Reverts start when undoing', () => {
    // Double check state has been changed.
    expect(state).not.toEqual(originalState)

    mutation.undo()
    mutation.undo()

    // Should still be two mutations in the record
    expect(mutation.records.length).toEqual(2)

    // Index should be rolled back
    expect(mutation.idx).toEqual(-1)

    // State should be the same as starting
    expect(state).toEqual(originalState)
  })

  it('Rolls state forward when redoing', () => {
    expect(state).not.toEqual(intermediateState)

    mutation.redo()
    mutation.redo()

    expect(state).toEqual(intermediateState)
  })

  it('Does not rollover end of records', () => {
    expect(mutation.redo()).toEqual(false)
    expect(state).toEqual(intermediateState)
  })

  it('Does not rollover beginning of records', () => {
    for (let i = 0; i < mutation.records.length + 1; i++) {
      mutation.undo()
    }

    expect(state).toEqual(originalState)
  })

  it('Truncates record when new mutation is made at idx === -1', () => {
    mutation.mutate('param2', 2010)
    expect(mutation.records.length).toEqual(1)
    expect(mutation.records[0]).toEqual({
      prev: originalState.param2,
      value: 2010,
      path: 'param2',
    })
  })

  it('Trucates record when new mutation is made in middle of array', () => {
    mutation.mutate('param1', 'A new param')
    mutation.mutate('storage.2.name', 'A new name')

    expect(mutation.records.length).toEqual(3)

    mutation.undo()
    expect(mutation.idx).toEqual(1)

    const prevVal = state.param1
    mutation.mutate('param1', 'Final Param')

    expect(mutation.records.length).toEqual(3)
    expect(mutation.records[2]).toEqual({
      prev: prevVal,
      value: 'Final Param',
      path: 'param1',
    })
  })

  it('Truncates record when a new mutation is made at end of array', () => {
    mutation.undo()

    const prevVal = state.param1
    mutation.mutate('param1', 'End param')

    expect(mutation.records.length).toEqual(3)
    expect(mutation.records[mutation.records.length - 1]).toEqual({
      prev: prevVal,
      value: 'End param',
      path: 'param1',
    })
  })

  it('Limits the number of records', () => {
    const limitMutation = new Mutation(state, 20)
    for (let i = 0; i < 200; i++) {
      limitMutation.mutate('param1', String(Math.random() * 100))
    }
    expect(limitMutation.records.length).toEqual(20)
  })
})

describe('Handles history rolling', () => {
  function createMicroStore(name: string) {
    return {
      name: name,
      time: Date.now(),
      id: Math.round(Math.random() * 100),
    }
  }
  const state = {
    storage: [createMicroStore('name1'), createMicroStore('name2'), createMicroStore('name3')],

    param1: 'Some param',
    param2: 2000,
  }

  // TODO: This test fails way too often, there seems to be a race condition.
  it.skip('Rolls history back to initial then forward to modified state', { retry: 3 }, () => {
    // Modify n times then insure the state matched after n rollbacks
    const originalState = clone(state)

    const mutator = new Mutation(state)

    mutator.mutate('param1', '3000')
    mutator.mutate('storage.0.name', 'Havi')
    mutator.mutate('storage.1.name', 'Dave')
    mutator.mutate('storage.2.name', 'Tammy')
    mutator.mutate('storage.0.id', 30)
    mutator.mutate('storage.1.id', 50)
    mutator.mutate('storage.2.id', 70)

    const finalState = clone(state)

    const undoNumber = 10 // Overshoot number of mutation to handle array edges
    for (let i = 0; i < undoNumber; i++) {
      mutator.undo()
      if (i < 6) {
        expect(state).not.toEqual(originalState)
      } else {
        expect(state).toEqual(originalState)
      }
    }
    for (let i = 0; i < undoNumber; i++) {
      mutator.redo()
      if (i < 6) {
        expect(state).not.toEqual(finalState)
      } else {
        expect(state).toEqual(finalState)
      }
    }
  })
})
