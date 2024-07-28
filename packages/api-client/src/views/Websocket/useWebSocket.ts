import { onUnmounted, reactive, ref } from 'vue'

const socket = ref<WebSocket | null>(null)
const isConnected = ref(false)
const messageHistory = reactive<
  { type: 'sent' | 'received'; message: string }[]
>([])
const url = ref('')

export function useWebSocket() {
  const connect = () => {
    console.log('connecting!')
    if (socket.value?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket is already connected')
      return
    }

    socket.value = new WebSocket(url.value)

    socket.value.onopen = () => {
      isConnected.value = true
      console.log('WebSocket connected')
    }

    socket.value.onmessage = (event) => {
      messageHistory.push({ type: 'received', message: event.data })
    }

    socket.value.onclose = () => {
      isConnected.value = false
      console.log('WebSocket disconnected')
    }

    socket.value.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  const disconnect = () => {
    socket.value?.close()
    socket.value = null
    isConnected.value = false
  }

  const sendMessage = (message: string) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(message)
      messageHistory.push({ type: 'sent', message })
    } else {
      console.error('WebSocket is not connected')
    }
  }

  const setUrl = (newUrl: string) => {
    url.value = newUrl
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    messageHistory,
    connect,
    disconnect,
    sendMessage,
    setUrl,
    url,
  }
}
