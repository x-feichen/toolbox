# 头像上传功能设计（MinIO 对象存储）

## 一、关键决策（未收到选择，按推荐默认）

| 决策点 | 方案 | 理由 |
|---|---|---|
| 公网访问 | **后端代理** `GET /api/v1/avatars/{key}` | MinIO 9000 端口不暴露公网，bucket 私有；公网只需访问主站即可显示 |
| 可见性 | 任何人可访问（gravatar 式，不鉴权） | 跨站引用/截图分享也能正常显示；头像本身非敏感数据 |
| 上传处理 | **客户端 Canvas 压缩**（最长边 512px，WebP 优先，JPEG 回退） | 符合项目"浏览器优先"原则；单头像约几十 KB，省存储与带宽 |
| URL 存储 | `avatar_url` 存**相对路径** `/api/v1/avatars/avatars/{user_id}/{uuid}.webp` | 换域名/IP 无需迁移数据，公网部署天然可用 |

## 二、后端

### 2.1 存储抽象（新模块 `app/storage/`）
- `base.py`：`ObjectStorage` Protocol — `ensure_ready()` / `put_object(key, data, content_type)` / `get_object(key) -> bytes` / `delete_object(key)` / `object_exists(key)`（同步接口，由上层在线程池执行，保持 FastAPI 全异步）
- `minio_storage.py`：官方 `minio` SDK 实现；`ensure_ready` 幂等创建私有 bucket（**容器启动时自动初始化，无需 mc 镜像**；MinIO 未就绪时内置重试 ~30s）
- `factory.py`：按 `STORAGE_BACKEND` 创建单例（`minio`）；测试用 InMemory fake

### 2.2 配置（core/config.py）
`storage_backend`、`minio_endpoint`、`minio_access_key`、`minio_secret_key`、`minio_bucket`（默认 `avatars`）、`minio_secure`

### 2.3 头像 API（新模块 `app/avatars/`）
| API | 说明 |
|---|---|
| `POST /api/v1/avatars` | multipart 上传（需登录）：校验类型（jpeg/png/webp）与大小（≤2MB）→ key `avatars/{user_id}/{uuid4}.{ext}` → 存 MinIO → **删除旧头像文件**（仅当旧值为本系统路径）→ 更新 `users.avatar_url` 为相对 API 路径 → 返回 UserOut |
| `GET /api/v1/avatars/{key:path}` | **不鉴权**（公网可显示）：读对象返回字节，`Content-Type` 正确 + `Cache-Control: public, max-age=31536000, immutable`（key 含 uuid，可永久缓存）+ ETag |
| `DELETE /api/v1/avatars` | 需登录：删除自己的头像文件 + 清空 `avatar_url` → 204 |

依赖：`minio`（官方轻量 SDK，uv 从清华源安装）

## 三、Docker

- `docker-compose.yml` 新增 **minio 服务**：
  - 镜像用本机已有的 `minio/minio:RELEASE.2024-05-28T17-19-04Z`（Docker Hub 当前不可达，必须用本地已有版本）
  - 数据卷 `minio_data`；根账号密码走 `.env`（`MINIO_ROOT_USER/PASSWORD`）
  - **9000（API）不对外暴露**（仅容器网络）；9001（Console）绑定 `127.0.0.1` 供运维本地管理
  - 不配 healthcheck（minio 镜像无 curl/mc），由后端 `ensure_ready` 重试兜底
- backend 服务：`depends_on: minio` + 注入 `STORAGE_BACKEND` / `MINIO_*` 环境变量

## 四、前端

### 4.1 客户端压缩（新 `lib/images/avatar.ts`）
- `computeTargetSize(w, h, max=512)` — 纯函数，**可单测**（保持比例、不放大）
- `compressAvatarImage(file, opts)` — 浏览器 `Image` + `canvas.toBlob`（优先 `image/webp` 0.85，不支持则 JPEG）；纯逻辑与 DOM 分离
- `isSupportedAvatarType(type)`

### 4.2 API 客户端
- `ApiClient.request` 支持 `FormData`（body 是 FormData 时**不设** Content-Type，交由浏览器带 boundary）——现有实现固定设 JSON，需小改
- `client.avatars.upload(blob)` / `client.avatars.remove()`

### 4.3 设置页资料 Tab（改造）
- 头像区从"URL 输入框"改为**上传控件**：点击/选择文件 → 客户端压缩（带 loading）→ 上传 → invalidate `["auth","me"]` → **侧边栏头像即时更新** → toast
- 有上传头像时显示「恢复默认头像」（调用 DELETE）
- 移除头像 URL 文本输入（对普通用户无意义）
- 图片加载失败回退首字母（保留并增强 onError 处理）

## 五、测试

- **后端**（新增 ~10 例）：未登录 401 / 非法类型拒绝 / 超限拒绝 / 上传成功（avatar_url 正确、key 前缀正确）/ 替换时删除旧文件 / GET 200（content-type + cache header + immutable）/ 不存在 404 / DELETE 清空并删文件 —— 使用 `InMemoryStorage` fake（记录 put/get/delete 调用）
- **前端**：`computeTargetSize` 单测 + `ApiClient` FormData 不设 Content-Type 单测
- 现有 58 后端 + 77 前端全部保持通过

## 六、实施顺序

1. **A 存储层**：config + `app/storage/`（base/minio/factory）+ compose 加 minio + `.env.example`
2. **B API**：`app/avatars/` 路由 + fake storage + pytest
3. **C 前端**：压缩 lib + api-client FormData + ProfileTab 上传 UI + Vitest
4. **D 联调**：docker 起 minio → 浏览器注册用户 → 上传头像 → 侧边栏/设置页显示 → **用局域网 IP 验证公网可访问** → README + 提交

## 七、不做的事

- 图片 CDN 直连、缩略图多尺寸、头像审核、图片 EXIF 处理、对象存储迁移工具
- 存储抽象不实现第二种后端（local/S3 未来按需加，Protocol 已就位）