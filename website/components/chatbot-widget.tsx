"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ChatBubbleBottomCenterTextIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const QUICK_PROMPTS = [
  "How does Kriana personalize tutoring?",
  "Can you help with AP Calculus?",
  "Do you offer microschool support?",
];

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content:
        "Hi there! I'm Kriana's AI tutor. Ask me about programs, subjects, or how we support your learner.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const idCounter = useRef(1);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const hasUserMessage = useMemo(
    () => messages.some((message) => message.role === "user"),
    [messages]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: Message = {
      id: idCounter.current++,
      role: "user",
      content: trimmed,
    };

    const optimisticMessages = [...messages, userMessage];
    setMessages(optimisticMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history: optimisticMessages.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Unexpected status: ${response.status}`);
      }

      const data: { reply?: string } = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: idCounter.current++,
          role: "assistant",
          content:
            data.reply ??
            "I'm still learning. Could you try asking that a different way?",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: idCounter.current++,
          role: "assistant",
          content:
            "I'm having trouble reaching our tutoring service right now. Please try again in a moment or contact us at hello@kriana.com.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
      {isOpen && (
        <div className="flex h-[28rem] w-80 flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/10">
          <div className="flex items-start justify-between bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 text-white">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Kriana AI Tutor</p>
              <p className="text-xs text-indigo-100">
                Available 24/7 for quick questions and planning help.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition hover:bg-white/20"
              aria-label="Close chat"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 min-h-0 flex-col bg-slate-50">
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto p-4 pr-3 text-sm min-h-0"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-3 py-2 leading-relaxed shadow-sm ${
                      message.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-800"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white px-3 py-2 text-slate-500 shadow-sm">
                    Typing…
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-slate-200 bg-white p-4">
              {!hasUserMessage && (
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handlePromptClick(prompt)}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <label htmlFor="chatbot-message" className="sr-only">
                  Send a message
                </label>
                <input
                  id="chatbot-message"
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Ask a question about Kriana"
                  className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 p-2 text-white shadow transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  disabled={isLoading}
                  aria-label="Send message"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-600 hover:via-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
        aria-expanded={isOpen}
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
          <SparklesIcon className="absolute -right-1 -top-1 h-4 w-4 text-yellow-200" />
        </span>
        <span>{isOpen ? "Hide AI Tutor" : "Ask Kriana AI"}</span>
      </button>
    </div>
  );
}
