// components/Sidebar.tsx
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Plus, Trash2, BookOpen, Tag, X, Check, Pencil, ArrowUpDown, ArrowUp, ArrowDown, Calendar } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/FileUpload";

// 预设颜色
const PRESET_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
    "#f97316", "#eab308", "#22c55e", "#14b8a6",
    "#06b6d4", "#3b82f6", "#64748b", "#78716c",
];

// 格式化日期
function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays < 7) return `${diffDays}天前`;

    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    if (d.getFullYear() === now.getFullYear()) {
        return `${month}-${day}`;
    }
    return `${d.getFullYear()}-${month}-${day}`;
}

export function Sidebar() {
    const {
        sessions, currentSessionId,
        fetchSessions, createSession, selectSession, deleteSession,
        categories, fetchCategories, activeCategoryId, setCategoryFilter,
        createCategory, updateCategory, deleteCategory, updateSessionCategory,
        fetchDocuments,
    } = useAppStore();

    const [showUpload, setShowUpload] = useState(false);

    // 排序状态: 'desc' (最新在前) 或 'asc' (最早在前)
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    // 分类管理状态
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [categoryName, setCategoryName] = useState("");
    const [categoryColor, setCategoryColor] = useState(PRESET_COLORS[0]);

    // 会话分类选择状态
    const [assigningSessionId, setAssigningSessionId] = useState<string | null>(null);

    const categoryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSessions();
        fetchCategories();
        fetchDocuments();
    }, []);

    // 排序后的会话列表
    const sortedSessions = useMemo(() => {
        const sorted = [...sessions].sort((a, b) => {
            const dateA = new Date(a.updated_at).getTime();
            const dateB = new Date(b.updated_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        return sorted;
    }, [sessions, sortOrder]);

    const handleSaveCategory = () => {
        if (!categoryName.trim()) return;
        if (editingCategoryId !== null) {
            updateCategory(editingCategoryId, categoryName.trim(), categoryColor);
        } else {
            createCategory(categoryName.trim(), categoryColor);
        }
        setCategoryName("");
        setCategoryColor(PRESET_COLORS[0]);
        setShowCategoryForm(false);
        setEditingCategoryId(null);
    };

    const startEdit = (cat: { id: number; name: string; color_code: string }) => {
        setEditingCategoryId(cat.id);
        setCategoryName(cat.name);
        setCategoryColor(cat.color_code);
        setShowCategoryForm(true);
        setTimeout(() => categoryInputRef.current?.focus(), 50);
    };

    const cancelForm = () => {
        setShowCategoryForm(false);
        setEditingCategoryId(null);
        setCategoryName("");
        setCategoryColor(PRESET_COLORS[0]);
    };

    // 获取会话所属分类
    const getSessionCategory = (session: any) => {
        if (!session.category_id) return null;
        return categories.find(c => c.id === session.category_id) || null;
    };

    return (
        <div className="w-[300px] border-r h-full flex flex-col bg-slate-50/50">
            {/* 顶部操作区 */}
            <div className="p-4 space-y-3">
                <Button
                    className="w-full justify-start gap-2 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => createSession()}
                >
                    <Plus size={16} />
                    新对话
                </Button>

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

            {/* 分类管理区域 */}
            <div className="px-4 py-2">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-muted-foreground">分类标签</h3>
                    <div className="flex items-center gap-1">
                        {activeCategoryId && (
                            <button
                                onClick={() => setCategoryFilter(null)}
                                className="text-[10px] text-red-500 hover:underline"
                            >
                                清除
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (showCategoryForm) cancelForm();
                                else { setShowCategoryForm(true); setTimeout(() => categoryInputRef.current?.focus(), 50); }
                            }}
                            className="text-[10px] text-indigo-500 hover:underline"
                        >
                            {showCategoryForm ? "取消" : "+ 添加"}
                        </button>
                    </div>
                </div>

                {/* 分类创建/编辑表单 */}
                {showCategoryForm && (
                    <div className="mb-2 p-2 bg-white rounded-lg border space-y-2">
                        <Input
                            ref={categoryInputRef}
                            placeholder="分类名称"
                            className="h-7 text-xs"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
                        />
                        <div className="flex gap-1 flex-wrap">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCategoryColor(c)}
                                    className={cn(
                                        "w-5 h-5 rounded-full border-2 transition-all",
                                        categoryColor === c ? "border-slate-800 scale-110" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <div className="flex gap-1">
                            <Button size="sm" className="h-6 text-[11px] flex-1" onClick={handleSaveCategory}>
                                <Check size={12} className="mr-1" />
                                {editingCategoryId ? "保存" : "创建"}
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={cancelForm}>
                                取消
                            </Button>
                        </div>
                    </div>
                )}

                {/* 分类标签列表 */}
                <div className="flex gap-1.5 flex-wrap">
                    {categories.map((cat) => (
                        <div key={cat.id} className="group relative">
                            <button
                                onClick={() => setCategoryFilter(activeCategoryId === cat.id ? null : cat.id)}
                                className={cn(
                                    "px-2.5 py-1 text-xs rounded-full transition-all border flex items-center gap-1",
                                    activeCategoryId === cat.id
                                        ? "text-white border-transparent shadow-sm"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                )}
                                style={activeCategoryId === cat.id
                                    ? { backgroundColor: cat.color_code }
                                    : { borderLeftColor: cat.color_code, borderLeftWidth: '3px' }
                                }
                            >
                                {cat.name}
                            </button>
                            {/* 悬停操作 */}
                            <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
                                <button
                                    onClick={() => startEdit(cat)}
                                    className="w-4 h-4 bg-white border rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 shadow-sm"
                                >
                                    <Pencil size={8} />
                                </button>
                                <button
                                    onClick={() => { if (confirm(`删除分类「${cat.name}」？`)) deleteCategory(cat.id); }}
                                    className="w-4 h-4 bg-white border rounded-full flex items-center justify-center text-slate-500 hover:text-red-600 shadow-sm"
                                >
                                    <X size={8} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {categories.length === 0 && !showCategoryForm && (
                        <span className="text-[10px] text-slate-400">暂无分类，点击「+ 添加」创建</span>
                    )}
                </div>
            </div>

            <Separator />

            {/* 会话列表标题 + 排序按钮 */}
            <div className="px-4 py-2 flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground">
                    对话记录 ({sortedSessions.length})
                </h3>
                <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-600 transition-colors px-1.5 py-0.5 rounded hover:bg-indigo-50"
                    title={sortOrder === 'desc' ? '当前：最新在前' : '当前：最早在前'}
                >
                    <Calendar size={11} />
                    {sortOrder === 'desc' ? (
                        <><ArrowDown size={10} /> 最新</>
                    ) : (
                        <><ArrowUp size={10} /> 最早</>
                    )}
                </button>
            </div>

            {/* 会话列表 */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {sortedSessions.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground py-10">
                            暂无历史记录
                        </div>
                    )}

                    {sortedSessions.map((session) => {
                        const cat = getSessionCategory(session);
                        return (
                            <div key={session.id} className="group flex items-center relative">
                                <Button
                                    variant={currentSessionId === session.id ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start font-normal h-auto py-2.5 text-left pl-3 pr-16",
                                        currentSessionId === session.id && "bg-white shadow-sm border"
                                    )}
                                    onClick={() => selectSession(session.id)}
                                >
                                    <MessageSquare className="mr-3 h-4 w-4 opacity-70 shrink-0" />
                                    <div className="flex flex-col items-start overflow-hidden w-full">
                                        <div className="flex items-center justify-between w-full gap-2">
                                            <span className="truncate font-medium text-sm text-slate-700">
                                                {session.title}
                                            </span>
                                            <span className="text-[9px] text-slate-400 whitespace-nowrap shrink-0">
                                                {formatDate(session.updated_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {cat && (
                                                <span
                                                    className="text-[9px] px-1.5 py-0.5 rounded-full text-white shrink-0"
                                                    style={{ backgroundColor: cat.color_code }}
                                                >
                                                    {cat.name}
                                                </span>
                                            )}
                                            <span className="truncate text-[10px] text-slate-400">
                                                {session.summary || "暂无摘要..."}
                                            </span>
                                        </div>
                                    </div>
                                </Button>

                                {/* 操作按钮 (悬停显示) */}
                                <div className="absolute right-2 flex gap-0.5 opacity-0 group-hover:opacity-100">
                                    {/* 分类选择 */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setAssigningSessionId(
                                                assigningSessionId === session.id ? null : session.id
                                            );
                                        }}
                                        className="p-1 hover:bg-indigo-100 hover:text-indigo-600 rounded"
                                        title="设置分类"
                                    >
                                        <Tag size={13} />
                                    </button>
                                    {/* 删除 */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("确定删除吗？")) deleteSession(session.id);
                                        }}
                                        className="p-1 hover:bg-red-100 hover:text-red-600 rounded"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>

                                {/* 分类选择下拉 */}
                                {assigningSessionId === session.id && (
                                    <div className="absolute right-0 top-full z-20 bg-white border rounded-lg shadow-lg p-1.5 min-w-[140px]">
                                        {categories.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    updateSessionCategory(session.id, c.id);
                                                    setAssigningSessionId(null);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 hover:bg-slate-50",
                                                    session.category_id === c.id && "bg-indigo-50 text-indigo-700"
                                                )}
                                            >
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color_code }} />
                                                {c.name}
                                            </button>
                                        ))}
                                        {session.category_id && (
                                            <>
                                                <div className="border-t my-1" />
                                                <button
                                                    onClick={() => {
                                                        updateSessionCategory(session.id, null);
                                                        setAssigningSessionId(null);
                                                    }}
                                                    className="w-full text-left px-2 py-1.5 text-xs rounded text-red-500 hover:bg-red-50"
                                                >
                                                    清除分类
                                                </button>
                                            </>
                                        )}
                                        {categories.length === 0 && (
                                            <div className="px-2 py-1.5 text-[10px] text-slate-400">
                                                请先创建分类
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            <div className="p-4 border-t text-xs text-center text-slate-400">
                Personal KB Assistant v0.1
            </div>
        </div>
    );
}