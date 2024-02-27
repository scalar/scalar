import React, { useEffect } from 'react'

import { ApiClientReactBase, BaseProps } from './ApiClientReactBase'

type Props = {
  // Function to close the modal
  close: () => void
  // Controls whether the modal is open or closed
  isOpen: boolean
} & BaseProps

/**
 * Api Client React
 */
export const ApiClientReact = ({
  close,
  isDarkMode = false,
  isOpen = false,
}: Props) => {
  // useEffect(() => {}, [])

  return (
    <div
      className="scalar"
      style={{ display: isOpen ? 'block' : 'none' }}>
      <div className="scalar-container">
        <div className="scalar-app">
          <div className="scalar-app-header">
            <span>API Client </span>
            <a
              href="https://www.scalar.com?utm_campaign=gitbook"
              target="_blank">
              Powered by scalar.com
            </a>
          </div>
          <ApiClientReactBase isDarkMode={isDarkMode} />
        </div>
        <div
          onClick={close}
          className="scalar-app-exit"></div>
      </div>
    </div>
  )
}
