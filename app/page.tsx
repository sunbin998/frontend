"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DiaryPanel } from "@/components/DiaryPanel";
import { useAppStore } from "@/lib/store";
import { MessageSquareDashed, Send, Bot, User, BookOpen, ChevronDown, ChevronUp, Sparkles, MessageCircle, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Source } from "@/lib/types";

// RAG 来源折叠组件
function SourcesPanel({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 transition-colors font-medium"
      >
        <BookOpen size={12} />
        📚 参考来源 ({sources.length})
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="mt-2 space-y-2 border-l-2 border-indigo-200 pl-3">
          {sources.map((src, i) => (
            <div key={i} className="bg-indigo-50/50 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-indigo-700 text-[11px]">{src.filename}</span>
                <span className="text-indigo-400 text-[10px]">
                  相关度 {(src.score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3">{src.preview}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ViewMode = "chat" | "diary";

export default function Home() {
  const { currentSessionId, sessions, messages, sendMessageStream } = useAppStore();
  const currentSession = sessions.find(s => s.id === currentSessionId);

  const [inputContent, setInputContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-white">
      <aside className="hidden md:flex h-full">
        <Sidebar />
      </aside>

      <section className="flex-1 flex flex-col h-full relative">
        {/* 顶部 Tab 切换 */}
        <div className="flex items-center border-b bg-white px-4 shrink-0">
          <button
            onClick={() => setViewMode("chat")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              viewMode === "chat"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
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
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <BookMarked size={16} />
            日记
          </button>
        </div>

        {/* 日记模式 */}
        {viewMode === "diary" ? (
          <DiaryPanel />
        ) : (
          /* 聊天模式 */
          <>
            {!currentSessionId ? (
              /* 欢迎界面 */
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 px-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
                  <Sparkles size={28} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-700 mb-2">觉醒教练</h1>
                <p className="text-sm text-slate-400 mb-8 text-center max-w-md">
                  你的个人成长 AI 教练，基于你的知识库提供专业指导。
                  上传书籍到知识库，开始你的成长之旅。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full">
                  {["📖 这本书的核心观点是什么？", "🧠 如何培养深度学习的习惯？", "💡 我总是拖延，该怎么改变？"].map((q, i) => (
                    <button
                      key={i}
                      className="text-left text-xs p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-slate-600"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <header className="h-14 border-b flex items-center px-6 justify-between bg-white/80 backdrop-blur z-10">
                  <h2 className="font-semibold text-lg text-slate-800 truncate">
                    {currentSession?.title}
                  </h2>
                </header>

                {/* Chat Area */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30 scroll-smooth"
                >
                  {messages.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground mt-10">
                      开始新的对话吧...
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full gap-3",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                          <Bot size={16} className="text-white" />
                        </div>
                      )}

                      <div className={cn(
                        "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                        msg.role === 'user'
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-white border text-slate-700 rounded-tl-none"
                      )}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-800 prose-p:my-1.5 prose-li:my-0.5 prose-strong:text-indigo-700">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                            <SourcesPanel sources={msg.sources || []} />
                          </div>
                        ) : (
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                          <User size={16} className="text-slate-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2 max-w-4xl mx-auto items-end">
                    <textarea
                      className="flex-1 border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 resize-none min-h-[42px] max-h-[160px]"
                      placeholder="输入消息... (Shift+Enter 换行)"
                      rows={1}
                      value={inputContent}
                      onChange={(e) => {
                        setInputContent(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                      }}
                      onKeyDown={handleKeyDown}
                    />
                    <button
                      className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 shrink-0"
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