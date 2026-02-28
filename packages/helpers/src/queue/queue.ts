export class Node<T> {
  data: T
  next: Node<T> | null
  constructor(data: T) {
    this.data = data
    this.next = null
  }
}

export class Queue<T> {
  front: Node<T> | null
  rear: Node<T> | null
  size: number
  constructor() {
    this.front = null
    this.rear = null
    this.size = 0
  }
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
  peek() {
    if (this.isEmpty() || !this.front) {
      return null
    }
    return this.front.data
  }
  isEmpty() {
    return this.size === 0
  }
  getSize() {
    return this.size
  }
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
