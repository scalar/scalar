export class ExtendedURL extends URL {
  get path() {
    return this.pathname + this.search
  }
}
