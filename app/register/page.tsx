"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

function getErrorMessage(err: unknown): string {
    if (typeof err === "object" && err !== null) {
        const maybeErr = err as { response?: { data?: { detail?: string } }; message?: string };
        return maybeErr.response?.data?.detail || maybeErr.message || "注册失败，请重试";
    }
    return "注册失败，请重试";
}

export default function RegisterPage() {
    const router = useRouter();
    const { register, initAuth, isAuthenticated, isAuthChecking } = useAppStore();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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
            setError("用户名和密码不能为空");
            return;
        }

        if (password.length < 6) {
            setError("密码至少需要 6 位");
            return;
        }

        if (password !== confirmPassword) {
            setError("两次输入的密码不一致");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            await register(username.trim(), password, email.trim() || undefined);
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
                    <h1 className="text-xl font-semibold text-slate-800">注册新账号</h1>
                    <p className="text-sm text-slate-500 mt-1">创建你的专属成长知识空间。</p>
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
                        <label className="block text-sm text-slate-600 mb-1">邮箱（可选）</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">密码</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            placeholder="至少 6 位"
                            autoComplete="new-password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">确认密码</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            placeholder="再次输入密码"
                            autoComplete="new-password"
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
                        {submitting ? "注册中..." : "注册并登录"}
                    </button>
                </form>

                <p className="text-sm text-slate-500">
                    已有账号？{" "}
                    <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        立即登录
                    </Link>
                </p>
            </div>
        </main>
    );
}
