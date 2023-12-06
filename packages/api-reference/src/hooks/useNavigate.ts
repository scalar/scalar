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

/**
 * Hook which both handles navigation, as well as provides
 * a reactive state of the current properties from the URL
 *
 */
export const useNavigate = () => {

  if (typeof window !== 'undefined') {
    
  }
  
  const navigate = ({ method }: NavigateProps) => {
    const state = {
      method,
    }
    console.log('lets set the path', state)
  }

  return { navigate, navState }
}
