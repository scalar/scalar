import { ref } from 'vue'

type NavigateProps = {
  method:
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'HEAD'
    | 'OPTIONS'
    | 'TRACE'
}

const navState = ref({})

const navigate = ({ method }: NavigateProps) => {
  const state = {
    method,
  }
  console.log('lets set the path', state)
}

/**
 * Hook which both handles navigation, as well as provides
 * a reactive state of the current properties from the URL
 * Also hash is only readable by the client so keep that
 * in mind for SSR/SSG
 */
export const useNavigate = () => {
  if (window?.location?.hash) {
    // TODO set initial state from hash
    console.log(window.location.hash)
  }

  return { navigate, navState }
}
