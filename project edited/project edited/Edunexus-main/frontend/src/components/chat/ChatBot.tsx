import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/AuthProvider";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const ChatBot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hello${user?.name ? ` ${user.name}` : ""}! 👋 I'm the Edunexus Assistant. I can help you with:\n\n• Navigating the platform\n• Understanding features\n• Academic questions\n\nHow can I help you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/chat", {
        message: trimmed,
        history: messages.slice(-6),
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process your request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Don't render if user not logged in
  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-[#3ecf8e] to-[#2ba06e] text-white shadow-lg shadow-[#3ecf8e]/30 flex items-center justify-center hover:scale-110 transition-all duration-300 group"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          {/* Ping animation */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ecf8e] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#3ecf8e] border-2 border-white"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-3rem)] rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-border flex flex-col bg-background animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#3ecf8e] to-[#2ba06e] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">
                  Edunexus Assistant
                </h3>
                <p className="text-white/70 text-xs">AI-Powered Help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-[#3ecf8e]/15 text-[#3ecf8e]"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-full bg-[#3ecf8e]/15 text-[#3ecf8e] flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]"></span>
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-background shrink-0">
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-1.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1.5"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="h-8 w-8 rounded-lg bg-[#3ecf8e] text-white flex items-center justify-center hover:bg-[#34b27b] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Powered by Edunexus AI
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
