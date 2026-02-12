// components/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, MessageSquare, Plus, Trash2, BookOpen } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/FileUpload";

export function Sidebar() {
    // 1. 从 Store 中提取状态和动作
    const { sessions, currentSessionId, fetchSessions, createSession, selectSession, deleteSession, categories, fetchCategories, activeCategoryId, setCategoryFilter, fetchDocuments } = useAppStore();

    const [keyword, setKeyword] = useState("");
    const [showUpload, setShowUpload] = useState(false);

    // 2. 组件加载时，获取会话列表
    // useEffect(() => {
    //     fetchSessions();
    // }, [fetchSessions]);
    // 组件加载时，同时获取会话和分类
    useEffect(() => {
        fetchSessions();
        fetchCategories();
        fetchDocuments();
    }, []);

    // 3. 处理搜索（这里做了个简单的防抖，回车才搜索，或者你可以做成实时）
    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            fetchSessions(keyword);
        }
    };

    return (
        <div className="w-[300px] border-r h-full flex flex-col bg-slate-50/50">
            {/* 顶部操作区 */}
            <div className="p-4 space-y-4">
                <Button
                    className="w-full justify-start gap-2 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => createSession()}
                >
                    <Plus size={16} />
                    新对话
                </Button>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索历史对话 (回车)..."
                        className="pl-8 bg-white"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                </div>

                {/* 知识库管理按钮 */}
                <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={() => setShowUpload(!showUpload)}
                >
                    <BookOpen size={16} />
                    {showUpload ? "收起知识库" : "管理知识库"}
                </Button>
            </div>

            {/* 文件上传区域（可收起） */}
            {showUpload && (
                <div className="px-4 py-3 border-b bg-slate-50/80">
                    <FileUpload />
                </div>
            )}

            <Separator />

            {/* 分类标签预留位 */}
            {/* 中部：分类标签 (动态渲染) */}
            <div className="px-4 py-2">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-muted-foreground">分类筛选</h3>
                    {/* 清除筛选的小按钮 */}
                    {activeCategoryId && (
                        <button
                            onClick={() => setCategoryFilter(null)}
                            className="text-[10px] text-red-500 hover:underline"
                        >
                            清除
                        </button>
                    )}
                </div>

                <div className="flex gap-2 flex-wrap">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategoryFilter(activeCategoryId === cat.id ? null : cat.id)}
                            className={cn(
                                "px-2 py-1 text-xs rounded-full transition-all border",
                                // 选中状态 vs 未选中状态
                                activeCategoryId === cat.id
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                            )}
                            style={{
                                // 如果想用数据库里的颜色，可以写在这里，比如：
                                // backgroundColor: activeCategoryId === cat.id ? cat.color_code : 'transparent'
                            }}
                        >
                            #{cat.name}
                        </button>
                    ))}
                </div>
            </div>

            <Separator />

            {/* 真实会话列表 */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {sessions.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground py-10">
                            暂无历史记录
                        </div>
                    )}

                    {sessions.map((session) => (
                        <div key={session.id} className="group flex items-center relative">
                            <Button
                                variant={currentSessionId === session.id ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start font-normal h-auto py-3 text-left pl-3 pr-8",
                                    currentSessionId === session.id && "bg-white shadow-sm border"
                                )}
                                onClick={() => selectSession(session.id)}
                            >
                                <MessageSquare className="mr-3 h-4 w-4 opacity-70 shrink-0" />
                                <div className="flex flex-col items-start overflow-hidden w-full">
                                    <span className="truncate w-full font-medium text-sm text-slate-700">
                                        {session.title}
                                    </span>
                                    <span className="truncate w-full text-[10px] text-slate-400 mt-0.5">
                                        {session.summary || "暂无摘要..."}
                                    </span>
                                </div>
                            </Button>

                            {/* 删除按钮 (悬停显示) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // 防止触发 selectSession
                                    if (confirm("确定删除吗？")) deleteSession(session.id);
                                }}
                                className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t text-xs text-center text-slate-400">
                Personal KB Assistant v0.1
            </div>
        </div>
    );
}