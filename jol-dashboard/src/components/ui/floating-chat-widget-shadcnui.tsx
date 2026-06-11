"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { streamChat } from "@/lib/aiChat";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "online" | "busy" | "offline";
  icon: React.ElementType;
  gradient: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const AI_AGENTS: Agent[] = [
  {
    id: "jol",
    name: "Jol AI",
    role: "Battery Recycling Intelligence",
    avatar: "",
    status: "online",
    icon: Sparkles,
    gradient: "from-blue-500/20 to-teal-500/20",
  },
];

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm Jol AI. Ask me about your supplier pipeline, buyer leads, collection network, or battery-metal market prices.",
};

const SUGGESTIONS = [
  "Which city has the highest scrap volume potential?",
  "How many leads are at 1-Ton+ tier?",
];

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transformOrigin: "bottom right",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

function TypingDots() {
  return (
    <div className="flex items-center justify-center gap-1 py-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" />
    </div>
  );
}

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  const currentAgent = AI_AGENTS[0];

  // Keep the latest message in view as it streams in.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || isStreaming) return;

      const history: ChatMessage[] = [
        ...messages,
        { role: "user", content: question },
      ];
      // Append the user turn + an empty assistant turn the stream will fill.
      setMessages([...history, { role: "assistant", content: "" }]);
      setMessage("");
      setIsStreaming(true);

      try {
        await streamChat(history, question, (delta) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              role: "assistant",
              content: last.content + delta,
            };
            return updated;
          });
        });
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content:
              "Sorry, I couldn't reach the AI right now. Please try again in a moment.",
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, messages],
  );

  const showSuggestions = messages.length === 1 && !isStreaming;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-[calc(100vw-2rem)] max-w-95 overflow-hidden rounded-2xl border border-border/40 bg-background shadow-2xl ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="relative border-b border-border/40 bg-muted/30 p-4 overflow-hidden">
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-50",
                  currentAgent.gradient,
                )}
              />
              <div className="relative flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      <AvatarFallback className="bg-[#1D1D1F] text-white text-xs font-bold">
                        JOL
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                        currentAgent.status === "online"
                          ? "bg-emerald-500"
                          : currentAgent.status === "busy"
                            ? "bg-amber-500"
                            : "bg-slate-400",
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {currentAgent.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {currentAgent.role}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-background/50"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex h-[320px] flex-col gap-4 overflow-y-auto p-4 bg-muted/10"
            >
              {messages.map((m, i) => {
                const isAssistant = m.role === "assistant";
                const isLast = i === messages.length - 1;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn(
                      "flex gap-3",
                      isAssistant ? "" : "flex-row-reverse self-end",
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0 border border-border/40 shadow-sm">
                      <AvatarFallback
                        className={cn(
                          "text-[10px] font-bold",
                          isAssistant
                            ? "bg-[#1D1D1F] text-white"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        {isAssistant ? "JOL" : "ME"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "flex max-w-[85%] flex-col gap-1",
                        isAssistant ? "" : "items-end",
                      )}
                    >
                      {isAssistant && (
                        <span className="text-xs font-medium text-muted-foreground">
                          {currentAgent.name}
                        </span>
                      )}
                      <div
                        className={cn(
                          "px-4 py-2.5 text-sm shadow-sm",
                          isAssistant
                            ? "rounded-2xl rounded-tl-none bg-muted/60 border border-border/20"
                            : "rounded-2xl rounded-tr-none bg-primary text-primary-foreground shadow-md",
                        )}
                      >
                        {isAssistant && isLast && isStreaming && !m.content ? (
                          <TypingDots />
                        ) : (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Suggestion chips (only on a fresh conversation) */}
              {showSuggestions && (
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border/40 bg-background p-3">
              <form
                className="relative flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(message);
                }}
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about suppliers, buyers, collection, or prices…"
                  className="flex-1 rounded-full border border-border/40 bg-muted/30 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
                  disabled={!message.trim() || isStreaming}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        className={cn(
          "cursor-pointer group relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300",
          isOpen
            ? "bg-destructive text-destructive-foreground rotate-90"
            : "bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F]",
        )}
      >
        <span className="absolute inset-0 -z-10 rounded-full bg-inherit opacity-20 blur-xl transition-opacity duration-300 group-hover:opacity-40" />
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  );
}
