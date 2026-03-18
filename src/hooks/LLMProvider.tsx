import { useRef, useState, useCallback, type ReactNode } from "react";
import {
  pipeline,
  TextStreamer,
  InterruptableStoppingCriteria,
  type TextGenerationPipeline,
} from "@huggingface/transformers";
import { ThinkStreamParser, type ThinkDelta } from "../utils/think-parser";
import {
  LLMContext,
  createMessageId,
  AVAILABLE_MODELS,
  type ChatMessage,
  type LoadingStatus,
  type ReasoningEffort,
  type ModelConfig,
} from "./LLMContext";

const DTYPE = "q4f16";

function applyDeltas(msg: ChatMessage, deltas: ThinkDelta[]): ChatMessage {
  let { content, reasoning = "" } = msg;
  for (const delta of deltas) {
    if (delta.type === "reasoning") reasoning += delta.textDelta;
    else content += delta.textDelta;
  }
  return { ...msg, content, reasoning };
}

export function LLMProvider({ children }: { children: ReactNode }) {
  const generatorRef = useRef<Promise<TextGenerationPipeline> | null>(null);
  const loadedModelIdRef = useRef<string | null>(null);
  const stoppingCriteria = useRef(new InterruptableStoppingCriteria());

  const [status, setStatus] = useState<LoadingStatus>({ state: "idle" });
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(
    AVAILABLE_MODELS[0],
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [tps, setTps] = useState(0);
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEffort>("medium");

  messagesRef.current = messages;
  isGeneratingRef.current = isGenerating;
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  const loadModel = useCallback(async () => {
    const model = selectedModelRef.current;

    // If a different model is already loaded, dispose it first
    if (generatorRef.current && loadedModelIdRef.current !== model.id) {
      setStatus({ state: "idle" });
      setLoadedModelId(null);
      loadedModelIdRef.current = null;
      try {
        const gen = await generatorRef.current;
        await gen.dispose();
      } catch {
        // ignore dispose errors
      }
      generatorRef.current = null;
    }

    if (generatorRef.current) return;

    generatorRef.current = (async () => {
      setStatus({ state: "loading", message: "Downloading model…" });
      try {
        const gen = await pipeline("text-generation", model.id, {
          dtype: DTYPE,
          device: "webgpu",
          progress_callback: (p: any) => {
            if (p.status !== "progress_total") return;
            setStatus({
              state: "loading",
              progress: p.progress,
              message: `Downloading model… ${Math.round(p.progress)}%`,
            });
          },
        });
        loadedModelIdRef.current = model.id;
        setLoadedModelId(model.id);
        setStatus({ state: "ready" });
        return gen;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setStatus({ state: "error", error: msg });
        generatorRef.current = null;
        throw err;
      }
    })();
  }, []);

  const runGeneration = useCallback(async (chatHistory: ChatMessage[]) => {
    const generator = await generatorRef.current!;
    setIsGenerating(true);
    setTps(0);
    stoppingCriteria.current.reset();

    const parser = new ThinkStreamParser(selectedModelRef.current.thinking);
    let tokenCount = 0;
    let firstTokenTime = 0;

    const assistantIdx = chatHistory.length;
    setMessages((prev) => [
      ...prev,
      { id: createMessageId(), role: "assistant", content: "", reasoning: "" },
    ]);

    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: false,
      callback_function: (output: string) => {
        if (output === "<|endoftext|>") return;
        const deltas = parser.push(output);
        if (deltas.length === 0) return;
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIdx] = applyDeltas(updated[assistantIdx], deltas);
          return updated;
        });
      },
      token_callback_function: () => {
        tokenCount++;
        if (tokenCount === 1) {
          firstTokenTime = performance.now();
        } else {
          const elapsed = (performance.now() - firstTokenTime) / 1000;
          if (elapsed > 0) {
            setTps(Math.round(((tokenCount - 1) / elapsed) * 10) / 10);
          }
        }
      },
    });

    const apiMessages = chatHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      await generator(apiMessages, {
        streamer,
        stopping_criteria: stoppingCriteria.current,
        max_new_tokens: 32768,
        do_sample: true,
        temperature: 0.6,
      });
    } catch (err) {
      console.error("Generation error:", err);
    }

    const remaining = parser.flush();
    if (remaining.length > 0) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIdx] = applyDeltas(updated[assistantIdx], remaining);
        return updated;
      });
    }

    setMessages((prev) => {
      const updated = [...prev];
      updated[assistantIdx] = {
        ...updated[assistantIdx],
        content: parser.content.trim() || prev[assistantIdx].content,
        reasoning: parser.reasoning.trim() || prev[assistantIdx].reasoning,
      };
      return updated;
    });

    setIsGenerating(false);
  }, []);

  const send = useCallback(
    (text: string) => {
      if (!generatorRef.current || isGeneratingRef.current) return;

      const userMsg: ChatMessage = {
        id: createMessageId(),
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMsg]);
      runGeneration([...messagesRef.current, userMsg]);
    },
    [runGeneration],
  );

  const stop = useCallback(() => {
    stoppingCriteria.current.interrupt();
  }, []);

  const clearChat = useCallback(() => {
    if (isGeneratingRef.current) return;
    setMessages([]);
  }, []);

  const editMessage = useCallback(
    (index: number, newContent: string) => {
      if (isGeneratingRef.current) return;

      setMessages((prev) => {
        const updated = prev.slice(0, index);
        updated.push({ ...prev[index], content: newContent });
        return updated;
      });

      const updatedHistory = messagesRef.current.slice(0, index);
      updatedHistory.push({
        ...messagesRef.current[index],
        content: newContent,
      });

      if (messagesRef.current[index]?.role === "user") {
        setTimeout(() => runGeneration(updatedHistory), 0);
      }
    },
    [runGeneration],
  );

  const retryMessage = useCallback(
    (index: number) => {
      if (isGeneratingRef.current) return;

      const history = messagesRef.current.slice(0, index);
      setMessages(history);
      setTimeout(() => runGeneration(history), 0);
    },
    [runGeneration],
  );

  return (
    <LLMContext.Provider
      value={{
        status,
        messages,
        isGenerating,
        tps,
        reasoningEffort,
        setReasoningEffort,
        selectedModel,
        setSelectedModel,
        loadedModelId,
        loadModel,
        send,
        stop,
        clearChat,
        editMessage,
        retryMessage,
      }}
    >
      {children}
    </LLMContext.Provider>
  );
}
