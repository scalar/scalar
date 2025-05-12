import React from 'react'
import '../assets/style.css'

type XCustomExtensionProps = {
  xCustomExtension: string
}

export const CustomReactComponent: React.FC<XCustomExtensionProps> = ({ xCustomExtension }) => {
  return (
    <div className="x-custom-extension">
      <div className="label">x-custom-extension</div>
      <div className="value">{xCustomExtension}</div>
    </div>
  )
}
