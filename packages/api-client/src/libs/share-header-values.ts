/* We persist/share header values across all method calls, e.g. if you set the Accept header
 * for one method using the API Client, then that value will be set for all other methods
 * that have an Accept header too. This persistence and sharing is done with this class. */
export const shareHeaderValues = (activeExample: any, allExamples: any) => {
  const myUid = activeExample.uid

  const otherExamples = allExamples.filter((e: any) => e[0] !== myUid)
  console.log(`There are ${otherExamples.length} other examples.`)
  if (otherExamples.length === 0) {
    return
  }

  otherExamples.forEach((otherExample: any) => {
    otherExample[1].parameters.headers.forEach((otherExampleHeader: any) => {
      activeExample.parameters.headers.forEach((activeExampleHeader: any) => {
        if (otherExampleHeader.key === activeExampleHeader.key) {
          if (otherExampleHeader.value !== activeExampleHeader.value) {
            otherExampleHeader.value = activeExampleHeader.value
          }
        }
      })
    })
  })
}
