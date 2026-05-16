import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  MessageSquare,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/AuthProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}

const AIChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const messages = activeConv?.messages || [];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const createNewChat = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(conversations.length > 1 ? conversations.find((c) => c.id !== id)?.id || null : null);
    }
  };

  const copyMessage = (content: string, msgIndex: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(`${msgIndex}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Create conversation if none active
    let convId = activeConvId;
    if (!convId) {
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: trimmed.slice(0, 40) + (trimmed.length > 40 ? "..." : ""),
        messages: [],
        createdAt: new Date(),
      };
      setConversations((prev) => [newConv, ...prev]);
      convId = newConv.id;
      setActiveConvId(convId);
    }

    const userMsg: ChatMessage = {
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    // Update title if first message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          const isFirst = c.messages.length === 0;
          return {
            ...c,
            title: isFirst
              ? trimmed.slice(0, 40) + (trimmed.length > 40 ? "..." : "")
              : c.title,
            messages: [...c.messages, userMsg],
          };
        }
        return c;
      })
    );

    setInput("");
    setLoading(true);

    try {
      const currentMessages = conversations.find((c) => c.id === convId)?.messages || [];
      const { data } = await api.post("/chat", {
        message: trimmed,
        history: [...currentMessages, userMsg].slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, messages: [...c.messages, assistantMsg] }
            : c
        )
      );
    } catch {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, messages: [...c.messages, errorMsg] }
            : c
        )
      );
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

  const suggestedPrompts = [
    { icon: "📅", text: "How do I generate a timetable?" },
    { icon: "📝", text: "How to create an AI quiz?" },
    { icon: "📋", text: "How do students submit assignments?" },
    { icon: "🎓", text: "Explain photosynthesis simply" },
  ];

  return (
    <div className="flex h-[calc(100vh-1rem)] max-h-screen">
      {/* Sidebar - Conversation History */}
      <div className="w-64 border-r border-border bg-muted/30 flex flex-col shrink-0 hidden md:flex">
        {/* New Chat Button */}
        <div className="p-3 border-b border-border">
          <Button
            onClick={createNewChat}
            className="w-full bg-gradient-to-r from-[#3ecf8e] to-[#2ba06e] hover:from-[#34b27b] hover:to-[#249060] text-white"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs p-4 mt-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No conversations yet</p>
              <p className="mt-1">Start a new chat!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm ${
                  activeConvId === conv.id
                    ? "bg-[#3ecf8e]/15 text-[#3ecf8e] border border-[#3ecf8e]/20"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveConvId(conv.id)}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border px-6 py-3 flex items-center gap-3 shrink-0 bg-background/80 backdrop-blur-sm">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#3ecf8e] to-[#2ba06e] flex items-center justify-center shadow-lg shadow-[#3ecf8e]/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm">Edunexus AI</h1>
            <p className="text-xs text-muted-foreground">
              Your intelligent learning assistant
            </p>
          </div>
          {/* Mobile new chat */}
          <Button
            onClick={createNewChat}
            variant="ghost"
            size="icon-sm"
            className="ml-auto md:hidden"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center p-6 max-w-2xl mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#3ecf8e] to-[#2ba06e] flex items-center justify-center mb-6 shadow-xl shadow-[#3ecf8e]/20">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Hello{user?.name ? `, ${user.name}` : ""}! 👋
              </h2>
              <p className="text-muted-foreground text-center mb-8 max-w-md">
                I'm Edunexus AI, your intelligent assistant. I can help you
                navigate the platform, answer academic questions, and more.
              </p>

              {/* Suggested Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(prompt.text);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted hover:border-[#3ecf8e]/30 transition-all text-left text-sm group"
                  >
                    <span className="text-lg">{prompt.icon}</span>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {prompt.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="max-w-3xl mx-auto p-4 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className="group">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-gradient-to-br from-[#3ecf8e] to-[#2ba06e] text-white shadow-sm"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {msg.role === "user"
                            ? user?.name || "You"
                            : "Edunexus AI"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                        {msg.content}
                      </div>

                      {/* Actions */}
                      {msg.role === "assistant" && (
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyMessage(msg.content, i)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-all"
                          >
                            {copiedId === `${i}` ? (
                              <>
                                <Check className="h-3 w-3 text-[#3ecf8e]" />
                                <span className="text-[#3ecf8e]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#3ecf8e] to-[#2ba06e] flex items-center justify-center shrink-0 text-white shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 pt-2">
                    <div className="flex gap-1.5 bg-muted rounded-xl px-4 py-3">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-background shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-muted rounded-2xl px-4 py-3 border border-border focus-within:border-[#3ecf8e]/50 focus-within:ring-1 focus-within:ring-[#3ecf8e]/20 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Edunexus AI..."
                disabled={loading}
                rows={1}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground resize-none max-h-[150px] py-1"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="h-9 w-9 rounded-xl bg-gradient-to-r from-[#3ecf8e] to-[#2ba06e] text-white flex items-center justify-center hover:shadow-lg hover:shadow-[#3ecf8e]/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Edunexus AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
