# ToolBox 产品与技术设计文档

**版本：v0.2**
**状态：架构设计阶段**
**技术方向：TypeScript + Python + PostgreSQL**

------

# 1. 产品概述

## 1.1 产品定位

ToolBox 是一个轻量、简洁、可扩展的在线工具平台。

核心目标：

> 用一个统一的网站，承载大量独立的小工具，让用户能够快速找到并完成任务，同时让开发者可以低成本持续增加新工具。

产品强调：

- 简单
- 快速
- 工具优先
- 最多两层导航
- 即开即用
- 登录按需
- 模块化扩展
- 前后端职责清晰
- 数据安全
- 小而美

------

# 2. 产品核心原则

## 2.1 工具优先

网站不是内容型网站，也不是传统 SaaS Dashboard。

核心对象是：

```text
Tool
```

而不是：

```text
Page
```

网站的主要工作就是：

```text
发现工具
→
打开工具
→
执行工具
→
获得结果
```

------

## 2.2 最多两层目录

用户可见的信息架构严格限制为：

```text
一级：工具分类

二级：具体工具
```

例如：

```text
开发工具
├── JSON 格式化
├── JWT 解码
├── Regex Tester
└── UUID Generator

文本工具
├── 文本 Diff
├── Markdown
└── 字数统计

图片工具
├── 图片压缩
├── 图片转换
└── Base64

AI 工具
├── Prompt 管理
├── Prompt 优化
└── 文本总结
```

禁止出现：

```text
开发工具
└── 数据处理
    └── JSON
        └── JSON Formatter
```

------

## 2.3 即开即用

工具分成两种：

```text
无需登录工具
登录后工具
```

例如：

### 无需登录

```text
JSON Formatter
JWT Decoder
UUID Generator
Base64
Timestamp
Regex Tester
Markdown Preview
```

用户打开即可使用。

### 需要登录

```text
Prompt 管理
收藏
历史记录
个人配置
私人数据
团队工具
```

用户访问时，如果没有登录：

```text
┌─────────────────────────────┐
│ Prompt 管理                 │
│                             │
│ 该工具需要登录后使用         │
│                             │
│        [ 登录 ]              │
│                             │
│ 没有账号？立即注册            │
└─────────────────────────────┘
```

------

# 3. 产品信息架构

最终用户侧控制为：

```text
ToolBox
│
├── 首页
│
├── 工具
│   ├── 开发工具
│   ├── 文本工具
│   ├── 数据工具
│   ├── 图片工具
│   ├── AI 工具
│   └── 其他
│
├── 我的工具
│   ├── 收藏
│   └── 最近使用
│
├── Prompt 管理
│
└── 个人中心
```

这里需要特别说明：

**“我的工具”和“Prompt 管理”属于一级产品入口，而工具本身仍然遵守最多两层结构。**

随着产品扩大，可以进一步统一成：

```text
首页
工具
我的
账户
```

其中：

```text
我的
├── 收藏
├── 最近使用
└── Prompt
```

这样仍然保持非常简单。

------

# 4. 用户身份体系

## 4.1 用户状态

系统存在三种用户状态：

```text
Anonymous
    ↓
Logged In
    ↓
Admin
```

### Anonymous

未登录用户。

可以使用：

```text
public tools
```

不能访问：

```text
private tools
personal data
```

------

### Logged In

普通登录用户。

可以：

```text
使用公共工具
使用登录工具
保存个人数据
收藏工具
查看历史
管理 Prompt
```

------

### Admin

管理员。

额外拥有：

```text
工具管理
用户管理
系统配置
数据管理
```

------

# 5. 登录设计

## 5.1 MVP 登录方式

第一版建议：

```text
邮箱 + 密码
```

后续增加：

```text
Google
GitHub
Apple
其他 OAuth
```

不建议第一版同时做大量 OAuth。

------

## 5.2 登录流程

```text
用户
 │
 ▼
登录页面
 │
 ├── 邮箱
 ├── 密码
 └── 登录
 │
 ▼
FastAPI
 │
 ▼
验证用户
 │
 ▼
Session
 │
 ▼
Browser
```

------

# 6. Session 设计

推荐：

> **HttpOnly Secure Cookie + Server-side Session**

浏览器：

```text
Cookie:
session_id=xxxx
```

前端 JavaScript 不直接读取 session。

优势：

- 降低 Token 泄露风险
- 不需要把 JWT 放 localStorage
- 对 Web 应用更加自然
- 方便后续权限控制

------

# 7. 用户表

PostgreSQL 作为正式数据库。

核心表：

```text
users
sessions
```

建议：

```sql
users
------------------------
id
email
username
password_hash
display_name
avatar_url
role
status
created_at
updated_at
last_login_at
```

其中：

```text
role:
user
admin
status:
active
disabled
```

------

# 8. PostgreSQL

数据库直接采用：

> PostgreSQL

不再使用 SQLite 作为正式方案。

原因：

- 从第一天开始统一生产环境
- JSONB 支持优秀
- 索引能力强
- 事务完整
- 适合用户数据
- 适合工具数据
- 适合 Prompt 等半结构化数据
- 后续支持全文搜索
- 后续支持团队 / 权限
- 避免 SQLite → PostgreSQL 迁移

------

# 9. 数据库总体设计

第一阶段：

```text
PostgreSQL
│
├── users
├── sessions
├── tools
├── user_tools
├── favorites
├── tool_history
└── prompts
```

后续：

```text
│
├── prompt_categories
├── prompt_versions
├── files
├── jobs
├── audit_logs
├── teams
├── team_members
└── api_keys
```

------

# 10. Tools 数据模型

工具虽然主要由代码定义，但数据库仍然可以保存工具索引和管理信息。

```text
tools
--------------------------------
id UUID
slug VARCHAR UNIQUE
name VARCHAR
description TEXT
category VARCHAR
icon VARCHAR
version VARCHAR
status VARCHAR
requires_auth BOOLEAN
execution_mode VARCHAR
ui_type VARCHAR
created_at TIMESTAMP
updated_at TIMESTAMP
```

例如：

```json
{
  "slug": "json-formatter",
  "name": "JSON 格式化",
  "category": "developer",
  "requires_auth": false,
  "execution_mode": "client",
  "ui_type": "editor"
}
```

Prompt：

```json
{
  "slug": "prompt-manager",
  "name": "Prompt 管理",
  "category": "ai",
  "requires_auth": true,
  "execution_mode": "server",
  "ui_type": "custom"
}
```

------

# 11. Tool 与数据库的关系

这里采用：

> **Code-first + Database-assisted**

而不是完全数据库驱动。

也就是说：

```text
Tool 的业务逻辑
        ↓
Python / TypeScript 代码

Tool 的 metadata
        ↓
manifest

Tool 的运行状态 / 管理数据
        ↓
PostgreSQL
```

不要把真正的业务代码放数据库。

------

# 12. Tool Contract

每个 Tool 必须定义：

```text
Tool Metadata
Tool UI
Tool Execution
Tool Permission
Tool Version
```

TypeScript：

```ts
interface ToolDefinition {
  id: string
  slug: string

  name: string
  description: string

  category: string

  version: string

  icon?: string

  tags: string[]

  status: ToolStatus

  access: ToolAccess

  execution: ToolExecution

  ui: ToolUI
}
```

------

# 13. Tool Access

这是本次架构升级的重点。

```ts
type ToolAccess =
  | {
      type: "public"
    }
  | {
      type: "authenticated"
    }
```

或者未来：

```ts
type ToolAccess =
  | "public"
  | "authenticated"
  | "admin"
  | "team"
```

------

# 14. Public Tool

例如：

```text
JSON Formatter
```

配置：

```json
{
  "access": {
    "type": "public"
  }
}
```

用户无需：

```text
登录
注册
创建账号
```

即可：

```text
打开
→
输入
→
执行
```

------

# 15. Authenticated Tool

例如：

```text
Prompt Manager
```

配置：

```json
{
  "access": {
    "type": "authenticated"
  }
}
```

访问流程：

```text
用户打开工具
      ↓
检查 session
      ↓
未登录？
      ↓
登录提示
      ↓
登录
      ↓
进入工具
```

------

# 16. 登录检查位置

登录检查不能只放前端。

必须：

```text
Frontend
 ↓
UX check

Backend
 ↓
Security check
```

例如前端：

```text
Prompt Manager
 ↓
发现未登录
 ↓
显示 Login
```

但后端：

```http
POST /api/v1/tools/prompt-manager/prompts
```

仍然必须验证：

```text
session
↓
user
↓
permission
```

否则用户可以绕过前端直接请求 API。

------

# 17. Tool Execution Mode

工具还有一个独立维度：

```text
client
server
hybrid
```

因此最终 Tool 模型实际上是：

```text
Tool
│
├── Access
│   ├── public
│   └── authenticated
│
├── Execution
│   ├── client
│   ├── server
│   └── hybrid
│
└── UI
    ├── form
    ├── editor
    ├── upload
    ├── viewer
    └── custom
```

------

# 18. Tool 示例

## JSON Formatter

```yaml
id: json-formatter

name: JSON 格式化

category: developer

access:
  type: public

execution:
  mode: client

ui:
  type: editor

status: stable
```

------

## Prompt Manager

```yaml
id: prompt-manager

name: Prompt 管理

category: ai

access:
  type: authenticated

execution:
  mode: server

ui:
  type: custom

status: stable
```

------

# 19. Prompt Manager

Prompt 管理是第一类真正需要数据库的工具。

核心模型：

```text
User
 │
 └── Prompts
       │
       ├── Prompt A
       ├── Prompt B
       └── Prompt C
```

数据库：

```text
prompts
--------------------------------
id UUID
user_id UUID
title VARCHAR
content TEXT
description TEXT
category VARCHAR
is_favorite BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

------

# 20. Prompt 权限

用户 A：

```text
Prompt A
Prompt B
```

用户 B：

```text
Prompt C
```

A 绝对不能：

```http
GET /api/prompts/{B的PromptID}
```

获取 B 的 Prompt。

后端查询必须始终包含：

```sql
WHERE id = :prompt_id
AND user_id = :current_user_id
```

------

# 21. User-owned Data 原则

所有个人数据都必须具有：

```text
owner
```

例如：

```text
prompts.user_id
favorites.user_id
history.user_id
settings.user_id
```

这是后续权限系统的基础。

------

# 22. Favorites

收藏工具：

```text
favorites
----------------------
user_id
tool_id
created_at
```

联合唯一：

```text
UNIQUE(user_id, tool_id)
```

这样一个用户不能重复收藏同一个工具。

------

# 23. 最近使用

建议：

```text
tool_history
----------------------
id
user_id
tool_id
executed_at
```

第一阶段只记录：

```text
谁
使用了哪个工具
什么时候
```

不要默认保存工具输入。

尤其是：

```text
JWT
Password
API Key
Private Prompt
Sensitive Text
```

------

# 24. 隐私原则

默认：

> **工具输入不持久化。**

例如 JSON Formatter：

```text
用户输入
 ↓
浏览器处理
 ↓
输出
 ↓
结束
```

服务器甚至不知道用户输入了什么。

------

# 25. 数据敏感等级

未来 Tool 可以定义：

```text
public
sensitive
private
```

但 MVP 可以简单处理为：

```text
是否持久化
```

默认：

```text
false
```

只有明确需要保存的 Tool 才保存。

------

# 26. Tool Capabilities

为了进一步扩展，建议增加：

```ts
capabilities: {
  auth: boolean
  storage: boolean
  file: boolean
  network: boolean
  async: boolean
}
```

例如：

### JSON Formatter

```json
{
  "auth": false,
  "storage": false,
  "file": false,
  "network": false,
  "async": false
}
```

### Prompt Manager

```json
{
  "auth": true,
  "storage": true,
  "file": false,
  "network": false,
  "async": false
}
```

### PDF OCR

```json
{
  "auth": false,
  "storage": false,
  "file": true,
  "network": false,
  "async": true
}
```

------

# 27. 前端整体架构

推荐：

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
```

职责：

```text
Next.js
    ↓
页面 / Routing / SSR

React
    ↓
交互 / Component

TanStack Query
    ↓
Server State

Tool Renderer
    ↓
统一工具 UI
```

------

# 28. Backend

使用：

```text
Python
FastAPI
Pydantic
SQLAlchemy
Alembic
```

结构：

```text
FastAPI
│
├── Auth
├── Tool Registry
├── Tool API
├── User
├── Prompt
├── Favorites
├── History
└── Infrastructure
```

------

# 29. 后端目录结构

```text
backend/
└── app/
    ├── main.py
    │
    ├── core/
    │   ├── config.py
    │   ├── database.py
    │   ├── security.py
    │   ├── logging.py
    │   └── errors.py
    │
    ├── auth/
    │   ├── router.py
    │   ├── service.py
    │   ├── schemas.py
    │   └── models.py
    │
    ├── tools/
    │   ├── registry.py
    │   ├── base.py
    │   ├── schemas.py
    │   │
    │   ├── json_formatter/
    │   ├── jwt_decoder/
    │   ├── text_diff/
    │   └── prompt_manager/
    │
    ├── users/
    ├── prompts/
    ├── favorites/
    ├── history/
    │
    ├── models/
    └── services/
```

------

# 30. 前端目录结构

```text
frontend/
└── src/
    ├── app/
    │   ├── page.tsx
    │   ├── login/
    │   ├── register/
    │   ├── tools/
    │   │   └── [slug]/
    │   ├── favorites/
    │   ├── prompts/
    │   └── settings/
    │
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   └── tool/
    │
    ├── features/
    │   ├── auth/
    │   ├── tools/
    │   ├── prompts/
    │   ├── favorites/
    │   └── history/
    │
    ├── lib/
    └── hooks/
```

------

# 31. Tool Registry

系统启动时：

```text
Tool Registry
     │
     ├── JSON Formatter
     ├── JWT Decoder
     ├── UUID
     ├── Text Diff
     └── Prompt Manager
```

Registry 负责：

```text
注册
查询
发现
校验
加载
```

------

# 32. Tool Renderer

前端统一：

```tsx
<ToolRenderer tool={tool} />
```

根据：

```text
tool.ui.type
```

渲染：

```text
form
editor
upload
viewer
custom
```

------

# 33. Access Guard

增加统一：

```tsx
<ToolAccessGuard tool={tool}>
    <ToolRenderer />
</ToolAccessGuard>
```

逻辑：

```text
Tool requires auth?
       │
       ├── No
       │    ↓
       │   Render
       │
       └── Yes
            ↓
       User logged in?
            │
            ├── Yes → Render
            │
            └── No → Login Prompt
```

------

# 34. API 设计

基础：

```text
/api/v1
```

工具：

```text
GET  /api/v1/tools
GET  /api/v1/tools/{slug}
```

认证：

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

用户：

```text
GET   /api/v1/me
PATCH /api/v1/me
```

收藏：

```text
GET    /api/v1/favorites
POST   /api/v1/favorites
DELETE /api/v1/favorites/{tool_id}
```

历史：

```text
GET    /api/v1/history
DELETE /api/v1/history
```

Prompt：

```text
GET    /api/v1/prompts
POST   /api/v1/prompts
GET    /api/v1/prompts/{id}
PATCH  /api/v1/prompts/{id}
DELETE /api/v1/prompts/{id}
```

------

# 35. API Authentication

认证 API：

```text
Cookie
 ↓
Session
 ↓
Current User
```

FastAPI Dependency：

```python
current_user = Depends(get_current_user)
```

需要登录的 API：

```python
@router.get("/prompts")
def list_prompts(
    user = Depends(get_current_user)
):
    ...
```

无需登录：

```python
@router.post("/json/format")
def format_json():
    ...
```

------

# 36. API 错误规范

统一：

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "请登录后使用该工具"
  }
}
```

常见错误：

```text
AUTH_REQUIRED
INVALID_CREDENTIALS
SESSION_EXPIRED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
TOOL_NOT_FOUND
TOOL_EXECUTION_ERROR
RATE_LIMITED
INTERNAL_ERROR
```

------

# 37. 登录 UX

登录入口：

```text
Header
        ↓
[ 登录 ]
```

用户点击需要登录的工具：

```text
Prompt 管理
      ↓
┌──────────────────────────────┐
│ Prompt 管理                  │
│                              │
│ 保存和管理你的 Prompt        │
│                              │
│ 此工具需要登录后使用          │
│                              │
│        [ 登录 ]              │
│                              │
│      注册新账号               │
└──────────────────────────────┘
```

不要直接：

```text
404
```

也不要：

```text
Access Denied
```

而应该明确告诉用户：

> 这个工具为什么需要登录。

------

# 38. 登录后的 Header

未登录：

```text
Logo
工具
搜索
                    [登录]
```

登录：

```text
Logo
工具
搜索

              用户头像 ▼
```

菜单：

```text
我的工具
Prompt
设置
退出登录
```

------

# 39. 首页设计

首页核心：

```text
┌─────────────────────────────────────┐
│ ToolBox                 搜索   登录 │
├─────────────────────────────────────┤
│                                     │
│       让工具触手可及                │
│                                     │
│       [ 搜索你需要的工具... ]       │
│                                     │
├─────────────────────────────────────┤
│ 常用工具                            │
│                                     │
│ JSON格式化   JWT解码   UUID         │
│                                     │
├─────────────────────────────────────┤
│ 工具集                              │
│                                     │
│ 开发工具                            │
│ [ JSON ] [ JWT ] [ Regex ]          │
│                                     │
│ 文本工具                            │
│ [ Diff ] [ Markdown ]               │
│                                     │
│ AI 工具                             │
│ [ Prompt ] [ AI 总结 ]              │
└─────────────────────────────────────┘
```

------

# 40. Tool Card

工具卡片必须告诉用户：

```text
工具名称
一句话描述
是否需要登录
```

例如：

```text
┌─────────────────────────┐
│ {}                      │
│ JSON 格式化              │
│ 格式化、校验 JSON        │
│                         │
│ ○ 无需登录               │
└─────────────────────────┘
```

Prompt：

```text
┌─────────────────────────┐
│ ✦                       │
│ Prompt 管理             │
│ 管理你的 Prompt         │
│                         │
│ 🔒 需要登录              │
└─────────────────────────┘
```

这样用户在点击之前就知道使用条件。

------

# 41. Tool 页面统一布局

```text
← 开发工具

JSON 格式化

格式化、压缩和校验 JSON

┌──────────────────┬──────────────────┐
│                  │                  │
│ 输入             │ 输出             │
│                  │                  │
│ JSON Editor      │ JSON Editor      │
│                  │                  │
│                  │                  │
└──────────────────┴──────────────────┘

[ 格式化 ] [ 压缩 ] [ 清空 ]
```

------

# 42. Prompt Manager 页面

Prompt Manager 可以使用特殊布局：

```text
┌─────────────────────────────────────────┐
│ Prompt 管理                       + 新建 │
├────────────┬────────────────────────────┤
│            │                            │
│ 我的 Prompt│ Prompt                     │
│            │                            │
│ 全部       │ 写一个产品需求分析 Prompt  │
│ 收藏       │                            │
│ 分类       │ 内容...                    │
│            │                            │
│            │ [编辑] [复制] [收藏]       │
└────────────┴────────────────────────────┘
```

这是一个典型的：

```text
authenticated + server + database
```

Tool。

------

# 43. Tool 类型矩阵

| Tool              | 登录 | 执行   | 数据库 |
| ----------------- | ---- | ------ | ------ |
| JSON Formatter    | 否   | Client | 否     |
| JWT Decoder       | 否   | Client | 否     |
| UUID              | 否   | Client | 否     |
| Text Diff         | 否   | Client | 否     |
| PDF Converter     | 否   | Server | 临时   |
| Image Compressor  | 否   | Server | 临时   |
| Prompt Manager    | 是   | Server | 是     |
| Favorites         | 是   | Server | 是     |
| History           | 是   | Server | 是     |
| Personal Settings | 是   | Server | 是     |

------

# 44. PostgreSQL Schema

第一阶段建议：

```text
users
sessions

tools

favorites
tool_history

prompts
```

关系：

```text
users
 │
 ├───────────────┐
 │               │
 ▼               ▼
sessions       prompts
 │
 │
 ├─────────────── favorites
 │
 └─────────────── tool_history

tools
 │
 ├── favorites
 └── tool_history
```

------

# 45. UUID

所有核心业务表使用：

```text
UUID
```

例如：

```text
users.id UUID
tools.id UUID
prompts.id UUID
sessions.id UUID
```

不要使用：

```text
1
2
3
```

作为对外暴露 ID。

------

# 46. 时间字段

统一：

```text
created_at
updated_at
```

需要时：

```text
deleted_at
last_login_at
executed_at
expires_at
```

全部使用：

```text
TIMESTAMPTZ
```

------

# 47. Soft Delete

普通工具：

```text
status
```

用户数据：

如果未来需要恢复，可以：

```text
deleted_at
```

MVP 不要所有表强制 Soft Delete。

------

# 48. Migration

数据库迁移：

```text
Alembic
```

流程：

```text
修改 SQLAlchemy Model
        ↓
alembic revision
        ↓
review migration
        ↓
alembic upgrade
```

生产环境禁止直接手工修改数据库结构。

------

# 49. 数据库环境

开发：

```text
Docker PostgreSQL
```

测试：

```text
独立 PostgreSQL Database
```

生产：

```text
PostgreSQL
```

推荐从第一天开始：

```text
DATABASE_URL
```

统一配置。

------

# 50. 环境变量

```env
APP_ENV=development

DATABASE_URL=postgresql+asyncpg://...

SESSION_SECRET=...

CORS_ORIGINS=http://localhost:3000

STORAGE_PATH=/data/storage
```

生产：

```text
所有 Secret
↓
Environment / Secret Manager
```

不能提交 Git。

------

# 51. 安全要求

登录系统加入：

```text
密码 Hash
Session
CSRF 防护
Rate Limit
登录失败限制
Secure Cookie
HttpOnly
SameSite
```

密码绝对不能：

```text
明文存储
```

------

# 52. 密码 Hash

推荐：

```text
Argon2id
```

不要自己设计 Hash。

------

# 53. Session 安全

Cookie：

```text
HttpOnly
Secure
SameSite=Lax
```

Session：

```text
随机高熵 ID
```

数据库保存：

```text
session_id hash
user_id
expires_at
created_at
last_seen_at
```

------

# 54. CSRF

如果使用 Cookie Session，需要考虑 CSRF。

对于：

```text
POST
PUT
PATCH
DELETE
```

必须保护。

可以采用：

```text
CSRF Token
```

或者严格的：

```text
SameSite + Origin validation
```

组合策略。

------

# 55. Rate Limit

至少保护：

```text
/login
/register
/password reset
```

以后对工具 API：

```text
AI
OCR
PDF
Image
```

也进行限流。

例如：

```text
anonymous
10 req/min

authenticated
60 req/min
```

具体数值以后根据实际负载调整。

------

# 56. Tool 安全等级

Tool 增加：

```text
security_level
```

例如：

```text
safe
filesystem
network
execution
```

JSON：

```text
safe
```

图片：

```text
filesystem
```

URL Screenshot：

```text
network
```

代码执行：

```text
execution
```

------

# 57. Code Execution Tool

未来如果增加：

```text
Python Runner
SQL Runner
JS Runner
Shell Runner
```

禁止直接：

```text
FastAPI
 ↓
subprocess
```

必须：

```text
FastAPI
 ↓
Job
 ↓
Sandbox
 ↓
Resource Limit
 ↓
Result
```

限制：

```text
CPU
Memory
Disk
Network
Time
Process
```

------

# 58. 文件处理

文件工具采用：

```text
Browser
 ↓
Upload
 ↓
FastAPI
 ↓
Temporary Storage
 ↓
Tool
 ↓
Output
 ↓
Download
 ↓
Cleanup
```

默认：

```text
处理完成后删除
```

------

# 59. 长任务

工具如果执行时间较长：

```text
POST /jobs
```

返回：

```json
{
  "job_id": "uuid",
  "status": "queued"
}
```

状态：

```text
queued
running
completed
failed
cancelled
```

第一阶段可以使用简单后台任务。

后续：

```text
Redis
+
Arq / Celery
```

------

# 60. OpenAPI

FastAPI 自动生成：

```text
/openapi.json
```

Swagger：

```text
/api/docs
```

TypeScript Client 从 OpenAPI 生成。

流程：

```text
Python
 ↓
Pydantic
 ↓
OpenAPI
 ↓
TypeScript Client
 ↓
Next.js
```

前端禁止重复定义 API Schema。

------

# 61. TypeScript API Client

统一：

```text
packages/api-client
```

例如：

```text
packages/
├── api-client
├── ui
└── shared
```

生成：

```text
API types
API functions
Error types
```

------

# 62. Client-side Tool

例如 JSON：

```text
React
 ↓
Tool Logic
 ↓
Result
```

无需：

```text
API
Database
Login
```

优势：

- 快
- 免费
- 隐私
- 低服务器成本
- 即开即用

------

# 63. Server-side Tool

例如 Prompt：

```text
React
 ↓
FastAPI
 ↓
Auth
 ↓
PostgreSQL
 ↓
Response
```

------

# 64. Hybrid Tool

例如 AI 工具：

```text
Browser
 ↓
上传 / 编辑
 ↓
FastAPI
 ↓
AI API
 ↓
结果
 ↓
Browser
```

部分逻辑可以在客户端执行。

------

# 65. 搜索系统

搜索字段：

```text
name
description
tags
category
```

第一阶段：

```text
PostgreSQL ILIKE
```

以后：

```text
PostgreSQL Full Text Search
```

工具数量达到一定规模后再考虑：

```text
Meilisearch
Typesense
Elasticsearch
```

MVP 不需要。

------

# 66. 最近使用

登录用户：

```text
最近使用
```

匿名用户：

```text
localStorage
```

这样即使不登录，也可以：

```text
最近使用 JSON Formatter
```

登录后可以：

```text
同步到服务器
```

------

# 67. 收藏

匿名：

```text
不提供服务器收藏
```

登录：

```text
数据库收藏
```

未来可以考虑：

```text
localStorage
```

保存临时收藏。

------

# 68. 主题

支持：

```text
Light
Dark
System
```

第一版就支持。

工具页面尤其适合 Dark Mode。

------

# 69. 响应式

必须支持：

```text
Desktop
Tablet
Mobile
```

但 Tool 工作区应该优先：

```text
Desktop
```

因为：

```text
代码
JSON
Diff
表格
Prompt
```

都更适合宽屏。

------

# 70. 键盘操作

核心快捷键：

```text
⌘ / Ctrl + K
搜索
/
搜索
Esc
关闭
```

工具：

```text
⌘ / Ctrl + Enter
执行
```

------

# 71. Tool 开发规范

新增工具必须包含：

```text
manifest
router
service
schema
test
```

例如：

```text
tools/
└── json_formatter/
    ├── manifest.py
    ├── router.py
    ├── service.py
    ├── schemas.py
    └── tests/
```

------

# 72. Tool Manifest

示例：

```yaml
id: json-formatter

name: JSON 格式化

description: 格式化、压缩和校验 JSON

category: developer

tags:
  - json
  - formatter
  - developer

access:
  type: public

execution:
  mode: client

ui:
  type: editor

status: stable

version: 1.0.0
```

------

# 73. Tool Manifest 设计目标

开发者只需要声明：

```text
这个工具是谁
它做什么
谁能用
在哪里执行
需要什么 UI
```

平台负责：

```text
注册
导航
搜索
权限
页面
错误处理
日志
统计
```

------

# 74. 核心开发体验

理想情况下：

```bash
pnpm tool:create json-formatter
```

自动：

```text
tools/json_formatter/

manifest
router
service
schema
tests
```

然后：

```bash
pnpm dev
```

网站自动出现：

```text
JSON 格式化
```

------

# 75. 不允许新增工具修改核心代码

新增：

```text
Tool A
Tool B
Tool C
```

不能要求修改：

```text
HomePage
Sidebar
ToolRenderer
ToolRegistry
API Router
```

工具只应该：

```text
注册自己
```

------

# 76. 测试体系

## Unit Test

Python：

```text
pytest
```

TypeScript：

```text
Vitest
```

------

## API Test

测试：

```text
Auth
Permission
Tool API
Validation
Error
```

------

## E2E

使用：

```text
Playwright
```

核心流程：

```text
打开首页
 ↓
搜索 JSON
 ↓
打开 JSON Formatter
 ↓
执行
 ↓
获得结果
```

登录：

```text
打开 Prompt Manager
 ↓
Login
 ↓
登录
 ↓
进入 Prompt Manager
 ↓
创建 Prompt
 ↓
保存
```

权限：

```text
User A
 ↓
创建 Prompt A

User B
 ↓
不能访问 Prompt A
```

------

# 77. Tool Contract Test

每个工具自动检查：

```text
id
name
description
category
version
status
access
execution
ui
```

保证所有工具符合平台协议。

------

# 78. CI/CD

```text
Git Push
    ↓
Lint
    ↓
Type Check
    ↓
Unit Test
    ↓
API Test
    ↓
Build
    ↓
E2E
    ↓
Docker Build
    ↓
Deploy
```

------

# 79. Docker

生产环境：

```text
Nginx
 │
 ├── Next.js
 │
 └── FastAPI
       │
       └── PostgreSQL
```

未来：

```text
FastAPI
 │
 ├── PostgreSQL
 ├── Redis
 └── Object Storage
```

------

# 80. MVP 数据库

第一版正式创建：

```text
users
sessions
tools
favorites
tool_history
prompts
```

不要一开始创建几十张表。

------

# 81. MVP 功能

## 基础平台

```text
首页
工具列表
工具分类
搜索
Tool Detail
```

## 用户

```text
注册
登录
退出
个人信息
Session
```

## 工具

```text
Public Tool
Authenticated Tool
Client Tool
Server Tool
```

## 数据

```text
PostgreSQL
Prompt
Favorites
History
```

------

# 82. MVP 工具

第一批：

### 开发工具

```text
JSON Formatter
JWT Decoder
UUID Generator
Regex Tester
Timestamp Converter
Text Diff
```

### AI

```text
Prompt Manager
```

这样第一批就可以同时验证：

```text
Public + Client
Public + Server
Authenticated + Server + Database
```

三种核心模式。

------

# 83. V0.2

加入：

```text
Markdown
Base64
CSV JSON
Image Compressor
PDF Converter
```

以及：

```text
最近使用
收藏
Dark Mode
快捷键
```

------

# 84. V0.3

加入：

```text
OAuth
AI Tools
File Tools
Async Jobs
Redis
Object Storage
```

------

# 85. V1

加入：

```text
团队
共享 Prompt
权限系统
API Key
工具配置
工具管理后台
工具统计
审计日志
```

------

# 86. 后台管理

管理员入口：

```text
/admin
```

第一阶段：

```text
Dashboard
Tools
Users
System
```

工具管理：

```text
启用
禁用
Beta
Deprecated
```

用户管理：

```text
查看
禁用
恢复
修改角色
```

------

# 87. Tool 生命周期

```text
draft
 ↓
beta
 ↓
stable
 ↓
deprecated
 ↓
removed
```

只有：

```text
stable
```

默认展示。

------

# 88. Tool 统计

记录：

```text
tool_id
execution_count
success_count
error_count
average_duration
```

注意：

> 统计执行情况，不默认保存用户输入。

------

# 89. 日志

记录：

```text
request_id
user_id
tool_id
status
duration
timestamp
```

不记录：

```text
password
JWT
API Key
Prompt Content
工具原始输入
```

除非某个业务明确需要并经过设计。

------

# 90. 可观测性

第一阶段：

```text
Structured Logging
```

后续：

```text
OpenTelemetry
```

重点指标：

```text
Tool execution count
Tool error rate
Tool latency
Login failure
API latency
Database latency
```

------

# 91. 性能目标

MVP 目标：

```text
首页首屏：< 2s
普通 API：P95 < 500ms
Client Tool：即时
登录：< 1s
```

对于：

```text
PDF
OCR
AI
Image
```

不适用上述普通 API SLA。

------

# 92. 成本原则

优先：

```text
Client execution
```

其次：

```text
轻量 Server execution
```

最后：

```text
Async Job
```

原因：

```text
Client
 ↓
几乎零服务器计算成本

Server
 ↓
服务器成本

Async
 ↓
基础设施成本
```

------

# 93. 最终系统架构

```text
                         Browser
                            │
                            ▼
                  ┌───────────────────┐
                  │      Next.js      │
                  │ React + TypeScript│
                  └─────────┬─────────┘
                            │
                     OpenAPI Client
                            │
                            ▼
                  ┌───────────────────┐
                  │      FastAPI      │
                  │       Python      │
                  └─────────┬─────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
       Auth              Tool Registry       Services
          │                 │                  │
          │        ┌────────┼────────┐         │
          │        ▼        ▼        ▼         │
          │      Client   Server   Hybrid      │
          │        │        │        │         │
          │        │        ▼        │         │
          │        │    PostgreSQL   │         │
          │        │                 │         │
          └────────┴─────────────────┴─────────┘
```

------

# 94. 最终核心抽象

整个系统最终围绕 6 个核心对象：

```text
User
Session
Tool
ToolRegistry
ToolExecution
UserData
```

关系：

```text
User
 │
 ├── Session
 │
 ├── Favorites
 │
 ├── History
 │
 └── UserData
       └── Prompt

Tool
 │
 ├── Access
 ├── Execution
 ├── UI
 └── Metadata
```

------

# 95. 最关键的架构原则

## 原则一

> **登录是 Tool Capability，而不是网站总开关。**

------

## 原则二

> **数据库从第一天直接 PostgreSQL。**

------

## 原则三

> **能在客户端完成的工具，优先客户端执行。**

------

## 原则四

> **需要用户数据的工具才进入数据库。**

------

## 原则五

> **默认不保存用户工具输入。**

------

## 原则六

> **前端权限检查负责 UX，后端权限检查负责 Security。**

------

## 原则七

> **新增 Tool 不应该修改平台核心代码。**

------

## 原则八

> **Tool Contract 是整个系统最重要的接口。**

------

# 96. 推荐技术栈最终版

| 层             | 技术                         |
| -------------- | ---------------------------- |
| Frontend       | Next.js                      |
| Language       | TypeScript                   |
| UI             | React                        |
| Styling        | Tailwind CSS                 |
| Components     | shadcn/ui                    |
| Server State   | TanStack Query               |
| Backend        | Python                       |
| API            | FastAPI                      |
| Validation     | Pydantic                     |
| ORM            | SQLAlchemy                   |
| Migration      | Alembic                      |
| Database       | PostgreSQL                   |
| Auth           | Cookie Session               |
| Password       | Argon2id                     |
| Testing        | Vitest / pytest / Playwright |
| Package        | pnpm                         |
| Python Package | uv                           |
| Container      | Docker                       |
| CI/CD          | GitHub Actions               |
| Cache          | Redis（后续）                |
| Storage        | S3/MinIO（后续）             |
| Job Queue      | Arq/Celery（后续）           |

------

# 97. 第一阶段开发顺序

## Phase 1：基础工程

```text
Monorepo
Next.js
FastAPI
PostgreSQL
Docker
CI
```

------

## Phase 2：核心 Tool Framework

```text
Tool Contract
Tool Registry
Tool Manifest
Tool Renderer
Tool Access
Tool Execution
```

------

## Phase 3：Authentication

```text
User
Register
Login
Logout
Session
Current User
Access Guard
```

------

## Phase 4：第一批工具

```text
JSON Formatter
JWT Decoder
UUID
Regex
Timestamp
Text Diff
```

------

## Phase 5：数据库型工具

```text
Prompt Manager
Favorites
History
```

------

## Phase 6：体验

```text
Search
⌘K
Dark Mode
Responsive
Loading
Error
Empty State
```

------

## Phase 7：生产化

```text
Rate Limit
Logging
Monitoring
Security
Backup
CI/CD
```

------

# 98. MVP 验收标准

## 用户侧

用户无需登录：

```text
打开网站
 ↓
搜索 JSON
 ↓
打开 JSON Formatter
 ↓
输入 JSON
 ↓
获得结果
```

整个流程：

```text
无需注册
无需登录
无需等待
```

------

用户需要登录：

```text
打开 Prompt Manager
 ↓
看到登录提示
 ↓
登录
 ↓
进入 Prompt Manager
 ↓
创建 Prompt
 ↓
保存
```

------

## 开发者侧

新增工具：

```text
创建 Tool
 ↓
填写 Manifest
 ↓
实现 Service
 ↓
实现 UI
 ↓
测试
 ↓
自动注册
```

不修改：

```text
首页
导航
Tool Renderer
核心 Router
```

------

# 99. 产品最终定位

ToolBox 不应该成为：

```text
复杂 SaaS
企业后台
插件市场
超级 Dashboard
```

而应该保持：

```text
打开
 ↓
找到
 ↓
使用
 ↓
完成
```

对于公共工具：

```text
打开即用
```

对于数据型工具：

```text
登录后使用
```

对于复杂工具：

```text
需要时才引入数据库 / Job / Storage
```

整个系统保持：

> **核心足够简单，工具可以无限扩展。**

------

# 100. 一句话架构总结

> **ToolBox = Next.js 工具工作台 + FastAPI 能力层 + PostgreSQL 数据层 + Tool Contract 插件体系 + 按需登录权限。**

最终形成：

```text
                 ToolBox
                    │
        ┌───────────┴───────────┐
        │                       │
     Public                  Private
        │                       │
   无需登录                   需要登录
        │                       │
   ┌────┴────┐             ┌────┴────┐
   │         │             │         │
 Client    Server        Server    Database
 Tool      Tool          Tool       Tool
   │         │             │         │
   └─────────┴─────────────┴─────────┘
                    │
                PostgreSQL
```

这套结构既能满足第一批简单工具，也能自然演进到 Prompt、AI、文件处理、团队协作等复杂工具，而不需要推翻基础架构。