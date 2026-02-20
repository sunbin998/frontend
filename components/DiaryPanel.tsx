"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Save, Trash2, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";

const MOODS = [
    { emoji: "😊", label: "开心" },
    { emoji: "😌", label: "平静" },
    { emoji: "🤔", label: "思考" },
    { emoji: "😤", label: "焦虑" },
    { emoji: "😔", label: "低落" },
    { emoji: "💪", label: "充实" },
    { emoji: "😴", label: "疲惫" },
];

export function DiaryPanel() {
    const {
        diaries, currentDiaryDate, fetchDiaries, saveDiary, deleteDiary, setDiaryDate,
    } = useAppStore();

    const [content, setContent] = useState("");
    const [mood, setMood] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // 加载日记列表
    useEffect(() => {
        fetchDiaries();
    }, []);

    // 当选择的日期变化时，加载对应日记
    useEffect(() => {
        const diary = diaries.find(d => d.date === currentDiaryDate);
        if (diary) {
            setContent(diary.content);
            setMood(diary.mood);
        } else {
            setContent("");
            setMood(null);
        }
        setHasChanges(false);
        setSaved(false);
    }, [currentDiaryDate, diaries]);

    // 日期导航
    const changeDate = (delta: number) => {
        const d = new Date(currentDiaryDate);
        d.setDate(d.getDate() + delta);
        setDiaryDate(d.toISOString().slice(0, 10));
    };

    const isToday = currentDiaryDate === new Date().toISOString().slice(0, 10);

    // 保存日记
    const handleSave = async () => {
        if (!content.trim()) return;
        setSaving(true);
        try {
            await saveDiary(currentDiaryDate, content, mood || undefined);
            setSaved(true);
            setHasChanges(false);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error("保存失败", e);
        } finally {
            setSaving(false);
        }
    };

    // 删除日记
    const handleDelete = async () => {
        if (!confirm(`确定删除 ${currentDiaryDate} 的日记吗？`)) return;
        await deleteDiary(currentDiaryDate);
        setContent("");
        setMood(null);
    };

    const currentDiary = diaries.find(d => d.date === currentDiaryDate);

    // 格式化日期显示
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
        return `${dateStr} ${weekdays[d.getDay()]}`;
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* 日期导航栏 */}
            <header className="h-14 border-b flex items-center px-6 justify-between bg-white/80 backdrop-blur z-10">
                <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronLeft size={18} className="text-slate-600" />
                </button>

                <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-lg text-slate-800">
                        {formatDate(currentDiaryDate)}
                    </h2>
                    {isToday && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                            今天
                        </span>
                    )}
                    <input
                        type="date"
                        value={currentDiaryDate}
                        onChange={(e) => setDiaryDate(e.target.value)}
                        className="text-sm border rounded-lg px-2 py-1 text-slate-500 cursor-pointer"
                    />
                </div>

                <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronRight size={18} className="text-slate-600" />
                </button>
            </header>

            {/* 心情选择 */}
            <div className="px-6 py-3 border-b bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 mr-1">今日心情：</span>
                    {MOODS.map(m => (
                        <button
                            key={m.label}
                            onClick={() => {
                                setMood(mood === m.label ? null : m.label);
                                setHasChanges(true);
                            }}
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-base transition-all",
                                mood === m.label
                                    ? "bg-indigo-100 ring-2 ring-indigo-400 scale-110"
                                    : "hover:bg-slate-100 opacity-60 hover:opacity-100"
                            )}
                            title={m.label}
                        >
                            {m.emoji}
                        </button>
                    ))}
                    {mood && (
                        <span className="text-xs text-indigo-600 ml-1">{mood}</span>
                    )}
                </div>
            </div>

            {/* 编辑区 */}
            <div className="flex-1 p-6 overflow-hidden">
                <textarea
                    className="w-full h-full resize-none text-sm leading-relaxed text-slate-700 bg-transparent focus:outline-none placeholder:text-slate-300"
                    placeholder={`写下今天的所思所感...\n\n你可以记录：\n• 今天做了什么\n• 有什么感悟\n• 遇到了什么困难\n• 明天想要改进什么`}
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);
                        setHasChanges(true);
                        setSaved(false);
                    }}
                />
            </div>

            {/* 底部操作栏 */}
            <div className="px-6 py-3 border-t bg-white flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    {currentDiary?.is_vectorized && (
                        <span className="flex items-center gap-1 text-green-600">
                            <Check size={12} /> 已同步到知识库
                        </span>
                    )}
                    {content.length > 0 && (
                        <span>{content.length} 字</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {currentDiary && (
                        <button
                            onClick={handleDelete}
                            className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <Trash2 size={12} /> 删除
                        </button>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={!content.trim() || saving || (!hasChanges && saved)}
                        className={cn(
                            "px-4 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 font-medium",
                            saved
                                ? "bg-green-100 text-green-700"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
                        )}
                    >
                        {saving ? (
                            <><Loader2 size={12} className="animate-spin" /> 保存中...</>
                        ) : saved ? (
                            <><Check size={12} /> 已保存</>
                        ) : (
                            <><Save size={12} /> 保存日记</>
                        )}
                    </button>
                </div>
            </div>

            {/* 历史日记列表 */}
            {diaries.length > 0 && (
                <div className="border-t px-6 py-3 bg-slate-50/50 max-h-[200px] overflow-y-auto">
                    <h3 className="text-xs font-medium text-slate-400 mb-2">历史日记</h3>
                    <div className="space-y-1">
                        {diaries.map(d => (
                            <button
                                key={d.date}
                                onClick={() => setDiaryDate(d.date)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between",
                                    d.date === currentDiaryDate
                                        ? "bg-indigo-50 text-indigo-700 font-medium"
                                        : "hover:bg-slate-100 text-slate-600"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{d.date}</span>
                                    {d.mood && <span>{MOODS.find(m => m.label === d.mood)?.emoji}</span>}
                                </div>
                                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                    {d.content.slice(0, 20)}...
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
