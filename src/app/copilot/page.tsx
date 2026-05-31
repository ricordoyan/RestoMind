"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Bot,
  Send,
  Trash2,
  Loader2,
  AlertCircle,
  MessageSquare,
  User,
} from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "copilot_chat";

const SUGGESTED_PROMPTS = [
  "How do I lower my food cost?",
  "Build me an opening checklist",
  "What labour % should I target?",
  "How much inventory should I hold?",
  "Ideas to boost weekday sales",
  "Draft a line-cook training plan",
];

export default function CopilotPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Restore from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of persisted chat on mount
          setMessages(parsed);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore storage errors
    }
  }, [messages]);

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const updated = [...messages, userMessage];

      setMessages(updated);
      setInput("");
      setIsLoading(true);
      setApiError("");

      try {
        const response = await fetch("/api/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updated }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Request failed (${response.status})`);
        }

        const data = await response.json();
        const reply = data.reply as string;

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Something went wrong. Please try again.";
        setApiError(message);
        // Keep the user message in history so they can retry
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send(input);
      }
    },
    [input, send]
  );

  const handleClear = useCallback(() => {
    setMessages([]);
    setApiError("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white shrink-0"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-semibold text-sm sm:text-base truncate">
                Operations Copilot
              </h1>
              <p className="text-slate-400 text-xs truncate hidden sm:block">
                Expert restaurant operations assistant
              </p>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-rose-400 shrink-0"
            onClick={handleClear}
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </header>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 pb-4">
        {/* Error banner */}
        {apiError && (
          <Alert className="mt-4 bg-rose-500/10 border-rose-500/30 text-rose-300">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-8">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-white text-xl font-semibold mb-2">
                  Ask me anything about running your restaurant
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Your expert operations manager is ready — food costs, staffing, inventory,
                  menu engineering, marketing and more.
                </p>
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="px-3 py-2 rounded-full text-sm bg-slate-800 text-slate-300 border border-slate-700 hover:border-teal-500/60 hover:text-teal-300 hover:bg-slate-800/80 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {!isEmpty && (
          <div className="flex-1 py-6 space-y-6">
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} className="flex justify-end gap-3">
                  <div className="max-w-[80%] sm:max-w-[70%]">
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-md">
                      {msg.content}
                    </div>
                  </div>
                  <div className="flex items-end shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start gap-3">
                  <div className="flex items-end shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="max-w-[80%] sm:max-w-[75%]">
                    <div className="bg-slate-800 border border-slate-700/50 text-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed shadow-md whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start gap-3">
                <div className="flex items-end shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking…</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* Spacer when empty so input still anchors to bottom */}
        {isEmpty && <div ref={bottomRef} />}
      </main>

      {/* Sticky input area */}
      <div className="sticky bottom-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about food cost, staffing, inventory, menu engineering…"
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 resize-none min-h-[44px] max-h-36 focus-visible:ring-teal-500/50 focus-visible:border-teal-500/50 rounded-xl py-3"
          />
          <Button
            onClick={() => send(input)}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white hover:opacity-90 border-0 shrink-0 h-11 w-11 p-0 rounded-xl shadow-md shadow-teal-500/20 disabled:opacity-40"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-slate-600 text-xs text-center mt-2">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
