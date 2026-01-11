// components/Sidebar.tsx
"use client"; // 必须标记为客户端组件，因为我们要处理点击事件

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, MessageSquare, Plus } from "lucide-react";

export function Sidebar() {
    return (
        <div className="w-[300px] border-r h-full flex flex-col bg-slate-50/50">
            {/* 顶部：新建对话与搜索 */}
            <div className="p-4 space-y-4">
                <Button className="w-full justify-start gap-2" variant="default">
                    <Plus size={16} />
                    新对话
                </Button>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="搜索历史对话..." className="pl-8" />
                </div>
            </div>

            <Separator />

            {/* 中部：分类标签 (Category Tabs) - 稍后实现 */}
            <div className="px-4 py-2">
                <h3 className="text-xs font-medium text-muted-foreground mb-2">分类筛选</h3>
                <div className="flex gap-2 flex-wrap">
                    {/* 这是一个静态占位，稍后接 API */}
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full cursor-pointer hover:opacity-80">
                        #机器学习
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full cursor-pointer hover:opacity-80">
                        #开发日志
                    </span>
                </div>
            </div>

            <Separator />

            {/* 下部：会话列表 (Session List) */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {/* Mock 数据展示 */}
                    {["Transformer 架构解析", "FastAPI 数据库报错", "随便聊聊"].map((title, i) => (
                        <Button
                            key={i}
                            variant="ghost"
                            className="w-full justify-start font-normal h-auto py-3 text-left"
                        >
                            <MessageSquare className="mr-2 h-4 w-4 opacity-70" />
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="truncate w-full font-medium text-sm">{title}</span>
                                <span className="truncate w-full text-xs text-muted-foreground">这里是摘要信息...</span>
                            </div>
                        </Button>
                    ))}
                </div>
            </ScrollArea>

            {/* 底部：用户信息区域 */}
            <div className="p-4 border-t">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">U</div>
                    <span>User (Student)</span>
                </div>
            </div>
        </div>
    );
}