/**
 * Represents a node in a singly linked list structure, used internally by the Queue.
 *
 * Example:
 *   const node = new Node<number>(42);
 *   console.log(node.data); // 42
 *   console.log(node.next); // null
 */
export class Node<T> {
  data: T
  next: Node<T> | null
  constructor(data: T) {
    this.data = data
    this.next = null
  }
}

/**
 * A generic queue implementation using a singly linked list.
 *
 * Example usage:
 *
 *   const q = new Queue<number>();
 *   q.enqueue(1);
 *   q.enqueue(2);
 *   q.enqueue(3);
 *   console.log(q.dequeue()); // 1
 *   console.log(q.peek());    // 2
 *   console.log(q.getSize()); // 2
 *   console.log(q.toString()); // "2 -> 3"
 *   console.log(q.isEmpty()); // false
 */

export class Queue<T> {
  front: Node<T> | null
  rear: Node<T> | null
  size: number

  constructor() {
    this.front = null
    this.rear = null
    this.size = 0
  }

  /**
   * Adds an element to the end of the queue.
   * @param data - The data to add to the queue.
   */
  enqueue(data: T) {
    const newNode = new Node(data)
    if (this.isEmpty() || !this.rear) {
      this.front = newNode
      this.rear = newNode
    } else {
      this.rear.next = newNode
      this.rear = newNode
    }
    this.size++
  }

  /**
   * Removes and returns the front element of the queue.
   * @returns The data from the removed node, or null if the queue is empty.
   */
  dequeue() {
    if (this.isEmpty() || !this.front) {
      return null
    }
    const removedNode = this.front
    this.front = this.front.next
    if (this.front === null) {
      this.rear = null
    }
    this.size--
    return removedNode.data
  }

  /**
   * Returns the front element of the queue without removing it.
   * @returns The front data, or null if the queue is empty.
   */
  peek() {
    if (this.isEmpty() || !this.front) {
      return null
    }
    return this.front.data
  }

  /**
   * Checks whether the queue is empty.
   * @returns True if the queue has no elements, false otherwise.
   */
  isEmpty() {
    return this.size === 0
  }

  /**
   * Returns the number of elements in the queue.
   * @returns The size of the queue.
   */
  getSize() {
    return this.size
  }

  /**
   * Returns a string representation of the queue.
   * @returns Elements of the queue separated by ' -> '.
   */
  toString() {
    let current = this.front
    const elements = []
    while (current) {
      elements.push(current.data)
      current = current.next
    }
    return elements.join(' -> ')
  }
}
