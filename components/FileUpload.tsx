// components/FileUpload.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Upload, X, FileText, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = [".pdf", ".epub", ".mobi", ".azw", ".azw3", ".txt", ".md"];
const ACCEPTED_MIME_TYPES = [
    "application/pdf",
    "application/epub+zip",
    "text/plain",
    "text/markdown",
    // mobi/azw 没有标准 MIME，用空字符串兜底
];

export function FileUpload() {
    const { documents, fetchDocuments, uploadDocument, deleteDocument } = useAppStore();
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // 拖拽事件处理
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            await handleUpload(files[0]);
        }
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            await handleUpload(files[0]);
        }
        // 重置 input 以便再次选同一文件
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleUpload = async (file: File) => {
        // 校验扩展名
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
            setUploadStatus({
                type: "error",
                message: `不支持的格式: ${ext}。支持: ${ACCEPTED_EXTENSIONS.join(", ")}`,
            });
            return;
        }

        // 校验大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setUploadStatus({
                type: "error",
                message: `文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，请上传小于 10MB 的文件`,
            });
            return;
        }

        setIsUploading(true);
        setUploadStatus(null);

        try {
            await uploadDocument(file);
            setUploadStatus({
                type: "success",
                message: `${file.name} 上传成功！`,
            });
        } catch (error: any) {
            setUploadStatus({
                type: "error",
                message: error?.message || "上传失败，请重试",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* 拖拽上传区域 */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                    isDragging
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50"
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_EXTENSIONS.join(",")}
                    onChange={handleFileSelect}
                />
                {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-indigo-600">
                        <Loader2 size={32} className="animate-spin" />
                        <p className="text-sm font-medium">正在处理文件...</p>
                        <p className="text-xs text-slate-400">解析 → 切片 → Embedding 生成中</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Upload size={32} className={isDragging ? "text-indigo-500" : ""} />
                        <p className="text-sm font-medium text-slate-600">
                            拖拽文件到这里，或 <span className="text-indigo-600 underline">点击选择</span>
                        </p>
                        <p className="text-xs">支持 PDF、EPUB、MOBI、AZW、TXT、MD</p>
                    </div>
                )}
            </div>

            {/* 状态提示 */}
            {uploadStatus && (
                <div
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                        uploadStatus.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                    )}
                >
                    {uploadStatus.type === "success" ? (
                        <CheckCircle2 size={16} />
                    ) : (
                        <X size={16} />
                    )}
                    <span className="flex-1">{uploadStatus.message}</span>
                    <button onClick={() => setUploadStatus(null)} className="hover:opacity-70">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* 已上传文档列表 */}
            {documents.length > 0 && (
                <div className="space-y-1">
                    <h4 className="text-xs font-medium text-slate-500 mb-2">📚 知识库文件</h4>
                    {documents.map((doc) => (
                        <div
                            key={doc.filename}
                            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-100 group"
                        >
                            <FileText size={16} className="text-indigo-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">
                                    {doc.filename}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    {doc.chunk_count} 个切片
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`确定删除 ${doc.filename}？`)) {
                                        deleteDocument(doc.filename);
                                    }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
