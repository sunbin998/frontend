"use client";

import { useEffect, useState, useRef } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend, Cell } from "recharts";
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Info, Play, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function EvalDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // 自动化评测状态
    const [evalStatus, setEvalStatus] = useState<any>({ is_running: false });
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchEvalData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("http://localhost:8000/api/eval/summary");
            if (!res.ok) throw new Error("获取评测数据失败");
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // 触发测试并开始轮询
    const startEvaluation = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/eval/run", { method: "POST" });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "启动失败");
            }
            pollStatus();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const pollStatus = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/eval/status");
            const status = await res.json();
            setEvalStatus(status);
            
            if (status.is_running) {
                if (!pollIntervalRef.current) {
                    pollIntervalRef.current = setInterval(pollStatus, 3000);
                }
            } else {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
                // 如果运行结束且没有报错，自动刷新数据
                if (!status.error) {
                    fetchEvalData();
                }
            }
        } catch (err) {
            console.error("Polling status error:", err);
        }
    };

    useEffect(() => {
        fetchEvalData();
        pollStatus(); // 初次加载检查是否后端在跑
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    // Loader for initial load without data
    if (loading && !data) return <div className="p-10 text-center text-slate-500">加载评测数据中...</div>;
    if (error && !data) return <div className="p-10 text-center text-red-500">错误: {error}</div>;
    if (!data) return <div className="p-10 text-center text-slate-500">无数据</div>;

    // 格式化雷达图数据
    const radarData = [
        { metric: "检索 (Retrieval)", A: data.scores["检索质量"], fullMark: 100 },
        { metric: "生成 (Generation)", A: data.scores["生成质量"], fullMark: 100 },
        { metric: "教练 (Coaching)", A: data.scores["教练质量"], fullMark: 100 },
        { metric: "引用 (Citation)", A: data.scores["引用质量"], fullMark: 100 },
        { metric: "性能 (Performance)", A: data.scores["性能表现"], fullMark: 100 },
    ];

    // 格式化 RAG 核心图表数据 (Precision, Recall, F1, Relevance, Faithfulness)
    const { summaries } = data;
    const precision = summaries.retrieval?.context_precision || 0;
    const recall = summaries.retrieval?.context_recall || 0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const relevance = summaries.generation?.answer_relevancy_mean || 0;
    const faithfulness = summaries.generation?.faithfulness_mean || 0;

    const coreRAGData = [
        { name: "Ctx Precision", score: precision, color: "#3b82f6" }, // blue
        { name: "Ctx Recall", score: recall, color: "#14b8a6" },    // teal
        { name: "F1 Score", score: f1, color: "#8b5cf6" },          // violet
        { name: "Answer Relevance", score: relevance, color: "#10b981" }, // emerald
        { name: "Faithfulness", score: faithfulness, color: "#f59e0b" } // amber
    ];

    // 格式化教练场景对比图数据
    const coachingCatMap: Record<string, string> = {
        book_knowledge: "纯理论",
        diary_analysis: "日记分析",
        mixed: "混合",
        chitchat: "闲聊",
        boundary: "边界测试",
        multi_turn: "多轮"
    };

    let coachingBarData: Array<{ name: string; score: number }> = [];
    if (data.summaries.coaching?.by_category) {
        coachingBarData = Object.entries(data.summaries.coaching.by_category).map(([k, v]) => ({
            name: coachingCatMap[k] || k,
            score: v as number
        }));
    }

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
            <ScrollArea className="flex-1 w-full h-full p-8">
                <div className="max-w-6xl mx-auto space-y-8 pb-12">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                                    <ArrowLeft size={16} />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">系统评测大盘 (Evaluation Dashboard)</h1>
                                <p className="text-sm text-slate-500 mt-1">基于真实书籍与日记场景数据集生成的自动化测评</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={fetchEvalData} className="gap-2" disabled={evalStatus.is_running || loading}>
                                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                                刷新数据
                            </Button>
                            <Button 
                                onClick={startEvaluation} 
                                disabled={evalStatus.is_running}
                                className={`gap-2 text-white ${evalStatus.is_running ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
                            >
                                {evalStatus.is_running ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        评测中 ({evalStatus.progress}/{evalStatus.total_modules}) - {evalStatus.current_module}
                                    </>
                                ) : (
                                    <>
                                        <Play size={14} />
                                        启动全量自动化评测
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                    
                    {evalStatus.error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm flex items-center gap-2">
                            <AlertTriangle size={16} />
                            后端评测异常中断: {evalStatus.error}
                        </div>
                    )}

                    {/* Top Section: Radar Chart & Core RAG Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 雷达图 */}
                        <div className="bg-slate-900 text-white rounded-xl shadow-sm border p-6 flex flex-col items-center">
                            <h3 className="text-lg font-semibold mb-4 text-slate-100 self-start">✨ 五大维度综合体系评分 (满分 100)</h3>
                            <div className="w-full h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#334155" />
                                        <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569' }} axisLine={false} />
                                        <Radar name="Score" dataKey="A" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.3} />
                                        <RechartsTooltip formatter={(val: any) => Number(val).toFixed(1) + " 分"} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* RAG Core Metrics Bar Chart */}
                        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
                            <h3 className="text-lg font-semibold mb-4 text-slate-800">🎯 RAG 核心机制诊断 (生成式检索指标)</h3>
                            <div className="w-full h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={coreRAGData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{fill: '#475569', fontSize: 11}} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 1]} tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                                        <RechartsTooltip 
                                            formatter={(val: any) => Number(val).toFixed(3)} 
                                            cursor={{fill: '#f8fafc'}}
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#0f172a' }}
                                        />
                                        <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={40} label={{ position: 'top', fill: '#64748b', fontSize: 11, formatter: (v: any) => Number(v).toFixed(2) }}>
                                            {coreRAGData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* 指标卡片行 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard title="A. 检索质量 (Retrieval)" bg="bg-blue-50">
                            <MetricRow label="Hit Rate@5" val={summaries.retrieval?.hit_rate_at_5} target={0.85} isHigherBetter />
                            <MetricRow label="MRR@5" val={summaries.retrieval?.mrr_at_5} target={0.7} isHigherBetter />
                            <MetricRow label="Precision" val={summaries.retrieval?.context_precision} target={0.75} isHigherBetter />
                            <MetricRow label="Recall" val={summaries.retrieval?.context_recall} target={0.80} isHigherBetter />
                        </MetricCard>
                        
                        <MetricCard title="B. 生成质量 (RAGAS)" bg="bg-emerald-50">
                            <MetricRow label="Faithfulness" val={summaries.generation?.faithfulness_mean} target={0.85} isHigherBetter />
                            <MetricRow label="Relevancy" val={summaries.generation?.answer_relevancy_mean} target={0.8} isHigherBetter />
                            <MetricRow label="Hallucination" val={summaries.generation?.hallucination_rate_mean} target={0.15} isHigherBetter={false} />
                        </MetricCard>

                        <MetricCard title="D. 引用机制 (Citation)" bg="bg-indigo-50">
                            <MetricRow label="覆盖率 (Coverage)" val={summaries.citation?.citation_coverage} target={0.9} isHigherBetter />
                            <MetricRow label="正确率 (Accuracy)" val={summaries.citation?.citation_correctness} target={0.9} isHigherBetter />
                            <MetricRow label="幻觉引用率" val={summaries.citation?.hallucination_rate} target={0.1} isHigherBetter={false} />
                        </MetricCard>

                        <MetricCard title="C. 教练特性 (LLM Judge)" bg="bg-amber-50">
                            <MetricRow label="教练综合均分" val={summaries.coaching?.overall_avg} target={3.5} isHigherBetter unit="/5" />
                            <MetricRow label="共情度表现" val={summaries.coaching?.metrics?.empathy} target={3.0} isHigherBetter unit="/5" />
                            <MetricRow label="理论桥接能力" val={summaries.coaching?.metrics?.theory_bridge} target={3.5} isHigherBetter unit="/5" />
                        </MetricCard>
                    </div>

                    {/* 教练模块深水区 & 优化建议 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 场景得分 */}
                        <div className="bg-white border rounded-xl shadow-sm p-6 col-span-1">
                            <h3 className="text-md font-semibold mb-6 flex items-center gap-2 text-slate-800">
                                📊 分场景教练能力表现
                            </h3>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={coachingBarData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" domain={[0, 5]} hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} width={70} />
                                        <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#64748b', fontSize: 12, formatter: (v: any) => Number(v).toFixed(2) }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 低分案例 */}
                        <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col col-span-1">
                            <h3 className="text-md font-semibold mb-4 flex items-center gap-2 text-red-600">
                                <AlertTriangle size={18} />
                                待优化低分案例摘录 
                                <span className="text-xs font-normal text-slate-400">(≤ 2.5分)</span>
                            </h3>
                            <ScrollArea className="flex-1 pr-4 -mr-4 h-[220px]">
                                {data.low_score_cases && data.low_score_cases.length > 0 ? (
                                    <div className="space-y-4">
                                        {data.low_score_cases.map((tc: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-lg bg-red-50/50 border border-red-100 text-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-medium text-red-900 bg-red-100 px-2 py-0.5 rounded text-[10px]">
                                                        {tc.id} · {tc.category}
                                                    </span>
                                                    <span className="font-bold text-red-600 border-b border-red-200">{tc.avg_coaching_score?.toFixed(2)}分</span>
                                                </div>
                                                <p className="text-slate-700 font-medium mb-1 line-clamp-2">Q: {tc.question}</p>
                                                <p className="text-slate-500 text-xs line-clamp-2 italic">A: {tc.answer_preview}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                                        <CheckCircle size={32} className="mb-2 text-green-400 opacity-50" />
                                        <p className="text-sm">未检测到严重缺陷响应。</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        {/* 优化建议 */}
                        <div className="col-span-1 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-100 p-6 flex flex-col">
                            <div className="flex items-center gap-2 mb-4 text-amber-700">
                                <Info size={20} />
                                <h3 className="text-lg font-semibold">自适应优化指南</h3>
                            </div>
                            <ScrollArea className="flex-1 px-1 h-[220px]">
                                <ul className="space-y-4 pr-3">
                                    {data.suggestions?.map((sugg: string, i: number) => (
                                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                                            <span className="shrink-0 mt-0.5 text-amber-500">•</span>
                                            {sugg.includes('✅') ? <span className="text-green-600 font-medium">{sugg}</span> : <span>{sugg}</span>}
                                        </li>
                                    ))}
                                    {(!data.suggestions || data.suggestions.length === 0) && (
                                        <li className="text-slate-500 text-sm">暂无优化建议</li>
                                    )}
                                </ul>
                            </ScrollArea>
                        </div>
                    </div>

                </div>
            </ScrollArea>
        </div>
    );
}

// 辅助组件
function MetricCard({ title, children, bg }: { title: string, children: React.ReactNode, bg: string }) {
    return (
        <div className={`rounded-xl border p-4 shadow-sm flex flex-col ${bg} border-slate-100`}>
            <h4 className="font-semibold text-slate-700 mb-3 text-sm">{title}</h4>
            <div className="space-y-2 mt-auto">
                {children}
            </div>
        </div>
    );
}

function MetricRow({ label, val, target, isHigherBetter, unit = "" }: { label: string, val: number | null | undefined, target: number, isHigherBetter: boolean, unit?: string }) {
    if (val === null || val === undefined) {
        return <div className="flex justify-between text-xs"><span className="text-slate-500">{label}</span><span className="text-slate-400">N/A</span></div>;
    }
    
    // 判断是否达标
    const isGood = isHigherBetter ? val >= target : val <= target;

    return (
        <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">
            <span className="text-slate-600 text-xs">{label}</span>
            <div className="flex items-center gap-1.5">
                <span className={`font-medium ${isGood ? 'text-slate-800' : 'text-red-600'}`}>
                    {unit === 'ms' ? val.toFixed(0) : val.toFixed(3)}{unit}
                </span>
                {isGood ? <CheckCircle size={10} className="text-green-500" /> : <AlertTriangle size={10} className="text-amber-500" />}
            </div>
        </div>
    );
}
