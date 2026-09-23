# ToolBox 工具实施规划文档

**版本：V1.0**
**定位：前端工具实施规范**
**核心技术：TypeScript**
**运行环境：现代浏览器**
**后端：第一阶段不需要 Python / API**
**数据库：第一阶段不需要**

---

分类	工具	实现难度	使用频率	推荐
开发	JSON Formatter	⭐	⭐⭐⭐⭐⭐	★★★★★
开发	UUID Generator	⭐	⭐⭐⭐⭐	★★★★★
开发	JWT Decoder	⭐	⭐⭐⭐⭐	★★★★★
开发	Base64 Encoder / Decoder	⭐	⭐⭐⭐⭐	★★★★★
开发	URL Encoder / Decoder	⭐	⭐⭐⭐⭐	★★★★★
开发	Hash Generator	⭐⭐	⭐⭐⭐⭐	★★★★★
开发	Regex Tester	⭐⭐	⭐⭐⭐⭐	★★★★★
开发	Timestamp Converter	⭐	⭐⭐⭐⭐	★★★★★
文本	Word Counter	⭐	⭐⭐⭐	★★★★★
文本	Case Converter	⭐	⭐⭐⭐	★★★★★
文本	Text Diff	⭐⭐	⭐⭐⭐⭐	★★★★★
文本	Markdown Preview	⭐⭐	⭐⭐⭐	★★★★
文本	Remove Duplicate Lines	⭐	⭐⭐⭐	★★★★★
文本	Text Sorter	⭐	⭐⭐⭐	★★★★
文本	Text Extractor	⭐	⭐⭐⭐	★★★★
数据	CSV ↔ JSON	⭐⭐	⭐⭐⭐⭐	★★★★★
数据	JSON ↔ YAML	⭐⭐	⭐⭐⭐	★★★★
数据	JSON → CSV	⭐⭐	⭐⭐⭐⭐	★★★★★
数据	SQL Formatter	⭐⭐	⭐⭐⭐⭐	★★★★★
数据	Mock JSON Generator	⭐⭐	⭐⭐⭐	★★★★
图片	Image Compressor	⭐⭐	⭐⭐⭐⭐	★★★★★
图片	Image Resizer	⭐	⭐⭐⭐⭐	★★★★★
图片	Image Cropper	⭐⭐	⭐⭐⭐	★★★★
图片	Image Format Converter	⭐⭐	⭐⭐⭐⭐	★★★★★
图片	Image Metadata Viewer	⭐⭐	⭐⭐⭐	★★★★
图片	Base64 ↔ Image	⭐	⭐⭐⭐	★★★★★

# 1. 实施目标

ToolBox 第一阶段以「浏览器端实用工具」为核心。

所有可以在浏览器完成的工具，都直接使用 TypeScript 实现：

```text
用户
 ↓
ToolBox Web
 ↓
TypeScript
 ↓
Browser API
 ↓
结果
```

不采用：

```text
用户
 ↓
Frontend
 ↓
Python API
 ↓
Python Logic
 ↓
Database
```

第一阶段的核心原则：

> **能在浏览器完成的事情，不发送到服务器。**

这样可以获得：

* 更快的响应速度
* 更低的服务器成本
* 不需要 Python 服务
* 不需要 API
* 不需要数据库
* 用户数据默认不离开浏览器
* 工具可以部署为纯静态 Web
* 后续扩展工具非常简单

---

# 2. 技术范围

## 2.1 核心技术

推荐：

```text
TypeScript
React
Vite
```

如果项目已经使用 Next.js，也可以保持：

```text
TypeScript
React
Next.js
```

但工具本身必须尽量保持：

```text
Client-side only
```

---

# 3. 工具执行模式

所有工具统一定义：

```ts
type ToolExecution =
  | "client"
  | "server"
  | "hybrid";
```

第一阶段：

```text
100% client
```

即：

```ts
execution: "client"
```

暂时不实现：

```ts
execution: "server"
execution: "hybrid"
```

---

# 4. 工具分类

第一阶段建议使用 5 个一级分类：

```text
Tools
├── Developer
├── Text
├── Data
├── Image
└── Utilities
```

---

# 5. 第一阶段实施工具

建议第一阶段实现 **12 个工具**。

## Developer

1. JSON Formatter
2. JWT Decoder
3. UUID Generator
4. Base64 Encoder / Decoder
5. URL Encoder / Decoder
6. Timestamp Converter

## Text

7. Word Counter
8. Case Converter
9. Text Diff
10. Remove Duplicate Lines

## Data

11. CSV ↔ JSON

## Image

12. Image Compressor

---

# 6. 工具优先级

## P0 — 第一批必须实现

```text
JSON Formatter
UUID Generator
Base64
URL Encoder
Timestamp Converter
Word Counter
Case Converter
Remove Duplicate Lines
```

## P1 — 第一阶段完成

```text
JWT Decoder
Text Diff
CSV ↔ JSON
Image Compressor
```

## P2 — 后续扩展

```text
Regex Tester
Hash Generator
Markdown Preview
JSON ↔ YAML
CSV Viewer
SQL Formatter
Mock JSON Generator
Image Resizer
Image Cropper
Image Converter
```

---

# 7. Tool Registry

工具不要直接硬编码在 Sidebar。

建立统一 Tool Registry。

例如：

```ts
export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;

  category:
    | "developer"
    | "text"
    | "data"
    | "image"
    | "utilities";

  accessPolicy: "public" | "authenticated";

  execution: "client";

  uiType:
    | "simple"
    | "editor"
    | "split"
    | "table"
    | "custom";
}
```

例如：

```ts
const jsonFormatter: ToolDefinition = {
  slug: "json-formatter",
  name: "JSON Formatter",
  description: "Format and validate JSON",
  category: "developer",
  accessPolicy: "public",
  execution: "client",
  uiType: "split",
};
```

这样以后新增工具只需要增加 Tool Definition。

---

# 8. JSON Formatter

## 目标

格式化、压缩和验证 JSON。

## 功能

必须支持：

```text
Format
Minify
Validate
Copy
Clear
```

可选：

```text
Sort Keys
```

## 输入

```text
JSON Text
```

例如：

```json
{"name":"Tom","age":18}
```

## 输出

```json
{
  "name": "Tom",
  "age": 18
}
```

## TypeScript 实现

使用：

```ts
JSON.parse()
JSON.stringify()
```

格式化：

```ts
JSON.stringify(JSON.parse(input), null, 2)
```

压缩：

```ts
JSON.stringify(JSON.parse(input))
```

## 错误处理

JSON 无效时：

```text
Invalid JSON
```

并显示错误位置。

## 登录

```text
不需要
```

## 后端

```text
不需要
```

---

# 9. JWT Decoder

## 目标

解析 JWT Payload。

## 输入

```text
JWT Token
```

## 输出

```text
Header
Payload
```

例如：

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

以及：

```json
{
  "sub": "123",
  "name": "Tom",
  "iat": 1234567890
}
```

## 必须明确

此工具：

```text
只 Decode
```

不是：

```text
Verify
```

不能声称验证 Token 签名。

## TypeScript

浏览器使用：

```ts
atob()
```

或：

```ts
TextDecoder
```

处理 Base64URL。

## 登录

```text
不需要
```

## 后端

```text
不需要
```

---

# 10. UUID Generator

## 目标

生成 UUID。

## 功能

支持：

```text
Generate 1
Generate 5
Generate 10
Copy
```

## TypeScript

直接使用：

```ts
crypto.randomUUID()
```

## 输出

```text
550e8400-e29b-41d4-a716-446655440000
```

## 登录

```text
不需要
```

## 后端

```text
不需要
```

---

# 11. Base64 Encoder / Decoder

## 功能

支持：

```text
Encode
Decode
```

## 输入

普通文本。

## 输出

Base64。

例如：

```text
Hello
```

转换为：

```text
SGVsbG8=
```

## TypeScript

浏览器 API：

```ts
btoa()
atob()
```

对于 Unicode 文本，需要使用 UTF-8 编解码逻辑。

## 登录

```text
不需要
```

## 后端

```text
不需要
```

---

# 12. URL Encoder / Decoder

## 功能

```text
Encode URL
Decode URL
```

使用：

```ts
encodeURIComponent()
decodeURIComponent()
```

## 示例

输入：

```text
hello world
```

输出：

```text
hello%20world
```

## 登录

```text
不需要
```

## 后端

```text
不需要
```

---

# 13. Timestamp Converter

## 目标

Unix Timestamp 与日期之间转换。

## 功能

```text
Timestamp → Date
Date → Timestamp
```

支持：

```text
Seconds
Milliseconds
```

## 输入

例如：

```text
1710000000
```

## 输出

```text
2024-03-09 16:00:00
```

## TypeScript

使用：

```ts
new Date()
Date.now()
```

## 登录

```text
不需要
```

## 后端

```text
不需要
```

---

# 14. Word Counter

## 目标

统计文本。

## 输出

```text
Characters
Characters without spaces
Words
Lines
Paragraphs
```

## 输入

```text
任意文本
```

## TypeScript

使用：

```ts
string.length
```

以及正则表达式处理：

```text
Words
Lines
Paragraphs
```

## 中文处理

不能只依赖：

```ts
text.split(" ")
```

需要针对中文、英文、数字进行合理处理。

## 登录

```text
不需要
```

## 后端

```text
不需要
```

---

# 15. Case Converter

## 功能

支持：

```text
UPPERCASE
lowercase
Title Case
camelCase
PascalCase
snake_case
kebab-case
```

## 输入

```text
hello world
```

## 输出

例如：

```text
helloWorld
```

## TypeScript

全部前端处理。

## 登录

```text
不需要
```

## 后端

```text
不需要
```

---

# 16. Text Diff

## 目标

比较两段文本差异。

## UI

采用：

```text
Left
Right
```

或者：

```text
Original
Changed
```

## 输出

标记：

```text
Added
Removed
Modified
```

## MVP

第一版可以实现：

```text
Line Diff
```

后续再增加：

```text
Character Diff
Word Diff
```

## TypeScript

可以自行实现 Diff Algorithm，也可以使用成熟的 TypeScript/JavaScript Diff 库。

## 登录

```text
不需要
```

## 后端

```text
不需要
```

---

# 17. Remove Duplicate Lines

## 目标

删除重复行。

## 输入

```text
apple
banana
apple
orange
banana
```

## 输出

```text
apple
banana
orange
```

## 功能

支持：

```text
Remove duplicates
Preserve order
Ignore empty lines
Case sensitive
```

## TypeScript

核心可以使用：

```ts
Set<string>
```

实现。

## 登录

```text
不需要
```

## 后端

```text
不需要
```

---

# 18. CSV ↔ JSON

## 目标

CSV 与 JSON 相互转换。

## 支持

```text
CSV → JSON
JSON → CSV
```

## CSV → JSON

输入：

```csv
name,age
Tom,18
Jack,20
```

输出：

```json
[
  {
    "name": "Tom",
    "age": "18"
  },
  {
    "name": "Jack",
    "age": "20"
  }
]
```

## JSON → CSV

输入：

```json
[
  {
    "name": "Tom",
    "age": 18
  }
]
```

输出：

```csv
name,age
Tom,18
```

## MVP

必须正确处理：

```text
Comma
Quote
Newline
Empty value
UTF-8
```

不要使用简单的：

```ts
split(",")
```

直接解析复杂 CSV。

可以使用成熟的 TypeScript CSV parser。

## 登录

```text
不需要
```

## 后端

```text
不需要
```

---

# 19. Image Compressor

## 目标

浏览器本地压缩图片。

## 输入

```text
JPG
PNG
WebP
```

## 功能

```text
Upload
Preview
Quality
Output Format
Compress
Download
```

## 浏览器 API

使用：

```text
File API
FileReader
Image
Canvas
Blob
URL.createObjectURL()
```

## 处理流程

```text
Select File
      ↓
Read Image
      ↓
Create Image
      ↓
Canvas
      ↓
canvas.toBlob()
      ↓
Compressed Blob
      ↓
Download
```

## 特别要求

图片默认：

```text
不上传服务器
```

所有压缩操作：

```text
Browser Local
```

## 登录

```text
不需要
```

## 后端

```text
不需要
```

---

# 20. 第二批 Developer Tools

第一阶段完成后，可以继续增加：

## Regex Tester

功能：

```text
Regex
Text
Match Result
Groups
Flags
```

全部浏览器执行。

---

# 21. Hash Generator

支持：

```text
SHA-256
SHA-384
SHA-512
```

使用：

```ts
crypto.subtle.digest()
```

浏览器原生实现。

---

# 22. Markdown Preview

输入：

```text
Markdown
```

输出：

```text
Rendered HTML
```

可以使用成熟的 TypeScript Markdown parser。

需要注意：

```text
XSS Sanitization
```

渲染 HTML 时必须进行安全处理。

---

# 23. JSON ↔ YAML

支持：

```text
JSON → YAML
YAML → JSON
```

可以使用成熟的 TypeScript YAML 库。

不需要 Python。

---

# 24. CSV Viewer

上传 CSV：

```text
File
 ↓
Browser Parse
 ↓
Table
```

功能：

```text
Search
Sort
Filter
Pagination
Download
```

不需要后端。

---

# 25. SQL Formatter

输入：

```sql
select * from users where id = 1
```

输出：

```sql
SELECT *
FROM users
WHERE id = 1;
```

可以使用 JavaScript / TypeScript SQL formatter。

不需要 Python。

---

# 26. Mock JSON Generator

支持生成：

```json
[
  {
    "id": 1,
    "name": "User 1",
    "email": "user@example.com"
  }
]
```

用户定义：

```text
Field
Type
Count
```

全部浏览器生成。

---

# 27. 后续 Image Tools

第二阶段可以增加：

```text
Image Resizer
Image Cropper
Image Converter
Image Metadata Viewer
Base64 ↔ Image
```

全部可以优先尝试浏览器实现。

---

# 28. Utilities

后续增加：

```text
Color Converter
Color Picker
QR Code Generator
Password Generator
Lorem Ipsum Generator
Unit Converter
Date Calculator
Timezone Converter
```

其中大部分都不需要后端。

---

# 29. 工具统一接口

所有工具都应该遵循统一结构。

推荐：

```ts
export interface Tool {
  definition: ToolDefinition;

  component: React.ComponentType;
}
```

例如：

```ts
export const jsonFormatterTool: Tool = {
  definition: {
    slug: "json-formatter",
    name: "JSON Formatter",
    description: "Format and validate JSON",
    category: "developer",
    accessPolicy: "public",
    execution: "client",
    uiType: "split",
  },

  component: JsonFormatter,
};
```

---

# 30. 推荐项目结构

```text
src/
├── app/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── tool/
│
├── features/
│   ├── tools/
│   │
│   │   ├── json-formatter/
│   │   │   ├── JsonFormatter.tsx
│   │   │   ├── jsonFormatter.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── jwt-decoder/
│   │   ├── uuid-generator/
│   │   ├── base64/
│   │   ├── url-encoder/
│   │   ├── timestamp/
│   │   ├── word-counter/
│   │   ├── case-converter/
│   │   ├── text-diff/
│   │   ├── duplicate-lines/
│   │   ├── csv-json/
│   │   └── image-compressor/
│   │
│   └── auth/
│
├── lib/
│   ├── text/
│   ├── json/
│   ├── csv/
│   ├── image/
│   └── encoding/
│
├── registry/
│   └── tools.ts
│
├── types/
│   └── tool.ts
│
└── utils/
```

---

# 31. Tool Logic 与 UI 分离

非常重要。

不要把所有逻辑直接写在 React Component 里面。

错误：

```tsx
function JsonFormatter() {
  // 500 行 JSON 处理逻辑
  // UI
  // validation
  // formatting
}
```

应该：

```text
UI
 ↓
Tool Logic
 ↓
Result
```

例如：

```ts
export function formatJson(input: string): string {
  const data = JSON.parse(input);

  return JSON.stringify(data, null, 2);
}
```

React：

```tsx
const result = formatJson(input);
```

这样以后可以：

```text
Unit Test
Reuse
Refactor
```

---

# 32. 工具标准状态

每个工具统一处理：

```ts
type ToolState =
  | "idle"
  | "processing"
  | "success"
  | "error";
```

例如：

```text
Idle
 ↓
User Input
 ↓
Processing
 ↓
Success
```

或者：

```text
Processing
 ↓
Error
```

---

# 33. Error Handling

所有工具必须有统一错误处理。

例如：

```ts
try {
  const result = process(input);
} catch (error) {
  // display user-friendly error
}
```

不要直接显示：

```text
TypeError: Cannot read properties of undefined...
```

用户应该看到：

```text
Invalid JSON
```

或者：

```text
Unable to decode this value.
```

---

# 34. Clipboard

所有适合复制结果的工具统一支持：

```text
Copy
```

使用：

```ts
navigator.clipboard.writeText()
```

复制成功后：

```text
Copied
```

---

# 35. Download

需要文件输出的工具统一使用：

```text
Blob
URL.createObjectURL()
```

例如：

```ts
const blob = new Blob([content]);
const url = URL.createObjectURL(blob);
```

不需要服务器生成文件。

---

# 36. File Upload

图片 / CSV 工具使用：

```html
<input type="file">
```

或者 Drag & Drop。

文件处理原则：

```text
Browser
 ↓
Memory
 ↓
Process
 ↓
Download
```

不上传服务器。

---

# 37. Local Storage

第一阶段工具本身默认：

```text
不保存用户输入
```

但可以保存 UI Preferences：

```text
Theme
Recent Tools
Last Used Tool
Editor Preferences
```

例如：

```ts
localStorage.setItem()
localStorage.getItem()
```

不要默认把敏感工具输入保存到 Local Storage。

---

# 38. 登录要求

第一阶段工具：

| Tool             | Login |
| ---------------- | ----- |
| JSON Formatter   | No    |
| JWT Decoder      | No    |
| UUID Generator   | No    |
| Base64           | No    |
| URL Encoder      | No    |
| Timestamp        | No    |
| Word Counter     | No    |
| Case Converter   | No    |
| Text Diff        | No    |
| Duplicate Lines  | No    |
| CSV ↔ JSON       | No    |
| Image Compressor | No    |

也就是说：

> **第一阶段所有工具都不需要登录。**

---

# 39. 为什么第一阶段不需要 Python

因为第一批工具的计算全部可以在浏览器完成。

例如：

```text
JSON
→ JSON.parse()

UUID
→ crypto.randomUUID()

Hash
→ crypto.subtle.digest()

URL
→ encodeURIComponent()

Image
→ Canvas

CSV
→ TypeScript CSV Parser

Text
→ JavaScript String API
```

因此：

```text
Python API = unnecessary
```

---

# 40. 部署模式

第一阶段可以直接部署为：

```text
Static Web
```

例如：

```text
CDN
 ↓
HTML
CSS
JS
Assets
```

工具运行在：

```text
User Browser
```

不需要：

```text
Python Server
Node API
Database
Redis
Queue
```

---

# 41. 后续什么时候才需要后端

只有出现以下需求时，再考虑后端：

```text
用户数据同步
Prompt Manager
账号系统
云端保存
团队协作
历史记录同步
文件云端处理
AI API
收费订阅
权限管理
```

例如 Prompt Manager：

```text
User
 ↓
Frontend
 ↓
API
 ↓
Database
```

但这属于另外一个阶段。

---

# 42. 第一阶段最终工具清单

```text
ToolBox
│
├── Developer
│   ├── JSON Formatter
│   ├── JWT Decoder
│   ├── UUID Generator
│   ├── Base64 Encoder / Decoder
│   ├── URL Encoder / Decoder
│   └── Timestamp Converter
│
├── Text
│   ├── Word Counter
│   ├── Case Converter
│   ├── Text Diff
│   └── Remove Duplicate Lines
│
├── Data
│   └── CSV ↔ JSON
│
└── Image
    └── Image Compressor
```

---

# 43. 第一阶段开发顺序

推荐严格按照下面顺序：

```text
1. Tool Registry
        ↓
2. Tool Shell
        ↓
3. JSON Formatter
        ↓
4. UUID Generator
        ↓
5. Base64
        ↓
6. URL Encoder
        ↓
7. Timestamp
        ↓
8. Word Counter
        ↓
9. Case Converter
        ↓
10. Duplicate Lines
        ↓
11. JWT Decoder
        ↓
12. Text Diff
        ↓
13. CSV ↔ JSON
        ↓
14. Image Compressor
```

先做简单工具，把整个 Tool Framework 跑通，再做复杂工具。

---

# 44. 每个工具的实施标准

每个工具完成时必须具备：

```text
[ ] Tool Definition
[ ] Route
[ ] UI
[ ] Core Logic
[ ] Error Handling
[ ] Copy
[ ] Clear
[ ] Loading State（如需要）
[ ] Empty State
[ ] Mobile Layout
[ ] Dark Mode
[ ] Keyboard Interaction
[ ] Unit Tests
```

文件型工具额外：

```text
[ ] File Upload
[ ] Drag & Drop
[ ] File Validation
[ ] Preview
[ ] Download
```

---

# 45. MVP 完成标准

第一阶段完成后，用户应该能够：

```text
打开 ToolBox
    ↓
搜索工具
    ↓
打开工具
    ↓
直接使用
    ↓
Copy / Download
    ↓
完成任务
```

不应该出现：

```text
注册
↓
登录
↓
等待 API
↓
上传数据
↓
等待处理
↓
下载结果
```

对于纯本地工具：

> **打开即用。**

---

# 46. 核心技术原则

ToolBox 工具开发遵循以下原则：

### 原则 1

```text
Browser First
```

能浏览器处理，就不要调用后端。

### 原则 2

```text
TypeScript First
```

工具逻辑优先使用 TypeScript。

### 原则 3

```text
Local First
```

用户数据默认留在浏览器。

### 原则 4

```text
No Unnecessary API
```

没有必要就不要创建 API。

### 原则 5

```text
Small Tools
```

每个工具只解决一个明确问题。

### 原则 6

```text
Composable
```

工具逻辑与 UI 分离。

### 原则 7

```text
Reusable
```

公共逻辑放到：

```text
lib/
```

避免每个工具重复实现。

---

# 47. 最终技术边界

## 第一阶段允许

```text
TypeScript
React
Browser APIs
Web APIs
第三方 TypeScript Libraries
LocalStorage
IndexedDB（必要时）
Canvas
Web Crypto
File API
Blob
```

## 第一阶段不需要

```text
Python
FastAPI
Flask
Django
Python API
Tool API
Database
Redis
Message Queue
```

---

# 48. 最终结论

ToolBox 第一阶段不应该被设计成：

> 「Frontend + Python Backend + API + Database」

而应该是：

```text
                ToolBox
                   │
              React + TS
                   │
          ┌────────┴────────┐
          │                 │
       Tool UI          Tool Logic
                            │
                      Browser APIs
                            │
             ┌──────────────┼──────────────┐
             │              │              │
          Web Crypto      Canvas       File API
             │              │              │
             └──────────────┴──────────────┘
                            │
                       Local Result
```

**第一阶段核心目标：**

```text
12 个高频工具
+
100% TypeScript
+
100% Client-side
+
0 Python API
+
0 数据库依赖
+
打开即用
```

后续只有当工具出现「账号、云端数据、同步、AI、团队协作」等需求时，再引入后端。

---

# 49. 推荐第一阶段实际开发范围

最终不要一次做几十个工具。

建议第一版锁定：

```text
Developer
├── JSON Formatter
├── JWT Decoder
├── UUID Generator
├── Base64
├── URL Encoder
└── Timestamp

Text
├── Word Counter
├── Case Converter
├── Text Diff
└── Remove Duplicate Lines

Data
└── CSV ↔ JSON

Image
└── Image Compressor
```

共 **12 个工具**。

这 12 个工具已经足够验证 ToolBox 的：

```text
Tool Registry
Search
Category
Tool Workspace
Client-side Execution
Copy
Download
Error Handling
Responsive UI
Dark Mode
Keyboard Interaction
```

整个产品架构也可以在不引入 Python 后端的情况下跑通。
