export function toSearchParams(obj) {
    return new URLSearchParams(Object.entries(obj)
        .map(([key, value]) => {
        if (Array.isArray(value)) {
            return value.map(v => [key, v]);
        }
        return [[key, value]];
    })
        .flat(1));
}
export class ExtendedURL extends URL {
    get path() {
        return this.pathname + this.search;
    }
}
