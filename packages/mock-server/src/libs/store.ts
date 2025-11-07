/**
 * Simple in-memory store for x-handler operations.
 * Data persists during server lifetime but is reset on server restart.
 */
type StoreData = Record<string, Record<string, any>>

class Store {
  private data: StoreData = {}

  /**
   * Get all items in a collection.
   */
  list(collection: string): any[] {
    const items = this.data[collection]
    return items ? Object.values(items) : []
  }

  /**
   * Get a single item by ID.
   */
  get(collection: string, id: string): any | undefined {
    return this.data[collection]?.[id]
  }

  /**
   * Create a new item in a collection.
   * Auto-generates an ID if not provided.
   */
  create(collection: string, data: any): any {
    if (!this.data[collection]) {
      this.data[collection] = {}
    }

    const id = data.id ?? crypto.randomUUID()
    const item = { ...data, id }

    this.data[collection][id] = item

    return item
  }

  /**
   * Update an existing item in a collection.
   */
  update(collection: string, id: string, data: any): any {
    if (!this.data[collection]?.[id]) {
      throw new Error(`Item with id "${id}" not found in collection "${collection}"`)
    }

    const updated = { ...this.data[collection][id], ...data, id }
    this.data[collection][id] = updated

    return updated
  }

  /**
   * Delete an item from a collection.
   */
  delete(collection: string, id: string): boolean {
    if (!this.data[collection]?.[id]) {
      return false
    }

    delete this.data[collection][id]

    return true
  }

  /**
   * Clear a specific collection or all collections.
   */
  clear(collection?: string): void {
    if (collection) {
      delete this.data[collection]
    } else {
      this.data = {}
    }
  }
}

/**
 * Singleton store instance shared across all requests.
 */
export const store = new Store()
