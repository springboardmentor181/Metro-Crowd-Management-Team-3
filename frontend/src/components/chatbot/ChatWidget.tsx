"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Loader2, Bot } from "lucide-react";

import { cn } from "@/lib/cn";
import { sendChatMessage, type ChatMessage } from "@/lib/api/chatbot";
import ChatMarkdown from "./ChatMarkdown";

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm the MetroFlow assistant. Ask me about station status, crowd levels, delays, next trains, or how to use the app.",
};

/** Floating "ask anything" chat launcher, mounted once near the root
 * of the authenticated app so it's available on every dashboard page.
 * Conversation lives in local state only (no server-side history) -
 * closing/refreshing the tab starts a fresh thread. */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const reply = await sendChatMessage(nextMessages);
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[200] flex flex-col items-end gap-3 sm:inset-x-auto sm:bottom-5 sm:right-5">
      {open && (
        <div className="flex h-[min(520px,calc(100vh-6.5rem))] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:h-[520px] sm:w-[360px] sm:max-w-[calc(100vw-2.5rem)]">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-primary px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-none">MetroFlow Assistant</p>
                <p className="mt-1 text-[11px] leading-none text-white/75">Ask anything</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "rounded-br-sm bg-primary text-white"
                      : "rounded-bl-sm bg-muted/15 text-foreground",
                  )}
                >
                  {message.role === "assistant" ? (
                    <ChatMarkdown content={message.content} />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted/15 px-3.5 py-2.5 text-sm text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="border-t border-border px-4 py-2 text-xs text-red-500">{error}</p>
          )}

          <div className="flex items-end gap-2 border-t border-border p-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              rows={1}
              className="max-h-28 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white transition disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        className="grid h-14 w-14 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/25 transition hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}