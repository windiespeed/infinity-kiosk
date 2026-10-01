import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/source-serif-4/500.css";
import "@fontsource/source-serif-4/700.css";
import "./styles/theme.css";
import { ContentProvider } from "./hooks/useContent.jsx";
import App from "./App.jsx";

// Block the long-press menu everywhere; it has no use on a kiosk.
window.addEventListener("contextmenu", (e) => e.preventDefault());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ContentProvider>
        <App />
      </ContentProvider>
    </BrowserRouter>
  </StrictMode>
);
