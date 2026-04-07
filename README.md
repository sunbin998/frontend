# Graduate-RAG Frontend

Next.js 前端应用，负责：

- 登录 / 注册 / 刷新 token
- 会话、分类、日记、文档管理 UI
- 与后端流式聊天接口联动

## 运行

1. 确保后端已启动（默认 `http://127.0.0.1:8080`）
2. 安装依赖并启动前端

```bash
npm install
npm run dev
```

默认访问：`http://127.0.0.1:3000`

## 鉴权冒烟测试

在后端服务已启动（默认 `127.0.0.1:8080`）时，可运行：

```bash
npm run smoke:auth
```

可选：指定后端地址

```bash
AUTH_SMOKE_BASE_URL=http://127.0.0.1:8080/api npm run smoke:auth
```

该脚本会自动执行：注册 → `/auth/me` → refresh → `/auth/me` → 非法 token 401 校验。

## 用户隔离冒烟测试

在后端服务已启动（默认 `127.0.0.1:8080`）时，可运行：

```bash
npm run smoke:isolation
```

该脚本会自动执行：

- 创建用户 A / 用户 B
- 用户 A 创建会话
- 验证用户 B 列表看不到 A 的会话
- 验证用户 B 删除 A 的会话返回 `404`
- 用户 A 创建分类并验证用户 B 看不到

## 鉴权说明

- 登录后会保存 `access_token` 与 `refresh_token` 到 `localStorage`
- 普通 API 请求通过 Axios 自动附带 `Authorization: Bearer <token>`
- 当 access token 过期时，会自动调用 `/api/auth/refresh` 续签并重试原请求
- 如果 refresh 失败，会清空本地 token 并跳转 `/login`

## 路由

- `/` 欢迎/产品介绍页（公开）
- `/workspace` 主工作台（受保护）
- `/login` 登录
- `/register` 注册

## 常见问题

- **请求 404 / 502**：确认后端地址是否为 `127.0.0.1:8080`（见 `next.config.ts` 代理设置）
- **登录后仍跳回登录页**：检查浏览器是否禁用了 localStorage
