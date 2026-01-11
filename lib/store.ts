// frontend/lib/store.ts
import { create } from 'zustand';
import api from './api';
import { Session, Category, Message } from './types';

interface AppState {
    // 数据状态
    sessions: Session[];
    categories: Category[];
    activeCategoryId: number | null; // 新增：当前选中的分类过滤器
    messages: Message[];
    currentSessionId: string | null;
    isLoading: boolean;

    // 动作 (Actions)
    fetchSessions: (keyword?: string, categoryId?: number) => Promise<void>;
    createSession: (title?: string) => Promise<void>;
    selectSession: (id: string) => void;
    deleteSession: (id: string) => Promise<void>;
    fetchMessages: (sessionId: string) => Promise<void>; // 新增
    sendMessage: (content: string) => Promise<void>;     // 新增
    fetchCategories: () => Promise<void>; // 新增动作
    setCategoryFilter: (id: number | null) => void; // 新增动作
}

export const useAppStore = create<AppState>((set, get) => ({
    sessions: [],
    categories: [], // 暂时留空，后续实现分类 API 后再补
    activeCategoryId: null,
    messages: [],
    currentSessionId: null,
    isLoading: false,

    fetchSessions: async (keyword, categoryId) => {
        set({ isLoading: true });
        try {
            const params = new URLSearchParams();
            if (keyword) params.append("keyword", keyword);
            if (categoryId) params.append("category_id", categoryId.toString());

            const res = await api.get<Session[]>(`/sessions?${params.toString()}`);
            set({ sessions: res.data });
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            set({ isLoading: false });
        }
    },

    createSession: async (title = "新对话") => {
        try {
            // 1. 调用后端创建
            const res = await api.post<Session>("/sessions", { title });
            const newSession = res.data;

            // 2. 乐观更新：直接把新会话加到列表头部，并自动选中
            set((state) => ({
                sessions: [newSession, ...state.sessions],
                currentSessionId: newSession.id
            }));
        } catch (error) {
            console.error("Failed to create session", error);
        }
    },

    selectSession: (id) => {
        set({ currentSessionId: id });
        // TODO: 这里未来会触发 "fetchMessages(id)"
        get().fetchMessages(id); // <--- 关键联动
    },

    deleteSession: async (id) => {
        // 稍微复杂的逻辑：删除后如果当前正选中该会话，需要重置选中状态
        try {
            await api.delete(`/sessions/${id}`);
            set((state) => ({
                sessions: state.sessions.filter(s => s.id !== id),
                currentSessionId: state.currentSessionId === id ? null : state.currentSessionId
            }));
        } catch (error) {
            console.error("删除失败", error);
        }
    },

    fetchMessages: async (sessionId) => {
        // 切换会话时，先清空旧消息，防止闪烁
        set({ messages: [] });
        try {
            const res = await api.get<Message[]>(`/chat/messages?session_id=${sessionId}`);
            set({ messages: res.data });
        } catch (error) {
            console.error("加载消息失败", error);
        }
    },

    sendMessage: async (content) => {
        const { currentSessionId, messages } = get();
        if (!currentSessionId) return;

        // 1. 乐观更新 (Optimistic UI)：不用等后端，直接先把用户的话画上去
        const tempUserMsg: Message = {
            id: Date.now().toString(), // 临时 ID
            role: 'user',
            content: content,
            created_at: new Date().toISOString()
        };
        set({ messages: [...messages, tempUserMsg] });

        try {
            // 2. 发送给后端
            const res = await api.post<Message>("/chat/messages", {
                session_id: currentSessionId,
                content: content
            });

            // 3. 收到 AI 回复后，追加到列表
            const aiMsg = res.data;
            set((state) => ({ messages: [...state.messages, aiMsg] }));

            // 4. 刷新一下会话列表（因为 updated_at 变了，需要置顶）
            get().fetchSessions();

        } catch (error) {
            console.error("发送失败", error);
            // 失败了应该把那条乐观消息撤回，这里暂略
        }
    },

    fetchCategories: async () => {
        try {
            const res = await api.get<Category[]>("/categories");
            set({ categories: res.data });
        } catch (error) {
            console.error("加载分类失败", error);
        }
    },

    setCategoryFilter: (id) => {
        set({ activeCategoryId: id });
        // 切换分类时，重新加载会话列表
        get().fetchSessions(undefined, id || undefined);
    }
}));