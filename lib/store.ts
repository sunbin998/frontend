// frontend/lib/store.ts
import { create } from 'zustand';
import api from './api';
import { Session, Category, Message, DocumentInfo, DiaryEntry } from './types';

interface AppState {
    // 数据状态
    sessions: Session[];
    categories: Category[];
    activeCategoryId: number | null;
    messages: Message[];
    currentSessionId: string | null;
    isLoading: boolean;
    documents: DocumentInfo[];
    diaries: DiaryEntry[];
    currentDiaryDate: string;

    // 动作 (Actions)
    fetchSessions: (keyword?: string, categoryId?: number) => Promise<void>;
    createSession: (title?: string) => Promise<void>;
    selectSession: (id: string) => void;
    deleteSession: (id: string) => Promise<void>;
    fetchMessages: (sessionId: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    fetchCategories: () => Promise<void>;
    setCategoryFilter: (id: number | null) => void;
    sendMessageStream: (content: string) => Promise<void>;
    fetchDocuments: () => Promise<void>;
    uploadDocument: (file: File) => Promise<void>;
    deleteDocument: (filename: string) => Promise<void>;
    fetchDiaries: (month?: string) => Promise<void>;
    saveDiary: (date: string, content: string, mood?: string, tags?: string[]) => Promise<void>;
    deleteDiary: (date: string) => Promise<void>;
    setDiaryDate: (date: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    sessions: [],
    categories: [],
    activeCategoryId: null,
    messages: [],
    currentSessionId: null,
    isLoading: false,
    documents: [],

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
    },

    sendMessageStream: async (content) => {
        const { currentSessionId, messages } = get();
        if (!currentSessionId) return;

        // 1. 乐观更新：用户消息立即上屏
        const tempUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content,
            created_at: new Date().toISOString()
        };

        // 2. 乐观更新：预置一个空的 AI 消息占位符
        const tempAiMsgId = (Date.now() + 1).toString();
        const tempAiMsg: Message = {
            id: tempAiMsgId,
            role: 'assistant',
            content: '', // 初始为空，稍后填充
            created_at: new Date().toISOString()
        };

        set({ messages: [...messages, tempUserMsg, tempAiMsg] });

        try {
            // 3. 使用原生 fetch 发起流式请求
            // 注意：这里需要完整的 URL，因为 fetch 不像 axios 自动走 base URL 配置
            // 但因为我们配置了 next.config.ts 的 proxy，所以可以直接写 /api/...
            const response = await fetch('/api/chat/messages/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: currentSessionId,
                    content: content
                })
            });

            if (!response.ok || !response.body) throw new Error("Stream Error");

            // 4. 读取流
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiContent = "";
            let pendingSources: any[] = [];
            let sseBuffer = ""; // 缓冲区：处理跨 chunk 的大型 SSE 事件

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                sseBuffer += decoder.decode(value, { stream: true });

                // 按双换行分割 SSE 事件，最后一段可能不完整，留在缓冲区
                const parts = sseBuffer.split('\n\n');
                sseBuffer = parts.pop() || ""; // 最后一段可能不完整

                for (const event of parts) {
                    if (!event.trim()) continue;

                    // 处理 sources 事件：event: sources\ndata: [...]
                    if (event.startsWith('event: sources')) {
                        const dataLine = event.split('\n').find(l => l.startsWith('data: '));
                        if (dataLine) {
                            try {
                                pendingSources = JSON.parse(dataLine.slice(6));

                                // 将 sources 附加到 AI 消息
                                set((state) => {
                                    const newMessages = [...state.messages];
                                    const idx = newMessages.findIndex(m => m.id === tempAiMsgId);
                                    if (idx !== -1) {
                                        newMessages[idx] = { ...newMessages[idx], sources: pendingSources };
                                    }
                                    return { messages: newMessages };
                                });
                            } catch (e) {
                                console.error("解析 sources 失败", e);
                            }
                        }
                        continue;
                    }

                    // 处理 title 事件：event: title\ndata: ...
                    if (event.startsWith('event: title')) {
                        // 标题更新了，刷新 sessions 列表
                        get().fetchSessions();
                        continue;
                    }

                    // 处理普通 data 事件
                    if (event.startsWith('data: ')) {
                        const data = event.slice(6);
                        if (data === '[DONE]') break;

                        // 后端用 JSON 编码了 token（保留换行符等特殊字符）
                        try {
                            const token = JSON.parse(data);
                            aiContent += token;
                        } catch {
                            // 降级：如果不是合法 JSON，直接用原始文本
                            aiContent += data;
                        }

                        // 5. 实时更新 Store 中的最后一条消息 (AI 消息)
                        set((state) => {
                            const newMessages = [...state.messages];
                            const lastMsgIndex = newMessages.findIndex(m => m.id === tempAiMsgId);
                            if (lastMsgIndex !== -1) {
                                newMessages[lastMsgIndex] = {
                                    ...newMessages[lastMsgIndex],
                                    content: aiContent
                                };
                            }
                            return { messages: newMessages };
                        });
                    }
                }
            }

            // 流结束，刷新会话列表(更新时间)
            get().fetchSessions();

        } catch (error) {
            console.error("流式发送失败", error);
            // 生产环境应该在这里处理错误回滚
        }
    },

    fetchDocuments: async () => {
        try {
            const res = await api.get<DocumentInfo[]>("/documents");
            set({ documents: res.data });
        } catch (error) {
            console.error("加载文档列表失败", error);
        }
    },

    uploadDocument: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post("/documents", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 300000, // 5分钟超时，大文件+Embedding可能较慢
            });

            // 上传成功后刷新文档列表
            get().fetchDocuments();
            return res.data;
        } catch (error: any) {
            const msg = error?.response?.data?.detail || error?.message || "上传失败";
            throw new Error(msg);
        }
    },

    deleteDocument: async (filename: string) => {
        try {
            await api.delete(`/documents/${encodeURIComponent(filename)}`);
            // 乐观更新
            set((state) => ({
                documents: state.documents.filter((d) => d.filename !== filename),
            }));
        } catch (error) {
            console.error("删除文档失败", error);
        }
    },

    // ==========================================
    // Diary
    // ==========================================
    diaries: [],
    currentDiaryDate: new Date().toISOString().slice(0, 10),

    setDiaryDate: (date: string) => {
        set({ currentDiaryDate: date });
    },

    fetchDiaries: async (month?: string) => {
        try {
            const params = month ? { month } : {};
            const res = await api.get<DiaryEntry[]>("/diary", { params });
            set({ diaries: res.data });
        } catch (error) {
            console.error("加载日记列表失败", error);
        }
    },

    saveDiary: async (date: string, content: string, mood?: string, tags?: string[]) => {
        try {
            await api.post("/diary", {
                date,
                content,
                mood: mood || null,
                tags: tags || null,
            });
            // 刷新列表
            get().fetchDiaries();
        } catch (error) {
            console.error("保存日记失败", error);
            throw error;
        }
    },

    deleteDiary: async (date: string) => {
        try {
            await api.delete(`/diary/${date}`);
            set((state) => ({
                diaries: state.diaries.filter(d => d.date !== date),
            }));
        } catch (error) {
            console.error("删除日记失败", error);
        }
    },

}));