import { beforeEach, describe, expect, it } from 'vitest'

import { Node, Queue } from './queue'

describe('Node', () => {
  it('stores data and has null next by default', () => {
    const node = new Node('a')

    expect(node.data).toBe('a')
    expect(node.next).toBeNull()
  })
})

describe('Queue', () => {
  let queue: Queue<string>

  beforeEach(() => {
    queue = new Queue<string>()
  })

  it('starts empty', () => {
    expect(queue.isEmpty()).toBe(true)
    expect(queue.getSize()).toBe(0)
    expect(queue.front).toBeNull()
    expect(queue.rear).toBeNull()
    expect(queue.peek()).toBeNull()
    expect(queue.dequeue()).toBeNull()
  })

  it('enqueue adds first element and updates front/rear', () => {
    queue.enqueue('a')

    expect(queue.isEmpty()).toBe(false)
    expect(queue.getSize()).toBe(1)
    expect(queue.front?.data).toBe('a')
    expect(queue.rear?.data).toBe('a')
    expect(queue.front).toBe(queue.rear)
    expect(queue.peek()).toBe('a')
  })

  it('dequeue removes and returns front element (FIFO)', () => {
    queue.enqueue('a')
    queue.enqueue('b')
    queue.enqueue('c')

    expect(queue.getSize()).toBe(3)
    expect(queue.peek()).toBe('a')

    expect(queue.dequeue()).toBe('a')
    expect(queue.getSize()).toBe(2)
    expect(queue.peek()).toBe('b')

    expect(queue.dequeue()).toBe('b')
    expect(queue.getSize()).toBe(1)
    expect(queue.peek()).toBe('c')

    expect(queue.dequeue()).toBe('c')
    expect(queue.getSize()).toBe(0)
    expect(queue.isEmpty()).toBe(true)
    expect(queue.front).toBeNull()
    expect(queue.rear).toBeNull()
    expect(queue.peek()).toBeNull()
    expect(queue.dequeue()).toBeNull()
  })

  it('rear follows the last enqueued item and links nodes', () => {
    queue.enqueue('a')
    queue.enqueue('b')
    queue.enqueue('c')

    expect(queue.front?.data).toBe('a')
    expect(queue.front?.next?.data).toBe('b')
    expect(queue.front?.next?.next?.data).toBe('c')
    expect(queue.front?.next?.next?.next).toBeNull()
    expect(queue.rear?.data).toBe('c')
    expect(queue.rear?.next).toBeNull()
  })

  it('handles non-primitive values without cloning', () => {
    const a = { id: 'a' }
    const b = { id: 'b' }
    const objectQueue = new Queue<{ id: string }>()

    objectQueue.enqueue(a)
    objectQueue.enqueue(b)

    expect(objectQueue.peek()).toBe(a)
    expect(objectQueue.dequeue()).toBe(a)
    expect(objectQueue.dequeue()).toBe(b)
  })

  describe('toString', () => {
    it('returns empty string for an empty queue', () => {
      expect(queue.toString()).toBe('')
    })

    it('returns elements joined by arrows', () => {
      queue.enqueue('a')
      queue.enqueue('b')
      queue.enqueue('c')

      expect(queue.toString()).toBe('a -> b -> c')
    })
  })
})
