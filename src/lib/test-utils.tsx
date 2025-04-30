import { render as rtlRender } from '@testing-library/react'
import { ReactNode } from 'react'

function render(ui: ReactNode, { ...options } = {}) {
  return rtlRender(ui, { ...options })
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { render } 