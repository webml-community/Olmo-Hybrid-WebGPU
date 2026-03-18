import { useEffect, useState } from "react";

import { LandingPage } from "./components/LandingPage";
import { ChatApp } from "./components/ChatApp";
import { useLLM } from "./hooks/useLLM";
import { Loader2 } from "lucide-react";
import "katex/dist/katex.min.css";

function App() {
  const { status, loadModel, selectedModel, setSelectedModel, loadedModelId } =
    useLLM();

  const [hasStarted, setHasStarted] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const isReady =
    status.state === "ready" && loadedModelId === selectedModel.id;
  const isLoading = hasStarted && !isReady && status.state !== "error";

  const handleStart = () => {
    setHasStarted(true);
    loadModel();
  };

  const handleGoHome = () => {
    setShowChat(false);
    setTimeout(() => setHasStarted(false), 700);
  };

  useEffect(() => {
    if (isReady && hasStarted) {
      setShowChat(true);
    }
  }, [isReady, hasStarted]);

  return (
    <div className="relative h-screen w-screen bg-[#0A3235]">
      {/* Landing page — hidden once loading starts */}
      <div
        className={`absolute inset-0 z-10 transition-opacity duration-700 ${
          hasStarted ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <LandingPage
          onStart={handleStart}
          isLoading={isLoading}
          showChat={showChat}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          loadedModelId={loadedModelId}
        />
      </div>

      {/* Chat page — fades in when ready */}
      <div
        className={`absolute inset-0 z-10 transition-opacity duration-700 ${
          showChat ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {hasStarted && <ChatApp onGoHome={handleGoHome} />}
      </div>

      {/* Loading overlay — sits on top, fades from loading screen directly to chat */}
      <div
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center transition-opacity duration-700 bg-[#0A3235] ${
          isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`flex w-full max-w-md flex-col items-center px-6 transition-all duration-700 ${isLoading ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <img
            src="/ai2.svg"
            alt="AI2"
            className="mb-8 h-9 w-auto"
            draggable={false}
          />
          <Loader2 className="h-10 w-10 animate-spin text-[#F0529C]" />
          <p className="mt-4 text-sm tracking-wide text-[#FAF2E9b3]">
            {status.state === "loading"
              ? (status.message ?? "Loading model…")
              : status.state === "error"
                ? "Error"
                : "Initializing…"}
          </p>
          <div className="mt-4 h-1.5 w-full rounded-full bg-[#FAF2E91a] overflow-hidden">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#105257_0%,#F0529C_60%,#B11BE8_100%)] transition-[width] ease-out"
              style={{
                width: `${status.state === "ready" ? 100 : status.state === "loading" && status.progress != null ? status.progress : 0}%`,
              }}
            />
          </div>
          {status.state === "error" && (
            <p className="mt-3 text-sm text-red-400">{status.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
