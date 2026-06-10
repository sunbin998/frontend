// frontend/lib/store.ts
import { create } from 'zustand';
import api from './api';
import { clearAuthTokens, ensureValidAccessToken, setAuthTokens } from './auth';
import { Session, Category, Message, DocumentInfo, DiaryEntry, User, AuthResponse, Source } from './types';

const STREAM_TYPE_INTERVAL_MS = 14;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface AppState {
    user: User | null;
    isAuthenticated: boolean;
    isAuthChecking: boolean;
    isAssistantThinking: boolean;
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
    selectedBooks: string[];  // 选中的书籍过滤（空数组=全部）

    // 动作 (Actions)
    initAuth: () => Promise<void>;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, email?: string) => Promise<void>;
    refreshCurrentUser: () => Promise<void>;
    updateProfile: (payload: { username?: string; email?: string | null; password?: string }) => Promise<void>;
    uploadAvatar: (file: File) => Promise<void>;
    removeAvatar: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    logout: () => void;
    fetchSessions: (keyword?: string, categoryId?: number) => Promise<void>;
    createSession: (title?: string) => Promise<void>;
    selectSession: (id: string) => void;
    deleteSession: (id: string) => Promise<void>;
    fetchMessages: (sessionId: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    fetchCategories: () => Promise<void>;
    createCategory: (name: string, colorCode?: string) => Promise<void>;
    updateCategory: (id: number, name: string, colorCode?: string) => Promise<void>;
    deleteCategory: (id: number) => Promise<void>;
    setCategoryFilter: (id: number | null) => void;
    updateSessionCategory: (sessionId: string, categoryId: number | null) => Promise<void>;
    sendMessageStream: (content: string) => Promise<void>;
    fetchDocuments: () => Promise<void>;
    uploadDocument: (file: File) => Promise<void>;
    deleteDocument: (filename: string) => Promise<void>;
    fetchDiaries: (month?: string) => Promise<void>;
    saveDiary: (date: string, content: string, mood?: string, tags?: string[]) => Promise<void>;
    deleteDiary: (date: string) => Promise<void>;
    setDiaryDate: (date: string) => void;
    setSelectedBooks: (books: string[] | ((prev: string[]) => string[])) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isAuthChecking: true,
    isAssistantThinking: false,
    sessions: [],
    categories: [],
    activeCategoryId: null,
    messages: [],
    currentSessionId: null,
    isLoading: false,
    documents: [],

    initAuth: async () => {
        set({ isAuthChecking: true });
        const token = await ensureValidAccessToken();
        if (!token) {
            clearAuthTokens();
            set({ user: null, isAuthenticated: false, isAuthChecking: false });
            return;
        }

        try {
            const res = await api.get<User>('/auth/me');
            set({ user: res.data, isAuthenticated: true, isAuthChecking: false });
        } catch {
            clearAuthTokens();
            set({ user: null, isAuthenticated: false, isAuthChecking: false });
        }
    },

    login: async (username, password) => {
        const res = await api.post<AuthResponse>('/auth/login', { username, password });
        setAuthTokens(res.data.access_token, res.data.refresh_token);
        set({ user: res.data.user, isAuthenticated: true, isAuthChecking: false });
    },

    register: async (username, password, email) => {
        const res = await api.post<AuthResponse>('/auth/register', {
            username,
            password,
            email: email || null,
        });
        setAuthTokens(res.data.access_token, res.data.refresh_token);
        set({ user: res.data.user, isAuthenticated: true, isAuthChecking: false });
    },

    refreshCurrentUser: async () => {
        const res = await api.get<User>('/auth/me');
        set({ user: res.data, isAuthenticated: true, isAuthChecking: false });
    },

    updateProfile: async (payload) => {
        const cleanPayload: { username?: string; email?: string | null; password?: string } = {};
        if (typeof payload.username === 'string') {
            const username = payload.username.trim();
            if (username) cleanPayload.username = username;
        }
        if (payload.email !== undefined) {
            const email = payload.email?.trim();
            cleanPayload.email = email ? email : null;
        }
        if (payload.password) {
            cleanPayload.password = payload.password;
        }

        const res = await api.put<User>('/auth/me', cleanPayload);
        set({ user: res.data });
    },

    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post<User>('/auth/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        set({ user: res.data });
    },

    removeAvatar: async () => {
        const res = await api.delete<User>('/auth/me/avatar');
        set({ user: res.data });
    },

    deleteAccount: async () => {
        await api.delete('/auth/me');
        clearAuthTokens();
        set({
            user: null,
            isAuthenticated: false,
            isAuthChecking: false,
            isAssistantThinking: false,
            sessions: [],
            categories: [],
            activeCategoryId: null,
            messages: [],
            currentSessionId: null,
            documents: [],
            diaries: [],
            selectedBooks: [],
            currentDiaryDate: new Date().toISOString().slice(0, 10),
        });
    },

    logout: () => {
        clearAuthTokens();
        set({
            user: null,
            isAuthenticated: false,
            isAuthChecking: false,
            isAssistantThinking: false,
            sessions: [],
            categories: [],
            activeCategoryId: null,
            messages: [],
            currentSessionId: null,
            documents: [],
            diaries: [],
            selectedBooks: [],
            currentDiaryDate: new Date().toISOString().slice(0, 10),
        });
    },

    fetchSessions: async (keyword, categoryId) => {
        set({ isLoading: true });
        try {
            const params: Record<string, string> = {};
            if (keyword) params.keyword = keyword;
            if (categoryId) params.category_id = categoryId.toString();

            const res = await api.get<Session[]>("/sessions/", { params });
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
            const res = await api.post<Session>("/sessions/", { title });
            const newSession = res.data;

            const sessionDate = newSession.created_at
                ? new Date(newSession.created_at).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10);

            // 2. 乐观更新：直接把新会话加到列表头部，并自动选中
            set((state) => ({
                sessions: [newSession, ...state.sessions],
                currentSessionId: newSession.id,
                currentDiaryDate: sessionDate,
                messages: [],
                isAssistantThinking: false,
            }));

            // 3. 立即拉取新会话消息（包含后端自动写入的欢迎语）
            await get().fetchMessages(newSession.id);
        } catch (error) {
            console.error("Failed to create session", error);
        }
    },

    selectSession: (id) => {
        // 找到对应 session，同步日记日期到该会话的创建日期
        const session = get().sessions.find(s => s.id === id);
        const sessionDate = session?.created_at
            ? new Date(session.created_at).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10);

        set({ currentSessionId: id, currentDiaryDate: sessionDate, isAssistantThinking: false });
        get().fetchMessages(id);
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
        set({ messages: [], isAssistantThinking: false });
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
            const res = await api.get<Category[]>("/categories/");
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

    createCategory: async (name, colorCode) => {
        try {
            await api.post('/categories/', { name, color_code: colorCode || '#6366f1' });
            get().fetchCategories();
        } catch (error) {
            console.error('创建分类失败', error);
        }
    },

    updateCategory: async (id, name, colorCode) => {
        try {
            await api.put(`/categories/${id}`, { name, color_code: colorCode });
            get().fetchCategories();
        } catch (error) {
            console.error('更新分类失败', error);
        }
    },

    deleteCategory: async (id) => {
        try {
            await api.delete(`/categories/${id}`);
            if (get().activeCategoryId === id) {
                set({ activeCategoryId: null });
            }
            get().fetchCategories();
            get().fetchSessions();
        } catch (error) {
            console.error('删除分类失败', error);
        }
    },

    updateSessionCategory: async (sessionId, categoryId) => {
        try {
            const payload = categoryId === null
                ? { clear_category: true }
                : { category_id: categoryId };
            await api.patch(`/sessions/${sessionId}`, payload);
            get().fetchSessions();
        } catch (error) {
            console.error('更新会话分类失败', error);
        }
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

        set({ messages: [...messages, tempUserMsg, tempAiMsg], isAssistantThinking: true });

        try {
            const accessToken = await ensureValidAccessToken();
            if (!accessToken) {
                set({ isAssistantThinking: false });
                return;
            }

            // 3. 使用原生 fetch 发起流式请求
            // 注意：这里需要完整的 URL，因为 fetch 不像 axios 自动走 base URL 配置
            // 但因为我们配置了 next.config.ts 的 proxy，所以可以直接写 /api/...
            const response = await fetch('/api/chat/messages/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    session_id: currentSessionId,
                    content: content,
                    book_filter: get().selectedBooks.length > 0 ? get().selectedBooks : null,
                })
            });

            if (!response.ok || !response.body) throw new Error("Stream Error");

            // 4. 读取流
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiContent = "";
            let renderedAiContent = "";
            let pendingSources: Source[] = [];
            let sseBuffer = ""; // 缓冲区：处理跨 chunk 的大型 SSE 事件
            const renderAssistantText = async (text: string) => {
                if (!text) return;

                set({ isAssistantThinking: false });

                for (const char of Array.from(text)) {
                    renderedAiContent += char;

                    set((state) => {
                        const newMessages = [...state.messages];
                        const lastMsgIndex = newMessages.findIndex(m => m.id === tempAiMsgId);
                        if (lastMsgIndex !== -1) {
                            newMessages[lastMsgIndex] = {
                                ...newMessages[lastMsgIndex],
                                content: renderedAiContent
                            };
                        }
                        return { messages: newMessages };
                    });

                    await wait(STREAM_TYPE_INTERVAL_MS);
                }
            };

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
                                pendingSources = JSON.parse(dataLine.slice(6)) as Source[];

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
                        if (data === '[DONE]') {
                            set({ isAssistantThinking: false });
                            break;
                        }

                        // 后端用 JSON 编码了 token（保留换行符等特殊字符）
                        try {
                            const token = JSON.parse(data);
                            aiContent += token;
                        } catch {
                            // 降级：如果不是合法 JSON，直接用原始文本
                            aiContent += data;
                        }

                        // 5. 逐字写入 Store，避免大 chunk 被 React 合并成整段突然出现
                        await renderAssistantText(aiContent.slice(renderedAiContent.length));
                    }
                }
            }

            // 流结束，刷新会话列表(更新时间)
            set({ isAssistantThinking: false });
            get().fetchSessions();

        } catch (error) {
            set({ isAssistantThinking: false });
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
        } catch (error: unknown) {
            const maybeError = error as { response?: { data?: { detail?: string } }; message?: string };
            const msg = maybeError?.response?.data?.detail || maybeError?.message || "上传失败";
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
    selectedBooks: [],

    setSelectedBooks: (books) => {
        if (typeof books === 'function') {
            set((state) => ({ selectedBooks: books(state.selectedBooks) }));
            return;
        }
        set({ selectedBooks: books });
    },

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