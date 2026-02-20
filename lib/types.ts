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
    sources?: Source[];
}

export interface Source {
    filename: string;
    score: number;
    preview: string;
}

export interface DocumentInfo {
    filename: string;
    chunk_count: number;
}

export interface DiaryEntry {
    id: string;
    date: string;
    content: string;
    mood: string | null;
    tags: string[] | null;
    is_vectorized: boolean;
    created_at: string;
    updated_at: string;
}