import '@testing-library/jest-dom'

declare module '@testing-library/jest-dom' {
  interface Matchers<R> {
    toBeInTheDocument(): R
    toHaveClass(className: string): R
  }
} 