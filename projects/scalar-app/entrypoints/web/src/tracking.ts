const TRACKING_HOST = 'client.scalar.com'
const TRACKING_DATASET = 'client-scalar'
const APOLLO_TRACKER_APP_ID = '69af08315b42dc0021c4058a'
const VECTOR_TRACKER_ID = '35f38258-8949-4041-a905-81ffb5a51704'

type ApolloTrackingWindow = {
  trackingFunctions?: { onLoad: (params: { appId: string }) => void }
}

type VectorTrackerMethod = 'load' | 'identify' | 'on'

type VectorTracker = {
  q: Array<[VectorTrackerMethod, unknown[]]>
  loaded?: boolean
  load: (projectId: string) => void
  identify: (...args: unknown[]) => void
  on: (...args: unknown[]) => void
}

type TrackingWindow = ApolloTrackingWindow & {
  vector?: VectorTracker
}

type TrackingContext = {
  hostname: string
  targetDocument: Document
  targetWindow: TrackingWindow
}

const createTrackingContext = (): TrackingContext => ({
  hostname: window.location.hostname,
  targetDocument: document,
  targetWindow: window as unknown as TrackingWindow,
})

const initializeApolloTracker = (context: TrackingContext = createTrackingContext()) => {
  const { hostname, targetDocument, targetWindow } = context

  if (hostname !== TRACKING_HOST) {
    return
  }

  if (targetDocument.querySelector(`script[data-apollo-tracker="${TRACKING_DATASET}"]`)) {
    return
  }

  const noCacheToken = Math.random().toString(36).substring(7)
  const script = targetDocument.createElement('script')
  script.src = `https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=${noCacheToken}`
  script.async = true
  script.defer = true
  script.dataset.apolloTracker = TRACKING_DATASET
  script.onload = () => {
    targetWindow.trackingFunctions?.onLoad({ appId: APOLLO_TRACKER_APP_ID })
  }

  targetDocument.head.appendChild(script)
}

const createVectorTracker = (): VectorTracker => {
  const vectorTracker: VectorTracker = {
    q: [],
    load: (projectId: string) => {
      vectorTracker.q.push(['load', [projectId]])
    },
    identify: (...args: unknown[]) => {
      vectorTracker.q.push(['identify', args])
    },
    on: (...args: unknown[]) => {
      vectorTracker.q.push(['on', args])
    },
  }

  return vectorTracker
}

const initializeVectorTracker = (context: TrackingContext = createTrackingContext()) => {
  const { hostname, targetDocument, targetWindow } = context

  if (hostname !== TRACKING_HOST) {
    return
  }

  if (targetWindow.vector || targetDocument.querySelector(`script[data-vector-tracker="${TRACKING_DATASET}"]`)) {
    return
  }

  try {
    const vectorTracker = createVectorTracker()
    targetWindow.vector = vectorTracker
    const script = targetDocument.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = 'https://cdn.vector.co/pixel.js'
    script.dataset.vectorTracker = TRACKING_DATASET

    const firstScript = targetDocument.getElementsByTagName('script')[0]

    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript)
    } else {
      targetDocument.head.appendChild(script)
    }

    vectorTracker.load(VECTOR_TRACKER_ID)
  } catch (error) {
    console.error('Error loading Vector:', error)
  }
}

export const initializeWebsiteTrackers = (context: TrackingContext = createTrackingContext()) => {
  initializeApolloTracker(context)
  initializeVectorTracker(context)
}
