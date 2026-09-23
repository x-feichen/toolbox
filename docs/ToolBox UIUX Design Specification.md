# ToolBox UI/UX Design Specification

## Version 2.0

**Product:** ToolBox
**Document Type:** UI / UX Design Specification
**Status:** Design Ready
**Version:** V2.0

------

# 1. Design Overview

## 1.1 Product Positioning

ToolBox 是一个轻量、现代化的在线工具工作台。

它不是：

- 传统工具导航网站
- 内容门户
- 复杂 Dashboard
- 工具分类目录站

它更接近：

> 一个打开即用的数字工具工作台。

用户进入网站后，不需要理解复杂的信息架构，而应该能够快速完成：

```text
Search
   ↓
Tool
   ↓
Workspace
   ↓
Done
```

------

# 2. Design Goals

## 2.1 Primary Goals

### Fast

用户应该能够快速找到工具并开始操作。

### Simple

界面不应该要求用户学习网站结构。

### Focused

进入工具后，视觉重点应该集中在任务本身。

### Consistent

不同工具应该拥有统一的操作体验。

### Extensible

未来增加大量工具时，不应该破坏现有 UI 体系。

------

# 3. Core Design Principles

## 3.1 Tool First

工具是产品第一优先级。

不要让：

- Banner
- Marketing Content
- Statistics
- 推荐内容

抢占工具本身的视觉空间。

------

## 3.2 Search First

Search 是核心导航方式。

用户应该可以：

```text
打开网站
↓
搜索工具
↓
直接进入
```

而不是：

```text
首页
↓
分类
↓
子分类
↓
工具列表
↓
工具
```

------

## 3.3 Low Cognitive Load

用户不应该思考：

> “这个按钮在哪里？”

而应该思考：

> “我要完成什么？”

------

## 3.4 Quiet UI

视觉应该安静。

避免：

- 大面积渐变
- 过度阴影
- 大量彩色
- 复杂背景
- 巨型 Banner
- 装饰性动画

------

## 3.5 Workspace First

工具页面应该优先考虑工作区域。

结构：

```text
Tool Header
──────────────
Workspace
──────────────
Actions
```

而不是：

```text
大量介绍
↓
工具说明
↓
广告
↓
工具
```

------

## 3.6 Keyboard Friendly

核心操作尽量支持键盘。

主要快捷键：

```text
⌘ K / Ctrl K    Search
Esc             Close
Enter           Confirm
⌘ Enter         Execute
⌘ S             Save
```

------

# 4. Visual Direction

## 4.1 Keywords

整体视觉：

```text
Minimal
Quiet
Fast
Focused
Technical
Reliable
Modern
Useful
```

------

## 4.2 Visual References

设计语言可以参考：

- Linear
- Raycast
- Notion
- Vercel

但不直接复制任何产品视觉。

重点借鉴：

```text
Linear
→ 信息密度、间距、交互状态

Raycast
→ Search、Command Palette

Notion
→ 内容结构、编辑体验

Vercel
→ 极简、技术感、Typography
```

------

# 5. Layout System

## 5.1 Desktop App Shell

整体：

```text
┌─────────────────────────────────────────────┐
│                                             │
│ Sidebar │            Main Content           │
│         │                                   │
│         │                                   │
│         │                                   │
│         │                                   │
└─────────────────────────────────────────────┘
```

Sidebar：

```text
Width: 232px
```

Main：

```text
flex: 1
min-width: 0
```

------

## 5.2 Sidebar

推荐结构：

```text
┌──────────────────────┐
│ ToolBox              │
│                      │
│ Search               │
│                      │
│ Home                 │
│ Tools                │
│                      │
│ Categories           │
│  Developer           │
│  Text                │
│  AI                  │
│                      │
│ Favorites            │
│ Recent               │
│                      │
│                      │
│ ──────────────────── │
│ Account              │
└──────────────────────┘
```

Sidebar 不允许无限增加导航项目。

一级导航最多：

```text
Home
Tools
Favorites
Recent
Account
```

------

# 6. Navigation Hierarchy

最多两层。

推荐：

```text
Tools
├── Developer
├── Text
└── AI
```

禁止：

```text
Tools
 └── Developer
      └── JSON
           └── Formatter
                └── ...
```

用户不应该通过深层目录寻找工具。

------

# 7. Responsive Layout

## Desktop

```text
≥ 1200px
```

使用：

```text
Sidebar + Main
```

------

## Tablet

```text
768px – 1199px
```

Sidebar 可以缩小或折叠。

------

## Mobile

```text
< 768px
```

使用：

```text
Top Header
+
Drawer
```

不显示固定 Sidebar。

------

# 8. Container

普通页面：

```text
max-width: 1200px
```

工具 Workspace：

```text
max-width: none
```

工具需要尽可能利用屏幕空间。

------

# 9. Spacing System

采用 4px 基础单位。

```text
4
8
12
16
20
24
32
40
48
64
```

常用：

| 场景         | Spacing |
| ------------ | ------- |
| Icon 与文字  | 8px     |
| Button 内部  | 8–12px  |
| Card Padding | 16px    |
| Section      | 24px    |
| Page Section | 32px    |
| 大型区域     | 48–64px |

------

# 10. Border Radius

整体保持克制。

```text
Small: 6px
Medium: 8px
Large: 12px
Panel: 12px
```

推荐：

```text
Button: 6px
Input: 6px
Card: 8px
Dialog: 12px
Workspace: 8–12px
```

避免大量圆角胶囊设计。

------

# 11. Color System

采用：

> Neutral First + Indigo Interaction

------

## 11.1 Light Theme

### Background

```text
Page:
#FFFFFF

Secondary:
#F7F7F8

Panel:
#FFFFFF

Muted:
#F3F4F6
```

### Text

```text
Primary:
#111827

Secondary:
#6B7280

Muted:
#9CA3AF
```

### Border

```text
#E5E7EB
```

### Accent

```text
Indigo
```

Accent 只用于：

- Primary Button
- Focus
- Active
- Link
- Selected
- Interactive Highlight

------

# 12. Dark Theme

背景：

```text
Page:
#0B0B0C

Panel:
#111113

Secondary:
#18181B
```

文字：

```text
Primary:
#F4F4F5

Secondary:
#A1A1AA

Muted:
#71717A
```

Border：

```text
#27272A
```

Accent：

```text
Indigo
```

------

# 13. Semantic Colors

除 Indigo 外，只在语义需要时使用颜色。

```text
Success
Warning
Error
Info
```

使用场景：

```text
Success
→ Saved
→ Copied

Warning
→ Potential issue

Error
→ Invalid JSON
→ Login failed

Info
→ Additional information
```

禁止把每个 Tool Category 都设计成不同颜色。

------

# 14. Typography

## Font

中文：

```text
Noto Sans SC
```

英文：

```text
Inter
```

代码：

```text
JetBrains Mono
```

------

## Type Scale

```text
Display: 32px / 40px
H1:      28px / 36px
H2:      22px / 30px
H3:      18px / 26px

Body:    14px / 22px
Small:   13px / 20px
Caption: 12px / 18px
```

------

# 15. Font Weight

```text
Regular: 400
Medium: 500
Semibold: 600
Bold: 700
```

默认正文：

```text
400
```

标题：

```text
600
```

不要大量使用 Bold。

------

# 16. Icons

使用：

> Lucide Icons

默认：

```text
16px
```

较大的：

```text
20px
```

原则：

> Icon 是辅助信息，不是主要视觉。

避免：

- 复杂插画
- 3D Icon
- 大型彩色 Icon
- 每个 Tool 使用不同风格 Icon

------

# 17. Buttons

## Primary

用于：

- Save
- Create
- Execute
- Confirm

结构：

```text
[ Icon ] Label
```

高度：

```text
36px
```

------

## Secondary

用于：

- Copy
- Reset
- Cancel
- Secondary Action

------

## Ghost

用于：

- Toolbar
- Icon Action
- Navigation

------

## Destructive

仅用于：

- Delete
- Remove
- Permanent Action

------

# 18. Button States

每个 Button 必须设计：

```text
Default
Hover
Pressed
Focus
Disabled
Loading
```

Loading：

```text
[ Spinner ] Saving...
```

而不是只显示 Spinner。

------

# 19. Input

高度：

```text
36px
```

结构：

```text
Label
Input
Helper Text
Error
```

Focus：

```text
Border + Indigo Focus Ring
```

不要使用强烈发光效果。

------

# 20. Search Input

Search 是特殊组件。

首页：

```text
┌────────────────────────────────────────┐
│ ⌕  Search tools...                 ⌘ K │
└────────────────────────────────────────┘
```

特点：

- 大于普通 Input
- 明显但不夸张
- 支持快捷键
- 支持即时搜索

------

# 21. Badge

用于：

```text
Public
Login Required
Beta
New
```

不要使用 Badge 表达普通信息。

例如：

```text
Developer
```

不一定需要 Badge。

------

# 22. Tool Card

Tool Card：

```text
┌─────────────────────────────────┐
│ JSON Formatter             ↗    │
│ Format and validate JSON         │
│                                 │
│ Developer                       │
└─────────────────────────────────┘
```

内容：

```text
Icon
Name
Description
Category
Access Badge
```

------

## Hover

Hover 时：

- Border 加深
- Background 轻微变化
- 显示 Arrow
- 不产生明显浮起效果

避免：

```text
巨大 Shadow
Scale
浮动动画
```

------

# 23. Tool Card Grid

Desktop：

```text
3 columns
```

大屏：

```text
3–4 columns
```

Mobile：

```text
1 column
```

推荐：

```text
grid-template-columns:
repeat(auto-fill, minmax(240px, 1fr))
```

------

# 24. Home Page

Home 不是 Dashboard。

核心目标：

> 让用户快速找到工具。

------

## 24.1 Layout

```text
┌──────────────────────────────────────┐
│ Header                               │
├──────────────────────────────────────┤
│                                      │
│        今天想做什么？                 │
│                                      │
│   [ Search tools...          ⌘ K ]   │
│                                      │
│                                      │
│ Recent                               │
│ [ Tool ] [ Tool ] [ Tool ]           │
│                                      │
│ Categories                           │
│                                      │
│ Developer                            │
│ [ Tool ] [ Tool ] [ Tool ]           │
│                                      │
│ Text                                 │
│ [ Tool ] [ Tool ]                   │
│                                      │
└──────────────────────────────────────┘
```

------

# 25. Home Hero

不要使用传统营销 Hero。

不要：

```text
The Ultimate Tool Platform
Powerful tools for everyone...
[Get Started]
```

推荐：

```text
今天想做什么？
```

下面直接放 Search。

------

# 26. Recent Tools

登录用户：

```text
显示最近使用
```

未登录：

```text
可以显示本地 Recent
```

最多：

```text
5–8 个
```

------

# 27. Tool List

URL：

```text
/tools
```

布局：

```text
Title
Search
Category Filter
Tool Grid
```

示例：

```text
Tools

[ Search tools... ]

All  Developer  Text  AI

┌──────┐ ┌──────┐ ┌──────┐
│ Tool │ │ Tool │ │ Tool │
└──────┘ └──────┘ └──────┘
```

------

# 28. Tool Workspace

这是整个产品最重要的页面。

结构：

```text
┌──────────────────────────────────────┐
│ ← JSON Formatter             Actions │
├──────────────────────────────────────┤
│                                      │
│                                      │
│            Workspace                 │
│                                      │
│                                      │
├──────────────────────────────────────┤
│ Reset        Copy        Format       │
└──────────────────────────────────────┘
```

------

# 29. Tool Header

Tool Header 包含：

```text
Back
Tool Icon
Tool Name
Short Description
Access Badge
Actions
```

不要放：

- 长介绍
- 使用教程
- 大型 Banner

------

# 30. JSON Formatter

推荐 Split Layout：

```text
┌──────────────────────────────────────────────┐
│ JSON Formatter                               │
├──────────────────────┬───────────────────────┤
│ Input                │ Output                │
│                      │                       │
│ {                    │ {                     │
│   "name": "John"     │   "name": "John"      │
│ }                    │ }                     │
│                      │                       │
├──────────────────────┴───────────────────────┤
│ Format   Minify   Copy   Clear               │
└──────────────────────────────────────────────┘
```

Desktop：

```text
50 / 50
```

Mobile：

```text
Input
↓
Output
```

------

# 31. Editor Design

代码编辑区域使用：

```text
JetBrains Mono
```

建议：

```text
14px
line-height: 1.6
```

Editor：

- 深色背景可以独立于 Light Theme
- Border 弱化
- Toolbar 简洁
- 行号可选
- 不使用过多颜色

------

# 32. Prompt Manager

Prompt Manager 是一个特殊 Workspace。

推荐三栏：

```text
┌────────────┬──────────────┬──────────────────┐
│ Folders    │ Prompts      │ Editor           │
│            │              │                  │
│ All        │ SEO Prompt   │ Title            │
│ Work       │ Blog Prompt  │                  │
│ Coding     │ API Prompt   │ Content          │
│ AI         │              │                  │
│            │              │                  │
└────────────┴──────────────┴──────────────────┘
```

Desktop：

```text
220px
280px
flex
```

------

# 33. Prompt Manager Mobile

Mobile 不强行保留三栏。

使用：

```text
Folders
↓
Prompt List
↓
Prompt Editor
```

通过页面切换完成。

------

# 34. Login Page

Login 应该极简。

```text
              ToolBox

          Welcome back

       Email
       [                  ]

       Password
       [                  ]

       [     Sign in      ]

       Forgot password?

       ───── or ─────

       Continue with ...

       Don't have an account?
       Create account
```

避免：

- 大型插画
- 营销文案
- 多余导航

------

# 35. Register Page

结构与 Login 保持一致。

```text
ToolBox

Create your account

Name
Email
Password

[ Create account ]

Already have an account?
Sign in
```

------

# 36. Login Redirect

用户访问需要登录的 Tool：

```text
Prompt Manager
       ↓
Login
       ↓
Authentication
       ↓
Prompt Manager
```

登录页面不应该让用户重新寻找工具。

------

# 37. Account

Account 页面保持简单。

```text
Account

Profile
────────────────
Name
Email

Preferences
────────────────
Theme
Language

Security
────────────────
Password
Sessions
```

------

# 38. Settings

Settings 不应该变成大型后台。

推荐：

```text
Appearance
Account
Security
```

最多两层。

------

# 39. Command Palette

快捷键：

```text
⌘ K
Ctrl K
```

Overlay：

```text
┌─────────────────────────────────┐
│ ⌕ Search tools...               │
├─────────────────────────────────┤
│                                 │
│ Recent                          │
│                                 │
│ JSON Formatter            ↵     │
│ JWT Decoder               ↵     │
│ UUID Generator            ↵     │
│                                 │
├─────────────────────────────────┤
│ ↑↓ Navigate    ↵ Open    Esc    │
└─────────────────────────────────┘
```

------

# 40. Command Palette 行为

支持：

```text
Typing
Arrow Up
Arrow Down
Enter
Escape
```

搜索：

```text
Tool Name
Description
Category
Tags
```

------

# 41. Modal

Modal 只用于：

- Confirm Delete
- Create Folder
- Rename
- Important Confirmation

不要用 Modal 承载完整工具。

------

# 42. Toast

用于短暂反馈：

```text
Copied
Saved
Deleted
Updated
```

示例：

```text
✓ Copied to clipboard
```

持续：

```text
2–3 seconds
```

不要用 Toast 展示重要错误详情。

------

# 43. Tooltip

用于解释：

```text
Icon-only Button
Keyboard Shortcut
Unclear Action
```

例如：

```text
[ ⧉ ]
      ↓
Copy
```

不要给所有按钮添加 Tooltip。

------

# 44. Empty State

Empty State 应该简洁。

例如 Prompt Manager：

```text
No prompts yet

Create your first prompt to get started.

[ Create Prompt ]
```

不要使用大型插画。

------

# 45. Loading State

避免整个页面白屏。

使用：

```text
Skeleton
```

例如 Tool List：

```text
┌────────────┐
│ ▓▓▓▓▓      │
│ ▓▓▓▓▓▓▓    │
│ ▓▓▓▓       │
└────────────┘
```

工具执行：

```text
[ Spinner ] Formatting...
```

------

# 46. Error State

Tool Error：

```text
Something went wrong

We couldn't process this input.

[ Try again ]
```

Validation Error：

```text
Invalid JSON

Unexpected token at line 4.

[ Go to error ]
```

错误信息必须：

- 简洁
- 明确
- 可操作

------

# 47. 404

推荐：

```text
404

This page doesn't exist.

[ Back to Home ]
```

不要做复杂 Error Illustration。

------

# 48. Accessibility

必须支持：

### Keyboard

所有核心功能可使用键盘。

### Focus

Focus State 必须清晰。

### Contrast

正文必须保持足够对比度。

### Screen Reader

Icon-only Button 必须提供 Accessible Label。

### Touch

Mobile 点击区域：

```text
≥ 44px
```

------

# 49. Motion

动画原则：

> Fast and subtle.

推荐：

```text
100–200ms
```

适合：

- Hover
- Focus
- Dialog
- Dropdown
- Sidebar
- Command Palette

避免：

- 页面大幅移动
- 长时间 Loading Animation
- 复杂进入动画
- Parallax

------

# 50. Dark Mode

Dark Mode 不是简单：

```text
White → Black
```

而是独立设计。

结构：

```text
Background
↓
Panel
↓
Elevated Panel
```

层级通过：

```text
Color
Border
Spacing
```

而不是大量 Shadow。

------

# 51. Tool Access UI

Public：

```text
JSON Formatter
```

可以不显示 Badge。

Authenticated：

```text
Prompt Manager
[ Login Required ]
```

Role Based：

```text
Admin Tools
[ Admin ]
```

Badge 应该低调。

------

# 52. Mobile Header

Mobile：

```text
┌────────────────────────────┐
│ ☰  ToolBox        ⌕  ◯    │
└────────────────────────────┘
```

功能：

```text
Menu
Search
Account
```

------

# 53. Mobile Tool Workspace

原则：

> Workspace 优先，而不是完整复制 Desktop。

例如：

```text
JSON Formatter

[ Input ]

        ↓

[ Output ]

[ Format ]
[ Copy ]
```

操作区域应该保持容易点击。

------

# 54. Responsive Breakpoints

建议：

```text
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

重点断点：

```text
< 768
Mobile

768–1023
Tablet

≥ 1024
Desktop
```

------

# 55. Figma Structure

Figma 建议：

```text
ToolBox
│
├── 00 Foundations
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Icons
│   └── Grid
│
├── 01 Components
│   ├── Button
│   ├── Input
│   ├── Badge
│   ├── Card
│   ├── Dialog
│   ├── Dropdown
│   ├── Tooltip
│   ├── Toast
│   └── Command
│
├── 02 Patterns
│   ├── App Shell
│   ├── Tool Header
│   ├── Tool Workspace
│   ├── Tool Card
│   └── Auth Form
│
├── 03 Pages
│   ├── Home
│   ├── Tools
│   ├── JSON Formatter
│   ├── Login
│   ├── Register
│   ├── Prompt Manager
│   ├── Account
│   └── Settings
│
├── 04 Responsive
│   ├── Desktop
│   ├── Tablet
│   └── Mobile
│
└── 05 Prototype
```

------

# 56. Figma Naming

组件命名统一：

```text
Button / Primary
Button / Secondary
Button / Ghost

Input / Default
Input / Error
Input / Disabled

Badge / Public
Badge / Authenticated

ToolCard / Default
ToolCard / Hover

Dialog / Confirm
Dialog / Form
```

------

# 57. Figma Component Variants

Button：

```text
Variant:
Primary
Secondary
Ghost
Destructive

State:
Default
Hover
Pressed
Disabled
Loading
```

Input：

```text
State:
Default
Focus
Error
Disabled
```

Tool Card：

```text
State:
Default
Hover
Selected
Disabled
```

------

# 58. Auto Layout

所有主要组件优先使用 Auto Layout。

特别是：

```text
Button
Card
Sidebar Item
Tool Card
Command Item
Form
Dialog
Tool Header
```

避免依赖绝对定位完成主要布局。

------

# 59. Design Tokens

Figma Variables 建议建立：

```text
Color
Spacing
Radius
Typography
Shadow
```

例如：

```text
color.background.default
color.background.muted

color.text.primary
color.text.secondary

color.border.default

color.accent.primary

spacing.1
spacing.2
spacing.3
spacing.4

radius.sm
radius.md
radius.lg
```

这样后续 Dark Mode 可以直接切换 Variable Mode。

------

# 60. 第一轮 Figma 页面

不要一次设计所有页面。

第一轮只设计：

### 01 Home

验证：

```text
Search First
Tool First
```

### 02 Tool List

验证：

```text
Navigation
Category
Tool Card
```

### 03 JSON Formatter

验证：

```text
Workspace
Split Editor
Tool Actions
```

### 04 Login

验证：

```text
Auth Experience
```

### 05 Prompt Manager

验证：

```text
Data Workspace
Three-column Layout
```

### 06 Command Palette

验证：

```text
Search
Keyboard
Navigation
```

### 07 Dark Mode

验证：

```text
Design Token
Contrast
```

### 08 Mobile

验证：

```text
Responsive
Drawer
Workspace
```

------

# 61. 页面设计优先级

设计优先级：

```text
P0
Home
Tool Workspace
Tool List
Command Palette

P1
Login
Register
Prompt Manager

P2
Account
Settings

P3
Admin
Future Features
```

------

# 62. UX Flow

## Flow A — Public Tool

```text
Home
 ↓
Search
 ↓
Tool
 ↓
Workspace
 ↓
Execute
 ↓
Copy Result
```

整个流程不需要登录。

------

## Flow B — Authenticated Tool

```text
Home
 ↓
Search
 ↓
Tool
 ↓
Login Required
 ↓
Login
 ↓
Redirect
 ↓
Workspace
 ↓
Save
```

------

## Flow C — Returning User

```text
Home
 ↓
Recent
 ↓
Tool
 ↓
Workspace
```

------

## Flow D — Keyboard User

```text
⌘ K
 ↓
Type
 ↓
Arrow
 ↓
Enter
 ↓
Tool
```

------

# 63. UX Rules

## Rule 1

任何工具都应该在进入页面后尽快进入工作状态。

------

## Rule 2

用户不应该因为登录而丢失当前上下文。

------

## Rule 3

公共工具不应该强迫用户创建账户。

------

## Rule 4

保存、复制、执行等核心操作必须明显。

------

## Rule 5

危险操作必须有确认。

------

## Rule 6

错误信息必须告诉用户下一步怎么做。

------

## Rule 7

移动端不是 Desktop 的缩小版。

------

# 64. Content Guidelines

文案保持：

```text
Short
Clear
Direct
Neutral
```

推荐：

```text
Format JSON
Copy
Clear
Save
Create Prompt
Search tools...
```

避免：

```text
✨ Super Powerful JSON Formatter
🚀 The ultimate tool for developers
```

------

# 65. Tool Description

描述最多：

```text
1–2 lines
```

例如：

```text
Format, validate and minify JSON.
```

不要：

```text
This powerful and comprehensive tool allows you
to easily format, validate, beautify...
```

------

# 66. Empty / Loading / Error 文案

统一语言风格。

### Empty

```text
No prompts yet
```

### Loading

```text
Loading...
```

### Saving

```text
Saving...
```

### Success

```text
Saved
```

### Error

```text
Something went wrong.
```

------

# 67. UI Density

ToolBox 整体：

> Medium / High Information Density

但不是拥挤。

推荐：

```text
页面：
Medium

工具 Workspace：
High

Marketing Content：
Low
```

------

# 68. Shadow

默认：

```text
None
```

必要时：

```text
Subtle
```

只用于：

- Dropdown
- Dialog
- Command Palette
- Floating Menu

Card 不需要明显 Shadow。

------

# 69. Border

Border 是主要层级工具之一。

推荐：

```text
1px
Low Contrast
```

通过：

```text
Spacing
Background
Border
```

形成层级。

------

# 70. Final Design Language

ToolBox 的最终视觉语言：

```text
Neutral First
        ↓
Indigo Interaction
        ↓
Typography Driven
        ↓
Weak Borders
        ↓
Minimal Shadows
        ↓
High Information Density
        ↓
Search First
        ↓
Workspace First
```

------

# 71. Final Product Principle

整个 UI 最终只围绕一句话：

> **让用户少思考网站怎么用，把注意力全部放在“我要完成什么事情”上。**

ToolBox 应该让用户感觉：

```text
打开
↓
找到
↓
使用
↓
完成
```

而不是：

```text
打开
↓
学习网站
↓
寻找入口
↓
浏览分类
↓
理解功能
↓
寻找按钮
↓
开始使用
```

------

# 72. V2.0 Design Checklist

## Foundation

-  Color System
-  Typography
-  Spacing
-  Radius
-  Border
-  Shadow
-  Icons
-  Dark Mode

## Components

-  Button
-  Input
-  Search
-  Badge
-  Tool Card
-  Dialog
-  Dropdown
-  Tooltip
-  Toast
- [Command Palette]

## Pages

-  Home
-  Tool List
-  Tool Workspace
-  Login
-  Register
-  Prompt Manager
-  Account
-  Settings
-  404
-  Error
-  Empty
-  Loading

## Responsive

-  Desktop
-  Tablet
-  Mobile
-  Mobile Drawer
-  Mobile Tool Workspace

## Interaction

-  Search
-  Command Palette
-  Keyboard Navigation
-  Copy
-  Save
-  Delete Confirmation
-  Loading
- [Error Feedback]
- [Login Redirect]

## Figma

-  Foundations
-  Components
-  Patterns
-  Pages
-  Variants
-  Variables
-  Auto Layout
-  Responsive Frames
-  Prototype

------

# 73. V2.0 Final Summary

ToolBox 不追求视觉上的“炫”，而追求：

**清晰、快速、安静、可靠。**

设计系统应该让新增工具拥有统一的：

```text
Navigation
Header
Workspace
Actions
Feedback
Responsive Behavior
```

同时允许特殊工具拥有自己的 Workspace。

最终产品应该呈现为：

```text
              ToolBox
                 │
       ┌─────────┴─────────┐
       │                   │
    Discover             Work
       │                   │
   Search / Browse     Workspace
       │                   │
       └─────────┬─────────┘
                 │
                Done
```

**核心设计原则：**

> **Search First. Tool First. Workspace First.**
>
> **Less Navigation. Less Decoration. Less Thinking.**
>
> **More Doing.**