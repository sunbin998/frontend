"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

function getErrorMessage(err: unknown): string {
    if (typeof err === "object" && err !== null) {
        const maybeErr = err as { response?: { data?: { detail?: string } }; message?: string };
        return maybeErr.response?.data?.detail || maybeErr.message || "登录失败，请重试";
    }
    return "登录失败，请重试";
}

export default function LoginPage() {
    const router = useRouter();
    const { login, initAuth, isAuthenticated, isAuthChecking } = useAppStore();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    useEffect(() => {
        if (!isAuthChecking && isAuthenticated) {
            router.replace("/");
        }
    }, [isAuthChecking, isAuthenticated, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password) {
            setError("请输入用户名和密码");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            await login(username.trim(), password);
            router.replace("/");
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-5">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">登录 Graduate-RAG</h1>
                    <p className="text-sm text-slate-500 mt-1">欢迎回来，继续你的成长对话。</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">用户名</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            placeholder="请输入用户名"
                            autoComplete="username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">密码</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            placeholder="请输入密码"
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm px-3 py-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm py-2.5 transition-colors"
                    >
                        {submitting ? "登录中..." : "登录"}
                    </button>
                </form>

                <p className="text-sm text-slate-500">
                    还没有账号？{" "}
                    <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        立即注册
                    </Link>
                </p>
            </div>
        </main>
    );
}
