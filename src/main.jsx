import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/400-italic.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "./styles/theme.css";
import { ContentProvider } from "./hooks/useContent.jsx";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Block the long-press menu everywhere; it has no use on a kiosk.
window.addEventListener("contextmenu", (e) => e.preventDefault());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ContentProvider>
          <App />
        </ContentProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
