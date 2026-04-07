"use client";

import { useEffect } from "react";

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
};

export function ConfirmDialog({
    open,
    title,
    description,
    confirmText = "确认",
    cancelText = "取消",
    onConfirm,
    onCancel,
    danger = true,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onCancel();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
            <button
                className="absolute inset-0 bg-[#141413]/45 backdrop-blur-[1px]"
                aria-label="close-confirm-dialog"
                onClick={onCancel}
            />

            <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#e8e6dc] bg-[#faf9f5] p-6 shadow-[rgba(0,0,0,0.18)_0_12px_36px]">
                <h3 className="font-editorial text-2xl leading-tight text-[#141413]">{title}</h3>
                {description && <p className="mt-3 text-sm leading-relaxed text-[#5e5d59]">{description}</p>}

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-4 py-2 text-sm text-[#4d4c48] hover:bg-[#f0eee6] transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={
                            danger
                                ? "rounded-xl bg-[#b53333] px-4 py-2 text-sm text-[#faf9f5] hover:bg-[#9f2d2d] transition-colors"
                                : "rounded-xl bg-[#c96442] px-4 py-2 text-sm text-[#faf9f5] hover:bg-[#b85b3b] transition-colors"
                        }
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
