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

const QUICK_PROMPTS = [
  { emoji: "🪞", text: "帮我分析今天的日记，有什么值得关注的模式？" },
  { emoji: "🧠", text: "最近总感到焦虑，书里有什么方法可以帮到我？" },
  { emoji: "🎯", text: "我想建立一个早起习惯，该怎么开始？" },
  { emoji: "💡", text: "回顾我最近的状态，有哪些成长和进步？" },
];

const MODEL_CARDS = [
  {
    name: "Reflection",
    desc: "从日记中识别情绪与行为模式，提炼可执行的成长线索。",
  },
  {
    name: "Grounding",
    desc: "将对话锚定在你的知识库内容，避免泛泛而谈。",
  },
  {
    name: "Action",
    desc: "把洞察转成下一步行动，让成长发生在真实生活里。",
  },
];

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
  }, [messages]);

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
              <div className="flex-1 overflow-y-auto">
                <section className="px-6 py-14 md:py-18 max-w-5xl mx-auto">
                  <div className="max-w-3xl mx-auto text-center">
                    <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8e6dc] text-[#4d4c48] text-xs border border-[#d1cfc5]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c96442]" />
                      Literary Growth Companion
                    </p>
                    <h1 className="font-editorial text-4xl md:text-6xl leading-[1.1] text-[#141413] mt-5">
                      用日记照亮自我，
                      <br />
                      用知识点燃成长
                    </h1>
                    <p className="mt-5 text-base md:text-lg text-[#5e5d59] leading-relaxed max-w-2xl mx-auto">
                      每一篇日记都是你人生轨迹的镜像，每一本书都是前人验证过的智慧结晶。
                      当两者交汇，属于你的成长体系就开始生长。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
                    {MODEL_CARDS.map((card) => (
                      <div
                        key={card.name}
                        className="rounded-2xl bg-[#faf9f5] border border-[#e8e6dc] p-5 claude-whisper"
                      >
                        <h3 className="font-editorial text-[1.35rem] leading-[1.2] text-[#141413]">
                          {card.name}
                        </h3>
                        <p className="text-sm text-[#5e5d59] mt-2 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-[#141413] border-y border-[#30302e]">
                  <div className="max-w-5xl mx-auto px-6 py-10 md:py-12 text-center">
                    <h2 className="font-editorial text-3xl md:text-4xl leading-[1.15] text-[#faf9f5]">
                      先从一个具体问题开始
                    </h2>
                    <p className="mt-3 text-[#b0aea5] text-sm md:text-base">
                      让 AI 从你的真实语境出发，给出可执行而不空泛的建议。
                    </p>
                  </div>
                </section>

                <section className="px-6 py-10 max-w-5xl mx-auto w-full">
                  <p className="text-xs text-[#87867f] text-center mb-3">试着这样问我</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {QUICK_PROMPTS.map((q, i) => (
                      <button
                        key={i}
                        onClick={async () => {
                          await useAppStore.getState().createSession();
                          setTimeout(() => {
                            useAppStore.getState().sendMessageStream(q.text);
                          }, 300);
                        }}
                        className="flex items-start gap-2.5 text-left text-sm p-4 rounded-2xl border border-[#f0eee6] bg-[#faf9f5] hover:border-[#d1cfc5] transition-all claude-ring"
                      >
                        <span className="text-lg shrink-0 mt-0.5">{q.emoji}</span>
                        <span className="leading-relaxed text-[#4d4c48]">{q.text}</span>
                      </button>
                    ))}
                  </div>
                </section>
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

                  {messages.map((msg) => (
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
                          <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-strong:text-[#3d3d3a]">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                            <SourcesPanel sources={msg.sources || []} />
                          </div>
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
                  ))}
                </div>

                <div className="p-4 border-t border-[#e8e6dc] bg-[#f5f4ed] relative">
                  {showBookFilter && (
                    <div className="absolute bottom-full left-4 mb-2 w-72 bg-[#faf9f5] rounded-2xl shadow-[rgba(0,0,0,0.05)_0_4px_24px] border border-[#f0eee6] overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                      <div className="p-3 border-b border-[#f0eee6] bg-[#f5f4ed] flex justify-between items-center">
                        <span className="text-xs font-medium text-[#4d4c48]">
                          选择检索知识库范围
                        </span>
                        <button
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
                                key={doc.filename}
                                className={cn(
                                  "w-full flex items-center justify-between text-left p-2 rounded-lg text-xs transition-colors",
                                  isSelected
                                    ? "bg-[#f5ece8] text-[#c96442] font-medium"
                                    : "hover:bg-[#f5f4ed] text-[#5e5d59]"
                                )}
                                onClick={() => {
                                  let newBooks = [...selectedBooks];
                                  if (selectedBooks.length === 0) {
                                    newBooks = [doc.filename];
                                  } else if (selectedBooks.includes(doc.filename)) {
                                    newBooks = newBooks.filter((b) => b !== doc.filename);
                                  } else {
                                    newBooks.push(doc.filename);
                                  }
                                  setSelectedBooks(newBooks);
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