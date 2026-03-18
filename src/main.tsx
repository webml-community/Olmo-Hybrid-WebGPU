import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { LLMProvider } from "./hooks/LLMProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LLMProvider>
      <App />
    </LLMProvider>
  </StrictMode>,
);
