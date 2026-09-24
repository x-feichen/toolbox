# ToolBox 设置中心 + 用户管理设计方案

## 一、需求确认（依据你的决策）

| 决策 | 内容 |
|---|---|
| 定位 | 不是纯管理后台，而是**所有角色都能进入的设置界面**；用户管理是其中仅管理员可见的部分 |
| 角色 | 仅 `admin` / `user` 两级；管理员可**重置用户密码** |
| 个人设置 | 所有角色均可修改**昵称、头像、密码** |
| 工具配置 | 先留入口（未来用于 AI 工具的 API Key 等配置） |
| AI 供应商 | 设置中预留接口与入口 |
| 工具上下线 | **不做**（不做 hidden/enabled，manifest 保持唯一事实来源） |
| admin 来源 | 环境变量白名单 `ADMIN_EMAILS` |
| 部署形态 | 主站内路由 |

## 二、路由与信息架构

```
/settings                 设置中心（所有登录用户）— 顶部 Tab 切换
  ├─ 资料    个人资料（昵称、头像）
  ├─ 安全    修改密码
  ├─ 工具    工具配置入口（占位：列出工具 + “即将支持配置”）
  └─ AI      AI 供应商（占位：Provider / API Key 表单骨架）
/admin/users              用户管理（仅 admin，入口仅 admin 可见）
```

侧边栏：登录后底部用户区增加「设置」齿轮入口；**仅 admin** 额外显示「用户管理」入口。

## 三、后端设计

### 3.1 角色授予（环境变量白名单）
- `core/config.py`：新增 `admin_emails: str = ""`（逗号分隔，大小写不敏感）
- `auth/service.register_user()`：邮箱命中白名单 → `role="admin"`，否则 `"user"`
- 已存在的 admin 用户不受影响（白名单只作用于新注册）

### 3.2 权限依赖
- `auth/dependencies.py` 新增 `require_admin`：`user is None → 401 AUTH_REQUIRED`；`role != "admin" → 403 FORBIDDEN`（错误码复用现有 `ErrorCode`）

### 3.3 个人设置（所有登录用户）
| API | 说明 |
|---|---|
| `PATCH /api/v1/me` | 已存在，扩展头像/昵称校验（复用现结构） |
| `POST /api/v1/me/password` | `{current_password, new_password}`：校验当前密码 → 更新 → **踢出该用户其他设备的会话**（保留当前会话） |

### 3.4 用户管理（仅 admin，新模块 `app/admin/`）
| API | 说明 |
|---|---|
| `GET /api/v1/admin/users` | 列表：`q`（邮箱/昵称模糊搜索）、`role`、`status` 过滤、分页（`page`/`page_size`≤100），按注册时间倒序 + 总数 |
| `GET /api/v1/admin/users/{id}` | 详情 |
| `PATCH /api/v1/admin/users/{id}` | 改 `role` / `status`（启用·禁用） |
| `POST /api/v1/admin/users/{id}/password` | 管理员重置密码 `{new_password}`（≥8 位）→ **清空该用户全部会话**（强制重新登录） |

**安全护栏（必须）**：
1. 管理员**不能禁用/降级自己**（防锁死）
2. **最后一个 admin 不能被降级或禁用**
3. 所有管理员敏感操作写结构化日志（操作人、目标用户、动作、时间）——暂不建 audit_logs 表，与现有 `core/logging.py` 一致

### 3.5 AI 供应商接口预留
**建议：本期只做前端占位 UI，不建后端 API 与存储**。理由：真正接入时必须解决 API Key 的加密存储与多用户隔离（属于 Prompt/AI 工具阶段的设计），现在建空接口只会产生死代码。设置中「AI」Tab 以明确的“即将支持”状态呈现。

## 四、前端设计

### 4.1 设置中心 `/settings`
- 复用现有设计系统（`primitives.tsx` 的 Button/Input/Card、Design Tokens、暗色模式）
- Tab 状态存 URL query（`?tab=profile|security|tools|ai`），可分享/刷新保持
- 「资料」：昵称、头像 URL，保存后 invalidate `["auth","me"]` 即时更新侧边栏
- 「安全」：当前密码 + 新密码 + 确认新密码表单，提交后 toast 提示其他设备已退出
- 「工具」：列出工具清单（来自 `GET /tools`），每项显示“即将支持配置”的禁用按钮
- 「AI」：Provider 下拉 + API Key 密码框的骨架表单，整体 disabled + “即将支持”说明

### 4.2 用户管理 `/admin/users`
- 表格：邮箱 / 昵称 / 角色 / 状态 / 注册时间 / 操作
- 搜索框（邮箱、昵称）+ 角色与状态过滤 + 分页
- 行操作：重置密码（Dialog 表单）、启用/禁用、改角色（user↔admin）——危险操作二次确认
- 自我行操作用户名“当前账号”标记，禁用自身相关操作
- 复用 api-client 新增的 `admin` 命名空间方法

### 4.3 类型与客户端
- `packages/api-client`：`User` 类型已有 `role`；新增 `AdminUserList`（分页响应）、`UserQuery` 等类型 + `client.admin.users.*` 方法

## 五、测试计划（pytest，前置约定沿用现有 fixture 模式）

1. `ADMIN_EMAILS` 命中 → 新用户 role=admin；未命中 → user
2. `require_admin`：匿名 → 401；普通用户 → 403；admin → 200
3. 修改密码：当前密码错误被拒；成功后其他会话失效、当前会话保留
4. 管理员重置密码：仅 admin 可用；目标用户全部会话失效
5. 用户列表：搜索/过滤/分页正确
6. 护栏：不能改自己；最后一个 admin 不能降级/禁用
7. 前端 Vitest：密码表单校验（长度≥8、两次一致）

## 六、实施顺序

1. **后端 A**：`ADMIN_EMAILS` 配置 + `require_admin` + 改密码/重置密码 + 用户管理 API + 全部 pytest
2. **前端 B**：api-client 扩展 + 设置中心四 Tab + 侧边栏入口 + Vitest
3. **前端 C**：用户管理页（表格/搜索/分页/操作 Dialog）+ 路由与入口
4. **验证 D**：浏览器全流程（注册普通用户 → 改密码；白名单邮箱注册为 admin → 用户管理全套操作）+ README 更新 + 提交

## 六、明确不做（保持边界）

- 工具上下线/隐藏、工具状态调整（保持 manifest code-first 单一来源）
- 审计日志表、统计 Dashboard、工具配置的真实持久化
- 密码找回邮件、OAuth、2FA
- AI 供应商真实接入（仅占位）