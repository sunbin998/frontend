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
        <main className="min-h-screen bg-[#f5f4ed] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-3xl bg-[#faf9f5] border border-[#f0eee6] shadow-[rgba(0,0,0,0.05)_0_4px_24px] p-7 space-y-6">
                <div>
                    <p className="text-[10px] tracking-[0.5px] uppercase text-[#87867f] mb-2">Graduate-RAG</p>
                    <h1 className="text-3xl leading-tight text-[#141413] font-editorial">创建新的成长账号</h1>
                    <p className="text-sm text-[#5e5d59] mt-2">创建你的专属成长知识空间。</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-[#4d4c48] mb-1">用户名</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3 py-2 text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#3898ec]/35 focus:border-[#3898ec]"
                            placeholder="请输入用户名"
                            autoComplete="username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[#4d4c48] mb-1">邮箱（可选）</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3 py-2 text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#3898ec]/35 focus:border-[#3898ec]"
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[#4d4c48] mb-1">密码</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3 py-2 text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#3898ec]/35 focus:border-[#3898ec]"
                            placeholder="至少 6 位"
                            autoComplete="new-password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[#4d4c48] mb-1">确认密码</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3 py-2 text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#3898ec]/35 focus:border-[#3898ec]"
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
                        className="w-full rounded-xl bg-[#c96442] hover:bg-[#b85b3b] disabled:opacity-60 text-[#faf9f5] text-sm py-2.5 transition-colors shadow-[#c96442_0_0_0_0,#c96442_0_0_0_1px]"
                    >
                        {submitting ? "注册中..." : "注册并登录"}
                    </button>
                </form>

                <p className="text-sm text-[#5e5d59]">
                    已有账号？{" "}
                    <Link href="/login" className="text-[#c96442] hover:text-[#d97757] font-medium">
                        立即登录
                    </Link>
                </p>
            </div>
        </main>
    );
}
