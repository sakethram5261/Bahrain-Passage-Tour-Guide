import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF9F6] p-8 text-center">
          <span className="text-5xl mb-4">🧭</span>
          <h2 className="font-serif text-2xl font-bold text-[#2A2321] mb-2">
            Passage Interrupted
          </h2>
          <p className="font-sans text-sm text-[#5C5451] max-w-sm mb-6">
            Something went wrong while loading this section. Please try refreshing.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#BA0C2F] to-[#8A0A22] text-white font-sans text-xs uppercase tracking-widest font-black cursor-pointer"
          >
            Refresh Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}