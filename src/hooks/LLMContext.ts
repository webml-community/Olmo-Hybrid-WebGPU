import { createContext } from "react";

let nextMessageId = 0;

export function createMessageId(): number {
  return nextMessageId++;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string;
}

export type LoadingStatus =
  | { state: "idle" }
  | { state: "loading"; progress?: number; message?: string }
  | { state: "ready" }
  | { state: "error"; error: string };

export type ReasoningEffort = "low" | "medium" | "high";

export interface ModelConfig {
  id: string;
  label: string;
  thinking: boolean;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "onnx-community/Olmo-Hybrid-Instruct-SFT-7B-ONNX",
    label: "Instruct SFT",
    thinking: false,
  },
  {
    id: "onnx-community/Olmo-Hybrid-Instruct-DPO-7B-ONNX",
    label: "Instruct DPO",
    thinking: false,
  },
  {
    id: "onnx-community/Olmo-Hybrid-Think-SFT-7B-ONNX",
    label: "Think SFT",
    thinking: true,
  },
];

export interface LLMContextValue {
  status: LoadingStatus;
  messages: ChatMessage[];
  isGenerating: boolean;
  tps: number;
  reasoningEffort: ReasoningEffort;
  setReasoningEffort: (effort: ReasoningEffort) => void;
  selectedModel: ModelConfig;
  setSelectedModel: (model: ModelConfig) => void;
  loadedModelId: string | null;
  loadModel: () => void;
  send: (text: string) => void;
  stop: () => void;
  clearChat: () => void;
  editMessage: (index: number, newContent: string) => void;
  retryMessage: (index: number) => void;
}

export const LLMContext = createContext<LLMContextValue | null>(null);
