"use client";

import { useEffect, useRef, useState } from "react"; // 引入 hooks
import { Sidebar } from "@/components/Sidebar";
import { useAppStore } from "@/lib/store";
import { MessageSquareDashed, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { currentSessionId, sessions, messages, sendMessage, sendMessageStream } = useAppStore();
  const currentSession = sessions.find(s => s.id === currentSessionId);

  // 本地状态：输入框内容
  const [inputContent, setInputContent] = useState("");
  // 滚动锚点
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputContent.trim()) return;
    // sendMessage(inputContent);
    sendMessageStream(inputContent); // <--- 改用流式方法
    setInputContent(""); // 清空输入框
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
        {!currentSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <MessageSquareDashed size={64} className="mb-4 opacity-20" />
            <p>请在左侧选择或创建一个新对话</p>
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
                  {/* Avatar (AI) */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 border border-indigo-200">
                      <Bot size={16} className="text-indigo-600" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={cn(
                    "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === 'user'
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-white border text-slate-700 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>

                  {/* Avatar (User) */}
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
              <div className="flex gap-2 max-w-4xl mx-auto">
                <input
                  className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50"
                  placeholder="输入消息..."
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                  onClick={handleSend}
                  disabled={!inputContent.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}