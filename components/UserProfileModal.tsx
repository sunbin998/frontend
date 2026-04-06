"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/lib/store";

type Props = {
    open: boolean;
    onClose: () => void;
};

function getInitials(name?: string | null): string {
    if (!name) return "U";
    return name.trim().slice(0, 1).toUpperCase();
}

export function UserProfileModal({ open, onClose }: Props) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const {
        user,
        updateProfile,
        uploadAvatar,
        removeAvatar,
        deleteAccount,
    } = useAppStore();

    const [username, setUsername] = useState(user?.username || "");
    const [email, setEmail] = useState(user?.email || "");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setUsername(user?.username || "");
            setEmail(user?.email || "");
            setPassword("");
            setMessage(null);
            setError(null);
        }
    }, [open, user]);

    if (!open || !user) return null;

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            await updateProfile({
                username,
                email,
                password: password || undefined,
            });
            setPassword("");
            setMessage("个人信息已更新");
        } catch (e: unknown) {
            const maybeError = e as { response?: { data?: { detail?: string } }; message?: string };
            setError(maybeError?.response?.data?.detail || maybeError?.message || "更新失败");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file?: File) => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            await uploadAvatar(file);
            setMessage("头像上传成功");
        } catch (e: unknown) {
            const maybeError = e as { response?: { data?: { detail?: string } }; message?: string };
            setError(maybeError?.response?.data?.detail || maybeError?.message || "头像上传失败");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            await removeAvatar();
            setMessage("头像已移除");
        } catch (e: unknown) {
            const maybeError = e as { response?: { data?: { detail?: string } }; message?: string };
            setError(maybeError?.response?.data?.detail || maybeError?.message || "移除头像失败");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm("确认删除当前账号？此操作不可恢复。\n你的会话、日记、分类和文档都会被删除。");
        if (!confirmed) return;

        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            await deleteAccount();
            router.replace("/login");
        } catch (e: unknown) {
            const maybeError = e as { response?: { data?: { detail?: string } }; message?: string };
            setError(maybeError?.response?.data?.detail || maybeError?.message || "删除账号失败");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button className="absolute inset-0 bg-black/35" onClick={onClose} aria-label="close-overlay" />

            <div className="relative z-10 w-[92vw] max-w-md rounded-2xl bg-white shadow-xl border p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">用户管理</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>关闭</Button>
                </div>

                <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 border border-slate-200">
                        <AvatarImage src={user.avatar || undefined} alt="user-avatar" />
                        <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                    </Avatar>

                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => handleUpload(e.target.files?.[0])}
                        />
                        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={loading}>
                            上传头像
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDeleteAvatar} disabled={loading || !user.avatar}>
                            移除头像
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-slate-500">用户名</label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={50} />
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-slate-500">邮箱</label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} maxLength={100} />
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-slate-500">新密码（可选）</label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="不修改请留空"
                        minLength={6}
                    />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}
                {message && <p className="text-xs text-emerald-600">{message}</p>}

                <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>取消</Button>
                    <Button onClick={handleSave} disabled={loading}>保存资料</Button>
                </div>

                <div className="pt-3 border-t">
                    <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={handleDeleteAccount}
                        disabled={loading}
                    >
                        删除账号（危险操作）
                    </Button>
                </div>
            </div>
        </div>
    );
}
