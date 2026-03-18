import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Square, Plus } from "lucide-react";

import { useLLM } from "../hooks/useLLM";
import { MessageBubble } from "./MessageBubble";
import { StatusBar } from "./StatusBar";

const EXAMPLE_PROMPTS = [
  {
    label: "Solve x² + x - 12 = 0",
    prompt: "Solve x^2 + x - 12 = 0",
  },
  {
    label: "Explain quantum computing",
    prompt:
      "Explain quantum computing in simple terms. What makes it different from classical computing, and what are some real-world applications?",
  },
  {
    label: "Write a Python quicksort",
    prompt:
      "Write a clean, well-commented Python implementation of the quicksort algorithm. Include an example of how to use it.",
  },
  {
    label: "Solve a logic puzzle",
    prompt:
      "Five people were eating apples, A finished before B, but behind C. D finished before E, but behind B. What was the finishing order?",
  },
] as const;

interface ChatInputProps {
  showDisclaimer: boolean;
  animated?: boolean;
}

function ChatInput({ showDisclaimer, animated }: ChatInputProps) {
  const { send, stop, status, isGenerating } = useLLM();
  const isReady = status.state === "ready";
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || !isReady || isGenerating) return;
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "7.5rem";
      }
      send(text);
    },
    [input, isReady, isGenerating, send],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className={`w-full ${animated ? "animate-rise-in-delayed" : ""}`}>
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        <div className="relative">
          <textarea
            ref={textareaRef}
            className="w-full rounded-xl border border-[#0A32351a] bg-white px-4 py-3 pb-11 text-[15px] text-[#0A3235] placeholder-[#0A323580] focus:border-[#105257] focus:outline-none focus:ring-1 focus:ring-[#105257] disabled:opacity-50 resize-none max-h-40 shadow-sm"
            style={{ minHeight: "7.5rem", height: "7.5rem" }}
            placeholder={isReady ? "Type a message…" : "Loading model…"}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "7.5rem";
              e.target.style.height =
                Math.max(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            disabled={!isReady}
            autoFocus
          />

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-end pb-3 px-2">
            {isGenerating ? (
              <button
                type="button"
                onClick={stop}
                className="flex items-center justify-center rounded-lg text-[#0A323580] hover:text-[#0A3235] transition-colors cursor-pointer"
                title="Stop generating"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isReady || !input.trim()}
                className="flex items-center justify-center rounded-lg text-[#0A323580] hover:text-[#0A3235] disabled:opacity-30 transition-colors cursor-pointer"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </form>

      {showDisclaimer && (
        <p className="mx-auto max-w-3xl mt-1 text-center text-xs text-[#0A323580]">
          No chats are sent to a server. Everything runs locally in your
          browser. AI can make mistakes. Check important info.
        </p>
      )}
    </div>
  );
}

interface ChatAppProps {
  onGoHome: () => void;
}

export function ChatApp({ onGoHome }: ChatAppProps) {
  const { messages, isGenerating, send, status, clearChat } = useLLM();
  const scrollRef = useRef<HTMLElement>(null);

  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const thinkingStartRef = useRef<number | null>(null);
  const thinkingSecondsMapRef = useRef<Map<number, number>>(new Map());
  const prevIsGeneratingRef = useRef(false);
  const messagesRef = useRef(messages);
  const thinkingSecondsRef = useRef(thinkingSeconds);
  messagesRef.current = messages;
  thinkingSecondsRef.current = thinkingSeconds;

  const isReady = status.state === "ready";
  const hasMessages = messages.length > 0;
  const showNewChat = isReady && hasMessages && !isGenerating;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (prevIsGeneratingRef.current && !isGenerating) {
      const lastMsg = messagesRef.current.at(-1);
      if (
        lastMsg?.role === "assistant" &&
        lastMsg.reasoning &&
        thinkingSecondsRef.current > 0
      ) {
        thinkingSecondsMapRef.current.set(
          lastMsg.id,
          thinkingSecondsRef.current,
        );
      }
    }
    prevIsGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating) {
      thinkingStartRef.current = null;
      return;
    }

    thinkingStartRef.current = Date.now();
    setThinkingSeconds(0);

    const interval = setInterval(() => {
      if (thinkingStartRef.current) {
        setThinkingSeconds(
          Math.round((Date.now() - thinkingStartRef.current) / 1000),
        );
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const lastAssistant = messages.at(-1);
  useEffect(() => {
    if (
      isGenerating &&
      lastAssistant?.role === "assistant" &&
      lastAssistant.content
    ) {
      thinkingStartRef.current = null;
    }
  }, [isGenerating, lastAssistant?.role, lastAssistant?.content]);

  return (
    <div className="flex h-full flex-col brand-surface text-[#0A3235]">
      <header className="flex-none flex items-center justify-between border-b border-[#0A32351a] px-6 py-3 h-14">
        <button
          onClick={onGoHome}
          className="cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
          title="Back to home"
        >
          <img
            src="/ai2.svg"
            alt="AI2"
            className="h-6 w-auto"
            draggable={false}
          />
        </button>
        <button
          onClick={clearChat}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[#0A323580] hover:text-[#0A3235] hover:bg-[#0A32350d] transition-opacity duration-300 cursor-pointer ${
            showNewChat ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          title="New chat"
        >
          <Plus className="h-3.5 w-3.5" />
          New chat
        </button>
      </header>

      {!hasMessages ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="mb-8 text-center animate-rise-in">
            <p className="text-3xl font-medium text-[#0A3235]">
              What can I help you with?
            </p>
          </div>

          <ChatInput showDisclaimer={false} animated />

          <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-3xl animate-rise-in-delayed">
            {EXAMPLE_PROMPTS.map(({ label, prompt }) => (
              <button
                key={label}
                onClick={() => send(prompt)}
                className="rounded-lg border border-[#0A32351a] bg-white px-3 py-2 text-xs text-[#0A323580] hover:text-[#0A3235] hover:border-[#105257] transition-colors cursor-pointer shadow-sm"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <main
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-6 animate-fade-in"
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {!isReady && <StatusBar />}

              {messages.map((msg, i) => {
                const isLast =
                  i === messages.length - 1 && msg.role === "assistant";
                return (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    index={i}
                    isStreaming={isGenerating && isLast}
                    thinkingSeconds={
                      isLast
                        ? thinkingSeconds
                        : thinkingSecondsMapRef.current.get(msg.id)
                    }
                    isGenerating={isGenerating}
                  />
                );
              })}
            </div>
          </main>

          <footer className="flex-none px-4 py-3 animate-fade-in relative">
            {isReady && (
              <div className="absolute bottom-full left-0 right-0 flex justify-center pointer-events-none mb-[-8px]">
                <div className="pointer-events-auto">
                  <StatusBar />
                </div>
              </div>
            )}
            <ChatInput showDisclaimer animated />
          </footer>
        </>
      )}
    </div>
  );
}
