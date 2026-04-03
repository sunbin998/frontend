"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DiaryPanel } from "@/components/DiaryPanel";
import { useAppStore } from "@/lib/store";
import { Send, Bot, User, BookOpen, ChevronDown, ChevronUp, MessageCircle, BookMarked, Library, CheckCircle2 } from "lucide-react";
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
  const { 
    currentSessionId, sessions, messages, sendMessageStream,
    documents, fetchDocuments, selectedBooks, setSelectedBooks 
  } = useAppStore();
  const currentSession = sessions.find(s => s.id === currentSessionId);

  const [inputContent, setInputContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showBookFilter, setShowBookFilter] = useState(false);

  // 初始化加载文档列表
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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
              <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-6 py-10"
                style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f5f3ff 100%)" }}
              >
                <div className="max-w-2xl w-full space-y-8">
                  {/* 标题区域 */}
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs text-indigo-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      AI 觉醒教练 · 随时在线
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                      用日记照亮自我<br />用知识点燃成长
                    </h1>
                    <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                      每一篇日记都是你人生轨迹的实时镜像，
                      每一本书都是前人验证过的智慧结晶。
                      当它们交汇，属于你的成长体系便开始生长。
                    </p>
                  </div>

                  {/* 三大核心价值 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="group p-5 rounded-2xl bg-white/70 backdrop-blur border border-white/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                        <span className="text-lg">📔</span>
                      </div>
                      <h3 className="font-semibold text-sm text-slate-700 mb-1">日记 · 人生的镜像</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        通过持续书写和回顾，觉察行为模式、情绪周期与成长轨迹
                      </p>
                    </div>

                    <div className="group p-5 rounded-2xl bg-white/70 backdrop-blur border border-white/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                        <span className="text-lg">📚</span>
                      </div>
                      <h3 className="font-semibold text-sm text-slate-700 mb-1">知识 · 现实的桥梁</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        用理论照亮现实，用你的真实经历验证和内化书中的智慧
                      </p>
                    </div>

                    <div className="group p-5 rounded-2xl bg-white/70 backdrop-blur border border-white/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                        <span className="text-lg">🌱</span>
                      </div>
                      <h3 className="font-semibold text-sm text-slate-700 mb-1">觉醒 · 内在的力量</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        每个人都有自我成长的力量，教练是你的镜子和催化剂
                      </p>
                    </div>
                  </div>

                  {/* 引言 */}
                  <div className="text-center py-3">
                    <blockquote className="text-xs text-slate-400 italic">
                      「做总比不做强。人生之路还很长，何必急于一时。」
                    </blockquote>
                  </div>

                  {/* 快速开始 */}
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 text-center font-medium">✨ 试着问我</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { emoji: "🪞", text: "帮我分析今天的日记，有什么值得关注的模式？" },
                        { emoji: "🧠", text: "最近总感到焦虑，书里有什么方法可以帮到我？" },
                        { emoji: "🎯", text: "我想建立一个早起习惯，该怎么开始？" },
                        { emoji: "💡", text: "回顾我最近的状态，有哪些成长和进步？" },
                      ].map((q, i) => (
                        <button
                          key={i}
                          onClick={async () => {
                            await useAppStore.getState().createSession();
                            // 短暂延迟确保 session 创建完成
                            setTimeout(() => {
                              useAppStore.getState().sendMessageStream(q.text);
                            }, 300);
                          }}
                          className="flex items-start gap-2.5 text-left text-xs p-3.5 rounded-xl border border-slate-200/80 bg-white/60 backdrop-blur hover:border-indigo-300 hover:bg-white hover:shadow-sm transition-all text-slate-600 group"
                        >
                          <span className="text-base shrink-0 mt-0.5 group-hover:scale-110 transition-transform">{q.emoji}</span>
                          <span className="leading-relaxed">{q.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
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
                <div className="p-4 border-t bg-white relative">
                  
                  {/* 书籍选择器面板 */}
                  {showBookFilter && (
                    <div className="absolute bottom-full left-4 mb-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                       <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-700">选择检索知识库限定范围</span>
                          <button 
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                            onClick={() => setSelectedBooks([])}
                          >
                            恢复全选
                          </button>
                       </div>
                       <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                          {documents.length === 0 ? (
                             <div className="text-xs text-slate-400 text-center py-4">暂无书籍，去知识库上传吧！</div>
                          ) : (
                             documents.map(doc => {
                               const isSelected = selectedBooks.length === 0 || selectedBooks.includes(doc.filename);
                               return (
                                 <button
                                   key={doc.filename}
                                   className={cn(
                                     "w-full flex items-center justify-between text-left p-2 rounded-lg text-xs transition-colors",
                                     isSelected ? "bg-indigo-50 text-indigo-700 font-medium" : "hover:bg-slate-50 text-slate-600"
                                   )}
                                   onClick={() => {
                                      let newBooks = [...selectedBooks];
                                      if (selectedBooks.length === 0) {
                                         // 从全选切到单选
                                         newBooks = [doc.filename];
                                      } else if (selectedBooks.includes(doc.filename)) {
                                         newBooks = newBooks.filter(b => b !== doc.filename);
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
                    {/* 知识库过滤按钮 */}
                    <button
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm shrink-0 border",
                        selectedBooks.length > 0 && selectedBooks.length < documents.length 
                          ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                          : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      )}
                      onClick={() => setShowBookFilter(!showBookFilter)}
                      title="限定检索范围"
                    >
                      <Library size={18} />
                    </button>
                    
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