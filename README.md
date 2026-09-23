# ToolBox

轻量、简洁、可扩展的在线工具工作台。

> **打开 → 找到 → 使用 → 完成**

核心原则：**能在浏览器完成的事，不发送到服务器。** 工具逻辑全部由 TypeScript 在客户端执行，输入不离开浏览器；后端只承担平台职责（工具发现、导航、权限、个人数据）。

## 工具清单

第一阶段 13 个工具，除提示词工具外全部**免登录、即开即用**。

### 开发工具

| 工具 | 说明 |
| --- | --- |
| JSON 格式化 | 格式化 / 压缩 / 校验，错误精确定位到行列 |
| UUID 生成器 | 批量生成 UUID v4（1 / 5 / 10） |
| Base64 编解码 | UTF-8 安全，支持中文与 emoji |
| URL 编解码 | URL 组件编码 / 解码 |
| 时间戳转换 | Unix 时间戳 ↔ 日期，支持秒 / 毫秒 |
| JWT 解码 | 解码 Header 与 Payload（**仅解码，不验证签名**） |

### 文本工具

| 工具 | 说明 |
| --- | --- |
| 字数统计 | 字符 / 不含空格 / 词数 / 行数 / 段落，中文分词感知 |
| 大小写转换 | UPPER / lower / Title / camel / Pascal / snake / kebab |
| 文本对比 | LCS 行级 diff（新增 / 删除 / 保留标记） |
| 去除重复行 | 保留首次出现顺序，可忽略空行、忽略大小写 |

### 数据 / 图片 / AI

| 工具 | 说明 |
| --- | --- |
| CSV ↔ JSON | RFC-4180 解析（引号、逗号、换行、转义、UTF-8），双向转换 |
| 图片压缩 | Canvas 本地压缩 JPG/PNG/WebP，可调质量与输出格式，不传服务器 |
| 提示词工具 🔒 | 提示词管理：搜索、`{{变量}}` 填充、完整提示词复制、置顶（需登录） |

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Next.js 15 + React 19 + TypeScript + Tailwind CSS 4 + TanStack Query |
| 后端 | Python 3.13 + FastAPI + Pydantic + SQLAlchemy 2 (async) + Alembic |
| 数据库 | PostgreSQL 16 |
| 认证 | HttpOnly Cookie + 服务端 Session（Argon2id 密码哈希、CSRF Origin 校验） |
| 工程 | pnpm Monorepo / uv / Docker Compose / Vitest / pytest |

## 快速开始

### 方式 A：Docker 一键启动（推荐）

```bash
cp .env.example .env    # 生产部署请先修改 SESSION_SECRET
docker compose up -d --build
```

打开 **<http://localhost>**（Nginx 统一入口，浏览器同源，无需配置 CORS）。

| 路径 | 服务 |
| --- | --- |
| `/` | Next.js 前端 |
| `/api/v1/*`、`/api/docs` | FastAPI 后端（容器启动时自动执行数据库迁移） |

### 方式 B：本地开发（宿主直接跑代码）

```bash
# 1. 只启动数据库
docker compose up -d postgres

# 2. 后端（http://localhost:8000）
cd backend
uv sync
cp ../.env.example .env      # 首次
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

# 3. 前端（http://localhost:3000）
pnpm install
pnpm dev:frontend
```

API 文档：<http://localhost:8000/api/docs>　健康检查：<http://localhost:8000/api/v1/health>

### 方式 C：容器内开发（源码热更新）

改代码即时生效，无需重建镜像：

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

| 服务 | 开发模式差异 |
| --- | --- |
| backend | 挂载 `backend/app` + `alembic`，uvicorn `--reload` |
| frontend | 挂载 `frontend/src` + `packages/api-client/src`，`next dev`（HMR） |

入口与生产一致（`http://localhost`）。依赖变更（`pyproject.toml` / `package.json`）需加 `--build` 重建；`next`/`venv` 依赖来自镜像，不挂载宿主机版本。

## 测试

```bash
# 后端：43 个用例（安全原语 / 认证 / 工具契约 / 提示词权限隔离 / 收藏历史）
cd backend && uv run pytest

# 前端：72 个用例（13 个文件，覆盖全部 12 个客户端工具的核心逻辑）
pnpm --filter @toolbox/frontend test

# 共享客户端：4 个用例
pnpm --filter @toolbox/api-client test

# 类型检查 + 生产构建
pnpm --filter @toolbox/frontend typecheck
pnpm --filter @toolbox/frontend build
```

后端测试默认使用文件型 SQLite 保证密闭性（生产始终是 PostgreSQL + Alembic）；在 CI 中用真实 PostgreSQL 只需设置 `DATABASE_URL` 指向测试库。

## 架构要点

- **Tool Contract**（`backend/app/tools/base.py`）：每个工具由三个正交维度声明——`access`（public / authenticated）、`execution`（client / server / hybrid）、`ui`（form / editor / split / upload / custom）。manifest 注册进 Registry，平台自动完成发现、导航、搜索与权限。
- **新增工具零侵入**：后端加一个 manifest 包 + 前端加一个组件并在 `ToolRenderer` 注册，导航树、搜索、卡片自动出现，无需改动平台核心代码。
- **逻辑与 UI 分离**：每个工具的算法写在 `frontend/src/lib/tools/*.ts`（纯 TS、可单测），组件只负责渲染与交互。
- **按需登录**：前端 `ToolAccessGuard` 负责 UX，后端每个受保护 API 独立校验 session（前端管体验，后端管安全）。
- **用户数据隔离**：所有个人数据查询强制 `user_id` 作用域，越权访问返回 404（不泄露资源是否存在）。
- **隐私默认**：客户端工具在浏览器内完成计算，服务器不接触工具输入；历史记录只保留"谁在何时用了哪个工具"。
- **统一错误规范**：所有 API 错误返回 `{"error": {"code": "...", "message": "..."}}`，前端按 `code` 分支，不解析文案。

## 目录结构

```
toolbox/
├── backend/                    FastAPI 应用
│   ├── app/core/               配置、数据库、安全、错误、日志
│   ├── app/auth/               注册 / 登录 / Session / 权限依赖
│   ├── app/tools/              Tool Contract + Registry + 各工具 manifest
│   ├── app/{prompts,favorites,history,users}/   用户数据模块
│   ├── alembic/                数据库迁移
│   └── tests/                  pytest（单元 + API + 权限隔离）
├── frontend/                   Next.js App Router
│   └── src/
│       ├── app/                页面（首页 / 工具工作台 / 登录注册 / 收藏）
│       ├── components/         App Shell、侧边栏工具树、⌘K 面板、工具组件、UI 基础件
│       ├── features/           auth / tools 数据层（TanStack Query）
│       └── lib/tools/          12 个客户端工具的核心逻辑 + 单元测试
├── packages/api-client/        共享 TS API 契约（类型 + 客户端 + 错误模型）
├── deploy/nginx.conf           统一入口反向代理
├── docs/                       产品技术设计 / UIUX 规范 / 工具实施规划
├── docker-compose.yml          完整栈（postgres + backend + frontend + nginx）
└── docker-compose.dev.yml      开发 overlay（源码热更新）
```

> `packages/api-client` 是前后端之间的**接口契约**：类型镜像后端 Pydantic 模型，前端通过 `workspace:*` 引用。它独立成包而非常规前端代码，是为了让"改接口先改契约"由类型检查强制保证，并为未来的管理后台等第二个消费者留出位置。

## 环境变量

见 `.env.example`。要点：

| 变量 | 说明 |
| --- | --- |
| `SESSION_SECRET` | 生产必须修改，用于会话安全 |
| `CORS_ORIGINS` | 允许调用 API 的浏览器来源（含 nginx 入口与本地开发端口） |
| `NEXT_PUBLIC_API_URL` | 前端构建期注入的 API 地址；公网部署填你的域名 |
| `APP_ENV` | `development` / `production` |

生产环境的 Secret 通过环境变量或 Secret Manager 注入，禁止提交 Git。

## 设计文档

| 文档 | 内容 |
| --- | --- |
| `docs/ToolBox 产品与技术设计文档.md` | 产品定位、信息架构、数据模型、API 设计、架构原则 |
| `docs/ToolBox UIUX Design Specification.md` | 设计语言、Design Tokens、组件规范、页面布局 |
| `docs/ToolBox 工具实施规划文档.md` | 工具清单、实施顺序、每个工具的验收标准 |
