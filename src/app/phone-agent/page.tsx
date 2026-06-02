"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Bot,
  User,
  Send,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  Mic,
  AlertCircle,
} from "lucide-react";
import { getMenu, addOrder, newId, type MenuItem } from "@/lib/store";

// ── Types ──────────────────────────────────────────────────────────────────────

type ChatMessage = { role: "user" | "assistant"; content: string };

type OrderLineItem = {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

type LiveOrder = {
  items: OrderLineItem[];
  total: number;
  status: "in_progress" | "confirmed";
};

type AgentApiResponse = {
  reply: string;
  order: LiveOrder;
  error?: string;
};

type CallState = "idle" | "on_call" | "completed";

// Minimal typing for the non-standard Web Speech API (not in the TS DOM lib).
type SpeechResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
interface SpeechRecognizer {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognizerCtor = new () => SpeechRecognizer;

// ── Constants ─────────────────────────────────────────────────────────────────

const OPENING_GREETING =
  "Thanks for calling! What can I get started for you today?";

const SUGGESTED_LINES = [
  "I'd like two margherita pizzas",
  "What do you recommend?",
  "Can I get one of those with a side salad?",
  "That's all, thanks — please confirm my order",
  "Actually, make that three",
];

const EMPTY_ORDER: LiveOrder = { items: [], total: 0, status: "in_progress" };

// ── Component ─────────────────────────────────────────────────────────────────

export default function PhoneAgentPage() {
  const router = useRouter();

  // Load menu SSR-safely on mount
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoaded, setMenuLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate menu from localStorage on mount
    setMenu(getMenu());
    setMenuLoaded(true);
  }, []);

  // Call state machine
  const [callState, setCallState] = useState<CallState>("idle");
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [liveOrder, setLiveOrder] = useState<LiveOrder>(EMPTY_ORDER);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Speech recognition
  const [micAvailable, setMicAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognizer | null>(null);

  // Scroll anchor
  const bottomRef = useRef<HTMLDivElement>(null);

  // Detect mic availability on mount (client-only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognizerCtor;
      webkitSpeechRecognition?: SpeechRecognizerCtor;
    };
    const SpeechRecognitionCtor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mic feature-detect on mount
      setMicAvailable(true);
      const rec = new SpeechRecognitionCtor();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      rec.onresult = (event) => {
        const spoken = event.results[0]?.[0]?.transcript ?? "";
        if (spoken.trim()) setInput((prev) => (prev ? `${prev} ${spoken}` : spoken));
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, isLoading]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const startCall = useCallback(() => {
    const greeting: ChatMessage = { role: "assistant", content: OPENING_GREETING };
    setTranscript([greeting]);
    setLiveOrder(EMPTY_ORDER);
    setApiError("");
    setInput("");
    setCallState("on_call");
  }, []);

  const hangUp = useCallback(() => {
    setCallState("idle");
    setTranscript([]);
    setLiveOrder(EMPTY_ORDER);
    setApiError("");
    setInput("");
    setIsLoading(false);
  }, []);

  const resetCall = useCallback(() => {
    setCallState("idle");
    setTranscript([]);
    setLiveOrder(EMPTY_ORDER);
    setApiError("");
    setInput("");
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const updatedTranscript = [...transcript, userMsg];

      setTranscript(updatedTranscript);
      setInput("");
      setIsLoading(true);
      setApiError("");

      try {
        const res = await fetch("/api/order-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updatedTranscript, menu }),
        });

        const data = (await res.json()) as AgentApiResponse;

        if (!res.ok || data.error) {
          throw new Error(data.error ?? `Request failed (${res.status})`);
        }

        const agentMsg: ChatMessage = { role: "assistant", content: data.reply };
        setTranscript((prev) => [...prev, agentMsg]);
        setLiveOrder(data.order);

        // If order confirmed — save and move to completed state
        if (data.order.status === "confirmed") {
          addOrder({
            id: newId(),
            createdAt: new Date().toISOString(),
            source: "phone",
            items: data.order.items.map((i) => ({
              name: i.name,
              qty: i.qty,
              unitPrice: i.unitPrice,
            })),
            total: data.order.total,
          });
          setCallState("completed");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setApiError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [transcript, isLoading, menu]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  const toggleMic = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  }, [isListening]);

  // ── Render helpers ────────────────────────────────────────────────────────

  if (!menuLoaded) {
    // Server/hydration placeholder — avoids flash
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (menu.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-white font-semibold text-sm sm:text-base">AI Phone Agent</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md space-y-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-800 mx-auto">
              <ShoppingBag className="w-10 h-10 text-slate-400" />
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold mb-2">No menu set up yet</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                The AI Phone Agent needs your menu to take orders. Head to Menu Setup to add your
                dishes, prices, and costs — then come back here to start taking calls.
              </p>
            </div>
            <Button
              className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white hover:opacity-90 border-0"
              onClick={() => router.push("/menu-setup")}
            >
              Set up your menu
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ── IDLE state ────────────────────────────────────────────────────────────

  if (callState === "idle") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-white font-semibold text-sm sm:text-base">AI Phone Agent</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-8">
            {/* Animated ring */}
            <div className="relative flex items-center justify-center mx-auto w-36 h-36">
              <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" />
              <div className="absolute inset-3 rounded-full bg-teal-500/10" />
              <button
                onClick={startCall}
                className="relative z-10 flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 shadow-xl shadow-teal-500/40 hover:opacity-90 transition-opacity active:scale-95"
                aria-label="Start call"
              >
                <PhoneCall className="w-10 h-10 text-white" />
              </button>
            </div>
            <div>
              <p className="text-white text-lg font-semibold">Incoming call…</p>
              <p className="text-slate-400 text-sm mt-1">
                Tap to answer and take an order from your menu
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── COMPLETED state ───────────────────────────────────────────────────────

  if (callState === "completed") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-white font-semibold text-sm sm:text-base">AI Phone Agent</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-md">
            <CardHeader className="text-center pb-2">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <CardTitle className="text-white text-xl">Order Confirmed!</CardTitle>
              <p className="text-slate-400 text-sm mt-1">
                This order has been saved to your records.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order breakdown */}
              <div className="bg-slate-950/60 rounded-xl p-4 space-y-2">
                {liveOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">
                      {item.qty} × {item.name}
                    </span>
                    <span className="text-slate-400">${item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-700 pt-2 flex justify-between font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-teal-400">${liveOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  className="flex-1 bg-gradient-to-br from-teal-500 to-cyan-500 text-white hover:opacity-90 border-0"
                  onClick={resetCall}
                >
                  <PhoneCall className="w-4 h-4 mr-2" />
                  New call
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                  onClick={() => router.push("/insights")}
                >
                  View menu insights
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ── ON_CALL state ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
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
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-semibold text-sm sm:text-base truncate">
                AI Phone Agent
              </h1>
              <p className="text-teal-400 text-xs flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                On call
              </p>
            </div>
          </div>
        </div>

        {/* Hang up */}
        <Button
          size="sm"
          className="bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 shrink-0"
          onClick={hangUp}
        >
          <PhoneOff className="w-4 h-4 mr-1" />
          Hang up
        </Button>
      </header>

      {/* Two-column layout on md+ */}
      <div className="flex-1 flex flex-col md:flex-row max-w-6xl w-full mx-auto gap-0 md:gap-4 md:p-4">

        {/* ── Chat column ── */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Error banner */}
          {apiError && (
            <Alert className="mx-4 mt-4 bg-rose-500/10 border-rose-500/30 text-rose-300">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {transcript.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} className="flex justify-end gap-2">
                  <div className="max-w-[80%] sm:max-w-[70%]">
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-md whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    <p className="text-slate-600 text-xs mt-1 text-right">Caller</p>
                  </div>
                  <div className="flex items-end shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start gap-2">
                  <div className="flex items-end shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="max-w-[80%] sm:max-w-[75%]">
                    <div className="bg-slate-800 border border-slate-700/50 text-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed shadow-md whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    <p className="text-slate-600 text-xs mt-1">Agent</p>
                  </div>
                </div>
              )
            )}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start gap-2">
                <div className="flex items-end shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Typing…</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          <div className="px-4 pt-1 pb-2 flex gap-2 flex-wrap">
            {SUGGESTED_LINES.map((line) => (
              <button
                key={line}
                onClick={() => sendMessage(line)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700 hover:border-teal-500/60 hover:text-teal-300 hover:bg-slate-800/80 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                {line}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div className="sticky bottom-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 px-4 py-3">
            <div className="flex gap-2 items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type what the caller says…"
                disabled={isLoading}
                className="flex-1 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500/50 focus-visible:border-teal-500/50 rounded-xl h-11"
              />
              {micAvailable && (
                <Button
                  type="button"
                  size="sm"
                  onClick={toggleMic}
                  disabled={isLoading}
                  className={`h-11 w-11 p-0 rounded-xl border shrink-0 ${
                    isListening
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                  aria-label={isListening ? "Stop listening" : "Start voice input"}
                >
                  <Mic className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white hover:opacity-90 border-0 h-11 w-11 p-0 rounded-xl shadow-md shadow-teal-500/20 disabled:opacity-40 shrink-0"
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
              Enter to send · type what the caller would say
            </p>
          </div>
        </div>

        {/* ── Order Summary sidebar ── */}
        <div className="md:w-72 shrink-0 px-4 pb-4 md:px-0 md:pb-0">
          <div className="md:sticky md:top-20">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="flex items-center gap-2 text-sm text-slate-300">
                  <ShoppingBag className="w-4 h-4 text-teal-400" />
                  Order Summary
                  {liveOrder.status === "confirmed" && (
                    <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">
                      Confirmed
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {liveOrder.items.length === 0 ? (
                  <p className="text-slate-600 text-sm italic">Nothing ordered yet…</p>
                ) : (
                  <div className="space-y-2">
                    {liveOrder.items.map((item, i) => (
                      <div key={i} className="text-sm">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-slate-300 leading-snug">{item.name}</span>
                          <span className="text-slate-400 shrink-0">
                            ${item.lineTotal.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs">
                          {item.qty} × ${item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                    ))}
                    <div className="border-t border-slate-700 pt-2 flex justify-between font-semibold mt-1">
                      <span className="text-white text-sm">Total</span>
                      <span className="text-teal-400 text-sm">${liveOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
