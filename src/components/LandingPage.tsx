import { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Zap,
  BookOpen,
  Brain,
  Check,
} from "lucide-react";
import { AVAILABLE_MODELS, type ModelConfig } from "../hooks/LLMContext";
import HfIcon from "./HfIcon";

interface LandingPageProps {
  onStart: () => void;
  isLoading: boolean;
  showChat: boolean;
  selectedModel: ModelConfig;
  onSelectModel: (model: ModelConfig) => void;
  loadedModelId: string | null;
}

const features = [
  { Icon: Zap, label: "Hybrid Transformer + DeltaNet" },
  { Icon: BookOpen, label: "Fully open 7B parameter model" },
  { Icon: Brain, label: "Reasoning and Instruct variants" },
] as const;

export function LandingPage({
  onStart,
  selectedModel,
  onSelectModel,
  loadedModelId,
}: LandingPageProps) {
  const [introFade, setIntroFade] = useState(true);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modelMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [modelMenuOpen]);

  useEffect(() => {
    const t = setTimeout(() => setIntroFade(false), 50);
    return () => clearTimeout(t);
  }, []);

  const selectedIsLoaded = loadedModelId === selectedModel.id;

  return (
    <div className="relative flex h-full min-h-full flex-col overflow-hidden bg-[#0A3235] text-[#FAF2E9]">
      <div
        className="absolute pointer-events-none z-[1]"
        style={{
          left: "0",
          top: "70%",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #0FCB8C22 0%, #10525718 40%, transparent 70%)",
          animation: "orb-drift-left 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none z-[1]"
        style={{
          right: "0",
          top: "75%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #0FCB8C22 0%, #10525718 40%, transparent 70%)",
          animation: "orb-drift-right 22s ease-in-out infinite",
        }}
      />

      {/* Background image */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/purple.avif"
          alt=""
          className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-[80%] max-w-8xl h-auto select-none"
          draggable={false}
        />
      </div>

      {/* Initial fade */}
      <div
        className={`absolute inset-0 z-50 bg-[#0A3235] transition-opacity duration-1000 pointer-events-none ${
          introFade ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-5xl flex-col items-center justify-center px-6 sm:px-8 lg:px-14">
        {/* Header */}
        <header className="absolute top-6 left-6 right-6 sm:top-8 sm:left-8 sm:right-8 lg:left-14 lg:right-14 animate-rise-in flex items-start justify-between">
          <img
            src="/ai2.svg"
            alt="AI2"
            className="h-10 w-auto sm:h-12"
            draggable={false}
          />
        </header>

        {/* Hero */}
        <div className="flex flex-col items-center text-center space-y-8 mb-16">
          <div className="animate-rise-in space-y-4 mb-2">
            <p className="font-support text-xs uppercase tracking-[0.2em] text-[#0FCB8Cb3]">
              Fully open hybrid language model by AI2
            </p>
            <h1 className="text-5xl font-bold leading-[1.0] tracking-tight text-[#FAF2E9] sm:text-7xl lg:text-8xl">
              Olmo <span className="text-[#0FCB8C]">WebGPU</span>
            </h1>
          </div>

          <p className="animate-rise-in-delayed max-w-2xl text-base leading-relaxed text-[#FAF2E9b3] sm:text-lg">
            Run
            <a
              href="https://huggingface.co/onnx-community/Olmo-Hybrid-Think-SFT-7B-ONNX"
              target="_blank"
              rel="noreferrer"
              className="mx-1 underline decoration-[#FAF2E94d] underline-offset-4 hover:text-[#0FCB8C] transition-colors"
            >
              Olmo Hybrid
            </a>
            directly in your browser, powered by
            <HfIcon className="size-7 inline-block ml-1 mb-[1px]" />
            <a
              href="https://github.com/huggingface/transformers.js"
              target="_blank"
              rel="noreferrer"
              className="ml-1 underline decoration-[#FAF2E94d] underline-offset-4 hover:text-[#0FCB8C] transition-colors"
            >
              Transformers.js
            </a>
          </p>

          {/* Feature pills */}
          <div
            className="animate-rise-in-delayed flex flex-wrap justify-center gap-3"
            style={{ animationDelay: "200ms" }}
          >
            {features.map(({ Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-[#FAF2E91a] bg-[#FAF2E90a] px-4 py-2 text-sm text-[#FAF2E9cc]"
              >
                <Icon className="h-3.5 w-3.5 text-[#0FCB8C]" />
                {label}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div
            ref={menuRef}
            className="animate-rise-in flex flex-col items-center mt-2 relative"
            style={{ animationDelay: "300ms" }}
          >
            <div className="inline-flex rounded-xl overflow-hidden">
              <button
                onClick={onStart}
                className="inline-flex items-center justify-center gap-2 bg-[#FAF2E9] px-8 py-3.5 text-base font-semibold text-[#0A3235] transition-colors duration-200 hover:bg-[#0FCB8C] cursor-pointer"
              >
                {selectedIsLoaded
                  ? "Start chatting"
                  : `Load ${selectedModel.label}`}
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setModelMenuOpen((v) => !v)}
                className="inline-flex items-center justify-center bg-[#FAF2E9] px-3 py-3.5 text-[#0A3235] border-l border-[#0A323520] transition-colors duration-200 hover:bg-[#0FCB8C] cursor-pointer"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Model dropdown */}
            {modelMenuOpen && (
              <div className="absolute top-full mt-2 w-64 rounded-xl border border-[#FAF2E91a] bg-[#0A3235] shadow-xl z-50 overflow-hidden">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model);
                      setModelMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#FAF2E9cc] transition-colors hover:bg-[#1052571a] cursor-pointer"
                  >
                    <span className="w-4 flex-shrink-0">
                      {model.id === selectedModel.id && (
                        <Check className="h-4 w-4 text-[#0FCB8C]" />
                      )}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium text-[#FAF2E9]">
                        {model.label}
                      </span>
                      <span className="text-xs text-[#FAF2E980]">
                        {model.thinking ? "With reasoning" : "No reasoning"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!selectedIsLoaded && (
              <p className="mt-3 text-xs text-[#FAF2E980]">
                ~4.3 GB download, cached locally for future sessions.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
