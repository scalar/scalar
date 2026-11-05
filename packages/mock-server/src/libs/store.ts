/**
 * Simple in-memory store for x-handler operations.
 * Data persists during server lifetime but is reset on server restart.
 */
type StoreData = Record<string, Record<string, any>>

export class Store {
  // Collection names and item IDs come from guest code, so neither lookup may inherit host properties.
  private data: StoreData = Object.create(null)

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
    const items: StoreData[string] = this.data[collection] ?? Object.create(null)
    this.data[collection] = items

    // Handle null/undefined data by defaulting to empty object
    const safeData = data ?? {}
    const id = safeData.id ?? crypto.randomUUID()
    const item = { ...safeData, id }

    items[id] = item

    return item
  }

  /**
   * Update an existing item in a collection.
   * Returns null if the item is not found.
   */
  update(collection: string, id: string, data: any): any | null {
    if (!this.data[collection]?.[id]) {
      return null
    }

    // Handle null/undefined data by defaulting to empty object
    const safeData = data ?? {}
    const updated = { ...this.data[collection][id], ...safeData, id }
    this.data[collection][id] = updated

    return updated
  }

  /**
   * Delete an item from a collection.
   * Returns null if the item is not found.
   */
  delete(collection: string, id: string): boolean | null {
    if (!this.data[collection]?.[id]) {
      return null
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
      this.data = Object.create(null)
    }
  }
}

/**
 * Singleton store instance shared across all requests.
 */
export const store = new Store()
