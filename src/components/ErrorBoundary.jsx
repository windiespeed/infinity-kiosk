import { Component } from "react";
import { buttonClass } from "../lib/ui.js";

// Catches a crash while drawing a screen and shows a way out instead of a blank kiosk.
// App.jsx wraps the screens in one with resetKey = the current path, so moving to another
// screen clears the error (the bottom nav and the hidden admin corner keep working).
// main.jsx wraps the whole app in another as a last resort.
export default class ErrorBoundary extends Component {
  state = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { failed: false, resetKey: props.resetKey } : null;
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <h1 className="text-4xl">This screen couldn't open</h1>
        <p className="max-w-[50ch] text-text-muted">Something in its content is missing. Start over to keep exploring.</p>
        {/* A full reload, so this works even when the router itself is what failed. */}
        <button onClick={() => window.location.replace("/")} className={buttonClass("primary")}>
          Start over
        </button>
      </div>
    );
  }
}
