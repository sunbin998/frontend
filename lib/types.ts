// frontend/lib/types.ts
export interface Session {
    id: string;
    title: string;
    summary?: string;
    is_pinned: boolean;
    category_id?: number;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    color_code: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface DocumentInfo {
    filename: string;
    chunk_count: number;
}