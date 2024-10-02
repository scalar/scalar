import microdiff, { type Difference } from 'microdiff'

/**
 * This will go through the diff and combine any diff items which are next to eachother which go from remove to add.
 * - first we check if the payloads are the same then it was just a simple rename
 * - next we will add the rename and also handle any changes in the diff
 */
export const combineRenameDiffs = (diff: Difference[]): Difference[] => {
  const combined: Difference[] = []
  console.log(diff)
  let skipNext = false

  for (let i = 0; i < diff.length; i++) {
    if (skipNext) {
      skipNext = false
      continue
    }

    const current = diff[i]
    const next = diff[i + 1]

    if (current.path[0] !== 'paths') {
      combined.push(current)
      continue
    }

    if (current.type === 'REMOVE' && next?.type === 'CREATE') {
      const [, currPath, currMethod] = current.path
      const [, nextPath, nextMethod] = next.path

      // Handle path rename
      if (currPath !== nextPath) {
        combined.push({
          type: 'CHANGE',
          path: ['paths', 'path'],
          oldValue: currPath,
          value: nextPath,
        })
      }

      // Handle method rename
      if (currMethod && nextMethod && currMethod !== nextMethod) {
        combined.push({
          type: 'CHANGE',
          path: ['paths', nextPath, 'method'],
          oldValue: currMethod,
          value: nextMethod,
        })
      }

      // Handle other changes within the renamed path or method
      const innerDiff = microdiff(current.oldValue, next.value)
      for (const change of innerDiff) {
        if (change.type === 'CHANGE') {
          combined.push({
            ...change,
            path: [
              'paths',
              nextPath,
              ...(nextMethod ? [nextMethod] : []),
              ...change.path,
            ],
          })
        }
      }

      skipNext = true
    } else {
      combined.push(current)
    }
  }

  return combined
}
