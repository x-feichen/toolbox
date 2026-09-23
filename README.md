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

## 部署（Docker Compose）

一键部署完整栈（PostgreSQL + FastAPI + Next.js + Nginx 统一入口）：

```bash
cp .env.example .env    # 先修改 SESSION_SECRET 等敏感配置
docker compose up -d --build
```

访问 `http://localhost`（Nginx 统一入口，浏览器同源，无需额外 CORS）：

| 路径 | 服务 |
| --- | --- |
| `/` | Next.js 前端 |
| `/api/v1/*`、`/openapi.json` | FastAPI 后端（启动时自动执行 Alembic 迁移） |

- PostgreSQL 端口仅绑定 `127.0.0.1:5432`（IDE 工具链可连，公网不可达）。
- 后端本地开发：`docker compose up -d postgres` 只起数据库，再在宿主运行 uvicorn。
- 公网部署：在 `.env` 中设置 `NEXT_PUBLIC_API_URL=https://你的域名`（前端 build arg）与 `CORS_ORIGINS`，再重新 `up -d --build`。
- 基础镜像与依赖源：默认配置了国内镜像（PyPI 清华源 / npmmirror），海外环境可删除 Dockerfile 中对应行。

### 开发模式（源码热更新）

改代码即时生效，无需重建镜像：

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

差异（生产默认不受影响）：

| 服务 | 变化 |
| --- | --- |
| backend | 挂载 `backend/app` + `alembic`，uvicorn `--reload`（含轮询监听，Windows/macOS 挂载可靠） |
| frontend | 挂载 `frontend/src` + `packages/api-client/src`，运行 `next dev`（HMR） |

入口与生产一致：`http://localhost`。**依赖变更**（`pyproject.toml` / `package.json`）仍需重建：把上面的命令加上 `--build`。切回生产：`docker compose -f docker-compose.yml -f docker-compose.dev.yml down` 后重新 `docker compose up -d`。

## 测试

```bash
# 后端（42 个测试：安全原语 / 认证 / 工具契约 / 提示词权限隔离 / 收藏历史）
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
