import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-3xl mb-4">
            🍨
          </div>
          <h1 className="text-xl font-black text-white mb-2">Creamee Ballz POS</h1>
          <p className="text-xs text-slate-400 mb-6 max-w-xs">
            App is refreshing. Tap the button below to reload and continue.
          </p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="px-6 py-3 bg-purple-600 active:scale-95 text-white rounded-2xl text-xs font-black shadow-lg shadow-purple-900/50"
          >
            🔄 Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
