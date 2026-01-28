---
'@scalar/api-reference': patch
---

fix: prevent re-rendering of already-ready items in lazy-bus queue

Restores the readyQueue guard in addToPendingQueue to prevent items that are
already rendered from being re-added to the pending queue. This fixes a
performance regression introduced in #7497 where large API specs would
experience severe slowdowns due to items being reprocessed on every scroll
or interaction.

The fix maintains the callback functionality from #7497 by still allowing
items to be added to the priority queue (for callback triggering), but
processQueue now skips adding items that are already in readyQueue.
