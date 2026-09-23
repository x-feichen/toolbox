# ToolBox

轻量、简洁、可扩展的在线工具工作台。

> 打开 → 找到 → 使用 → 完成

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Next.js 15 + React 19 + TypeScript + Tailwind CSS 4 |
| 服务端状态 | TanStack Query |
| 后端 | Python 3.13 + FastAPI + Pydantic + SQLAlchemy 2 (async) |
| 数据库 | PostgreSQL 16（Alembic 迁移） |
| 认证 | HttpOnly Cookie + 服务端 Session，Argon2id 密码哈希 |
| 工程 | pnpm Monorepo / uv / Docker Compose / Vitest / pytest |

## 目录结构

```
toolbox/
├── backend/            FastAPI 应用（app/core, app/auth, app/tools, app/prompts ...）
│   ├── app/main.py     应用工厂：CORS、CSRF Origin 校验、错误规范、工具注册
│   ├── app/tools/      Tool Contract + Registry + 各工具包（manifest/service）
│   ├── alembic/        数据库迁移
│   └── tests/          pytest 单元测试 + API 测试
├── frontend/           Next.js App Router 前端
│   └── src/
│       ├── app/        页面（首页 / 工具工作台 / 登录注册 / 收藏）
│       ├── components/ App Shell、Command Palette、Tool 渲染层、UI 基础件
│       ├── features/   auth / tools 数据层（TanStack Query hooks）
│       └── lib/        工具客户端逻辑（json-formatter 等）、localStorage recent
├── packages/api-client 共享 TypeScript API 客户端（类型 + 错误模型）
├── docs/               产品与技术设计文档、UI/UX 设计规范
└── docker-compose.yml  PostgreSQL 开发环境
```

## 快速开始

### 1. 启动数据库

```bash
docker compose up -d        # PostgreSQL 16，端口 5432
```

### 2. 启动后端（端口 8000）

```bash
cd backend
uv sync                     # 安装依赖
cp ../.env.example .env     # 配置环境变量（首次）
uv run alembic upgrade head # 初始化数据库结构
uv run uvicorn app.main:app --reload --port 8000
```

- API 文档：<http://localhost:8000/api/docs>
- 健康检查：<http://localhost:8000/api/v1/health>

### 3. 启动前端（端口 3000）

```bash
pnpm install
pnpm dev:frontend           # http://localhost:3000
```

如端口 3000 被占用可换端口，并同步更新 `backend/.env` 的 `CORS_ORIGINS`。

## 测试

```bash
# 后端（42 个测试：安全原语 / 认证 / 工具契约 / Prompt 权限隔离 / 收藏历史）
cd backend && uv run pytest

# api-client（4 个测试）+ 前端逻辑（9 个测试）
pnpm --filter @toolbox/api-client test
pnpm --filter @toolbox/frontend test

# 类型检查与生产构建
pnpm --filter @toolbox/frontend typecheck
pnpm --filter @toolbox/frontend build
```

## 架构要点

- **Tool Contract**（`backend/app/tools/base.py`）：每个工具由 `Access`（public / authenticated）、`Execution`（client / server / hybrid）、`UI`（form / editor / custom …）三个维度声明，manifest 注册进 Registry，平台自动完成导航、发现与权限。
- **新增工具零侵入**：新建 `app/tools/<tool>/` 包并 `registry.register(manifest, service?)`，前端工作台自动出现，无需修改导航或渲染核心。
- **按需登录**：前端 AccessGuard 只负责 UX；后端每个受保护 API 通过 session cookie 独立校验（原则：前端管 UX，后端管 Security）。
- **用户数据隔离**：所有查询强制 `user_id` 作用域，越权访问一律返回 404（不泄露存在性）。
- **隐私默认**：客户端工具（JSON Formatter 等）在浏览器内执行，服务器不接触工具输入；历史只记录"谁在何时用了哪个工具"。
- **错误规范**：所有错误返回 `{"error": {"code": "...", "message": "..."}}`，前端按 `code` 分支。

## 测试说明

后端测试默认使用文件型 SQLite 保证密闭性（生产仍是 PostgreSQL + Alembic）；
如需在 CI 中用真实 PostgreSQL，设置 `DATABASE_URL` 指向测试库后运行 `pytest`。

## 环境变量

见 `.env.example`。生产环境的 Secret 通过环境/Secret Manager 注入，禁止提交 Git。
