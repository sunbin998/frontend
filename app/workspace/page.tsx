"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  BookMarked,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Library,
  MessageCircle,
  Send,
  User,
  BookOpen,
} from "lucide-react";

import { Sidebar } from "@/components/Sidebar";
import { DiaryPanel } from "@/components/DiaryPanel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/lib/store";
import type { Source } from "@/lib/types";
import { cn } from "@/lib/utils";

function SourcesPanel({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[#c96442] hover:text-[#d97757] transition-colors font-medium"
      >
        <BookOpen size={12} />
        参考来源 ({sources.length})
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="mt-2 space-y-2 border-l-2 border-[#e8e6dc] pl-3">
          {sources.map((src, i) => (
            <div
              key={i}
              className="bg-[#f5f4ed] border border-[#f0eee6] rounded-xl p-2.5"
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="font-medium text-[#3d3d3a] text-[11px] truncate">
                  {src.filename}
                </span>
                <span className="text-[#87867f] text-[10px] shrink-0">
                  相关度 {(src.score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[#5e5d59] text-[11px] leading-relaxed line-clamp-3">
                {src.preview}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const THINKING_SPOKES = Array.from({ length: 10 }, (_, index) => ({
  rotation: index * 36,
  animationDelay: `${index * 70}ms`,
}));

function ThinkingIndicator() {
  return (
    <div className="thinking-indicator" role="status" aria-label="正在思考">
      <svg
        className="thinking-indicator__mark"
        viewBox="-18 -18 36 36"
        aria-hidden="true"
      >
        {THINKING_SPOKES.map((spoke, index) => (
          <rect
            key={index}
            className="thinking-indicator__spoke"
            x="-1.8"
            y="-16"
            width="3.6"
            height="12"
            rx="1.8"
            fill="#d97757"
            opacity="0.72"
            transform={`rotate(${spoke.rotation})`}
            style={{ animationDelay: spoke.animationDelay }}
          />
        ))}
      </svg>
      <span className="sr-only">正在思考</span>
    </div>
  );
}

function AssistantThinkingMessage() {
  return (
    <div className="flex w-full gap-3 justify-start">
      <div className="w-8 h-8 bg-[#30302e] border border-[#30302e] rounded-full flex items-center justify-center shrink-0">
        <Bot size={16} className="text-[#faf9f5]" />
      </div>
      <div className="max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed bg-[#faf9f5] border border-[#f0eee6] text-[#4d4c48] rounded-tl-md">
        <ThinkingIndicator />
      </div>
    </div>
  );
}

type ViewMode = "chat" | "diary";

export default function Home() {
  const router = useRouter();
  const {
    currentSessionId,
    sessions,
    messages,
    sendMessageStream,
    documents,
    fetchDocuments,
    selectedBooks,
    setSelectedBooks,
    isAuthenticated,
    isAuthChecking,
    initAuth,
    user,
    isAssistantThinking,
  } = useAppStore();

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const [inputContent, setInputContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const [showBookFilter, setShowBookFilter] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isAuthChecking && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthChecking, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [fetchDocuments, isAuthenticated]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAssistantThinking]);

  const handleSend = () => {
    if (!inputContent.trim()) return;
    sendMessageStream(inputContent);
    setInputContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isAuthChecking) {
    return (
      <main className="h-screen w-full flex items-center justify-center bg-[#f5f4ed]">
        <div className="text-sm text-[#5e5d59]">正在验证登录状态...</div>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main className="flex h-screen w-full overflow-hidden bg-[#f5f4ed] text-[#141413]">
      <aside className="hidden md:flex h-full">
        <Sidebar />
      </aside>

      <section className="flex-1 flex flex-col h-full relative border-l border-[#f0eee6]">
        <div className="flex items-center border-b border-[#e8e6dc] bg-[#f5f4ed]/95 backdrop-blur px-4 shrink-0">
          <button
            onClick={() => setViewMode("chat")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              viewMode === "chat"
                ? "border-[#c96442] text-[#c96442]"
                : "border-transparent text-[#87867f] hover:text-[#4d4c48]"
            )}
          >
            <MessageCircle size={16} />
            对话
          </button>
          <button
            onClick={() => setViewMode("diary")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              viewMode === "diary"
                ? "border-[#c96442] text-[#c96442]"
                : "border-transparent text-[#87867f] hover:text-[#4d4c48]"
            )}
          >
            <BookMarked size={16} />
            日记
          </button>
        </div>

        {viewMode === "diary" ? (
          <DiaryPanel />
        ) : (
          <>
            {!currentSessionId ? (
              <div className="flex-1 overflow-y-auto px-6 py-12 md:py-16">
                <div className="max-w-2xl mx-auto rounded-3xl border border-[#e8e6dc] bg-[#faf9f5] p-8 md:p-10 text-center claude-whisper">
                  <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f4ed] text-[#5e5d59] text-xs border border-[#e8e6dc]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#c96442]" />
                    Workspace Ready
                  </p>
                  <h1 className="mt-5 font-editorial text-3xl md:text-4xl leading-[1.15] text-[#141413]">
                    从一次具体对话开始
                  </h1>
                  <p className="mt-3 text-sm md:text-base text-[#5e5d59] leading-relaxed">
                    先写一篇日记，随后新建一个对话，再提出你当下最真实的问题。系统会结合你的知识库与日记语境，给出可执行建议。
                  </p>
                  <button
                    onClick={() => useAppStore.getState().createSession()}
                    className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#c96442] px-5 py-2.5 text-sm text-[#faf9f5] hover:bg-[#b85b3b] transition-colors shadow-[#c96442_0_0_0_0,#c96442_0_0_0_1px]"
                  >
                    新建第一条对话
                  </button>
                </div>
              </div>
            ) : (
              <>
                <header className="h-14 border-b border-[#e8e6dc] flex items-center px-6 justify-between bg-[#f5f4ed]/95 backdrop-blur z-10">
                  <h2 className="font-editorial text-[1.35rem] text-[#141413] truncate">
                    {currentSession?.title}
                  </h2>
                </header>

                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#f5f4ed] scroll-smooth"
                >
                  {messages.length === 0 && (
                    <div className="text-center text-xs text-[#87867f] mt-10">
                      开始新的对话吧...
                    </div>
                  )}

                  {messages.map((msg) => {
                    if (isAssistantThinking && msg.role === "assistant" && !msg.content) {
                      return null;
                    }

                    return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full gap-3",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 bg-[#30302e] border border-[#30302e] rounded-full flex items-center justify-center shrink-0">
                          <Bot size={16} className="text-[#faf9f5]" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                          msg.role === "user"
                            ? "bg-[#c96442] text-[#faf9f5] rounded-tr-md shadow-[#c96442_0_0_0_0,#c96442_0_0_0_1px]"
                            : "bg-[#faf9f5] border border-[#f0eee6] text-[#4d4c48] rounded-tl-md"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          msg.content ? (
                            <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-strong:text-[#3d3d3a]">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                              <SourcesPanel sources={msg.sources || []} />
                            </div>
                          ) : (
                            <ThinkingIndicator />
                          )
                        ) : (
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        )}
                      </div>

                      {msg.role === "user" && (
                        <Avatar className="h-8 w-8 border border-[#e8e6dc] shrink-0 bg-[#faf9f5]">
                          <AvatarImage src={user?.avatar || undefined} alt="user-avatar" />
                          <AvatarFallback>
                            <User size={14} className="text-[#87867f]" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    );
                  })}

                  {isAssistantThinking && <AssistantThinkingMessage />}
                </div>

                <div className="p-4 border-t border-[#e8e6dc] bg-[#f5f4ed] relative">
                  {showBookFilter && (
                    <div className="absolute bottom-full left-4 mb-2 w-72 bg-[#faf9f5] rounded-2xl shadow-[rgba(0,0,0,0.05)_0_4px_24px] border border-[#f0eee6] overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                      <div className="p-3 border-b border-[#f0eee6] bg-[#f5f4ed] flex justify-between items-center">
                        <span className="text-xs font-medium text-[#4d4c48]">
                          选择检索知识库范围
                        </span>
                        <button
                          type="button"
                          className="text-xs text-[#c96442] hover:text-[#d97757]"
                          onClick={() => setSelectedBooks([])}
                        >
                          恢复全选
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                        {documents.length === 0 ? (
                          <div className="text-xs text-[#87867f] text-center py-4">
                            暂无书籍，去知识库上传吧！
                          </div>
                        ) : (
                          documents.map((doc) => {
                            const isSelected =
                              selectedBooks.length === 0 ||
                              selectedBooks.includes(doc.filename);
                            return (
                              <button
                                type="button"
                                key={doc.filename}
                                className={cn(
                                  "w-full flex items-center justify-between text-left p-2 rounded-lg text-xs transition-colors",
                                  isSelected
                                    ? "bg-[#f5ece8] text-[#c96442] font-medium"
                                    : "hover:bg-[#f5f4ed] text-[#5e5d59]"
                                )}
                                onClick={() => {
                                  setSelectedBooks((prevBooks) => {
                                    let newBooks = [...prevBooks];

                                    if (prevBooks.length === 0) {
                                      // 从“全选”状态点击某一项，切换为“全选-该项”
                                      return documents
                                        .map((item) => item.filename)
                                        .filter((name) => name !== doc.filename);
                                    }

                                    if (prevBooks.includes(doc.filename)) {
                                      newBooks = newBooks.filter((b) => b !== doc.filename);
                                    } else {
                                      newBooks.push(doc.filename);
                                    }

                                    return newBooks;
                                  });
                                }}
                              >
                                <span className="truncate pr-2">{doc.filename}</span>
                                {isSelected && <CheckCircle2 size={14} className="shrink-0" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 max-w-4xl mx-auto items-end">
                    <button
                      type="button"
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 border",
                        selectedBooks.length > 0 && selectedBooks.length < documents.length
                          ? "bg-[#f5ece8] border-[#e7c7bb] text-[#c96442]"
                          : "bg-[#faf9f5] border-[#e8e6dc] text-[#87867f] hover:text-[#4d4c48] hover:bg-[#f0eee6]"
                      )}
                      onClick={() => setShowBookFilter(!showBookFilter)}
                      title="限定检索范围"
                    >
                      <Library size={18} />
                    </button>

                    <textarea
                      className="flex-1 border border-[#e8e6dc] rounded-2xl px-4 py-2.5 text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#3898ec]/30 bg-[#faf9f5] resize-none min-h-[42px] max-h-[160px]"
                      placeholder="输入消息... (Shift+Enter 换行)"
                      rows={1}
                      value={inputContent}
                      onChange={(e) => {
                        setInputContent(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                      }}
                      onKeyDown={handleKeyDown}
                    />
                    <button
                      className="bg-[#c96442] text-[#faf9f5] w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#b85b3b] transition-colors disabled:opacity-50 shrink-0 shadow-[#c96442_0_0_0_0,#c96442_0_0_0_1px]"
                      onClick={handleSend}
                      disabled={!inputContent.trim()}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}